import User from "../models/Users.js";
import bcrypt from 'bcryptjs';
import PasswordValidator from 'password-validator';
import validator from 'validator'; // Import the validator library


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
    const { name, email, password, role, preferences } = req.body;

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
      name,
      email,
      passwordHash: hashedPassword,
      role,
      preferences,
    });

    // Save user to the database
    const newUser = await user.save();
    res.status(201).json(newUser);
  } catch (err) {
    res.status(500).json({ message: err.message });
    res.status(400).json({message:err.message})
  }
};


// Update user
export const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (req.body.name) user.name = req.body.name;
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
