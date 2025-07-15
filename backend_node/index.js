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
import deviceStateRoutes from "./routes/DeviceStateRoutes.js"
import uploadRoutes from "./routes/UploadRoutes.js"
import { saveDiscoveredDevice } from "./discoveredDevices.js";
import path from "path";
import { mediaRoutes } from "./routes/MediaRoutes.js";
import scenarioRoutes from "./routes/ScenarioRoutes.js"
import roomRoutes from "./routes/RoomRoutes.js"
import voiceRecordRoute from "./routes/GetVoiceRecordRoute.js"
import { startTimeTriggerScheduler } from "./cronjobs/timeTriggers.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
app.use(express.json());

const httpServer = http.createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.FRONTEND_ORIGIN || "http://localhost:19006",
    methods: ["GET", "POST"],
  },
});

// MQTT Configuration
const MQTT_BROKER = "mqtt://192.168.1.136";
const mqttClient = mqtt.connect(MQTT_BROKER);

// MQTT Topics
const DISCOVER_OUT = "app/discover/out";

// 1) Listen for Socket.IO “startScan” and publish to DISCOVER_IN
io.on("connection", (socket) => {
  //console.log(`📡 Socket connected: ${socket.id}`);
  socket.on("startScan", async() => {

    try {
      const resp = await axios.get(`${process.env.LOCALHOST_URL}/devices`);
      const devices = resp.data; 
      // e.g. [ { protocol: "mqtt", id: "123" }, { protocol: "http", id: "xyz" }, … ]

      // 2) Map them into ["mqtt/123", "http/xyz", …]
      const payloadList = devices.map((d) => {
        if (d.protocol === "upnp") {
          return `${d.protocol}/${d.uuid}`;
        } else if (d.protocol === "ble" && d.manufacturer === "TUYA") {
          return `${d.manufacturer}/${d.metadata}`;
        } else {
          return 
        }
      });
      const payloadString = JSON.stringify(payloadList);
      const res = await axios.get(`${process.env.LOCALHOST_URL}/mqtttopic/device/null/discover/in`)
      const basetopic = res.data

      const finaltopic = `${basetopic.basetopic}/${basetopic.action}/${basetopic.direction}`

      // 4) Publish to MQTT
      mqttClient.publish(
        finaltopic,
        payloadString,
        { qos: 0 },
        (err) => {
          if (err) {
            console.error("❌ Failed to publish DISCOVER_IN:", err);
            socket.emit("scanFailed", { error: err.message });
          } else {
            console.log(
              `✔ Published device list`, payloadString);
         }
        }
      );
    } catch (err) {
      console.error("❌ Error fetching devices from API:", err);
      socket.emit("scanFailed", { error: err.message });
    }
  });
});

// 2) When mqttClient connects, subscribe and then seed STATUS_IN
mqttClient.on("connect", async () => {
  console.log("🔌 Connected to MQTT broker, now seeding STATUS_IN");

  const directions = ["in", "out"];

  // Ensure both discover/in and discover/out exist
  for (const direction of directions) {
    const basetopic = `app/discover/${direction}`;

    try {
      const res = await axios.get(`${process.env.LOCALHOST_URL}/mqtttopic/device/null/discover/${direction}`);
      //console.log(`✅ Topic exists: ${JSON.stringify(res.data, null, 2)}`);
    } catch (err) {
      if (err.response?.status === 404) {
        console.log(`⛔ Topic not found: ${basetopic}, creating...`);

        try {
          await axios.post(`${process.env.LOCALHOST_URL}/mqtttopic`, {
            basetopic,
            type: direction === "in" ? "publish" : "subscribe",
            deviceId: null,
            qos: 0
          });
          console.log(`✅ Created topic: ${basetopic}`);
        } catch (postErr) {
          console.error(`❌ Failed to create topic "${basetopic}":`, postErr.response?.data?.message || postErr.message);
        }
      } else {
        console.error(`❌ Error checking topic "${basetopic}":`, err.message);
      }
    }
  }

  // ✅ Subscribe to fixed dynamic topics once (not inside the loop)
  mqttClient.subscribe([
    "app/discover/out",
    "app/devices/+/+/out"
  ], { qos: 0 }, (err) => {
    if (err) {
      console.error("MQTT subscription error:", err);
    } else {
      console.log("✅ Subscribed to topic(s)");
    }
  });

  // ✅ Seed any MQTT topics (e.g. status/in) from DB
  try {
    const getRes = await axios.get(`${process.env.LOCALHOST_URL}/mqtttopic`);
    const allTopics = getRes.data;

    for (const topic of allTopics) {
      if (
        topic.deviceId &&
        (topic.action === "status" || topic.action === "state") &&
        topic.direction === "in"
      ) {
        const fullTopic = `${topic.basetopic}/${topic.deviceId}/${topic.action}/${topic.direction}`;

        if (topic.payload) {
          mqttClient.publish(fullTopic, topic.payload, { qos: topic.qos }, (err) => {
            if (err) {
              console.error(`❌ Failed to publish to ${fullTopic}:`, err);
            }
          });
        }
      }
    }
  } catch (err) {
    console.error("❌ Failed to fetch topics for seeding:", err.response?.data || err.message);
  }
});



