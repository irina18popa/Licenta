import MqttTopic from "../models/MQTTTopic.js";

export async function seedMqttTopics() {
  try {
    const existingTopics = await MqttTopic.find({
      topic: { $in: ["app/devices/discovered", "app/devices/discover"] },
    });

    // Build a set of existing topic names
    const existingNames = new Set(existingTopics.map((topicDoc) => topicDoc.topic));

    // List of topics we want to ensure exist
    const topicsToEnsure = [
      {
        topic: "app/devices/discovered",
        type: "subscribe",
        deviceId: null,
        qos: 1,
      },
      {
        topic: "app/devices/discover",
        payload: "search",
        type: "publish",
        deviceId: null,
        qos: 1,
      },
    ];

    // Check if all topics already exist
    if (existingNames.size === topicsToEnsure.length) {
      console.log("Topics already exist.");
    } else {
      // Create only the missing topics
      for (const t of topicsToEnsure) {
        if (!existingNames.has(t.topic)) {
          await MqttTopic.create(t);
          console.log(`Created topic: ${t.topic}`);
        }
      }
      console.log("MQTT topics seeding completed.");
    }
  } catch (err) {
    console.error("Error seeding MQTT topics:", err);
  }
}
