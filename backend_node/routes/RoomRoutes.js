import express from 'express';
import {
  getAllRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
  removeDeviceFromRoom,
  addDeviceToRoom,
  getRoomByName
} from '../controllers/RoomController.js';

const router = express.Router();

router.get('/', getAllRooms);
router.get('/:id', getRoomById);
router.get('/name/:name', getRoomByName);
router.post('/', createRoom);
router.put('/:id', updateRoom);
router.delete('/:id', deleteRoom);
router.post('/:id/remove-device', removeDeviceFromRoom);
router.post('/:id/add-device', addDeviceToRoom);

export default router;
