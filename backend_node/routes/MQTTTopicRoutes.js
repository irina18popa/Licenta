import express from "express";
import {
  getAllMQTTTopics,
  getMQTTTopicById,
  createMQTTTopic,
  updateMQTTTopic,
  deleteMQTTTopic,
  handleMQTTMessage
} from "../controllers/MQTTTopicController.js";

const router = express.Router();

const mqttTopicRoutes = (mqttClient) =>
{
  router.get("/", getAllMQTTTopics);
  router.get("/:id", getMQTTTopicById);
  router.post("/", createMQTTTopic);
  router.post("/handle", (req, res) =>handleMQTTMessage(req, res, mqttClient))
  router.put("/:id", updateMQTTTopic);
  router.delete("/:id", deleteMQTTTopic);

  return router
}

export default mqttTopicRoutes;
