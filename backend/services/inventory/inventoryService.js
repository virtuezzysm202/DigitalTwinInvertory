const db = require('../../config/db'); 
const fs = require('fs').promises;
const path = require('path');
const { parseMarkdownToJSON } = require('../../parsers/markdownParser');

// Helper dinamis untuk mendapatkan absolute path dari database record filepath
const getAbsoluteFilePath = (relativeFilepath) => {
  return path.join(__dirname, '../../', relativeFilepath);
};

// Helper dinamis untuk membaca file md berdasarkan ID dari Database
const readMDFileById = async (fileId) => {
  const [files] = await db.query('SELECT filepath FROM markdown_files WHERE id = ? LIMIT 1', [fileId]);
  if (files.length === 0) throw new Error(`Record file dengan id ${fileId} tidak ditemukan.`);
  
  const absolutePath = getAbsoluteFilePath(files[0].filepath);
  return await fs.readFile(absolutePath, 'utf-8');
};

// Helper dinamis untuk menulis ulang file md berdasarkan ID dari Database
const writeMDFileById = async (fileId, content) => {
  const [files] = await db.query('SELECT filepath FROM markdown_files WHERE id = ? LIMIT 1', [fileId]);
  if (files.length === 0) throw new Error(`Record file dengan id ${fileId} tidak ditemukan.`);
  
  const absolutePath = getAbsoluteFilePath(files[0].filepath);
  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  await fs.writeFile(absolutePath, content, 'utf-8');
};

/**
 * 🔥 HELPER UTAMA: UNIVERSAL PARSER ZONA (Mendukung Format Pipe '|' dan Kurung '()')
 */
const parseZoneLine = (line) => {
  const cleanLine = line.replace(/^##\s*\[Zone\]\s*/i, '').trim();
  let zoneName = cleanLine;
  let metadataStr = "";

  const pipeIdx = cleanLine.indexOf('|');
  const parenIdx = cleanLine.indexOf('(');

  // Pisahkan nama zona dan string metadatanya berdasarkan jenis karakter pembatas
  if (pipeIdx !== -1 && (parenIdx === -1 || pipeIdx < parenIdx)) {
    zoneName = cleanLine.substring(0, pipeIdx).trim();
    metadataStr = cleanLine.substring(pipeIdx).trim();
  } else if (parenIdx !== -1) {
    zoneName = cleanLine.substring(0, parenIdx).trim();
    metadataStr = cleanLine.substring(parenIdx).replace(/[()]/g, '').trim();
  }

  // Bersihkan koma atau pipe agar pembacaan regex parameter seragam
  const cleanMetadata = metadataStr.replace(/[,|]/g, ' ');
  const wMatch = cleanMetadata.match(/W\s*:\s*(\d+)/i);
  const hMatch = cleanMetadata.match(/H\s*:\s*(\d+)/i);
  const xMatch = cleanMetadata.match(/X\s*:\s*([\d-]+)/i);
  const yMatch = cleanMetadata.match(/Y\s*:\s*([\d-]+)/i);
  const colorMatch = cleanMetadata.match(/color\s*:\s*["']?([^"'\s)]+)["']?/i);

  return {
    name: zoneName,
    w: wMatch ? parseInt(wMatch[1], 10) : 200,
    h: hMatch ? parseInt(hMatch[1], 10) : 150,
    x: xMatch ? parseInt(xMatch[1], 10) : 30,
    y: yMatch ? parseInt(yMatch[1], 10) : 30,
    color: colorMatch ? colorMatch[1].trim() : '#22c55e'
  };
};

exports.readRawMarkdown = async (fileId) => {
  return await readMDFileById(fileId);
};

exports.writeRawMarkdown = async (fileId, rawContent) => {
  return await writeMDFileById(fileId, rawContent);
};

/**
 * AMBIL DAFTAR ZONA UNTUK DROPDOWN & CANVAS FRONTEND
 */
exports.getZonesFromMarkdown = async (fileId) => {
  try {
    const content = await readMDFileById(fileId);
    const lines = content.split('\n');
    const zones = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('##') && line.includes('[Zone]')) {
        const parsedZone = parseZoneLine(line);
        zones.push(parsedZone);
      }
    }
    return zones;
  } catch (error) {
    console.error(`Error mengambil list zona (fileId: ${fileId}):`, error);
    return [];
  }
};

