const inventoryService = require('../../services/inventory/inventoryService');
const { buildInventoryContext } = require('./aiContextBuilder');

// PARAMETER EXTRACTORS 

/**
 * Ekstrak kode/nama item dari pertanyaan
 * Contoh: "pindahkan ITEM-01 ke Rak B" → "ITEM-01"
 */
const extractItemName = (question) => {
  // Coba kode format huruf-angka (ITEM-01, GDT-001)
  const codeMatch = question.match(/\b([A-Za-z]{1,6}-\d{1,4})\b/);
  if (codeMatch) return codeMatch[1].toUpperCase();

  // Ambil kata setelah kata kunci aksi
  const nameMatch = question.match(
    /(?:pindahkan?|pindah|geser|move|update\s+posisi|posisi)\s+([^ke\s][^\n]+?)(?:\s+ke\s|\s+to\s|$)/i
  );
  if (nameMatch) return nameMatch[1].trim();

  return null;
};

/**
 * Ekstrak nama zona dari pertanyaan, cocokkan dengan zona di context
 * Contoh: "ke zona Rak B" → "Rak B"
 */
const extractTargetZone = (question, context) => {
  const q = question.toLowerCase();

  // Cocokkan langsung dengan nama zona yang ada
  if (context?.zones) {
    // Urutkan dari nama terpanjang agar tidak false match
    const sorted = [...context.zones].sort((a, b) => b.name.length - a.name.length);
    for (const zone of sorted) {
      if (q.includes(zone.name.toLowerCase())) return zone.name;
    }
  }

  // Pattern umum setelah kata "ke" atau "to"
  const match = question.match(/(?:ke\s+(?:zona\s+)?|to\s+(?:zone\s+)?)([A-Za-z0-9 _-]+?)(?:\s*$|\s*,|\s*\d)/i);
  if (match) return match[1].trim();

  return null;
};

/**
 * Ekstrak koordinat X,Y dari pertanyaan
 * Mendukung: "50, 60" | "50x60" | "X:50 Y:60" | "posisi 50 60"
 */
const extractCoordinates = (question) => {
  const patterns = [
    /(?:ke|to|posisi|position)\s+(\d+)\s*[,]\s*(\d+)/i,
    /X\s*:\s*(\d+).*?Y\s*:\s*(\d+)/i,
    /(\d{1,4})\s*,\s*(\d{1,4})(?!\s*\w)/, 
  ];
  for (const p of patterns) {
    const m = question.match(p);
    if (m) return { x: parseInt(m[1]), y: parseInt(m[2]) };
  }
  return null;
};

/**
 * Ekstrak dimensi W × H dari pertanyaan
 * support juga: "400x300" | "W:400 H:300" | "lebar 400 tinggi 300"
 */
const extractDimensions = (question) => {
  const patterns = [
    /(\d+)\s*[xX×]\s*(\d+)/,                          // 400x300
    /W\s*:\s*(\d+).*?H\s*:\s*(\d+)/i,                 // W:400 H:300
    /(?:jadi|menjadi|ke)\s+(\d+)\s*[xX×]\s*(\d+)/i,  // jadi 400x300
    /(?:lebar|width)\s+(\d+).*?(?:tinggi|height)\s+(\d+)/i,
  ];
  for (const p of patterns) {
    const m = question.match(p);
    if (m) return { w: parseInt(m[1]), h: parseInt(m[2]) };
  }
  return null;
};

// HELPER: cari file yang mengandung item 

const findFileByItem = async (userId, itemId, itemName) => {
  const files = await inventoryService.getAllFilesMetadata(userId);
  for (const file of files) {
    const items = await inventoryService.getInventoryFromMarkdown(file.id);
    if (items.find(i => i.id === itemId || i.name?.toLowerCase() === itemName?.toLowerCase())) {
      return file;
    }
  }
  return files[0] || null;
};

// HELPER: cari file yang mengandung zona 

const findFileByZone = async (userId, zoneName) => {
  const files = await inventoryService.getAllFilesMetadata(userId);
  for (const file of files) {
    const zones = await inventoryService.getZonesFromMarkdown(file.id);
    if (zones.find(z => z.name.toLowerCase().includes(zoneName.toLowerCase()))) {
      return file;
    }
  }
  return null;
};

