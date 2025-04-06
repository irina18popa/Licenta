import mongoose from "mongoose"

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true},
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true, unique:true },
  profile_image: {type:String},
  role: { type: String, required:true, enum: ["guest", "user"], default: "user" },
  createdAt: { type: Date, required:true, default: Date.now },
  preferences: {
    theme: { type: String, required:true, enum: ["light", "dark", "system"], default: "light" },
  },
  devices: [{ type: mongoose.Schema.Types.ObjectId, ref: "Device" }],
});

const UserModel = mongoose.models.User || mongoose.model("User", UserSchema)
export default UserModel