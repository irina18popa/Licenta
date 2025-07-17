import express from "express";
import {
  createLog, 
  deleteLogsByDeviceId, 
  getLogsByDeviceId,
  getLast6StatusLogs
} from "../controllers/LogsController.js";

const router = express.Router();

router.get("/:deviceId", getLogsByDeviceId);
router.get('/:deviceId/status', getLast6StatusLogs);
router.post("/", createLog);
router.delete("/:deviceId", deleteLogsByDeviceId);

export default router;