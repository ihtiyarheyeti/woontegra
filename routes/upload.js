const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const { authenticateToken, requireAdmin, requireViewer } = require('../middleware/auth');

// Apply JWT authentication to all routes
router.use(authenticateToken);

// Upload single image (Viewer+)
router.post('/image', requireViewer, uploadController.upload.single('image'), uploadController.uploadImage);

// Upload multiple images (Viewer+)
router.post('/images', requireViewer, uploadController.upload.array('images', 10), uploadController.uploadImages);

// Delete image (Viewer+)
router.delete('/image/:filename', requireViewer, uploadController.deleteImage);

module.exports = router; 