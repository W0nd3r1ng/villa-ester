const express = require('express');
const router = express.Router();
const recommendationController = require('../controllers/recommendationController');
const fs = require('fs');
const path = require('path');

// Gallery images endpoint
router.get('/gallery-images', (req, res) => {
  const imagesDir = path.join(__dirname, '../../images');
  fs.readdir(imagesDir, (err, files) => {
    if (err) {
      return res.status(500).json({ success: false, error: 'Failed to read images directory.' });
    }
    // Only return image files (jpg, jpeg, png, gif, webp)
    const imageFiles = files.filter(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f));
    res.json({ success: true, images: imageFiles });
  });
});

router.get('/', recommendationController.getRecommendations);
 
module.exports = router; 