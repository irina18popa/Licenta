import mongoose from "mongoose";

const CommandParameterSchema = new mongoose.Schema({
  name: { type: String, required: true },             // ex: switch_led
  type: { type: String, required: true },             // Boolean / Integer / Enum / Json / String
  enum: [{ type: String }],                          // For Enum types
  range: {                                            // For Integer / Float types
    min: Number,
    max: Number,
    step: Number,
  },
  properties: [{ type: mongoose.Schema.Types.Mixed }], // For nested Json objects
});

const CommandSchema = new mongoose.Schema({
  name: { type: String, required: true },
  parameters: [CommandParameterSchema],
});

const DeviceCommandSchema = new mongoose.Schema({
  deviceID: { type: String, required: true, unique: true },
  commands: [CommandSchema],
});

const DeviceCommandModel = mongoose.models.DeviceCommand || mongoose.model("DeviceCommand", DeviceCommandSchema);
export default DeviceCommandModel;
