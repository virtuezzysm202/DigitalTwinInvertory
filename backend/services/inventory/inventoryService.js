const db = require('../../config/db'); // Pastikan config/db.js lu sudah mengarah ke twinstock_db di .env
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
  // Amankan folder penampung jika belum ada
  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  await fs.writeFile(absolutePath, content, 'utf-8');
};

/**
 * 1. AMBIL SEMUA DATA INVENTORY (REAL-TIME DARI .MD BERDASARKAN FILE ID USER)
 */
exports.getInventoryFromMarkdown = async (fileId) => {
  try {
    // FIX MULTIUSER: Membaca file spesifik milik user, bukan warehouse.md statis
    const content = await readMDFileById(fileId);
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
    console.error(`Error membaca/parsing markdown file untuk fileId ${fileId}:`, error);
    return [];
  }
};

/**
 * 2. LOGIKA UPDATE ITEM + OTOMATIS INSERT LOG KE MYSQL (`inventory_logs`)
 */
exports.updateMarkdownItemLogic = async (fileId, oldItemsData, updateData, actionType) => {
  try {
    // FIX MULTIUSER: Membaca konten file milik user yang bersangkutan
    let content = await readMDFileById(fileId);
    const { name, qty } = updateData;

    // SINKRONISASI KE MYSQL: Catat riwayat perubahan ke tabel audit baru
    await db.query(
      `INSERT INTO inventory_logs (file_id, action_type, item_name, quantity_before, quantity_after) 
       VALUES (?, ?, ?, ?, ?)`,
      [fileId, actionType, name || 'Unknown Item', oldItemsData?.qty || 0, qty || 0]
    );

    // TODO: Proses manipulasi string text markdown manual (fs.writeFile) milik lu silakan diteruskan di bawah ini
    // Contoh: 
    // const newContent = beberapaLogikaStringGenerator(content, updateData);
    // await writeMDFileById(fileId, newContent);

    return true;
  } catch (error) {
    console.error("Gagal memperbarui log/markdown:", error);
    throw error;
  }
};

/**
 * 3. AMBIL METADATA FILE (DENGAN AUTO-SEED SINKRON KE TABEL BARU - FORMAT UNIK)
 */
exports.getMarkdownMetadata = async (userId) => {
  // 1. Ambil project id milik user dari tabel `projects` yang baru
  let [projects] = await db.query('SELECT id FROM projects WHERE user_id = ? LIMIT 1', [userId]);
  
  // Auto-Seed Project jika belum terdaftar di database baru
  if (projects.length === 0) {
    const [newProj] = await db.query(
      'INSERT INTO projects (user_id, name, description) VALUES (?, ?, ?)', 
      [userId, 'Gudang Utama', 'Project Gudang Utama TwinStock']
    );
    projects = [{ id: newProj.insertId }];
  }
  
  const projectId = projects[0].id;
  
  // 2. Ambil metadata dari tabel `markdown_files` yang baru
  let [files] = await db.query('SELECT * FROM markdown_files WHERE project_id = ? LIMIT 1', [projectId]);
  
  // Auto-Seed File Metadata jika belum terdaftar (SINKRON DENGAN FORMAT KONTROLLER BARU)
  if (files.length === 0) {
    const filename = `warehouse_project_${projectId}.md`;
    const relativePath = `data/markdown/${filename}`;
    const absolutePath = getAbsoluteFilePath(relativePath);

    // Tulis data layout default fisik jika file belum pernah ada
    await fs.mkdir(path.dirname(absolutePath), { recursive: true });
    const defaultMarkdown = `## [Zone] Rak Utama | W: 300 | H: 200 | X: 50 | Y: 50\n- ITEM-01 | Barang Contoh | pos: 30, 40`;
    await fs.writeFile(absolutePath, defaultMarkdown, 'utf-8');

    // Daftarkan ke DB
    const [newFile] = await db.query(
      'INSERT INTO markdown_files (project_id, filename, filepath) VALUES (?, ?, ?)',
      [projectId, filename, relativePath]
    );
    
    files = [{ id: newFile.insertId, project_id: projectId, filename, filepath: relativePath }];
  }
  
  return files[0];
};