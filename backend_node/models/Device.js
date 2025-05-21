import mongoose from "mongoose";

const DeviceSchema = new mongoose.Schema({
  name: { type: String, required: true},
  type: { type: String, enum: ["light", "sensor", "plug", "tv", "ir"], required: true },
  manufacturer: String,
  macAddress: {type: String, unique: true},
  ipAddress: String,
  uuid: {type: String, required:true, unique:true},
  protocol: { type: String, enum: ["ble", "upnp", "mdns"], required: true },
  status: { type: String, enum: ["online", "offline"], default: "online" },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} }, // Flexible field for storing additional data
  icon: {type:String, required:true},
  createdAt: { type: Date, default: Date.now }
});

const DeviceModel = mongoose.models.Device || mongoose.model("Device", DeviceSchema)
export default DeviceModel
