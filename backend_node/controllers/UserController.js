import User from "../models/Users.js";
import bcrypt from 'bcryptjs';
import PasswordValidator from 'password-validator';
import validator from 'validator'; // Import the validator library
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv'
import { createCanvas } from 'canvas';



dotenv.config()

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


// Function to create a base64 image with initials
const generateProfileImage = (first_name, last_name) => {
  const initials = first_name.charAt(0) + last_name.charAt(0);
  const canvas = createCanvas(100, 100);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#3498db'; // Background color
  ctx.fillRect(0, 0, 100, 100); // Create square
  ctx.font = '30px Arial';
  ctx.fillStyle = 'white';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(initials.toUpperCase(), 50, 50); // Write initials in center

  return canvas.toDataURL(); // Return base64 encoded image
};


// Create a new user
export const createUser = async (req, res) => {
  // Create a password schema
  const passwordSchema = new PasswordValidator();

// Add password validation rules
  passwordSchema
    .is().min(8) // Minimum length 8
    .has().uppercase() // Must have uppercase letters
    .has().lowercase() // Must have lowercase letters
    .has().digits() // Must have digits
    .has().symbols() // Must have special characters
    .has().not().spaces(); // No spaces allowed
    const { first_name, last_name, email, password, role, profile_image } = req.body;

  // Validate email format
  if (!validator.isEmail(email)) {
    return res.status(400).json({ message: 'Invalid email format' });
  }

  // Validate password
  if (!passwordSchema.validate(password)) {
    return res.status(400).json({
      message: 'Password must be at least 8 characters long, contain an uppercase letter, a lowercase letter, a digit, a special character, and have no spaces.',
    });
  }

  
  // Generate profile image if none provided
  const profileImage = profile_image || generateProfileImage(first_name, last_name);

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create a new user object
    const user = new User({
      first_name,
      last_name,
      email,
      passwordHash: hashedPassword,
      role,
      profile_image: profileImage, // Set profile image
    });

    // Save user to the database
    const newUser = await user.save();
    res.status(201).json(newUser);
  } catch (err) {
    res.status(500).json({ message: err.message });
    res.status(400).json({message:err.message})
  }
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid email or password' });

    const isPasswordCorrect = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordCorrect) return res.status(400).json({ message: 'Invalid email or password' });

    //token definition
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({ user, token });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// Update user
export const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Add device if deviceId is provided in the request body
    if (req.body.deviceId) {
      // Only add if not already present
      if (!user.devices.includes(req.body.deviceId)) {
        user.devices.push(req.body.deviceId);
      }
    }

    if (req.body.roomId) {
      // Only add if not already present
      if (!user.rooms.includes(req.body.roomId)) {
        user.rooms.push(req.body.roomId);
      }
    }

    // Handle normal updates
    if (req.body.first_name) user.first_name = req.body.first_name;
    if (req.body.last_name) user.last_name = req.body.last_name;
    if (req.body.email) user.email = req.body.email;
    if (req.body.passwordHash) user.passwordHash = req.body.passwordHash;
    if (req.body.profile_image) user.profile_image = req.body.profile_image;
    if (req.body.role) user.role = req.body.role;
    if (req.body.preferences) user.preferences = req.body.preferences;
    // if (req.body.devices && Array.isArray(req.body.devices)) user.devices = req.body.devices;
    // if (req.body.rooms && Array.isArray(req.body.rooms)) user.rooms = req.body.rooms;

    const updatedUser = await user.save();
    res.json(updatedUser);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Route: PUT /users/:id/remove-device
export const removeDevice = async (req, res) => {
  try {
    const { deviceId } = req.body;
    if (!deviceId) {
      return res.status(400).json({ message: "deviceId is required" });
    }

    // Atomically remove deviceId from devices array
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $pull: { devices: deviceId } },
      { new: true }
    );
    if (!updatedUser) return res.status(404).json({ message: "User not found" });

    res.json(updatedUser);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Route: PUT /users/:id/remove-room
export const removeRoom = async (req, res) => {
  try {
    const { roomId } = req.body;
    if (!roomId) {
      return res.status(400).json({ message: "roomId is required" });
    }

    // Atomically remove roomId from rooms array
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $pull: { rooms: roomId } },
      { new: true }
    );
    if (!updatedUser) return res.status(404).json({ message: "User not found" });

    res.json(updatedUser);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};



// Delete user
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
