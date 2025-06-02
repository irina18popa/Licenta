import express from "express";
import dotenv from "dotenv";
import axios from "axios";
import mqtt from "mqtt"; 
import http from "http";
import { Server as SocketIOServer } from "socket.io";

import { connectDB } from "./config/db.js";
import userRoutes from "./routes/UserRoutes.js";
import deviceRoutes from "./routes/DeviceRoutes.js";
import deviceCommandRoutes from "./routes/DeviceCommandRoutes.js";
import discoveredDevicesRoutes from "./routes/TemporarlyDevicesRoutes.js";
import mqttTopicRoutes from "./routes/MQTTTopicRoutes.js";
import { seedMqttTopics } from "./seed/MQTTSeed.js";
import { saveDiscoveredDevice } from "./discoveredDevices.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// 1) Create a raw HTTP server so Socket.io can attach to it:
const httpServer = http.createServer(app);
// 2) Instantiate Socket.io on that HTTP server:
const io = new SocketIOServer(httpServer, {
  // (When you switch to HTTPS/WSS later, just point origin to https://your‐domain)
  cors: {
    origin: process.env.FRONTEND_ORIGIN || "http://localhost:19006", // your React Native dev URL
    methods: ["GET", "POST"],
  },
});

// MQTT Configuration
const MQTT_BROKER = process.env.MQTT_BROKER || "mqtt://192.168.1.136";
const mqttClient = mqtt.connect(MQTT_BROKER);

// MQTT Topics
const TOPIC_PUB = "app/devices/discover";
const TOPIC_SUB = "app/devices/discovered";
//const TOPIC_PUB2 = "app/devices/commands/send";
//payload = protocol/ip_addr
const TOPIC_SUB2 = "app/devices/commands/return";
const STATUS_IN  = "app/devices/status/in";
const STATUS_OUT = "app/devices/status/out";


//trebuie sa fac un mqtt topic pt a trimite userID ul la care sa faca subscribe hub ul fiecarui utilizator

const detectDeviceType = (deviceName) => {
  const name = deviceName.toLowerCase();

  if (name.includes("light")) return "light";
  if (name.includes("plug")) return "plug";
  if (name.includes("tv")) return "tv";
  if (name.includes("ir")) return "ir";

  return "sensor"; // default fallback type
};


// Subscribe to "app/devices/discovered" and handle incoming messages
mqttClient.on("connect", () => {
  console.log("Connected to MQTT broker");

  // Subscribe to the discovered topic
  mqttClient.subscribe(TOPIC_SUB, (err) => {
    if (err) console.error("Subscription error:", err);
    //else console.log(`Subscribed to ${TOPIC_SUB}`);
  });

  mqttClient.subscribe(TOPIC_SUB2, (err) => {
    if (err) console.error("Subscription error:", err);
    //else console.log(`Subscribed to ${TOPIC_SUB2}`);
  });

    // 2) **NEW**: subscribe to status/out so we can log "Online"/"Offline"
  mqttClient.subscribe(STATUS_OUT, { qos: 0 }, (err) => {
    if (err) console.error("Subscription error:", err);
   // else console.log(`Subscribed to ${STATUS_OUT}`);
  });
});

// 3) **NEW**: every second, publish a POST to our own HTTP handler
  //    that will in turn publish to "app/devices/status/in"
  //    Replace <uuid> with whichever UUID you need each second.
  // Every second, fetch all devices from your database and publish a heartbeat

setInterval(async () => {
  try {
    // 1) Get all devices from your DB
    const getRes = await axios.get(`${process.env.LOCALHOST_URL}/devices`);
    const allDevices = getRes.data; // array of { protocol, uuid, manufacturer, ... }

    // 2) For each device, build payload based on protocol/manufacturer
    for (const device of allDevices) {
      let payload = "";

      if (device.protocol === "ble" && device.manufacturer === "TUYA") {
        payload = `${device._id}/${device.manufacturer}/${device.metadata}`; // e.g. "TUYA/<metadata>"
      } else if (device.protocol === "upnp") {
        payload = `${device._id}/${device.protocol}/${device.uuid}`; // e.g. "upnp/<uuid>"
      }
      // 3) Only send if payload was set
      if (payload) {
        try {
          await axios.post(
            `${process.env.LOCALHOST_URL}/mqtttopic/handle`,
            {
              topic: STATUS_IN,
              type: "pub",
              payload,
            },
            { timeout: 2000 }
          );
        } catch (err) {
          console.error(
            `Heartbeat POST error for device ${device.uuid}:`,
            err.response?.data || err.message
          );
        }
      }
    }
  } catch (err) {
    console.error(
      "Failed to fetch devices for heartbeat:",
      err.response?.data || err.message
    );
  }
}, 1000);




