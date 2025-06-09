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
import { seedMqttTopics } from "./seed/MQTTSeed.js";
import { saveDiscoveredDevice } from "./discoveredDevices.js";

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
const DISCOVER_IN  = "app/devices/discover";
const DISCOVER_OUT = "app/devices/discovered";
const COMMANDS_OUT = "app/devices/commands/return";
const STATUS_IN    = "app/devices/status/in";
const STATUS_OUT   = "app/devices/status/out";
const STATE_IN = "app/devices/state/in"
const DO_COMMAND_IN = "app/devices/do_command/in"
const STATE_OUT = "app/devices/state/out"
const DO_COMMAND_OUT = "app/devices/do_command/out"

const detectDeviceType = (deviceName) => {
  const name = deviceName.toLowerCase();
  if (name.includes("light")) return "light";
  if (name.includes("plug")) return "plug";
  if (name.includes("tv")) return "tv";
  if (name.includes("ir")) return "ir";
  return "sensor";
};

// 1) Listen for Socket.IO “startScan” and publish to DISCOVER_IN
io.on("connection", (socket) => {
  console.log(`📡 Socket connected: ${socket.id}`);
  socket.on("startScan", async() => {

    try {
      // 1) Call your own GET /devices endpoint to fetch all devices
      const resp = await axios.get(`${process.env.LOCALHOST_URL}/devices`);
      //    (Adjust URL/port as needed.)

      const devices = resp.data; 
      // e.g. [ { protocol: "mqtt", id: "123" }, { protocol: "http", id: "xyz" }, … ]

      // 2) Map them into ["mqtt/123", "http/xyz", …]
      const payloadList = devices.map((d) => {
        if (d.protocol === "upnp") {
          // use uuid for UPnP devices
          return `${d.protocol}/${d.uuid}`;
        } else if (d.protocol === "ble" && d.manufacturer === "TUYA") {
          // use manufacturer/metadata for BLE devices from TUYA
          return `${d.manufacturer}/${d.metadata}`;
        } else {
          // fallback to protocol/_id
          return `${d.protocol}/${d._id}`;
        }
      });
      // 3) Serialize into JSON (or whatever string format you need)
      const payloadString = JSON.stringify(payloadList);

      // 4) Publish to MQTT
      mqttClient.publish(
        DISCOVER_IN,
        payloadString,
        { qos: 0 },
        (err) => {
          if (err) {
            console.error("❌ Failed to publish DISCOVER_IN:", err);
            // Optionally emit an error back to the client:
            socket.emit("scanFailed", { error: err.message });
          } else {
            console.log(
              `✔ Published device list → ${DISCOVER_IN}:`,
              payloadString
            );
            // Optionally confirm back to the client:
            socket.emit("scanPublished", { devices: payloadList });
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

  // Subscribe to the inbound topics we care about:
  mqttClient.subscribe([ DISCOVER_OUT, COMMANDS_OUT, STATUS_OUT, STATE_OUT, DO_COMMAND_OUT ], { qos: 0 }, (err) => {
    if (err) console.error("MQTT subscription error:", err);
  });

  // Now that we’re definitely connected, fetch all devices from our DB
  // and publish one “seed” message per device to STATUS_IN:
  try {

    const getRes = await axios.get(`${process.env.LOCALHOST_URL}/devices`);
    const allDevices = getRes.data;

    for (const device of allDevices) {
      let payload = "";

      if (device.protocol === "ble" && device.manufacturer === "TUYA") {
        // Format: "<db_id>/<protocolOrManufacturer>/<id_val>/<old_status>"
        payload = `${device._id}/${device.manufacturer}/${device.metadata}/${device.status}`;
      } else if (device.protocol === "upnp") {
        payload = `${device._id}/${device.protocol}/${device.uuid}/${device.status}`;
      }

      if (payload) {
        mqttClient.publish(STATUS_IN, payload, { qos: 0 }, (err) => {
          if (err) {
            console.error(`❌ Failed to publish ${payload} → ${STATUS_IN}:`, err);
          }
        });
      }
    }
  } catch (err) {
    console.error(
      "Failed to fetch devices for heartbeat:",
      err.response?.data || err.message
    );
  }
});

// 3) Handle inbound MQTT messages:
mqttClient.on("message", async (topic, message) => {
  if (topic === DISCOVER_OUT) {
    // DISCOVER_OUT emits an array of discovered-device objects
    //console.log(`Received DISCOVER_OUT: ${message.toString()}`);
    const device = JSON.parse(message.toString());

    const tempDevice = {
      name: device.deviceName,
      type: detectDeviceType(device.deviceName),
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
  

  if (topic === COMMANDS_OUT) {
    (async () => {
      try {
        const payload = JSON.parse(message.toString());
        await axios.post(`${process.env.LOCALHOST_URL}/devicecommands`, payload);
      } catch (error) {
        console.error("Failed to send data to API:", error.response?.data || error.message);
      }
    })();
  }

  if (topic === STATUS_OUT) {
    // STATUS_OUT sends messages like "<db_id>/<newStatus>"
    const [deviceId, statusText] = message.toString().split("/");

    (async () => {
      try {
        await axios.put(
          `${process.env.LOCALHOST_URL}/devices/${deviceId}`,
          { status: statusText }        // ← Use statusText, not newStatus
        );
        io.emit("device:status_changed", { deviceId, newStatus: statusText });
      } catch(err) {
        console.error("Failed to update status:", err.response?.data || err.message);
      }
    })();
  }


  //aici trebuie sa fac getall in devicestate si daca nu exista deviceid sa creez entry

  if (topic === STATE_OUT) {
    try {
      const parsed = JSON.parse(message.toString());
      const deviceID = "123"; // hardcoded for now
      const data = parsed.state;

      if (!Array.isArray(data)) {
        console.error("Invalid payload: 'state' must be an array");
        return;
      }

      const url = `${process.env.LOCALHOST_URL}/devicestate/${deviceID}`;

      try {
        // Try to fetch the device state entry
        const res = await axios.get(url);

        // If found → update using PUT
        await axios.put(url, {
          deviceID,
          data,
        });

      } catch (err) {
        if (err.response && err.response.status === 404) {
          // Not found → create new using POST
          await axios.post(`${process.env.LOCALHOST_URL}/devicestate`, {
            deviceID,
            data,
          });
          console.log(`Created new device state for ${deviceID}`);
        } else {
          // Unexpected error
          console.error("Error fetching device state:", err.message);
        }
      }

    } catch (err) {
      console.error("Failed to process MQTT message:", err);
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

connectDB()
  .then(() => {
    console.log("Database connected successfully.");
    seedMqttTopics();
    httpServer.listen(port, () => console.log(`Server running on port ${port}`));
  })
  .catch((err) => {
    console.error("Database connection error:", err);
    process.exit(1);
  });

app.get("/", (req, res) => res.send("Smart Home API is running"));
