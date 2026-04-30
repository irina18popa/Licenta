import express from "express";
import {
  getAllDeviceCommands,
  getDeviceCommandByDeviceID,
  createDeviceCommand,
  updateDeviceCommand,
  deleteDeviceCommand,
} from "../controllers/DeviceCommandsController.js";

const router = express.Router();

// Use deviceType as the identifier for these operations
router.get("/", getAllDeviceCommands);
router.get("/:deviceID", getDeviceCommandByDeviceID);
router.post("/", createDeviceCommand);
router.put("/:deviceID", updateDeviceCommand);
router.delete("/:deviceID", deleteDeviceCommand);

export default router;
