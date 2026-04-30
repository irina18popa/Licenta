import express from 'express';
import multer from 'multer';
import fs from 'fs'
import axios from 'axios';
import FormData from 'form-data';
import parseCommand from '../config/ParsingCommands.js'

const upload = multer({ dest: 'audio/' });
const router = express.Router();

router.post('/', upload.single('file'), async (req, res) => {
  try {
    const filePath = req.file.path;
    const fileStream = fs.createReadStream(filePath);

    const formData = new FormData();
    formData.append('file', fileStream, req.file.originalname);
    formData.append('language', 'english'); 

    const response = await axios.post(
      'https://api.lemonfox.ai/v1/audio/transcriptions',
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${process.env.WHISPER_API_KEY}`, 
        },
      }
    );

    fs.unlinkSync(filePath); 

    const text = response.data.text;

    const parsed = await parseCommand(text);
    res.json(parsed);

  } catch (e) {
    res.status(500).json({ error: e.message || String(e) });
  }
});

export default router