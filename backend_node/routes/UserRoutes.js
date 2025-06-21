import express from "express";
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  loginUser
} from "../controllers/UserController.js";

const router = express.Router();

router.get("/", getAllUsers);
router.get("/:id", getUserById);
router.post("/", createUser);
router.post('/login', loginUser);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);

export default router;
