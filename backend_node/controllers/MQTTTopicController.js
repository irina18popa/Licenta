import MQTTTopic from "../models/MQTTTopic.js";

// 🔧 Basetopic Parser
function parseBasetopic(basetopic) {
  const parts = basetopic.split("/");

  if (parts.length === 3) {
    const [root, action, direction] = parts;
    if (
      root === "app" &&
      ["discover"].includes(action) &&
      ["in", "out"].includes(direction)
    ) {
      return { basetopic: "app", deviceId: null, action, direction };
    }
  }

  if (parts.length === 5) {
    const [root, group, deviceId, action, direction] = parts;
    if (
      root === "app" &&
      group === "devices" &&
      deviceId &&
      ["commands", "status", "state", "do_command"].includes(action) &&
      ["in", "out"].includes(direction)
    ) {
      return { basetopic: "app/devices", deviceId, action, direction };
    }
  }

  return null;
}


// Get all MQTT topics
export const getAllMQTTTopics = async (req, res) => {
  try {
    const messages = await MQTTTopic.find().lean();
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get topic by deviceId, action, direction
export const getTopicByDeviceActionDirection = async (req, res) => {
  const { deviceId, action, direction } = req.params;

  try {
    const query = {
      action,
      direction,
      ...(deviceId !== "null" ? { deviceId } : { deviceId: null }),
    };

    const topic = await MQTTTopic.findOne(query).lean();
    if (!topic) {
      return res.status(404).json({ message: "Topic not found" });
    }

    res.json(topic);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all topics by publish/subscribe type
export const getAllMQTTTopicsByType = async (req, res) => {
  const { type } = req.params;

  if (!["publish", "subscribe"].includes(type)) {
    return res.status(400).json({ message: "Type must be 'publish' or 'subscribe'" });
  }

  try {
    const topics = await MQTTTopic.find({ type }).lean();
    if (!topics.length) {
      return res.status(404).json({ message: `No ${type} topics found` });
    }

    res.json(topics);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Create new MQTT topic
export const createMQTTTopic = async (req, res) => {
  const { basetopic, payload, type, deviceId: explicitDeviceId = null, qos = 1 } = req.body;

  try {
    const parsed = parseBasetopic(basetopic);

    if (!parsed) {
      return res.status(400).json({ message: "Invalid basetopic format." });
    }

    const { basetopic:parsedBasetopic, deviceId: parsedDeviceId, action, direction } = parsed;
    const finalDeviceId = parsedDeviceId ?? explicitDeviceId;

    // console.log("🔍 Checking for existing topic with:", {
    //   basetopic:parsedBasetopic,
    //   deviceId: { $eq: finalDeviceId },  // Ensures exact match for `null`
    //   action,
    //   direction
    // });

    const exists = await MQTTTopic.findOne({
      basetopic:parsedBasetopic, 
      deviceId: finalDeviceId,
      action,
      direction
    });

    if (exists) {
      return res.status(409).json({
        message: `Topic already exists for deviceId=${finalDeviceId}, action=${action}, direction=${direction}.`
      });
    }

    const mqttTopic = new MQTTTopic({
      basetopic:parsedBasetopic,
      payload,
      type,
      deviceId: finalDeviceId,
      qos,
      action,
      direction,
    });

    const saved = await mqttTopic.save();
    res.status(201).json(saved);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "Duplicate topic for this device/action/direction." });
    }
    res.status(400).json({ message: err.message });
  }
};

// Update topic by deviceId + action + direction
export const updateMQTTTopicByDeviceActionDirection = async (req, res) => {
  const { deviceId, action, direction } = req.params;
  const { basetopic, payload, type, qos } = req.body;

  try {
    const topicEntry = await MQTTTopic.findOne({
      action,
      direction,
      ...(deviceId !== "null" ? { deviceId } : { deviceId: null }),
    });

    if (!topicEntry) {
      return res.status(404).json({ message: "MQTT topic not found for the given identifiers." });
    }

    if (basetopic) topicEntry.basetopic = basetopic;
    if (payload !== undefined) topicEntry.payload = payload;
    if (type) topicEntry.type = type;
    if (qos !== undefined) topicEntry.qos = qos;

    const updated = await topicEntry.save();
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Delete all topics for a device
export const deleteMQTTTopicsByDeviceId = async (req, res) => {
  const { deviceId } = req.params;

  try {
    const result = await MQTTTopic.deleteMany({ deviceId });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "No MQTT topics found for this device." });
    }

    res.json({ message: `Deleted ${result.deletedCount} topic(s) for device ${deviceId}` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Publish or Subscribe handler
export const handleMQTTMessage = async (req, res, mqttClient) => {
  const { topic, type, payload } = req.body;

  if (!topic || !type) {
    return res.status(400).json({ message: "Topic and type (pub/sub) are required." });
  }

  try {
    if (type === "publish") {
      mqttClient.publish(topic, payload || "", { qos: 1 }, (err) => {
        if (err) {
          console.error("MQTT publish error:", err);
          return res.status(500).json({ message: "Failed to publish message." });
        }
        res.json({ message: `Message published to topic '${topic}'` });
      });
    } else if (type === "subscribe") {
      mqttClient.subscribe(topic, { qos: 0 }, (err) => {
        if (err) {
          console.error("MQTT subscription error:", err);
          return res.status(500).json({ message: "Failed to subscribe to topic." });
        }
        res.json({ message: `Subscribed to topic '${topic}'` });
      });

      // mqttClient.on("message", (receivedTopic, message) => {
      //   if (receivedTopic === topic) {
      //     const mqttMessage = new MQTTTopic({
      //       basetopic: receivedTopic,
      //       payload: message.toString(),
      //       type: "subscribe",
      //     });
      //     mqttMessage.save().catch(err => console.error("Failed to save MQTT message:", err));
      //   }
      // });
    } else {
      res.status(400).json({ message: "Invalid type. Use 'publish' or 'subscribe'." });
    }
  } catch (err) {
    console.error("MQTT error:", err);
    res.status(500).json({ message: "MQTT operation failed." });
  }
};
