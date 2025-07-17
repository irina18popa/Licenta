import express from "express";
import {
  getAllDevices,
  getDeviceById,
  createDevice,
  updateDevice,
  deleteDevice,
  getDeviceByName
} from "../controllers/DeviceController.js";

const router = express.Router();

router.get("/", getAllDevices);
router.get("/:id", getDeviceById);
router.get('/name/:name', getDeviceByName);
router.post("/", createDevice);
router.put("/:id", updateDevice);
router.delete("/:id", deleteDevice);

export default router;
