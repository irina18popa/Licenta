import express from "express";
import {
  getAllMQTTTopics,
  getAllMQTTTopicsByType,
  getTopicByDeviceActionDirection,
  createMQTTTopic,
  updateMQTTTopicByDeviceActionDirection,
  deleteMQTTTopicsByDeviceId, 
  handleMQTTMessage
} from "../controllers/MQTTTopicController.js";

const router = express.Router();

const mqttTopicRoutes = (mqttClient) =>
{
  router.get("/", getAllMQTTTopics);
  router.get("/:deviceId/:action/:direction", getTopicByDeviceActionDirection,);
  router.get("/:type", getAllMQTTTopicsByType);
  router.post("/", createMQTTTopic);
  router.post("/handle", (req, res) =>handleMQTTMessage(req, res, mqttClient))
  router.put("/:deviceId/:action/:direction", updateMQTTTopicByDeviceActionDirection);
  router.delete("/:deviceId", deleteMQTTTopicsByDeviceId);

  return router
}

export default mqttTopicRoutes;
