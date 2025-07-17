import Device from "../models/Device.js";

// Get all devices
export const getAllDevices = async (req, res) => {
  try {
    const devices = await Device.find()
    res.json(devices);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get device by ID
export const getDeviceById = async (req, res) => {
  try {
    const device = await Device.findById(req.params.id);
    if (!device) return res.status(404).json({ message: "Device not found" });
    res.json(device);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// GET /api/devices/name/:name
export const getDeviceByName = async (req, res) => {
  try {
    const device = await Device.findOne({ name: req.params.name });
    if (!device) return res.status(404).json({ message: "Device not found" });
    res.json(device);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



// Create a new device
export const createDevice = async (req, res) => {
  const { name, type, manufacturer, macAddress, ipAddress, uuid, protocol, status, metadata, icon } = req.body;
  const device = new Device({ name, type, manufacturer, macAddress, ipAddress, uuid, protocol, status, metadata, icon });
  try {
    const newDevice = await device.save();
    res.status(201).json(newDevice);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Update device
export const updateDevice = async (req, res) => {
  try {
    const device = await Device.findById(req.params.id);
    if (!device) return res.status(404).json({ message: "Device not found" });

    if (req.body.name) device.name = req.body.name;
    if (req.body.type) device.type = req.body.type;
    if (req.body.manufacturer) device.manufacturer = req.body.manufacturer;
    if (req.body.macAddress) device.macAddress = req.body.macAddress;
    if (req.body.ipAddress) device.ipAddress = req.body.ipAddress;
    if (req.body.protocol) device.protocol = req.body.protocol;
    if (req.body.status) device.status = req.body.status;
    if (req.body.metadata) device.metadata = req.body.metadata;
    if (req.body.icon) device.icon = req.body.icon;

    const updatedDevice = await device.save();
    res.json(updatedDevice);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Delete device
export const deleteDevice = async (req, res) => {
  try {
    const device = await Device.findByIdAndDelete(req.params.id);
    if (!device) {
      return res.status(404).json({ message: "Device not found" });
    }

    res.json({ message: "Device deleted successfully" });
  } catch (err) {
    console.error("Error deleting device:", err);
    res.status(500).json({ message: err.message });
  }
};

