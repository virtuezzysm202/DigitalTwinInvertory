const express = require('express');
const router = express.Router();

const markdownController = require('../controllers/markdownController.js');
const authMiddleware = require('../middleware/authMiddleware.js'); 

// Jalur Endpoint API Backend
router.get('/layout', authMiddleware, markdownController.getMarkdownLayout);
router.post('/parse', authMiddleware, markdownController.parseRawMarkdown);
router.post('/save', authMiddleware, markdownController.saveMarkdownLayout);

module.exports = router;