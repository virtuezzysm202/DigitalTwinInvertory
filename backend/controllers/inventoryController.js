const inventoryService = require('../services/inventory/inventoryService');

// Ambil semua daftar barang (Data dibaca spesifik per user via service)
exports.getAllInventory = async (req, res) => {
  try {
    const userId = req.user.id; // ⬅️ FIX: Ambil ID user dari JWT Token

    // 1. Ambil metadata file markdown milik user ini
    const fileMeta = await inventoryService.getMarkdownMetadata(userId);
    
    // 2. Ambil data item dari file markdown spesifik milik user tersebut
    // Note: Pastikan di dalam inventoryService, fungsi getInventoryFromMarkdown sudah lu sesuaikan untuk menerima parameter fileMeta atau userId/filePath
    const items = await inventoryService.getInventoryFromMarkdown(fileMeta.id) || [];
    
    // 🔽 Hitung ringkasan statistik GLOBAL khusus untuk user yang sedang login
    const globalLowStock = items.filter(item => item.status === "Low Stock").length;
    
    // Total Nilai Aset Gudang (Nilai Satuan × Jumlah Stok)
    const globalTotalValue = items.reduce((acc, item) => {
      const value = Number(item.unit_value || 0); 
      const quantity = Number(item.qty || 0);
      return acc + (value * quantity);
    }, 0);

    // Total Zona Unik yang terdaftar milik user
    const globalTotalZones = new Set(
      items.filter(item => item.location).map(item => item.location.trim())
    ).size;

    // Pagination buatan untuk memotong data array hasil parsing .md
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    const paginatedItems = items.slice(offset, offset + limit);

    // 🚀 Kirim data pagination beserta metrik spesifik milik user ke Frontend
    res.status(200).json({
      success: true,
      data: paginatedItems,
      totalPages: Math.ceil(items.length / limit),
      currentPage: page,
      totalItems: items.length,
      globalLowStock,      
      globalTotalValue,    
      globalTotalZones     
    });
    
  } catch (error) {
    console.error("Error di getAllInventory (Multi-User):", error);
    res.status(500).json({ success: false, message: 'Gagal memuat data dari berkas Markdown milik user' });
  }
};

// Tambah item baru langsung ke berkas .md dan catat log auditnya
exports.createInventory = async (req, res) => {
  try {
    const fileMeta = await inventoryService.getMarkdownMetadata(req.user.id);
    
    // Eksekusi penulisan data dan pencatatan audit log ke tabel inventory_logs
    await inventoryService.updateMarkdownItemLogic(fileMeta.id, null, req.body, 'ADD_ITEM');

    res.status(201).json({ success: true, message: 'Item berhasil ditambahkan ke tata letak berkas' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Gagal memproses penambahan item' });
  }
};

// Hapus item dari tata letak ruang
exports.deleteInventory = async (req, res) => {
  try {
    const fileMeta = await inventoryService.getMarkdownMetadata(req.user.id);
    
    // Kirim instruksi hapus item ke service layer
    await inventoryService.updateMarkdownItemLogic(fileMeta.id, { qty: 0 }, req.body, 'DELETE_ITEM');

    res.status(200).json({ success: true, message: 'Item berhasil dihapus dari sistem berkas' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Gagal menghapus item' });
  }
};

// Update properti atau posisi item
exports.updateInventory = async (req, res) => {
  try {
    const fileMeta = await inventoryService.getMarkdownMetadata(req.user.id);
    
    await inventoryService.updateMarkdownItemLogic(fileMeta.id, { qty: req.body.oldQty || 0 }, req.body, 'UPDATE_ITEM');

    res.status(200).json({ success: true, message: 'Data item berhasil diperbarui' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Gagal memperbarui data item' });
  }
};

// Sinkronisasi massal dari canvas rendering frontend ke file .md utama
exports.syncInventory = async (req, res) => {
  try {
    const { items } = req.body;
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ success: false, message: 'Format data tidak valid' });
    }

    const fileMeta = await inventoryService.getMarkdownMetadata(req.user.id);

    // Iterasi sync data layout canvas ke struktur penulisan log MySQL
    for (const item of items) {
      await inventoryService.updateMarkdownItemLogic(fileMeta.id, null, item, 'SYNC_LAYOUT');
    }

    res.status(200).json({ success: true, message: 'Sinkronisasi berkas layout berhasil dieksekusi' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Proses sinkronisasi massal gagal' });
  }
};