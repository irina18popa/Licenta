import DeviceCommand from "../models/DeviceCommands.js";

// Get all device command configurations
export const getAllDeviceCommands = async (req, res) => {
  try {
    const commands = await DeviceCommand.find();
    res.json(commands);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get device command configuration by deviceID
export const getDeviceCommandByDeviceID = async (req, res) => {
  try {
    const commandConfig = await DeviceCommand.findOne({ deviceID: req.params.deviceID });
    if (!commandConfig) return res.status(404).json({ message: "Device command configuration not found" });
    res.json(commandConfig);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Create a new device command configuration
export const createDeviceCommand = async (req, res) => {
  const { deviceID, commands } = req.body;

  const deviceCommand = new DeviceCommand({ deviceID, commands });

  try {
    const newConfig = await deviceCommand.save();
    res.status(201).json(newConfig);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Update an existing device command configuration by deviceID
export const updateDeviceCommand = async (req, res) => {
  try {
    const config = await DeviceCommand.findOne({ deviceID: req.params.deviceID });
    if (!config) return res.status(404).json({ message: "Device command configuration not found" });

    if (req.body.commands) config.commands = req.body.commands;

    const updatedConfig = await config.save();
    res.json(updatedConfig);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Delete a device command configuration by deviceID
export const deleteDeviceCommand = async (req, res) => {
  try {
    const config = await DeviceCommand.findOneAndDelete({ deviceID: req.params.deviceID });
    if (!config) return res.status(404).json({ message: "Device command configuration not found" });
    
    res.json({ message: "Device command configuration deleted successfully" });
  } catch (err) {
    console.error("Error deleting device commands:", err);
    res.status(500).json({ message: err.message });
  }
};
