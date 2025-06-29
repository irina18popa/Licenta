import express from 'express';
import multer from 'multer';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs'


// Configure storage for multer
const mediaDir = path.join(process.cwd(), 'media');
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, mediaDir),
  filename: (_req, file, cb) => cb(null, file.originalname)
});
const upload = multer({ storage });

const router = express.Router();

router.post('/', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const origName  = req.file.originalname;
  const ext       = path.extname(origName).toLowerCase();
  let serveName  = origName;

  // If it's .mov, remux to .mp4
  if (ext === '.mov') {
    const base      = path.basename(origName, ext);
    const mp4Name   = `${base}.mp4`;
    const movPath   = path.join(mediaDir, origName);
    const mp4Path   = path.join(mediaDir, mp4Name);

    try {
      await new Promise((resolve, reject) => {
        ffmpeg(movPath)
          .outputOptions('-c copy')    // remux: no re-encode, fast
          .save(mp4Path)
          .on('end', resolve)
          .on('error', reject);
      });
      // switch to serving the .mp4
      serveName = mp4Name;
      // optionally delete the original MOV:
        fs.unlinkSync(movPath);
    } catch (err) {
      console.error('FFmpeg remux failed:', err);
      return res.status(500).json({ error: 'Video conversion failed' });
    }
  }

  const filename = encodeURIComponent(serveName);
  const host = req.get('host');       // e.g. '192.168.1.136:3000'
  const protocol = req.protocol;      // 'http' or 'https'
  const url = `${protocol}://${host}/api/media/${filename}`;
  res.json({ url });
});


router.delete('/:filename', async (req, res) => {
  const raw = req.params.filename;
  if (raw.includes('..')) {
    return res.status(400).json({ error: 'Invalid filename' });
  }
  const filename = decodeURIComponent(raw);
  const filePath = path.join(mediaDir, filename);
  fs.unlink(filePath, err => {
    if (err) {
      console.error('Failed to delete media file:', err);
      return res.status(500).json({ error: 'Failed to delete file' });
    }
    res.sendStatus(204);
  });
});

export default router;
