import MQTTTopic from "../models/MQTTTopic.js";


// Get all MQTT messages
export const getAllMQTTTopics = async (req, res) => {
  try {
    const messages = await MQTTTopic.find();
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get an MQTT message by ID
export const getMQTTTopicById = async (req, res) => {
  try {
    const message = await MQTTTopic.findById(req.params.id);
    if (!message) return res.status(404).json({ message: "MQTT message not found" });
    res.json(message);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Create a new MQTT message log
export const createMQTTTopic = async (req, res) => {
  const { topic, type, deviceId, qos } = req.body;
  const mqttMessage = new MQTTTopic({ topic, payload, type, deviceId, qos });
  try {
    const newMessage = await mqttMessage.save();
    res.status(201).json(newMessage);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Update an existing MQTT message log
export const updateMQTTTopic = async (req, res) => {
  try {
    const message = await MQTTTopic.findById(req.params.id);
    if (!message) return res.status(404).json({ message: "MQTT message not found" });

    if (req.body.topic) message.topic = req.body.topic;
    if (req.body.type) message.type = req.body.type;
    if (req.body.deviceId) message.deviceId = req.body.deviceId;
    if (req.body.qos) message.qos = req.body.qos;

    const updatedMessage = await message.save();
    res.json(updatedMessage);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Delete an MQTT message log
export const deleteMQTTTopic = async (req, res) => {
  try {
    const message = await MQTTTopic.findById(req.params.id);
    if (!message) return res.status(404).json({ message: "MQTT message not found" });
    await message.remove();
    res.json({ message: "MQTT message deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



// Publish or Subscribe based on API request
export const handleMQTTMessage = async (req, res, mqttClient) => {
  const { topic, type, payload } = req.body;

  if (!topic || !type) {
    return res.status(400).json({ message: "Topic and type (pub/sub) are required." });
  }

  try {
    if (type === "pub") {
      // Publish message to MQTT broker
      mqttClient.publish(topic, payload || "", { qos: 1 }, (err) => {
        if (err) {
          console.error("MQTT publish error:", err);
          return res.status(500).json({ message: "Failed to publish message." });
        }
        res.json({ message: `Message published to topic '${topic}'` });
      });
    } else if (type === "sub") {
      // Subscribe to the topic
      mqttClient.subscribe(topic, { qos: 0 }, (err) => {
        if (err) {
          console.error("MQTT subscription error:", err);
          return res.status(500).json({ message: "Failed to subscribe to topic." });
        }
        console.log(`Subscribed to topic: ${topic}`);
        res.json({ message: `Subscribed to topic '${topic}'` });
      });

      // Handle incoming messages on the subscribed topic
      mqttClient.on("message", (receivedTopic, message) => {
        if (receivedTopic === topic) {
          console.log(`Received message on topic '${receivedTopic}':`, message.toString());

          // Optionally save the message to MongoDB
          const mqttMessage = new MQTTTopic({ topic: receivedTopic, payload: message.toString(), type: "sub" });
          mqttMessage.save().catch((err) => console.error("Failed to save MQTT message to database:", err));
        }
      });
    } else {
      res.status(400).json({ message: "Invalid type. Use 'pub' for publish or 'sub' for subscribe." });
    }
  } catch (err) {
    console.error("MQTT error:", err);
    res.status(500).json({ message: "MQTT operation failed." });
  }
};

