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

exports.writeRawMarkdown = async (fileId, rawContent) => {
  return await writeMDFileById(fileId, rawContent);
};

/**
 * 1. AMBIL SEMUA DATA INVENTORY
 */
exports.getInventoryFromMarkdown = async (fileId) => {
  try {
    const content = await readMDFileById(fileId);
    const parsedData = parseMarkdownToJSON(content);
    
    let allItems = [];
    
    if (parsedData && parsedData.zones) {
      parsedData.zones.forEach(zone => {
        if (zone.items) {
          zone.items.forEach(item => {
            const currentQty = item.qty !== undefined ? Number(item.qty) : 0;
            const unitValue = item.unit_value !== undefined ? Number(item.unit_value) : 0;
            
            allItems.push({
              id: item.id || 'UNKNOWN',         
              item_code: item.item_code || item.id || 'UNKNOWN',
              item: item.id || 'UNKNOWN',       
              name: item.name || 'Unnamed Item', 
              category: 'General',
              location: zone.name, 
              qty: currentQty,
              stock: currentQty,                
              unit_value: unitValue,
              status: currentQty <= 0 ? 'Out of Stock' : (currentQty <= 5 ? 'Low Stock' : 'In Stock'), 
              value: unitValue * currentQty,
              pos: item.pos || [20, 40]
            });
          });
        }
      });
    }
    return allItems;
  } catch (error) {
    console.error(`Error membaca/parsing markdown file untuk fileId ${fileId}:`, error);
    return [];
  }
};

/**
 * 2. LOGIKA UPDATE ITEM + RE-WRITE STRING COORDINATE DI FILE .MD
 */
exports.updateMarkdownItemLogic = async (fileId, oldItemsData, updateData, actionType) => {
  try {
    let content = await readMDFileById(fileId);
    
    const itemCode = updateData.item_code || updateData.item_id || updateData.item || updateData.id || 'UNKNOWN';
    const itemName = updateData.name || 'Unknown Item';
    const targetZone = updateData.location || updateData.zone; 
    
    let currentQty = updateData.qty !== undefined ? Number(updateData.qty) : null;
    let unitValue = updateData.unit_value !== undefined ? Number(updateData.unit_value) : 0;

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

    const locX = updateData.location_x !== undefined ? updateData.location_x : (updateData.pos ? updateData.pos[0] : 20);
    const locY = updateData.location_y !== undefined ? updateData.location_y : (updateData.pos ? updateData.pos[1] : 40);

    for (let line of lines) {
      const trimmed = line.trim();

      if (trimmed.startsWith('## ') && trimmed.includes('[Zone]')) {
        if (targetZone && trimmed.toLowerCase().includes(targetZone.toLowerCase())) {
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

    // Jika Add Item dan item belum ada di zone tersebut
    if (actionType === 'ADD_ITEM' && !isItemReplaced) {
      updatedLines = [];
      for (let line of lines) {
        updatedLines.push(line);
        const trimmed = line.trim();
        if (trimmed.startsWith('## ') && trimmed.includes('[Zone]') && targetZone && trimmed.toLowerCase().includes(targetZone.toLowerCase())) {
          updatedLines.push(`- ${itemCode} | ${itemName} | qty: ${currentQty} | unit_value: ${unitValue} | pos: ${locX}, ${locY}`);
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
 * 3. AMBIL METADATA FILE (PERBAIKAN: Selalu ambil project & file terbaru)
 */
exports.getMarkdownMetadata = async (userId) => {
  // 1. Ambil project terbaru milik user (ORDER BY created_at DESC)
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
  
  // 2. Ambil file yang terkait dengan project terbaru (ORDER BY id DESC)
  let [files] = await db.query(
    'SELECT * FROM markdown_files WHERE project_id = ? ORDER BY id DESC LIMIT 1', 
    [projectId]
  );
  
  if (files.length === 0) {
    const filename = `warehouse_project_${projectId}.md`;
    const relativePath = `data/markdown/${filename}`;
    const absolutePath = getAbsoluteFilePath(relativePath);

    await fs.mkdir(path.dirname(absolutePath), { recursive: true });
    
    const defaultMarkdown = `# TWINSTOCK DIGITAL TWIN
## [Zone] Rak Utama (W: 300, H: 200, X: 50, Y: 50)
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