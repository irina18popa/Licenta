import mongoose from 'mongoose';

const RoomSchema = new mongoose.Schema({
  name: { type: String, required: true },
  image: { type: String }, // URL or local path to image
  devices: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Device' }]
});

const RoomModel = mongoose.models.Room || mongoose.model('Room', RoomSchema);
export default RoomModel;
