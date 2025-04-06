import express from "express";
import {
  getAllDeviceCommands,
  getDeviceCommandByType,
  createDeviceCommand,
  updateDeviceCommand,
  deleteDeviceCommand,
} from "../controllers/DeviceCommandsController.js";

const router = express.Router();

// Use deviceType as the identifier for these operations
router.get("/", getAllDeviceCommands);
router.get("/:deviceType", getDeviceCommandByType);
router.post("/", createDeviceCommand);
router.put("/:deviceType", updateDeviceCommand);
router.delete("/:deviceType", deleteDeviceCommand);

export default router;
