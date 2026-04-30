import mongoose from "mongoose";

const MqttTopicSchema = new mongoose.Schema({
  basetopic: { type: String, required: true },
  payload: { type: String, default: null },
  type: { type: String, enum: ["subscribe", "publish"], required: true },
  deviceId: { type: String, default: null },
  qos: { type: Number, default: 1 },
  action: { type: String, enum: ["status", "state", "do_command", "commands", "discover"] },
  direction: { type: String, enum: ["in", "out"] },
});

// Enforce uniqueness: one topic per deviceId-action-direction combo
MqttTopicSchema.index({ deviceId: 1, action: 1, direction: 1 }, { unique: true });
const MqttTopicModel = mongoose.models.MqttTopic || mongoose.model("MqttTopic", MqttTopicSchema);
export default MqttTopicModel;