// 3) Handle inbound MQTT messages:
mqttClient.on("message", async (topic, message) => {

  // const handlers = {
  //   status: handleStatusUpdate,
  //   state: handleStateUpdate,
  //   commands: handleCommand,
  // };

  // const handler = handlers[action];
  // if (handler) handler(deviceId, message);

  
  if (topic === DISCOVER_OUT) {
    const device = JSON.parse(message.toString());

    const tempDevice = {
      name: device.deviceName,
      type: device.type,
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
    io.emit("deviceDiscovered", tempDevice);
  }
  
  // Handle structured topics: app/devices/:deviceId/:action/out
  const parts = topic.split("/");
  if (parts.length !== 5 || parts[0] !== "app" || parts[1] !== "devices" || parts[4] !== "out") {
    console.warn(`⚠️ Ignoring unexpected topic format: ${topic}`);
    return;
  }

  const [, , deviceId, action, direction] = parts;

  if (action === "commands") {
    try {
      const payload = JSON.parse(message.toString());

      const deviceCommandPayload = {
      deviceID: deviceId,               // ✅ add device ID
      commands: payload.commands        // use the raw command list as-is
    };
      await axios.post(`${process.env.LOCALHOST_URL}/devicecommands`, deviceCommandPayload);
    } catch (error) {
      console.error("Failed to send command to API:", error.response?.data || error.message);
      return
    }
  }

  if (action === "status") {
    // STATUS_OUT sends messages like "<newStatus>"
    const statusText = message.toString();

    (async () => {
      try {
        if(statusText !== "online" && statusText !== "offline")
        {
          await axios.put(
            `${process.env.LOCALHOST_URL}/devices/${deviceId}`,
            { metadata: statusText }  
          );
        }else{
          await axios.put(
            `${process.env.LOCALHOST_URL}/devices/${deviceId}`,
            { status: statusText }        // ← Use statusText, not newStatus
          );
        }
        io.emit("device:status_changed", { deviceId, newStatus: statusText });
      } catch(err) {
        console.error("Failed to update status:", err.response?.data || err.message);
        return
      }
    })();
  }


  if (action === "state") {
    try {
      const parsed = JSON.parse(message.toString());
      const data = parsed.state;

      if (!Array.isArray(data)) {
        console.error("Invalid payload: 'state' must be an array");
        return;
      }

      const url = `${process.env.LOCALHOST_URL}/devicestate/${deviceId}`;

      try {
        // Try to fetch the device state entry
        const res = await axios.get(url);

        // If found → update using PUT
        await axios.put(url, { deviceID: deviceId, data });
      } catch (err) {
        if (err.response?.status === 404) {
          // Not found → create new using POST
          await axios.post(`${process.env.LOCALHOST_URL}/devicestate`, {
            deviceID: deviceId,
            data,
          });
          console.log(`Created new device state for ${deviceId}`);
        } else {
          console.error("Error fetching device state:", err.message);
          return
        }
      }
    } catch (err) {
      console.error("Failed to process 'state' message:", err);
      return
    }
  }

});

// (The rest of your Express setup remains unchanged)

app.use("/api/users", userRoutes);
app.use("/api/devices", deviceRoutes);
app.use("/api/discovered", discoveredDevicesRoutes);
app.use("/api/devicecommands", deviceCommandRoutes);
app.use("/api/mqtttopic", mqttTopicRoutes(mqttClient));
app.use("/api/devicestate", deviceStateRoutes)
app.use("/api/media", express.static(path.join(process.cwd(), 'media')));
app.use("/api/media", mediaRoutes)
app.use("/api/upload", uploadRoutes);
app.use("/api/scenario", scenarioRoutes)
app.use("/api/room", roomRoutes)
app.use("/api/voicerecord", voiceRecordRoute)

connectDB()
  .then(() => {
    console.log("Database connected successfully.");
    //seedMqttTopics();
    startTimeTriggerScheduler()
    httpServer.listen(port, () => console.log(`Server running on port ${port}`));
  })
  .catch((err) => {
    console.error("Database connection error:", err);
    process.exit(1);
  });

app.get("/", (req, res) => res.send("Smart Home API is running"));
