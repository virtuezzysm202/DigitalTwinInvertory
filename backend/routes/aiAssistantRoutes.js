const express = require('express');
const router = express.Router();
const aiAssistantController = require('../controllers/aiAssistantController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/chat', authMiddleware, aiAssistantController.chat);

module.exports = router;