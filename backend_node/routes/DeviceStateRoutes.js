import express from "express";
import {
  getAllDeviceStatuses,
  getDeviceStatusByDeviceID,
  createDeviceStatus,
  updateDeviceStatus,
  deleteDeviceStatus,
} from "../controllers/DeviceStateController.js";

const router = express.Router();

router.get("/", getAllDeviceStatuses);
router.get("/:deviceID", getDeviceStatusByDeviceID);
router.post("/", createDeviceStatus);
router.put("/:deviceID", updateDeviceStatus);
router.delete("/:deviceID", deleteDeviceStatus);

export default router;
