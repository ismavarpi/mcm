const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const router = express.Router();
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
const upload = multer({ dest: uploadDir });

router.post('/', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  const filename = Date.now() + '-' + req.file.originalname;
  const dest = path.join(uploadDir, filename);
  fs.renameSync(req.file.path, dest);
  res.json({ url: `/uploads/${filename}` });
});

module.exports = router;
