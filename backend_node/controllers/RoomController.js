import Room from '../models/Room.js';


// GET /api/rooms
export const getAllRooms = async (req, res) => {
  try {
    const rooms = await Room.find().populate('devices');
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching rooms', error: err.message });
  }
};

// GET /api/rooms/:id
export const getRoomById = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id).populate('devices');
    if (!room) return res.status(404).json({ message: 'Room not found' });
    res.json(room);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching room', error: err.message });
  }
};

// POST /api/rooms
export const createRoom = async (req, res) => {
  try {
    const { name, image, devices = [] } = req.body;
    const room = new Room({ name, image, devices });
    await room.save();
    res.status(201).json(room);
  } catch (err) {
    res.status(400).json({ message: 'Failed to create room', error: err.message });
  }
};

// PUT /api/rooms/:id
export const updateRoom = async (req, res) => {
  try {
    const { name, image, devices } = req.body;
    const room = await Room.findByIdAndUpdate(
      req.params.id,
      { name, image, devices },
      { new: true }
    );
    if (!room) return res.status(404).json({ message: 'Room not found' });
    res.json(room);
  } catch (err) {
    res.status(400).json({ message: 'Failed to update room', error: err.message });
  }
};

// DELETE /api/rooms/:id
export const deleteRoom = async (req, res) => {
  try {
    const room = await Room.findByIdAndDelete(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found' });
    res.json({ message: 'Room deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete room', error: err.message });
  }
};

export const removeDeviceFromRoom = async (req, res) => {
  const { deviceId } = req.body;
  try {
    const updated = await RoomModel.findByIdAndUpdate(
      req.params.id,
      { $pull: { devices: deviceId } },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove device' });
  }
};
