import express from "express";
import dotenv from "dotenv";
import axios from "axios";
import { connectDB } from "./config/db.js";
import userRoutes from "./routes/UserRoutes.js";
import deviceRoutes from "./routes/DeviceRoutes.js";
import deviceCommandRoutes from "./routes/DeviceCommandRoutes.js";
import mqttTopicRoutes from "./routes/MQTTTopicRoutes.js";
import { seedMqttTopics } from "./seed/MQTTSeed.js";
import mqtt from "mqtt";  // Import MQTT package

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// MQTT Configuration
const MQTT_BROKER = process.env.MQTT_BROKER || "mqtt://192.168.1.136";
const mqttClient = mqtt.connect(MQTT_BROKER);

// MQTT Topics
const TOPIC_PUB = "app/devices/discover";
const TOPIC_SUB = "app/devices/discovered";

// Subscribe to "app/devices/discovered" and handle incoming messages
mqttClient.on("connect", () => {
  console.log("Connected to MQTT broker");

  // Subscribe to the discovered topic
  mqttClient.subscribe(TOPIC_SUB, (err) => {
    if (err) console.error("Subscription error:", err);
    else console.log(`Subscribed to ${TOPIC_SUB}`);
  });

  // Publish "search" message to the discovery topic when server starts
  // mqttClient.publish(TOPIC_PUB, "search", (err) => {
  //   if (err) console.error("Publish error:", err);
  //   else console.log(`Published "search" to ${TOPIC_PUB}`);
  // });
});

// Log incoming MQTT messages from "app/devices/discovered"
mqttClient.on("message", (topic, message) => {
  console.log(`Received message on ${topic}: ${message.toString()}`)
});

// Routes
app.use("/api/users", userRoutes);
app.use("/api/devices", deviceRoutes);
app.use("/api/devicecommands", deviceCommandRoutes);
app.use("/api/mqtttopic", mqttTopicRoutes(mqttClient));

connectDB()
  .then(() => {
    console.log("Database connected successfully.");

    // Call our seeding function
    seedMqttTopics();

    // Start listening after DB connection & seeding
    app.listen(port, () => console.log(`Server running on port ${port}`));
  })
  .catch((err) => {
    console.error("Database connection error:", err);
    process.exit(1);
  });


  function sendMQTTMessage(topic, payload) {
    mqttClient.publish(topic, payload, { qos: 1 }, (err) => {
      if (err) {
        console.error(`Error while publishing to topic ${topic}:`, err);
      } else {
        console.log(`Message '${payload}' published to topic '${topic}'`);
      }
    });
  }
  
  // Publish MUTE to home/upnp/tv/command
  sendMQTTMessage("home/upnp/tv/command", "MUTE");
  
  // Publish True to home/tuya/lamp/command
  sendMQTTMessage("home/tuya/lamp/command", "False");


app.get("/", (req, res) => res.send("Smart Home API is running"))
