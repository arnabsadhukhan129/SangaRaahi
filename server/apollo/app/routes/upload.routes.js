const routes = require('express').Router();
const multer = require('multer');
const { uploadFileToS3 } = require('../services/s3.service');

const upload = multer();
const MAX_FILES = 10; // adjust as needed

// Public endpoint — supports multiple images now
routes.post('/', upload.array('images', MAX_FILES), async (req, res) => {
  try {
    const { type } = req.body; // e.g., blog, community, profile, event...
    if (!type) return res.status(400).json({ error: 'Module type is required' });

    if (!req.files || req.files.length === 0)
      return res.status(400).json({ error: 'No files uploaded' });

    const uploadedUrls = await Promise.all(
      req.files.map(file =>
        uploadFileToS3(file.buffer, file.originalname, file.mimetype, type)
      )
    );

    res.status(200).json({ urls: uploadedUrls });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Failed to upload images' });
  }
});

module.exports = routes;