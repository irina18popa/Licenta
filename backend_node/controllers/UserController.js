import User from "../models/Users.js";

// Get all users
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get user by ID
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Create a new user
export const createUser = async (req, res) => {
  const { username, email, passwordHash, role, preferences } = req.body;
  const user = new User({ username, email, passwordHash, role, preferences });
  try {
    const newUser = await user.save();
    res.status(200).json(newUser);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Update user
export const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (req.body.username) user.username = req.body.username;
    if (req.body.email) user.email = req.body.email;
    if (req.body.passwordHash) user.passwordHash = req.body.passwordHash;
    if (req.body.profile_image) user.profile_image = req.body.profile_image;
    if (req.body.role) user.role = req.body.role;
    if (req.body.preferences) user.preferences = req.body.preferences;
    if (req.body.devices) user.devices = req.body.devices;

    const updatedUser = await user.save();
    res.json(updatedUser);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Delete user
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    await user.remove();
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
