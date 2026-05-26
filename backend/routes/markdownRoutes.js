const express = require('express');
const router = express.Router();
const fileUpload = require('express-fileupload'); // Pasang library ini via npm i express-fileupload
const markdownController = require('../controllers/markdownController');
const authMiddleware = require('../middleware/authMiddleware')


// Jalur Endpoint API Backend
router.get('/layout', authMiddleware, markdownController.getMarkdownLayout);
router.post('/parse', authMiddleware, markdownController.parseRawMarkdown);
router.post('/save', authMiddleware, markdownController.saveMarkdownLayout);
router.post('/create-project', authMiddleware, fileUpload(), markdownController.createLayout);
router.get('/stats', authMiddleware, markdownController.getDashboardStats);

module.exports = router;