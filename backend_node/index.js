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
//const TOPIC_PUB2 = "app/devices/commands/send";
//payload = protocol/ip_addr
const TOPIC_SUB2 = "app/devices/commands/return";



// Subscribe to "app/devices/discovered" and handle incoming messages
mqttClient.on("connect", () => {
  console.log("Connected to MQTT broker");

  // Subscribe to the discovered topic
  mqttClient.subscribe(TOPIC_SUB, (err) => {
    if (err) console.error("Subscription error:", err);
    else console.log(`Subscribed to ${TOPIC_SUB}`);
  });

  mqttClient.subscribe(TOPIC_SUB2, (err) => {
    if (err) console.error("Subscription error:", err);
    else console.log(`Subscribed to ${TOPIC_SUB2}`);
  });

  //Publish "search" message to the discovery topic when server starts
  // mqttClient.publish(TOPIC_PUB, "search", (err) => {
  //   if (err) console.error("Publish error:", err);
  //   else console.log(`Published "search" to ${TOPIC_PUB}`);
  // });
});

// Log incoming MQTT messages from "app/devices/discovered"
mqttClient.on("message", async (topic, message) => {
  console.log(`Received message on ${topic}: ${message.toString()}`);

  if (topic === TOPIC_SUB) {
    try {
      const devices = JSON.parse(message.toString());

      devices.forEach((device) => {
        console.log(`Device Name: ${device.deviceName}`);
        console.log(`MAC Address: ${device.MAC}`);
        console.log(`IP Address: ${device.IP}`);
        console.log(`Protocol: ${device.protocol}`);
        console.log(`UUID:: ${device.uuid}`);
        console.log('------------------------');
      });
    } catch (error) {
      console.error('Failed to parse message:', error);
    }
  }

  if(topic === TOPIC_SUB2)
  {
    try {
      const payload = JSON.parse(message.toString());
      console.log("Received payload:", payload);
  
      await axios.post("http://localhost:3000/api/devicecommands", payload);
  
      console.log("Sent payload to API for DB saving");
  
    } catch (error) {
      console.error("Failed to send data to API:", error.response?.data || error.message);
    }
  }
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
