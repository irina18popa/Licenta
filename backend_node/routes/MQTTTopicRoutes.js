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
  router.get("/type/:type", getAllMQTTTopicsByType);
  router.get("/device/:deviceId/:action/:direction", getTopicByDeviceActionDirection);
  router.post("/", createMQTTTopic);
  router.post("/handle", (req, res) => handleMQTTMessage(req, res, mqttClient));
  router.put("/device/:deviceId/:action/:direction", updateMQTTTopicByDeviceActionDirection);
  router.delete("/device/:deviceId", deleteMQTTTopicsByDeviceId);

  return router
}

export default mqttTopicRoutes;
