import mongoose from "mongoose";

const MqttTopicSchema = new mongoose.Schema({
  topic: { type: String, required: true, unique: true },
  payload: {type: String, default: null},
  type: { type: String, enum: ["subscribe", "publish"], required: true },
  deviceId: { type: String, default: null },
  qos: { type: Number, default: 1 },
  timestamp: { type: Date, default: Date.now },
});

const MqttTopicModel = mongoose.models.MqttTopic || mongoose.model("MqttTopic", MqttTopicSchema);
export default MqttTopicModel;