/**
 * AMBIL SEMUA DATA INVENTORY DARI FILE MARKDOWN
 */
exports.getInventoryFromMarkdown = async (fileId, search = '') => {
  try {
    // Tetap menggunakan pembaca file bawaan proyekmu agar tidak merusak sistem
    const content = await readMDFileById(fileId);
    const lines = content.split('\n');
    let allItems = [];
    let currentZone = "Unknown Zone";

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Tangkap nama zona secara bersih menggunakan helper
      if (line.startsWith('##') && line.includes('[Zone]')) {
        currentZone = parseZoneLine(line).name;
      }

      // Tangkap Data Item (Dimulai dengan strip "-")
      if (line.startsWith('-')) {
        const parts = line.substring(1).split('|').map(p => p.trim());
        
        if (parts.length >= 2) {
          const itemCode = parts[0];
          const itemName = parts[1];
          
          let qty = 0, unit_value = 0, pos = [30, 30];
          
          for (let j = 2; j < parts.length; j++) {
            const p = parts[j];
            if (p.toLowerCase().startsWith('qty:')) {
              qty = parseInt(p.replace(/qty:/i, '').trim(), 10) || 0;
            } else if (p.toLowerCase().startsWith('unit_value:')) {
              unit_value = parseInt(p.replace(/unit_value:/i, '').trim(), 10) || 0;
            } else if (p.toLowerCase().startsWith('pos:')) {
              const posStr = p.replace(/pos:/i, '').trim();
              const posArr = posStr.split(',').map(n => parseInt(n.trim()));
              if (posArr.length === 2 && !isNaN(posArr[0])) {
                pos = posArr;
              }
            }
          }

          // Buat objek item sesuai struktur asli kamu
          const itemObj = {
            id: itemCode,
            item_code: itemCode,
            name: itemName,
            category: 'General',
            location: currentZone,
            qty: qty,
            stock: qty,
            unit_value: unit_value,
            status: qty <= 0 ? 'Out of Stock' : (qty <= 5 ? 'Low Stock' : 'In Stock'),
            value: unit_value * qty,
            pos: pos
          };

          // ========================================================
          // LOGIKA FILTER SEARCH (Hanya filter jika kata kunci dikirim)
          // ========================================================
          if (search) {
            const query = search.toLowerCase().trim();
            const matchCode = itemObj.item_code.toLowerCase().includes(query);
            const matchName = itemObj.name.toLowerCase().includes(query);
            const matchLocation = itemObj.location.toLowerCase().includes(query);

            // Jika kata kunci dicari tapi tidak cocok sama sekali, lewati item ini
            if (!matchCode && !matchName && !matchLocation) {
              continue;
            }
          }

          allItems.push(itemObj);
        }
      }
    }
    return allItems;
  } catch (error) {
    console.error(`Error getInventoryFromMarkdown:`, error);
    return [];
  }
};

/**
 * LOGIKA UPDATE ITEM + RE-WRITE STRING COORDINATE DI FILE .MD
 */
