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

router.get('/files', authMiddleware, markdownController.getAllMarkdownFiles);
router.post('/files', authMiddleware, markdownController.createMarkdownFile);
router.delete('/files/:fileId', authMiddleware, markdownController.deleteMarkdownFile);
router.get('/files/:fileId', authMiddleware, markdownController.getMarkdownFileById);
router.get('/project/status', authMiddleware, markdownController.getProjectStatus);
router.delete('/project', authMiddleware, markdownController.deleteProject);
router.put('/files/:fileId/rename', authMiddleware, markdownController.renameMarkdownFile);