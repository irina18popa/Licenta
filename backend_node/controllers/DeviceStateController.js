import DeviceStatus from "../models/DeviceState.js";


// Get all device status entries
export const getAllDeviceStatuses = async (req, res) => {
  try {
    const statuses = await DeviceStatus.find();
    res.json(statuses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get device status by deviceID
export const getDeviceStatusByDeviceID = async (req, res) => {
  try {
    const status = await DeviceStatus.findOne({deviceID:req.params.deviceID});
    if (!status) return res.status(404).json({ message: "Device status not found" });
    res.json(status);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Create a new device status entry
export const createDeviceStatus = async (req, res) => {
  const { deviceID, data } = req.body;

  const deviceStatus = new DeviceStatus({
    deviceID: deviceID,
    data,
    lastUpdated: new Date(),
  });

  try {
    const newStatus = await deviceStatus.save();
    res.status(201).json(newStatus);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Update existing device status by deviceID
export const updateDeviceStatus = async (req, res) => {
  try {
    const status = await DeviceStatus.findOne({deviceID : req.params.deviceID});
    if (!status) return res.status(404).json({ message: "Device status not found" });

    const updates = req.body.data;
    if (!Array.isArray(updates)) {
      return res.status(400).json({ message: "`data` must be an array" });
    }

    for (const { code, value } of updates) {
      const existing = status.data.find((d) => d.code === code);
      if (existing) {
        existing.value = value;
      } else {
        status.data.push({ code, value });
      }
    }

    status.lastUpdated = new Date();
    const updatedStatus = await status.save();
    res.json(updatedStatus);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Delete device status by deviceID
export const deleteDeviceStatus = async (req, res) => {
  try {
    const status = await DeviceStatus.findOneAndDelete({deviceID:req.params.deviceID});
    if (!status) return res.status(404).json({ message: "Device status not found" });

    res.json({ message: "Device status deleted successfully" });
  } catch (err) {
    console.error("Error deleting device status:", err);
    res.status(500).json({ message: err.message });
  }
};
