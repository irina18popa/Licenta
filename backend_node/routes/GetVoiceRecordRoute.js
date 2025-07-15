import express from 'express';
import multer from 'multer';
import fs from 'fs'
import axios from 'axios';
import FormData from 'form-data';

const upload = multer({ dest: 'audio/' });
const router = express.Router();

router.post('/', upload.single('file'), async (req, res) => {
  try {
    const filePath = req.file.path;
    const fileStream = fs.createReadStream(filePath);

    const formData = new FormData();
    formData.append('file', fileStream, req.file.originalname);
    formData.append('language', 'english'); // Optional
    // formData.append('response_format', 'json');

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

    fs.unlinkSync(filePath); // Clean up uploaded file

    // Optionally parse/act on the transcript here
    const text = response.data.text;
    // e.g., check for smart home commands:
    // if (text && text.toLowerCase().includes('turn on')) { ... }

    res.json({ text });
  } catch (e) {
    res.status(500).json({ error: e.message || String(e) });
  }
});

export default router