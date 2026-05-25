const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const authMiddleware = require('../middleware/authMiddleware'); // Pakai middleware baru

// Semua rute inventory dikunci menggunakan authMiddleware
router.get('/', authMiddleware, inventoryController.getAllInventory);
router.post('/', authMiddleware, inventoryController.createInventory);
router.post('/sync', authMiddleware, inventoryController.syncInventory);
router.put('/:id', authMiddleware, inventoryController.updateInventory);
router.delete('/:id', authMiddleware, inventoryController.deleteInventory);

module.exports = router;