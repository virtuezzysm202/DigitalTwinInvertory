const db = require('../../config/db');
const { parseMarkdownToJSON } = require('../../parsers/markdownParser');

// ─── HELPERS DB (tidak pakai file sistem lagi) ──────────────────────────────

const readMDFileById = async (fileId) => {
  const [files] = await db.query('SELECT content FROM markdown_files WHERE id = ? LIMIT 1', [fileId]);
  if (files.length === 0) throw new Error(`File id ${fileId} tidak ditemukan.`);
  return files[0].content || '';
};

const writeMDFileById = async (fileId, content) => {
  await db.query('UPDATE markdown_files SET content = ? WHERE id = ?', [content, fileId]);
};

// ─── PARSER ZONA ─────────────────────────────────────────────────────────────

const parseZoneLine = (line) => {
  const cleanLine = line.replace(/^##\s*\[Zone\]\s*/i, '').trim();
  let zoneName = cleanLine, metadataStr = '';

  const pipeIdx = cleanLine.indexOf('|');
  const parenIdx = cleanLine.indexOf('(');

  if (pipeIdx !== -1 && (parenIdx === -1 || pipeIdx < parenIdx)) {
    zoneName = cleanLine.substring(0, pipeIdx).trim();
    metadataStr = cleanLine.substring(pipeIdx).trim();
  } else if (parenIdx !== -1) {
    zoneName = cleanLine.substring(0, parenIdx).trim();
    metadataStr = cleanLine.substring(parenIdx).replace(/[()]/g, '').trim();
  }

  const clean = metadataStr.replace(/[,|]/g, ' ');
  const wMatch = clean.match(/W\s*:\s*(\d+)/i);
  const hMatch = clean.match(/H\s*:\s*(\d+)/i);
  const xMatch = clean.match(/X\s*:\s*([\d-]+)/i);
  const yMatch = clean.match(/Y\s*:\s*([\d-]+)/i);
  const colorMatch = clean.match(/color\s*:\s*["']?([^"'\s)]+)["']?/i);

  return {
    name: zoneName,
    w: wMatch ? parseInt(wMatch[1], 10) : 200,
    h: hMatch ? parseInt(hMatch[1], 10) : 150,
    x: xMatch ? parseInt(xMatch[1], 10) : 30,
    y: yMatch ? parseInt(yMatch[1], 10) : 30,
    color: colorMatch ? colorMatch[1].trim() : '#22c55e'
  };
};

// ─── METADATA ────────────────────────────────────────────────────────────────

// Ambil file pertama milik user — TANPA auto-create
exports.getMarkdownMetadata = async (userId) => {
  const [projects] = await db.query('SELECT id FROM projects WHERE user_id = ? LIMIT 1', [userId]);
  if (projects.length === 0) return null;

  const [files] = await db.query(
    'SELECT * FROM markdown_files WHERE project_id = ? ORDER BY created_at ASC LIMIT 1',
    [projects[0].id]
  );
  return files[0] || null;
};

// Ambil SEMUA file dalam layout milik user
exports.getAllFilesMetadata = async (userId) => {
  const [projects] = await db.query('SELECT id FROM projects WHERE user_id = ? LIMIT 1', [userId]);
  if (projects.length === 0) return [];

  const [files] = await db.query(
    'SELECT * FROM markdown_files WHERE project_id = ? ORDER BY created_at ASC',
    [projects[0].id]
  );
  return files;
};

// ─── READ / WRITE RAW ────────────────────────────────────────────────────────

exports.readRawMarkdown = async (fileId) => readMDFileById(fileId);
exports.writeRawMarkdown = async (fileId, content) => writeMDFileById(fileId, content);

// Hook dipanggil markdownController saat save — tidak perlu logic tambahan
exports.syncInventoryData = async (fileId, content) => true;

// ─── ZONA ────────────────────────────────────────────────────────────────────

exports.getZonesFromMarkdown = async (fileId) => {
  try {
    const content = await readMDFileById(fileId);
    const zones = [];
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (trimmed.startsWith('##') && trimmed.includes('[Zone]')) {
        zones.push(parseZoneLine(trimmed));
      }
    }
    return zones;
  } catch (e) {
    console.error(`Error getZonesFromMarkdown (fileId: ${fileId}):`, e);
    return [];
  }
};