exports.updateMarkdownItemLogic = async (fileId, oldItemsData, updateData, actionType) => {
  try {
    let content = await readMDFileById(fileId);
    
    const itemCode = updateData.item_code || updateData.itemCode || updateData.item_id || updateData.item || updateData.id || 'UNKNOWN';
    const itemName = updateData.name || 'Unknown Item';
    const targetZone = updateData.location || updateData.zone; 
    
    let currentQty = updateData.qty !== undefined ? Number(updateData.qty) : (updateData.quantity !== undefined ? Number(updateData.quantity) : null);
    let unitValue = updateData.unit_value !== undefined ? Number(updateData.unit_value) : (updateData.unitValue !== undefined ? Number(updateData.unitValue) : 0);

    if (actionType === 'SYNC_LAYOUT') {
      const activeInventory = await this.getInventoryFromMarkdown(fileId);
      const matchedItem = activeInventory.find(i => i.id === itemCode || i.item_code === itemCode);
      if (matchedItem) {
        currentQty = matchedItem.qty;
        unitValue = matchedItem.unit_value;
      }
    }

    if (currentQty === null) currentQty = 0;

    // Log tracking MySQL
    await db.query(
      `INSERT INTO inventory_logs (file_id, action_type, item_name, quantity_before, quantity_after) 
       VALUES (?, ?, ?, ?, ?)`,
      [fileId, actionType, `${itemCode} - ${itemName}`, Number(oldItemsData?.qty || 0), currentQty]
    );

    const lines = content.split('\n');
    let updatedLines = [];
    let insideTargetZone = false;
    let isItemReplaced = false;

    let locX = 30;
    let locY = 30;
    
    if (updateData.location_x !== undefined) locX = updateData.location_x;
    if (updateData.location_y !== undefined) locY = updateData.location_y;
    
    if (updateData.pos) {
      if (Array.isArray(updateData.pos)) {
        locX = updateData.pos[0] !== undefined ? updateData.pos[0] : locX;
        locY = updateData.pos[1] !== undefined ? updateData.pos[1] : locY;
      } else if (typeof updateData.pos === 'string') {
        const splitPos = updateData.pos.split(',').map(n => parseInt(n.trim()));
        if (splitPos.length === 2 && !isNaN(splitPos[0]) && !isNaN(splitPos[1])) {
          locX = splitPos[0];
          locY = splitPos[1];
        }
      }
    }

    for (let line of lines) {
      const trimmed = line.trim();

      if (trimmed.startsWith('## ') && trimmed.includes('[Zone]')) {
        const currentLineZoneName = parseZoneLine(trimmed).name;
        // Gunakan komparasi nama bersih agar terhindar dari bug spasi/huruf kapital
        if (targetZone && currentLineZoneName.toLowerCase().replace(/\s+/g, '') === targetZone.toLowerCase().replace(/\s+/g, '')) {
          insideTargetZone = true;
        } else {
          insideTargetZone = false;
        }
      }

      if (trimmed.startsWith('-') && insideTargetZone) {
        const parts = trimmed.substring(1).split('|').map(p => p.trim());
        if (parts[0] === itemCode) {
          if (actionType === 'DELETE_ITEM') {
            isItemReplaced = true;
            continue; 
          } else {
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
          const currentLineZoneName = parseZoneLine(trimmed).name;
          if (targetZone && currentLineZoneName.toLowerCase().replace(/\s+/g, '') === targetZone.toLowerCase().replace(/\s+/g, '')) {
            updatedLines.push(`- ${itemCode} | ${itemName} | qty: ${currentQty} | unit_value: ${unitValue} | pos: ${locX}, ${locY}`);
          }
        }
      }
    }

    await writeMDFileById(fileId, updatedLines.join('\n'));
    return true;
  } catch (error) {
    console.error("Gagal memperbarui log/markdown:", error);
    throw error;
  }
};

/**
 * AMBIL METADATA FILE MILIK USER
 */
exports.getMarkdownMetadata = async (userId) => {
  let [projects] = await db.query(
    'SELECT id FROM projects WHERE user_id = ? ORDER BY created_at DESC LIMIT 1', 
    [userId]
  );
  
  if (projects.length === 0) {
    const [newProj] = await db.query(
      'INSERT INTO projects (user_id, name, description) VALUES (?, ?, ?)', 
      [userId, 'Gudang Utama', 'Project Gudang Utama TwinStock']
    );
    projects = [{ id: newProj.insertId }];
  }
  
  const projectId = projects[0].id;
  
  let [files] = await db.query(
    'SELECT * FROM markdown_files WHERE project_id = ? ORDER BY id DESC LIMIT 1', 
    [projectId]
  );
  
  if (files.length === 0) {
    const filename = `warehouse_project_${projectId}.md`;
    const relativePath = `data/markdown/${filename}`;
    const absolutePath = getAbsoluteFilePath(relativePath);

    await fs.mkdir(path.dirname(absolutePath), { recursive: true });
    
    // Default disesuaikan dengan format Pipe berkas asli kamu
    const defaultMarkdown = `# TWINSTOCK DIGITAL TWIN
## [Zone] Rak Utama | W: 200 | H: 150 | X: 50 | Y: 50 | color: #22c55e
- ITEM-01 | Barang Contoh | qty: 15 | unit_value: 500000 | pos: 150, 100`;

    await fs.writeFile(absolutePath, defaultMarkdown, 'utf-8');

    const [newFile] = await db.query(
      'INSERT INTO markdown_files (project_id, filename, filepath) VALUES (?, ?, ?)',
      [projectId, filename, relativePath]
    );
    
    files = [{ id: newFile.insertId, project_id: projectId, filename, filepath: relativePath }];
  }
  
  return files[0];
};

/**
 * MENAMBAH ZONA BARU KE DALAM FILE MARKDOWN (Format Pipe Seragam)
 */
exports.addNewZoneToMarkdown = async (fileId, zonePayload) => {
  try {
    const { name, w, h, color, x, y } = zonePayload;
    let content = await readMDFileById(fileId);
    
    if (!content.endsWith('\n')) {
      content += '\n';
    }

    // Menulis ke file menggunakan format Pipe '|' bawaan pabrik gudang kamu
    const zoneLine = `\n## [Zone] ${name.trim()} | W: ${w || 200} | H: ${h || 150} | X: ${x !== undefined ? x : 30} | Y: ${y !== undefined ? y : 30} | color: ${color || '#22c55e'}\n`;
    
    await writeMDFileById(fileId, content + zoneLine);
    return true;
  } catch (error) {
    console.error("Error di addNewZoneToMarkdown service:", error);
    throw error;
  }
};

/**
 * LOGIKA UPDATE DAN DELETE ZONA LANGSUNG DI FILE .MD (Format Pipe Seragam)
 */
exports.updateMarkdownZoneLogic = async (fileId, zoneName, updateData, actionType) => {
  try {
    let content = await readMDFileById(fileId);
    const lines = content.split('\n');
    let updatedLines = [];
    let insideTargetZone = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      if (trimmed.startsWith('## ') && trimmed.includes('[Zone]')) {
        const parsedZone = parseZoneLine(trimmed);

        // Komparasi nama zona target tanpa mempedulikan spasi berlebih
        if (parsedZone.name.toLowerCase().replace(/\s+/g, '') === zoneName.toLowerCase().replace(/\s+/g, '')) {
          insideTargetZone = true;

          if (actionType === 'DELETE_ZONE') {
            continue; 
          } else if (actionType === 'UPDATE_ZONE') {
            const newName = (updateData && updateData.name) ? updateData.name.trim() : zoneName;
            const w = (updateData && updateData.w !== undefined && updateData.w !== null) ? Number(updateData.w) : parsedZone.w;
            const h = (updateData && updateData.h !== undefined && updateData.h !== null) ? Number(updateData.h) : parsedZone.h;
            const x = (updateData && updateData.x !== undefined && updateData.x !== null) ? Number(updateData.x) : parsedZone.x;
            const y = (updateData && updateData.y !== undefined && updateData.y !== null) ? Number(updateData.y) : parsedZone.y;
            const color = (updateData && updateData.color) ? updateData.color.trim() : parsedZone.color;

            // Ditulis kembali menggunakan Pipe format agar serasi dengan layout berkas .md kamu
            const newZoneLine = `## [Zone] ${newName} | W: ${w} | H: ${h} | X: ${x} | Y: ${y} | color: ${color}`;
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

    await writeMDFileById(fileId, updatedLines.join('\n'));
    return true;
  } catch (error) {
    console.error("Gagal memproses update/delete zona di markdown:", error);
    throw error;
  }
};