// Log incoming MQTT messages from "app/devices/discovered"
mqttClient.on("message", async (topic, message) => {
  //console.log(`Received message on ${topic}`);

  if (topic === TOPIC_SUB) {
    console.log(`Received message on ${topic}`);
    const devices = JSON.parse(message.toString());
  
    devices.forEach((device) => {
      const tempDevice = {
        name: device.deviceName,
        type: detectDeviceType(device.deviceName) || "Unknown",
        manufacturer: device.manufacturer || "unknown",
        macAddress: device.MAC || "unknown",
        ipAddress: device.IP || "unknown",
        uuid: device.uuid || "unknown",
        protocol: device.protocol || "unknown",
        status: device.status || "online",
        metadata: device.metadata,
        icon: "Unknown",
      };
  
      saveDiscoveredDevice(tempDevice);
    });
  }


  if(topic === TOPIC_SUB2)
  {
    (async() => {
      try {
        const payload = JSON.parse(message.toString());
        //console.log("Received payload:", payload);
    
        await axios.post(`${process.env.LOCALHOST_URL}/devicecommands`, payload);
    
        //console.log("\nSent payload to API for DB saving\n");
    
      } catch (error) {
        console.error("Failed to send data to API:", error.response?.data || error.message);
      }
    })()
  }

   // 3) **NEW**: handle status/out replies (“Online” / “Offline”)
 if (topic === STATUS_OUT) {
    // The payload is now "<deviceId>/<statusText>"
    const [deviceId, statusText] = message.toString().split("/");

    //console.log(`Device ${deviceId} status reply: ${statusText}`);

    // Immediately-invoked async function so we can use await:
    (async () => {
      try {
        // 1) Fetch the current device from your API
        const getRes = await axios.get(
          `${process.env.LOCALHOST_URL}/devices/${deviceId}`
        );
        const device = getRes.data;
        const currentStatus = device.status;

        //console.log(`Current status in DB: ${currentStatus}`);

        // 2) Compare and only PUT if different
        if (currentStatus !== statusText) {
          const putRes = await axios.put(
            `${process.env.LOCALHOST_URL}/devices/${deviceId}`,
            { status: statusText }
          );

          //console.log(`Status changed. Updated device in DB:`, putRes.data);
          io.emit("device:status_changed", { deviceId, newStatus: statusText });
        
        } else {
          // console.log(
          //   `No update needed. "${statusText}" matches DB already.`
          // );
        }
      } catch (err) {
        console.error("Error while checking/updating device status:", 
          err.response?.data || err.message
        );
      }
    })();
  }
});


// Routes
app.use("/api/users", userRoutes);
app.use("/api/devices", deviceRoutes);
app.use("/api/discovered", discoveredDevicesRoutes);
app.use("/api/devicecommands", deviceCommandRoutes);
app.use("/api/mqtttopic", mqttTopicRoutes(mqttClient));

connectDB()
  .then(() => {
    console.log("Database connected successfully.");

    // Call our seeding function
    seedMqttTopics();

    // Start listening after DB connection & seeding
    httpServer.listen(port, () => console.log(`Server running on port ${port}`));
  })
  .catch((err) => {
    console.error("Database connection error:", err);
    process.exit(1);
  });


  // function sendMQTTMessage(topic, payload) {
  //   mqttClient.publish(topic, payload, { qos: 1 }, (err) => {
  //     if (err) {
  //       console.error(`Error while publishing to topic ${topic}:`, err);
  //     } else {
  //       console.log(`Message '${payload}' published to topic '${topic}'`);
  //     }
  //   });
  // }
  
  // // Publish MUTE to home/upnp/tv/command
  // sendMQTTMessage("home/upnp/tv/command", "MUTE");
  
  // // Publish True to home/tuya/lamp/command
  // sendMQTTMessage("home/tuya/lamp/command", "False");


app.get("/", (req, res) => res.send("Smart Home API is running"))
