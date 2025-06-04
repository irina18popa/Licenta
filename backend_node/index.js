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
  socket.on("startScan", () => {
    console.log("→ socket ‘startScan’ received; publishing to MQTT to trigger scan");
    mqttClient.publish(DISCOVER_IN, "search", { qos: 0 }, (err) => {
      if (err) console.error("❌ Failed to publish DISCOVER_IN:", err);
      else console.log(`✔ Published 'search' → ${DISCOVER_IN}`);
    });
  });
});

// 2) When mqttClient connects, subscribe and then seed STATUS_IN
mqttClient.on("connect", async () => {
  console.log("🔌 Connected to MQTT broker, now seeding STATUS_IN");

  // Subscribe to the inbound topics we care about:
  mqttClient.subscribe([ DISCOVER_OUT, COMMANDS_OUT, STATUS_OUT ], { qos: 0 }, (err) => {
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
});

// (The rest of your Express setup remains unchanged)

app.use("/api/users", userRoutes);
app.use("/api/devices", deviceRoutes);
app.use("/api/discovered", discoveredDevicesRoutes);
app.use("/api/devicecommands", deviceCommandRoutes);
app.use("/api/mqtttopic", mqttTopicRoutes(mqttClient));

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