// INVENTORY DARI 1 FILE 

exports.getInventoryFromMarkdown = async (fileId, search = '') => {
  try {
    const content = await readMDFileById(fileId);
    const allItems = [];
    let currentZone = 'Unknown Zone';

    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (trimmed.startsWith('##') && trimmed.includes('[Zone]')) {
        currentZone = parseZoneLine(trimmed).name;
      }
      if (!trimmed.startsWith('-')) continue;

      const parts = trimmed.substring(1).split('|').map(p => p.trim());
      if (parts.length < 2) continue;

      const itemCode = parts[0];
      const itemName = parts[1];
      let qty = 0, unit_value = 0, pos = [30, 30];

      for (let j = 2; j < parts.length; j++) {
        const p = parts[j];
        if (p.toLowerCase().startsWith('qty:')) qty = parseInt(p.replace(/qty:/i, '').trim()) || 0;
        else if (p.toLowerCase().startsWith('unit_value:')) unit_value = parseInt(p.replace(/unit_value:/i, '').trim()) || 0;
        else if (p.toLowerCase().startsWith('pos:')) {
          const coords = p.replace(/pos:/i, '').trim().split(',').map(n => parseInt(n.trim()));
          if (coords.length === 2 && !isNaN(coords[0])) pos = coords;
        }
      }

      const item = {
        id: itemCode, item_code: itemCode, name: itemName,
        category: 'General', location: currentZone,
        qty, stock: qty, unit_value,
        status: qty <= 0 ? 'Out of Stock' : qty <= 5 ? 'Low Stock' : 'In Stock',
        value: unit_value * qty, pos
      };

      if (search) {
        const q = search.toLowerCase();
        if (!itemCode.toLowerCase().includes(q) && !itemName.toLowerCase().includes(q) && !currentZone.toLowerCase().includes(q)) continue;
      }
      allItems.push(item);
    }
    return allItems;
  } catch (e) {
    console.error('Error getInventoryFromMarkdown:', e);
    return [];
  }
};

// MANIPULASI ITEM 

