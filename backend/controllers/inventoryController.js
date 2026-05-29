const inventoryService = require('../services/inventory/inventoryService');

// Helper: cari file yang mengandung zona tertentu
const findFileByZoneName = async (userId, zoneName) => {
  const files = await inventoryService.getAllFilesMetadata(userId);
  for (const file of files) {
    const zones = await inventoryService.getZonesFromMarkdown(file.id);
    if (zones.find(z => z.name.toLowerCase().replace(/\s+/g, '') === zoneName.toLowerCase().replace(/\s+/g, '')))
      return file;
  }
  return files[0] || null;
};

// Helper: cari file yang mengandung item tertentu
const findFileByItemCode = async (userId, itemCode) => {
  const files = await inventoryService.getAllFilesMetadata(userId);
  for (const file of files) {
    const items = await inventoryService.getInventoryFromMarkdown(file.id);
    const found = items.find(i => i.item_code === itemCode || i.id === itemCode);
    if (found) return { file, item: found };
  }
  return { file: files[0] || null, item: null };
};

// Get All
exports.getAllInventory = async (req, res) => {
  try {
    const userId = req.user.id;
    const searchKeyword = req.query.search || '';

    const files = await inventoryService.getAllFilesMetadata(userId);
    if (files.length === 0) {
      return res.status(200).json({
        success: true, data: [], totalPages: 1, currentPage: 1,
        totalItems: 0, globalLowStock: 0, globalTotalValue: 0, globalTotalZones: 0
      });
    }

    let allItems = [], allZones = [];
    for (const file of files) {
      const items = await inventoryService.getInventoryFromMarkdown(file.id, searchKeyword);
      items.forEach(item => { item.sourceFile = file.filename; item.fileId = file.id; });
      allItems = allItems.concat(items);

      const zones = await inventoryService.getZonesFromMarkdown(file.id);
      zones.forEach(z => { z.fileId = file.id; z.sourceFile = file.filename; });
      allZones = allZones.concat(zones);
    }

    // Sort by qty descending
    allItems.sort((a, b) => b.qty - a.qty);

    const globalLowStock = allItems.filter(i => i.qty > 0 && i.qty <= 5).length;
    const globalTotalValue = allItems.reduce((acc, i) => acc + Number(i.value || 0), 0);

    if (req.query.limit === '1') {
      return res.status(200).json({
        success: true, data: allItems.slice(0, 1), totalPages: 1, currentPage: 1,
        totalItems: allItems.length, globalLowStock, globalTotalValue, globalTotalZones: allZones.length
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    return res.status(200).json({
      success: true,
      data: allItems.slice(offset, offset + limit),
      totalPages: Math.ceil(allItems.length / limit),
      currentPage: page, totalItems: allItems.length,
      globalLowStock, globalTotalValue, globalTotalZones: allZones.length
    });
  } catch (error) {
    console.error('Error getAllInventory:', error);
    res.status(500).json({ success: false, message: 'Gagal memuat inventory' });
  }
};

//  CREATE ITEM 
exports.createInventory = async (req, res) => {
  try {
    const userId = req.user.id;
    const itemCode = req.body.itemCode || req.body.item_code;
    const name = req.body.name || req.body.itemName;
    const location = req.body.location || req.body.zone;

    if (!itemCode || !name || !location)
      return res.status(400).json({ success: false, message: 'SKU, Nama, dan Zona wajib diisi.' });

    const targetFile = await findFileByZoneName(userId, location);
    if (!targetFile)
      return res.status(404).json({ success: false, message: 'Buat layout dulu di Dashboard.' });

    let finalPos = req.body.pos;
    const isDefaultPos = !finalPos || finalPos === '30, 30' || finalPos === '30,30';
    if (isDefaultPos) {
      const zoneItems = (await inventoryService.getInventoryFromMarkdown(targetFile.id))
        .filter(i => i.location.toLowerCase().replace(/\s+/g, '') === location.toLowerCase().replace(/\s+/g, ''));
      const count = zoneItems.length;
      finalPos = `${30 + (count % 5) * 30}, ${30 + Math.floor(count / 5) * 30}`;
    }

    await inventoryService.updateMarkdownItemLogic(targetFile.id, null, {
      item_code: itemCode.trim().toUpperCase(), name: name.trim(), location: location.trim(),
      qty: Number(req.body.quantity || req.body.qty) || 0,
      unit_value: Number(req.body.unitValue || req.body.unit_value) || 0,
      pos: finalPos
    }, 'ADD_ITEM');

    res.status(201).json({ success: true, message: `Item ${itemCode} ditambahkan ke ${location}` });
  } catch (error) {
    console.error('Error createInventory:', error);
    res.status(500).json({ success: false, message: 'Gagal menambah item' });
  }
};

// DELETE ITEM 
exports.deleteInventory = async (req, res) => {
  try {
    const userId = req.user.id;
    const itemCode = req.params.id.trim().toUpperCase();
    const { file, item } = await findFileByItemCode(userId, itemCode);
    if (!file) return res.status(404).json({ success: false, message: 'Layout tidak ditemukan.' });

    await inventoryService.updateMarkdownItemLogic(
      file.id, item || { qty: 0 },
      { item_code: itemCode, name: item?.name || 'Unknown', location: item?.location },
      'DELETE_ITEM'
    );
    res.status(200).json({ success: true, message: `Item ${itemCode} berhasil dihapus.` });
  } catch (error) {
    console.error('Error deleteInventory:', error);
    res.status(500).json({ success: false, message: 'Gagal menghapus item' });
  }
};

// UPDATE ITEM 
exports.updateInventory = async (req, res) => {
  try {
    const userId = req.user.id;
    const itemCode = req.params.id || req.body.item_code;
    const { file } = await findFileByItemCode(userId, itemCode);
    if (!file) return res.status(404).json({ success: false, message: 'Layout tidak ditemukan.' });

    await inventoryService.updateMarkdownItemLogic(file.id, { qty: req.body.oldQty || 0 }, req.body, 'UPDATE_ITEM');
    res.status(200).json({ success: true, message: 'Item berhasil diperbarui.' });
  } catch (error) {
    console.error('Error updateInventory:', error);
    res.status(500).json({ success: false, message: 'Gagal update item' });
  }
};

// SYNC 
exports.syncInventory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { items, markdown, fileId } = req.body;

    if (fileId && markdown) {
      await inventoryService.writeRawMarkdown(fileId, markdown);
      return res.status(200).json({ success: true, message: 'Sync berhasil.' });
    }

    const fileMeta = await inventoryService.getMarkdownMetadata(userId);
    if (!fileMeta) return res.status(404).json({ success: false, message: 'Buat layout dulu.' });

    if (markdown) {
      await inventoryService.writeRawMarkdown(fileMeta.id, markdown);
    } else if (items && Array.isArray(items)) {
      for (const item of items) {
        await inventoryService.updateMarkdownItemLogic(fileMeta.id, null, item, 'SYNC_LAYOUT');
      }
    } else {
      return res.status(400).json({ success: false, message: 'Format data tidak valid.' });
    }

    res.status(200).json({ success: true, message: 'Sinkronisasi berhasil.' });
  } catch (error) {
    console.error('Error syncInventory:', error);
    res.status(500).json({ success: false, message: 'Gagal sync' });
  }
};

// GET ZONES (agregasi semua file)
exports.getAvailableZones = async (req, res) => {
  try {
    const userId = req.user.id;
    const files = await inventoryService.getAllFilesMetadata(userId);
    if (files.length === 0) return res.status(200).json({ success: true, data: [] });

    let allZones = [];
    for (const file of files) {
      const zones = await inventoryService.getZonesFromMarkdown(file.id);
      zones.forEach(z => { z.fileId = file.id; z.sourceFile = file.filename; });
      allZones = allZones.concat(zones);
    }
    res.status(200).json({ success: true, data: allZones });
  } catch (error) {
    console.error('Error getAvailableZones:', error);
    res.status(500).json({ success: false, message: 'Gagal memuat zona' });
  }
};

//  CREATE ZONE 
exports.createZone = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, w, h, color, x, y, fileId } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Nama zona wajib diisi.' });

    let targetFileId = fileId;
    if (!targetFileId) {
      const fileMeta = await inventoryService.getMarkdownMetadata(userId);
      if (!fileMeta) return res.status(404).json({ success: false, message: 'Buat layout dulu di Dashboard.' });
      targetFileId = fileMeta.id;
    }

    let finalX = Number(x), finalY = Number(y);
    if (x === undefined || y === undefined) {
      const zones = await inventoryService.getZonesFromMarkdown(targetFileId);
      const count = zones.length;
      const zW = Number(w) || 200, zH = Number(h) || 150;
      finalX = 30 + (count % 3) * (zW + 25);
      finalY = 30 + Math.floor(count / 3) * (zH + 25);
    }

    await inventoryService.addNewZoneToMarkdown(targetFileId, {
      name: name.trim(), w: Number(w) || 200, h: Number(h) || 150,
      color: color || '#22c55e', x: finalX, y: finalY
    });
    res.status(201).json({ success: true, message: `Zona [${name}] berhasil dibuat.` });
  } catch (error) {
    console.error('Error createZone:', error);
    res.status(500).json({ success: false, message: 'Gagal membuat zona' });
  }
};

