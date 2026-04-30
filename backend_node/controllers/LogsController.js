import Log from '../models/Logs.js';

export const createLog = async (req, res) => {
  try {
    const { type, deviceId, command, value } = req.body;
    const log = new Log({ type, deviceId, command, value });
    await log.save();
    res.status(201).json(log);
  } catch (err) {
    res.status(400).json({ message: 'Failed to create log', error: err.message });
  }
};

export const deleteLogsByDeviceId = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const result = await Log.deleteMany({ deviceId });
    res.json({ message: `Deleted ${result.deletedCount} log(s) for device ${deviceId}` });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete logs', error: err.message });
  }
};


export const getLogsByDeviceId = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const logs = await Log.find({ deviceId }).sort({ timestamp: -1 });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch logs', error: err.message });
  }
};

export const getLast6StatusLogs = async (req, res) => {
  try {
    const { deviceId } = req.params;
    // Find only status_change logs for this device, sort by newest, limit 6
    const logs = await Log.find({
      deviceId,
      type: "status_change"
    })
    .sort({ timestamp: -1 })
    .limit(6);

    // Reverse so the earliest is first (good for charts)
    const ordered = logs.reverse();

    // You might want to shape the response like this:
    const response = ordered.map(log => ({
      status: log.status,
      timestamp: log.timestamp
    }));

    res.json(response);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch logs', error: err.message });
  }
};
