import express from "express";
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  removeDevice,
  removeRoom,
  deleteUser,
  loginUser
} from "../controllers/UserController.js";

const router = express.Router();

router.get("/", getAllUsers);
router.get("/:id", getUserById);
router.post("/", createUser);
router.post('/login', loginUser);
router.put("/:id", updateUser);
router.put("/:id/removedevice", removeDevice)
router.put("/:id/removeroom", removeRoom)
router.delete("/:id", deleteUser);

export default router;
