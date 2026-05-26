const inventoryService = require('../services/inventory/inventoryService');

exports.getAllInventory = async (req, res) => {
  try {
    const userId = req.user.id;

    const fileMeta = await inventoryService.getMarkdownMetadata(userId);
    const items = await inventoryService.getInventoryFromMarkdown(fileMeta.id) || [];
    
    // 1. AMBIL DAFTAR ZONA ASLI DARI FILE SEPERTI DI ENDPOINT GET AVAILABLE ZONES
    const actualZones = await inventoryService.getZonesFromMarkdown(fileMeta.id) || [];
    const globalTotalZones = actualZones.length; // SINKRON! Menghitung zona asli, bukan dari lokasi barang

    // Hitung sisa metrik lainnya
    const globalLowStock = items.filter(item => item.status === "Low Stock" || item.qty <= 5).length;
    
    const globalTotalValue = items.reduce((acc, item) => {
      const value = Number(item.unit_value || 0); 
      const quantity = Number(item.qty || 0);
      return acc + (value * quantity);
    }, 0);

    // ========================================================
    // JALUR PINTAS DASHBOARD (?limit=1)
    // ========================================================
    if (req.query.limit === '1') {
      return res.status(200).json({
        success: true,
        data: items.slice(0, 1),
        totalPages: 1,
        currentPage: 1,
        totalItems: items.length,
        globalLowStock: globalLowStock,
        globalTotalValue: globalTotalValue,
        globalTotalZones: globalTotalZones || 1 
      });
    }
    // ========================================================

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    const paginatedItems = items.slice(offset, offset + limit);

    res.status(200).json({
      success: true,
      data: paginatedItems,
      totalPages: Math.ceil(items.length / limit),
      currentPage: page,
      totalItems: items.length,
      globalLowStock,      
      globalTotalValue,    
      globalTotalZones: globalTotalZones || 1 
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
    
    const itemCode = req.body.itemCode || req.body.sku || req.body.item_code;
    const name = req.body.name || req.body.itemName;
    const location = req.body.location || req.body.zone;
    
    const { category, quantity, unitValue, description, pos } = req.body;

    if (!itemCode || !name || !location) {
      return res.status(400).json({ success: false, message: 'SKU, Nama, dan Lokasi (Zone) wajib diisi!' });
    }

    // ========================================================
    // LOGIKA AUTO-POSISI (ANTI NUMPUK SYSTEM V2)
    // ========================================================
    let finalPos = pos;

    const isDefaultPos = !finalPos || 
                        finalPos === "30, 30" || 
                        finalPos === "30,30" || 
                        (Array.isArray(finalPos) && finalPos[0] === 30 && finalPos[1] === 30);

    if (isDefaultPos) {
      const allItems = await inventoryService.getInventoryFromMarkdown(fileMeta.id) || [];
      
      // [FIX] Gunakan .includes() agar "Loading Dock Inbound" cocok dengan "[Zone] Loading Dock Inbound"
      const itemsInSameZone = allItems.filter(item => {
        if (!item.location) return false;
        const cleanItemLocation = item.location.toLowerCase().replace('[zone]', '').trim();
        const cleanTargetLocation = location.toLowerCase().replace('[zone]', '').trim();
        return cleanItemLocation.includes(cleanTargetLocation) || cleanTargetLocation.includes(cleanItemLocation);
      });

      const count = itemsInSameZone.length; 
      
      // Konfigurasi Grid Rapat (Jarak per item 30px)
      const startX = 30;     
      const startY = 30;     
      const spacing = 30;    // Jarak aman & rapat
      const itemsPerRow = 5; // Maksimal 5 barang sebaris ke kanan

      const offsetX = (count % itemsPerRow) * spacing;
      const offsetY = Math.floor(count / itemsPerRow) * spacing;

      finalPos = `${startX + offsetX}, ${startY + offsetY}`;
    }
    // ========================================================

    const itemPayload = {
      itemCode: itemCode.trim().toUpperCase(),
      name: name.trim(),
      category: category ? category.trim() : 'Uncategorized',
      location: location.trim(),
      qty: Number(quantity || req.body.qty) || 0,
      unit_value: Number(unitValue || req.body.unit_value) || 0,
      description: description ? description.trim() : '',
      pos: finalPos 
    };

    await inventoryService.updateMarkdownItemLogic(fileMeta.id, null, itemPayload, 'ADD_ITEM');

    res.status(201).json({ 
      success: true, 
      message: `Item ${itemPayload.itemCode} ditambahkan ke ${itemPayload.location} pada posisi ${finalPos}` 
    });
  } catch (error) {
    console.error("Error di createInventory:", error);
    res.status(500).json({ success: false, message: 'Gagal memproses penambahan item' });
  }
};

exports.deleteInventory = async (req, res) => {
  try {
    // 1. Ambil Metadata File untuk mendapatkan fileId murni dari database
    const fileMeta = await inventoryService.getMarkdownMetadata(req.user.id);
    const fileId = fileMeta.id;

    // 2. Ambil SKU / Item Code dari parameter URL (misal: ITEM-02)
    const itemCode = req.params.id.trim().toUpperCase(); 

    // 3. Ambil daftar inventory saat ini untuk mencari data kuantitas lama (untuk log MySQL)
    const currentInventory = await inventoryService.getInventoryFromMarkdown(fileId) || [];
    const oldItem = currentInventory.find(item => item.item_code === itemCode || item.id === itemCode);

    // 4. Susun payload data baru (diperlukan service untuk mencocokkan kode item di string markdown)
    const updatePayload = {
      item_code: itemCode,
      name: oldItem ? oldItem.name : 'Unknown Item',
      location: oldItem ? oldItem.location : undefined // Agar service tahu area zona item tersebut
    };

    // 5. Eksekusi service dengan 4 parameter yang SINKRON & SEPADAN
    // Parameter: (fileId, oldItemsData, updateData, actionType)
    await inventoryService.updateMarkdownItemLogic(
      fileId, 
      oldItem || { qty: 0 }, 
      updatePayload, 
      'DELETE_ITEM' // WAJIB 'DELETE_ITEM' agar sesuai dengan kondisi if (actionType === 'DELETE_ITEM') di service
    ); 

    return res.status(200).json({ 
      success: true, 
      message: `Item [${itemCode}] berhasil dihapus dari sistem Digital Twin.` 
    });

  } catch (error) {
    console.error("Gagal mengeksekusi deleteInventory:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Gagal menghapus item dari berkas Markdown",
      error: error.message 
    });
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
    const { items, markdown } = req.body; 
    
    const fileMeta = await inventoryService.getMarkdownMetadata(req.user.id);

    if (markdown) {
      await inventoryService.writeRawMarkdown(fileMeta.id, markdown);
    } else if (items && Array.isArray(items)) {
      for (const item of items) {
        await inventoryService.updateMarkdownItemLogic(fileMeta.id, null, item, 'SYNC_LAYOUT');
      }
    } else {
      return res.status(400).json({ success: false, message: 'Format data transaksi sync tidak valid' });
    }

    res.status(200).json({ success: true, message: 'Sinkronisasi berkas layout berhasil dieksekusi' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Proses sinkronisasi massal gagal' });
  }
};

// Ambil list objek zona langsung dari struktur file .md
exports.getAvailableZones = async (req, res) => {
  try {
    const userId = req.user.id;
    const fileMeta = await inventoryService.getMarkdownMetadata(userId);
    
    const zones = await inventoryService.getZonesFromMarkdown(fileMeta.id) || [];
    
    return res.status(200).json({
      success: true,
      data: zones 
    });
  } catch (error) {
    console.error("Error di getAvailableZones:", error);
    return res.status(500).json({ success: false, message: 'Gagal memuat daftar zona' });
  }
};

// Membuat zona baru
exports.createZone = async (req, res) => {
  try {
    const fileMeta = await inventoryService.getMarkdownMetadata(req.user.id);
    const { name, w, h, color, x, y } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Nama Zona wajib diisi!' });
    }

    const zoneW = Number(w) || 200; 
    const zoneH = Number(h) || 150; 

    let finalX = Number(x);
    let finalY = Number(y);

    if (x === undefined || y === undefined) {
      const allZones = await inventoryService.getZonesFromMarkdown(fileMeta.id) || [];
      const count = allZones.length;

      const startX = 30;      
      const startY = 30;      
      const gap = 25;          
      const zonesPerRow = 3;   

      const stepX = zoneW + gap; 
      const stepY = zoneH + gap; 

      const offsetX = (count % zonesPerRow) * stepX;
      const offsetY = Math.floor(count / zonesPerRow) * stepY;

      finalX = startX + offsetX;
      finalY = startY + offsetY;
    }

    const zonePayload = {
      name: name.trim(),
      w: zoneW,
      h: zoneH,
      color: color || '#22c55e',
      x: finalX, 
      y: finalY  
    };

    await inventoryService.addNewZoneToMarkdown(fileMeta.id, zonePayload);

    res.status(201).json({
      success: true,
      message: `Zona [${zonePayload.name}] berhasil dibuat di posisi (${finalX}, ${finalY})!`,
      data: zonePayload 
    });
  } catch (error) {
    console.error("Error di createZone controller:", error);
    res.status(500).json({ success: false, message: 'Gagal membuat zona baru' });
  }
};

// Endpoint untuk delete zona
exports.deleteZone = async (req, res) => {
  try {
    const fileMeta = await inventoryService.getMarkdownMetadata(req.user.id);
    const { zoneName, name } = req.body; 

    const targetName = zoneName || name;

    if (!targetName) {
      return res.status(400).json({ success: false, message: 'Nama zona yang akan dihapus wajib diisi!' });
    }

    // Eksekusi pembersihan string file markdown
    await exports.updateMarkdownZoneLogic(fileMeta.id, targetName, null, 'DELETE_ZONE');

    res.status(200).json({ 
      success: true, 
      message: `Zona "${targetName}" beserta seluruh item di dalamnya berhasil dihapus.` 
    });
  } catch (error) {
    console.error("Error di deleteZone:", error);
    res.status(500).json({ success: false, message: 'Gagal menghapus zona' });
  }
};

// Endpoint untuk update zona
exports.updateZone = async (req, res) => {
  try {
    const fileMeta = await inventoryService.getMarkdownMetadata(req.user.id);
    const { oldName, name, w, h, x, y, color } = req.body;

    if (!oldName) {
      return res.status(400).json({ success: false, message: 'Nama zona target (oldName) wajib diisi!' });
    }

    const updatePayload = {
      name: name ? name.trim() : undefined,
      w: w !== undefined && w !== "" ? Number(w) : undefined,
      h: h !== undefined && h !== "" ? Number(h) : undefined,
      x: x !== undefined && x !== "" ? Number(x) : undefined,
      y: y !== undefined && y !== "" ? Number(y) : undefined,
      color: color || undefined
    };

    await exports.updateMarkdownZoneLogic(fileMeta.id, oldName, updatePayload, 'UPDATE_ZONE');

    res.status(200).json({ success: true, message: `Zona "${oldName}" berhasil diperbarui.` });
  } catch (error) {
    console.error("Error di updateZone:", error);
    res.status(500).json({ success: false, message: 'Gagal memperbarui properti zona' });
  }
};

/**
 * LOGIKA MANIPULASI STRING UPDATE DAN DELETE ZONA DI FILE .MD
 */
exports.updateMarkdownZoneLogic = async (fileId, zoneName, updateData, actionType) => {
  try {
    const readFn = typeof readMDFileById !== 'undefined' ? readMDFileById : inventoryService.readRawMarkdown || inventoryService.getInventoryMarkdownRaw;
    const writeFn = typeof writeMDFileById !== 'undefined' ? writeMDFileById : inventoryService.writeRawMarkdown;

    let content = "";
    if (typeof inventoryService.readRawMarkdown === 'function') {
      content = await inventoryService.readRawMarkdown(fileId);
    } else if (typeof readFn === 'function') {
      content = await readFn(fileId);
    } else {
      throw new Error("Helper untuk membaca file Markdown tidak ditemukan di layer service.");
    }

    const lines = content.split('\n');
    let updatedLines = [];
    let insideTargetZone = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      if (trimmed.startsWith('## ') && trimmed.includes('[Zone]')) {
        if (trimmed.toLowerCase().includes(`[zone] ${zoneName.toLowerCase()}`) || trimmed.toLowerCase().replace(/\s+/g, '').includes(`[zone]${zoneName.toLowerCase().replace(/\s+/g, '')}`)) {
          insideTargetZone = true;

          if (actionType === 'DELETE_ZONE') {
            continue; 
          } else if (actionType === 'UPDATE_ZONE') {
            // 1. Buang semua tanda koma agar regex tidak kebingungan
            const cleanLine = trimmed.replace(/,/g, ' ');

            // 2. Regex baru yang lebih fleksibel (mendukung spasi sebelum dan sesudah titik dua)
            const matchW = cleanLine.match(/W\s*:\s*(\d+)/i);
            const matchH = cleanLine.match(/H\s*:\s*(\d+)/i);
            const matchX = cleanLine.match(/X\s*:\s*([\d-]+)/i);
            const matchY = cleanLine.match(/Y\s*:\s*([\d-]+)/i);
            const matchColor = cleanLine.match(/color\s*:\s*["']?([^"'\s]+)["']?/i);

            const oldW = matchW ? Number(matchW[1]) : 200;
            const oldH = matchH ? Number(matchH[1]) : 150;
            const oldX = matchX ? Number(matchX[1]) : 30;
            const oldY = matchY ? Number(matchY[1]) : 30;
            const oldColor = matchColor ? matchColor[1] : '#22c55e';

            const newName = updateData.name || zoneName;
            // 3. Pastikan data dari frontend dipaksa menjadi Number
            const w = updateData.w !== undefined && updateData.w !== null && updateData.w !== "" ? Number(updateData.w) : oldW;
            const h = updateData.h !== undefined && updateData.h !== null && updateData.h !== "" ? Number(updateData.h) : oldH;
            const x = updateData.x !== undefined && updateData.x !== null && updateData.x !== "" ? Number(updateData.x) : oldX;
            const y = updateData.y !== undefined && updateData.y !== null && updateData.y !== "" ? Number(updateData.y) : oldY;
            const color = updateData.color || oldColor;

            // 4. Susun ulang dengan format bersih
            const newZoneLine = `## [Zone] ${newName.trim()} (W: ${w}, H: ${h}, X: ${x}, Y: ${y}, color: ${color})`;
            updatedLines.push(newZoneLine);
            continue;
          }
        } else {
          insideTargetZone = false;
        }
      }

      if (insideTargetZone && actionType === 'DELETE_ZONE' && trimmed.startsWith('-')) {
        continue; 
      }

      updatedLines.push(line);
    }

    if (typeof inventoryService.writeRawMarkdown === 'function') {
      await inventoryService.writeRawMarkdown(fileId, updatedLines.join('\n'));
    } else if (typeof writeFn === 'function') {
      await writeFn(fileId, updatedLines.join('\n'));
    }

    return true;
  } catch (error) {
    console.error("Gagal memproses update/delete zona di markdown:", error);
    throw error;
  }
};