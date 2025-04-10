// routes/DiscoveredDevicesRoutes.js
import express from "express";
import { getDiscoveredDevices, clearDiscoveredDevices } from "../discoveredDevices.js";

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const devices = await getDiscoveredDevices(); 
    res.json(devices);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Failed to fetch discovered devices' });
  }
});



router.delete("/", (req, res) => {
  clearDiscoveredDevices();
  res.json({ message: "Discovered devices cleared" });
});

export default router;
