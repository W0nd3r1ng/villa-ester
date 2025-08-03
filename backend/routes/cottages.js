const express = require('express');
const router = express.Router();
const cottageController = require('../controllers/cottageController');

router.get('/', cottageController.getAllCottages);
router.post('/', cottageController.addCottage);
router.put('/:id', cottageController.updateCottage);
router.put('/update-status', cottageController.updateCottageStatus);
// Add more endpoints as needed

module.exports = router; 