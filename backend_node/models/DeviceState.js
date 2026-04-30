import mongoose from 'mongoose';

const StatusSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
  },
  value: mongoose.Schema.Types.Mixed, // boolean, number, string, or object
});

const DeviceStateSchema = new mongoose.Schema({
  deviceID: {type: String, required: true, unique: true},
  data: {
    type: [StatusSchema],
    required: true,
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
});

const DeviceState = mongoose.models.DeviceState || mongoose.model('DeviceState', DeviceStateSchema);
export default DeviceState