// ACTION HANDLERS 

const layoutHandlers = {

  /**
   * MOVE_ITEM
   * Contoh: "pindahkan ITEM-01 ke zona Rak B"
   */
  move_item: async (userId, question, context) => {
    const itemName = extractItemName(question);
    const targetZone = extractTargetZone(question, context);

    if (!itemName) return { success: false, answer: 'Sebutkan nama atau kode item. Contoh: "pindahkan ITEM-01 ke zona Rak B"' };
    if (!targetZone) return { success: false, answer: 'Sebutkan zona tujuan. Contoh: "pindahkan ITEM-01 ke zona Rak B"' };

    const found = context.items.find(i =>
      i.id.toLowerCase() === itemName.toLowerCase() ||
      i.name.toLowerCase().includes(itemName.toLowerCase())
    );
    if (!found) return { success: false, answer: `Item "${itemName}" tidak ditemukan di inventory.` };

    const file = await findFileByItem(userId, found.id, found.name);
    if (!file) return { success: false, answer: 'File tidak ditemukan.' };

    // Hapus dari zona lama
    await inventoryService.updateMarkdownItemLogic(
      file.id, { qty: found.qty },
      { item_code: found.id, name: found.name, location: found.zone },
      'DELETE_ITEM'
    );

    // Tambah ke zona baru
    await inventoryService.updateMarkdownItemLogic(
      file.id, null,
      { item_code: found.id, name: found.name, location: targetZone, qty: found.qty, unit_value: found.unit_value, pos: [30, 30] },
      'ADD_ITEM'
    );

    const updatedMarkdown = await inventoryService.readRawMarkdown(file.id);
    return {
      success: true,
      answer: `✅ **${found.name}** dipindahkan dari **${found.zone}** → **${targetZone}**.`,
      updatedMarkdown, fileId: file.id,
      action: 'move_item', fromZone: found.zone, toZone: targetZone
    };
  },

  /**
   * MOVE_ZONE: pindahkan posisi zona ke koordinat baru
   * Contoh: "pindahkan zona Rak A ke 300, 200"
   */
  move_zone: async (userId, question, context) => {
    const zoneName = extractTargetZone(question, context) || extractItemName(question);
    const coords = extractCoordinates(question);

    if (!zoneName) return { success: false, answer: 'Sebutkan nama zona. Contoh: "pindahkan zona Rak A ke 300, 200"' };
    if (!coords) return { success: false, answer: 'Sebutkan koordinat X, Y. Contoh: "pindahkan zona Rak A ke 300, 200"' };

    const file = await findFileByZone(userId, zoneName);
    if (!file) return { success: false, answer: `Zona "${zoneName}" tidak ditemukan.` };

    await inventoryService.updateMarkdownZoneLogic(file.id, zoneName, { x: coords.x, y: coords.y }, 'UPDATE_ZONE');

    const updatedMarkdown = await inventoryService.readRawMarkdown(file.id);
    return {
      success: true,
      answer: `✅ Zona **${zoneName}** dipindahkan ke posisi **(${coords.x}, ${coords.y})**.`,
      updatedMarkdown, fileId: file.id,
      action: 'move_zone', zone: zoneName, newPosition: [coords.x, coords.y]
    };
  },

  /**
   * RESIZE_ROOM: ubah ukuran ruangan
   * Contoh: "ubah ukuran ruangan jadi 1200x800"
   */
  resize_room: async (userId, question, context) => {
    const dims = extractDimensions(question);
    if (!dims) return { success: false, answer: 'Sebutkan ukuran baru. Contoh: "ubah ukuran ruangan jadi 1200x800"' };

    const files = await inventoryService.getAllFilesMetadata(userId);
    if (!files[0]) return { success: false, answer: 'Tidak ada file markdown.' };

    let content = await inventoryService.readRawMarkdown(files[0].id);

    // Update baris Room
    content = content.replace(
      /(#\s*\[Room\][^(\n]+)\(W:\s*\d+,?\s*H:\s*\d+\)/i,
      `$1(W: ${dims.w}, H: ${dims.h})`
    );

    await inventoryService.writeRawMarkdown(files[0].id, content);
    const updatedMarkdown = await inventoryService.readRawMarkdown(files[0].id);

    return {
      success: true,
      answer: `✅ Ukuran ruangan diubah menjadi **${dims.w} × ${dims.h}**.`,
      updatedMarkdown, fileId: files[0].id,
      action: 'resize_room', newSize: { w: dims.w, h: dims.h }
    };
  },

  /**
   * RESIZE_ZONE: ubah ukuran zona
   * Contoh: "resize zona Rak A jadi 400x300"
   */
  resize_zone: async (userId, question, context) => {
    const zoneName = extractTargetZone(question, context);
    const dims = extractDimensions(question);

    if (!zoneName) return { success: false, answer: 'Sebutkan nama zona. Contoh: "resize zona Rak A jadi 400x300"' };
    if (!dims) return { success: false, answer: 'Sebutkan ukuran baru. Contoh: "resize zona Rak A jadi 400x300"' };

    const file = await findFileByZone(userId, zoneName);
    if (!file) return { success: false, answer: `Zona "${zoneName}" tidak ditemukan.` };

    await inventoryService.updateMarkdownZoneLogic(file.id, zoneName, { w: dims.w, h: dims.h }, 'UPDATE_ZONE');

    const updatedMarkdown = await inventoryService.readRawMarkdown(file.id);
    return {
      success: true,
      answer: `✅ Zona **${zoneName}** diubah ukurannya menjadi **${dims.w} × ${dims.h}**.`,
      updatedMarkdown, fileId: file.id,
      action: 'resize_zone', zone: zoneName, newSize: { w: dims.w, h: dims.h }
    };
  },

  /**
   * UPDATE_POSITION: update koordinat pos item dalam zona
   * Contoh: "update posisi ITEM-01 ke 50, 60"
   */
  update_position: async (userId, question, context) => {
    const itemName = extractItemName(question);
    const coords = extractCoordinates(question);

    if (!itemName) return { success: false, answer: 'Sebutkan nama atau kode item. Contoh: "update posisi ITEM-01 ke 50, 60"' };
    if (!coords) return { success: false, answer: 'Sebutkan koordinat baru. Contoh: "update posisi ITEM-01 ke 50, 60"' };

    const found = context.items.find(i =>
      i.id.toLowerCase() === itemName.toLowerCase() ||
      i.name.toLowerCase().includes(itemName.toLowerCase())
    );
    if (!found) return { success: false, answer: `Item "${itemName}" tidak ditemukan.` };

    const file = await findFileByItem(userId, found.id, found.name);
    if (!file) return { success: false, answer: 'File tidak ditemukan.' };

    await inventoryService.updateMarkdownItemLogic(
      file.id, { qty: found.qty },
      { item_code: found.id, name: found.name, location: found.zone, qty: found.qty, unit_value: found.unit_value, location_x: coords.x, location_y: coords.y },
      'UPDATE_ITEM'
    );

    const updatedMarkdown = await inventoryService.readRawMarkdown(file.id);
    return {
      success: true,
      answer: `✅ Posisi **${found.name}** diperbarui ke **(${coords.x}, ${coords.y})** di zona **${found.zone}**.`,
      updatedMarkdown, fileId: file.id,
      action: 'update_position', item: found.name, newPosition: [coords.x, coords.y]
    };
  }
};

// ENTRY POINT 

exports.processLayoutAction = async (userId, question, intent) => {
  try {
    const context = await buildInventoryContext(userId);
    if (!context) return { success: false, answer: 'Tidak ada layout. Buat layout dulu di Dashboard.' };

    const handler = layoutHandlers[intent];
    if (!handler) return { success: false, answer: `Intent "${intent}" tidak dikenali sebagai aksi layout.` };

    return await handler(userId, question, context);

  } catch (error) {
    console.error('Error processLayoutAction:', error);
    return { success: false, answer: 'Terjadi kesalahan saat memproses aksi layout.' };
  }
};