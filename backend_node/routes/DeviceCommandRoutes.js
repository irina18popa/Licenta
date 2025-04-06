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
router.get("/:deviceType", getDeviceCommandByDeviceID);
router.post("/", createDeviceCommand);
router.put("/:deviceType", updateDeviceCommand);
router.delete("/:deviceType", deleteDeviceCommand);

export default router;