// DELETE ZONE 
exports.deleteZone = async (req, res) => {
  try {
    const userId = req.user.id;
    const targetName = req.body.zoneName || req.body.name;
    if (!targetName) return res.status(400).json({ success: false, message: 'Nama zona wajib diisi.' });

    const files = await inventoryService.getAllFilesMetadata(userId);
    let targetFile = null;
    for (const file of files) {
      const zones = await inventoryService.getZonesFromMarkdown(file.id);
      if (zones.find(z => z.name.toLowerCase().replace(/\s+/g, '') === targetName.toLowerCase().replace(/\s+/g, ''))) {
        targetFile = file; break;
      }
    }
    if (!targetFile) return res.status(404).json({ success: false, message: 'Zona tidak ditemukan.' });

    await inventoryService.updateMarkdownZoneLogic(targetFile.id, targetName, null, 'DELETE_ZONE');
    res.status(200).json({ success: true, message: `Zona "${targetName}" berhasil dihapus.` });
  } catch (error) {
    console.error('Error deleteZone:', error);
    res.status(500).json({ success: false, message: 'Gagal menghapus zona' });
  }
};

// UPDATE ZONE 
exports.updateZone = async (req, res) => {
  try {
    const userId = req.user.id;
    const { oldName, name, w, h, x, y, color } = req.body;
    if (!oldName) return res.status(400).json({ success: false, message: 'Nama zona target wajib diisi.' });

    const files = await inventoryService.getAllFilesMetadata(userId);
    let targetFile = null;
    for (const file of files) {
      const zones = await inventoryService.getZonesFromMarkdown(file.id);
      if (zones.find(z => z.name.toLowerCase().replace(/\s+/g, '') === oldName.toLowerCase().replace(/\s+/g, ''))) {
        targetFile = file; break;
      }
    }
    if (!targetFile) return res.status(404).json({ success: false, message: 'Zona tidak ditemukan.' });

    await inventoryService.updateMarkdownZoneLogic(targetFile.id, oldName, {
      name: name?.trim(),
      w: w !== undefined && w !== '' ? Number(w) : undefined,
      h: h !== undefined && h !== '' ? Number(h) : undefined,
      x: x !== undefined && x !== '' ? Number(x) : undefined,
      y: y !== undefined && y !== '' ? Number(y) : undefined,
      color: color || undefined
    }, 'UPDATE_ZONE');

    res.status(200).json({ success: true, message: `Zona "${oldName}" berhasil diperbarui.` });
  } catch (error) {
    console.error('Error updateZone:', error);
    res.status(500).json({ success: false, message: 'Gagal update zona' });
  }
};