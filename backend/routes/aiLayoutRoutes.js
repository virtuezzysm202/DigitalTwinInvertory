const express = require('express');
const router = express.Router();
const aiLayoutController = require('../controllers/aiLayoutController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/layout', authMiddleware, aiLayoutController.layoutChat);

module.exports = router;