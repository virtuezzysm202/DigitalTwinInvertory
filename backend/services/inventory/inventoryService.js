const db = require('../../config/db'); // Pastikan config/db.js lu sudah mengarah ke twinstock_db di .env
const fs = require('fs').promises;
const path = require('path');
const { parseMarkdownToJSON } = require('../../parsers/markdownParser');

// Sesuaikan path ini dengan lokasi fisik file warehouse.md lu
const markdownPath = path.join(__dirname, '../../data/markdown/warehouse.md');

// Helper untuk membaca file md
const readMDFile = async () => {
  return await fs.readFile(markdownPath, 'utf-8');
};

// Helper untuk menulis ulang file md
const writeMDFile = async (content) => {
  await fs.writeFile(markdownPath, content, 'utf-8');
};

/**
 * 1. AMBIL SEMUA DATA INVENTORY (REAL-TIME DARI .MD)
 */
exports.getInventoryFromMarkdown = async () => {
  try {
    const content = await readMDFile();
    const parsedData = parseMarkdownToJSON(content);
    
    let allItems = [];
    
    // Pastikan parsedData & zones aman sebelum di-looping
    if (parsedData && parsedData.zones) {
      parsedData.zones.forEach(zone => {
        if (zone.items) {
          zone.items.forEach(item => {
            allItems.push({
              ...item,
              location: zone.name,
              status: item.qty <= 0 ? 'Out of Stock' : (item.qty <= 5 ? 'Low Stock' : 'In Stock')
            });
          });
        }
      });
    }
    return allItems;
  } catch (error) {
    console.error("Error membaca/parsing markdown file:", error);
    return [];
  }
};

/**
 * 2. LOGIKA UPDATE ITEM + OTOMATIS INSERT LOG KE MYSQL (`inventory_logs`)
 */
exports.updateMarkdownItemLogic = async (fileId, oldItemsData, updateData, actionType) => {
  try {
    let content = await readMDFile();
    const { name, qty, pos, tags, targetZone } = updateData;

    // SINKRONISASI KE MYSQL: Catat riwayat perubahan ke tabel audit baru
    await db.query(
      `INSERT INTO inventory_logs (file_id, action_type, item_name, quantity_before, quantity_after) 
       VALUES (?, ?, ?, ?, ?)`,
      [fileId, actionType, name, oldItemsData?.qty || 0, qty || 0]
    );

    // TODO: Proses manipulasi string text markdown manual (fs.writeFile) milik lu silakan diteruskan di bawah ini
    // Contoh: 
    // const newContent = beberapaLogikaStringGenerator(content, updateData);
    // await writeMDFile(newContent);

    return true;
  } catch (error) {
    console.error("Gagal memperbarui log/markdown:", error);
    throw error;
  }
};

/**
 * 3. AMBIL METADATA FILE (DENGAN AUTO-SEED SINKRON KE TABEL BARU)
 */
exports.getMarkdownMetadata = async (userId) => {
  // 1. Ambil project id milik user dari tabel `projects` yang baru
  let [projects] = await db.query('SELECT id FROM projects WHERE user_id = ? LIMIT 1', [userId]);
  
  // Auto-Seed Project jika belum terdaftar di database baru
  if (projects.length === 0) {
    const [newProj] = await db.query(
      'INSERT INTO projects (user_id, name, description) VALUES (?, ?, ?)', 
      [userId, 'Main Project', 'Project Gudang Utama TwinStock']
    );
    projects = [{ id: newProj.insertId }];
  }
  
  const projectId = projects[0].id;
  
  // 2. Ambil metadata dari tabel `markdown_files` yang baru
  let [files] = await db.query('SELECT * FROM markdown_files WHERE project_id = ? LIMIT 1', [projectId]);
  
  // Auto-Seed File Metadata jika belum terdaftar
  if (files.length === 0) {
    const [newFile] = await db.query(
      'INSERT INTO markdown_files (project_id, filename, filepath) VALUES (?, ?, ?)',
      [projectId, 'warehouse.md', 'data/markdown/warehouse.md']
    );
    files = [{ id: newFile.insertId, project_id: projectId, filename: 'warehouse.md', filepath: 'data/markdown/warehouse.md' }];
  }
  
  return files[0];
};