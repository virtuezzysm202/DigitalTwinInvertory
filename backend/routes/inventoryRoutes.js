const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const authMiddleware = require('../middleware/authMiddleware');

// 1. Proteksi global untuk semua rute di bawah ini (Cukup ditulis sekali)
router.use(authMiddleware);

// 2. Rute Spesifik / Kelompok Zones (Wajib di atas rute dinamis)
router.get('/zones', inventoryController.getAvailableZones);
router.post('/zones', inventoryController.createZone);      // Bersihkan authMiddleware
router.delete('/zones', inventoryController.deleteZone);    // Pindahkan ke atas & bersihkan authMiddleware

// 3. Rute Utama Inventory
router.get('/', inventoryController.getAllInventory);
router.post('/', inventoryController.createInventory);
router.post('/sync', inventoryController.syncInventory);

// 4. Rute Dinamis Berdasarkan ID (Taruh paling bawah)
router.put('/:id', inventoryController.updateInventory);
router.delete('/:id', inventoryController.deleteInventory);

module.exports = router;