exports.updateMarkdownItemLogic = async (fileId, oldItemsData, updateData, actionType) => {
  try {
    let content = await readMDFileById(fileId);
    const itemCode = updateData.item_code || updateData.itemCode || updateData.item_id || updateData.id || 'UNKNOWN';
    const itemName = updateData.name || 'Unknown Item';
    const targetZone = updateData.location || updateData.zone;
    const currentQty = updateData.qty !== undefined ? Number(updateData.qty) : (updateData.quantity !== undefined ? Number(updateData.quantity) : 0);
    const unitValue = updateData.unit_value !== undefined ? Number(updateData.unit_value) : (updateData.unitValue !== undefined ? Number(updateData.unitValue) : 0);

    let locX = 30, locY = 30;
    if (updateData.location_x !== undefined) locX = Number(updateData.location_x);
    if (updateData.location_y !== undefined) locY = Number(updateData.location_y);
    if (updateData.pos) {
      if (Array.isArray(updateData.pos)) { locX = updateData.pos[0]; locY = updateData.pos[1]; }
      else if (typeof updateData.pos === 'string') {
        const sp = updateData.pos.split(',').map(n => parseInt(n.trim()));
        if (sp.length === 2 && !isNaN(sp[0])) { locX = sp[0]; locY = sp[1]; }
      }
    }

    try {
      await db.query(
        'INSERT INTO inventory_logs (file_id, action_type, item_name, quantity_before, quantity_after) VALUES (?, ?, ?, ?, ?)',
        [fileId, actionType, `${itemCode} - ${itemName}`, Number(oldItemsData?.qty || 0), currentQty]
      );
    } catch (logErr) { console.warn('Log skip:', logErr.message); }

    const lines = content.split('\n');
    let updatedLines = [];
    let insideTargetZone = false;
    let isItemReplaced = false;

    for (let line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('## ') && trimmed.includes('[Zone]')) {
        const zoneName = parseZoneLine(trimmed).name;
        insideTargetZone = targetZone
          ? zoneName.toLowerCase().replace(/\s+/g, '') === targetZone.toLowerCase().replace(/\s+/g, '')
          : false;
      }
      if (trimmed.startsWith('-') && insideTargetZone) {
        const parts = trimmed.substring(1).split('|').map(p => p.trim());
        if (parts[0] === itemCode) {
          if (actionType === 'DELETE_ITEM') { isItemReplaced = true; continue; }
          else {
            line = `- ${itemCode} | ${itemName} | qty: ${currentQty} | unit_value: ${unitValue} | pos: ${locX}, ${locY}`;
            isItemReplaced = true;
          }
        }
      }
      updatedLines.push(line);
    }

    if (actionType === 'ADD_ITEM' && !isItemReplaced) {
      updatedLines = [];
      for (let line of lines) {
        updatedLines.push(line);
        const trimmed = line.trim();
        if (trimmed.startsWith('## ') && trimmed.includes('[Zone]')) {
          const zoneName = parseZoneLine(trimmed).name;
          if (targetZone && zoneName.toLowerCase().replace(/\s+/g, '') === targetZone.toLowerCase().replace(/\s+/g, '')) {
            updatedLines.push(`- ${itemCode} | ${itemName} | qty: ${currentQty} | unit_value: ${unitValue} | pos: ${locX}, ${locY}`);
          }
        }
      }
    }

    await writeMDFileById(fileId, updatedLines.join('\n'));
    return true;
  } catch (e) {
    console.error('Error updateMarkdownItemLogic:', e);
    throw e;
  }
};

// ZONA CRUD 

exports.addNewZoneToMarkdown = async (fileId, zonePayload) => {
  try {
    const { name, w, h, color, x, y } = zonePayload;
    let content = await readMDFileById(fileId);
    if (!content.endsWith('\n')) content += '\n';
    const zoneLine = `\n## [Zone] ${name.trim()} | W: ${w || 200} | H: ${h || 150} | X: ${x ?? 30} | Y: ${y ?? 30} | color: ${color || '#22c55e'}\n`;
    await writeMDFileById(fileId, content + zoneLine);
    return true;
  } catch (e) {
    console.error('Error addNewZoneToMarkdown:', e);
    throw e;
  }
};

exports.updateMarkdownZoneLogic = async (fileId, zoneName, updateData, actionType) => {
  try {
    let content = await readMDFileById(fileId);
    const lines = content.split('\n');
    let updatedLines = [];
    let insideTargetZone = false;

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('## ') && trimmed.includes('[Zone]')) {
        const parsed = parseZoneLine(trimmed);
        if (parsed.name.toLowerCase().replace(/\s+/g, '') === zoneName.toLowerCase().replace(/\s+/g, '')) {
          insideTargetZone = true;
          if (actionType === 'DELETE_ZONE') continue;
          if (actionType === 'UPDATE_ZONE') {
            const newName = updateData?.name || zoneName;
            const w = updateData?.w ?? parsed.w;
            const h = updateData?.h ?? parsed.h;
            const x = updateData?.x ?? parsed.x;
            const y = updateData?.y ?? parsed.y;
            const color = updateData?.color || parsed.color;
            updatedLines.push(`## [Zone] ${newName.trim()} | W: ${w} | H: ${h} | X: ${x} | Y: ${y} | color: ${color}`);
            continue;
          }
        } else {
          insideTargetZone = false;
        }
      }
      if (insideTargetZone && actionType === 'DELETE_ZONE' && trimmed.startsWith('-')) continue;
      updatedLines.push(line);
    }

    await writeMDFileById(fileId, updatedLines.join('\n'));
    return true;
  } catch (e) {
    console.error('Error updateMarkdownZoneLogic:', e);
    throw e;
  }
};