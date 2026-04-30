import express from 'express';
import path from 'path';
import fs from 'fs';

const mediaDirPath = path.join(process.cwd(), 'media');
export const mediaRoutes = express.Router();

// static serving is done in main server: app.use('/api/media', express.static(mediaDir))
// DELETE /api/media/:filename
mediaRoutes.delete('/:filename', async(req, res) => {
  const raw      = req.params.filename;
  if (raw.includes('..')) return res.status(400).json({ error: 'Invalid filename' });

  const filename = decodeURIComponent(raw);
  const filePath = path.join(mediaDirPath, filename);
  fs.unlink(filePath, err => {
    if (err) {
      console.error('Failed to delete media file:', err);
      return res.status(500).json({ error: 'Failed to delete file' });
    }
    res.sendStatus(204);
  });
});