const multer = require('multer');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/images');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'product-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'), false);
    }
  }
});

/**
 * Upload single image
 * POST /api/upload/image
 */
const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Dosya yüklenmedi'
      });
    }

    // Generate public URL for the uploaded image
    const imageUrl = `/uploads/images/${req.file.filename}`;

    logger.info(`Image uploaded: ${req.file.filename} by user ${req.user.id}`);

    res.status(200).json({
      success: true,
      message: 'Görsel başarıyla yüklendi',
      data: {
        url: imageUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
      }
    });

  } catch (error) {
    logger.error('Error uploading image:', error);
    res.status(500).json({
      success: false,
      message: 'Görsel yüklenirken hata oluştu',
      error: error.message
    });
  }
};

/**
 * Upload multiple images
 * POST /api/upload/images
 */
const uploadImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Dosya yüklenmedi'
      });
    }

    const uploadedImages = req.files.map(file => ({
      url: `/uploads/images/${file.filename}`,
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype
    }));

    logger.info(`${req.files.length} images uploaded by user ${req.user.id}`);

    res.status(200).json({
      success: true,
      message: `${req.files.length} görsel başarıyla yüklendi`,
      data: uploadedImages
    });

  } catch (error) {
    logger.error('Error uploading images:', error);
    res.status(500).json({
      success: false,
      message: 'Görseller yüklenirken hata oluştu',
      error: error.message
    });
  }
};

/**
 * Delete uploaded image
 * DELETE /api/upload/image/:filename
 */
const deleteImage = async (req, res) => {
  try {
    const { filename } = req.params;
    const imagePath = path.join(__dirname, '../uploads/images', filename);

    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({
        success: false,
        message: 'Görsel bulunamadı'
      });
    }

    fs.unlinkSync(imagePath);

    logger.info(`Image deleted: ${filename} by user ${req.user.id}`);

    res.status(200).json({
      success: true,
      message: 'Görsel başarıyla silindi'
    });

  } catch (error) {
    logger.error('Error deleting image:', error);
    res.status(500).json({
      success: false,
      message: 'Görsel silinirken hata oluştu',
      error: error.message
    });
  }
};

module.exports = {
  uploadImage,
  uploadImages,
  deleteImage,
  upload
}; 