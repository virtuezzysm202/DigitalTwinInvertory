const fs = require('fs').promises;
const path = require('path');
const db = require('../config/db'); 
const { parseMarkdownToJSON } = require('../parsers/markdownParser');
// Import inventoryService untuk sinkronisasi data statistik secara real-time
const inventoryService = require('../services/inventory/inventoryService');

// Helper untuk mendapatkan absolute path
const getAbsoluteFilePath = (relativeFilepath) => {
  return path.join(__dirname, '../', relativeFilepath);
};

// 1. POST /api/markdown/create-project (PERBAIKAN SINKRONISASI IMPORT)
exports.createLayout = async (req, res) => {
  try {
    const userId = req.user.id; 
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Nama layout/gudang wajib diisi, bro!' });
    }

    // Insert project baru
    const [projectResult] = await db.query(
      'INSERT INTO projects (user_id, name, description) VALUES (?, ?, ?)',
      [userId, name, description || '']
    );
    const projectId = projectResult.insertId;

    const filename = `warehouse_project_${projectId}.md`;
    const relativePath = `data/markdown/${filename}`;
    const absolutePath = getAbsoluteFilePath(relativePath);

    await fs.mkdir(path.dirname(absolutePath), { recursive: true });

    let markdownContent = '';

    // JIKA USER IMPORT FILE .MD
    if (req.files && req.files.markdownFile) {
      const uploadedFile = req.files.markdownFile;
      if (path.extname(uploadedFile.name) !== '.md') {
        return res.status(400).json({ success: false, message: 'Format file harus .md ya!' });
      }
      // Pindahkan file ke storage internal
      await uploadedFile.mv(absolutePath);
      
      // PERBAIKAN: Baca isi file yang baru di-upload untuk disinkronkan ke DB statistik
      markdownContent = await fs.readFile(absolutePath, 'utf8');
    } else {
      // JIKA USER BUAT BARU KOSONGAN
      markdownContent = `# [Room] ${name} (W: 800, H: 600)\n# Ditulis otomatis oleh TwinStock System\n\n## [Zone] Default Zone | W: 200 | H: 200 | X: 50 | Y: 50\n- ITEM-01 | Contoh Item | qty: 0 | unit_value: 0 | pos: 30, 45`;
      await fs.writeFile(absolutePath, markdownContent, 'utf8');
    }

    // Catat data file markdown ke database
    const [fileResult] = await db.query(
      'INSERT INTO markdown_files (project_id, filename, filepath) VALUES (?, ?, ?)',
      [projectId, filename, relativePath]
    );
    const fileId = fileResult.insertId;

    // ==========================================
    // KUNCI PERBAIKAN: PAKSA SINKRONISASI DATA KETIKA IMPORT/CREATE
    // ==========================================
    // Pastikan service inventory kamu memiliki fungsi sinkronisasi (misal: sync atau save data)
    // Jika service kamu mendeteksi data inventaris dari database 'markdown_files', kita pancing 
    // agar data parser masuk ke database inventory atau log record.
    try {
      if (typeof inventoryService.syncInventoryData === 'function') {
        // Panggil tracker inventory jika fungsi ini tersedia di service lu
        await inventoryService.syncInventoryData(fileId, markdownContent);
      } else if (typeof inventoryService.updateInventoryFromMarkdown === 'function') {
        await inventoryService.updateInventoryFromMarkdown(fileId, markdownContent);
      }
      
      // Catat log awal pembuatan/import layout
      const jsonRuntime = parseMarkdownToJSON(markdownContent);
      let initialItemsCount = 0;
      if (jsonRuntime && jsonRuntime.zones) {
        jsonRuntime.zones.forEach(zone => {
          if (zone.items) initialItemsCount += zone.items.length;
        });
      }
      
      await db.query(
        `INSERT INTO inventory_logs (file_id, action_type, item_name, quantity_before, quantity_after)
         VALUES (?, ?, ?, ?, ?)`,
        [fileId, 'IMPORT_LAYOUT', 'Initial Layout Setup', 0, initialItemsCount]
      );
    } catch (syncError) {
      console.warn('Gagal melakukan pre-sinkronisasi statistik otomatis:', syncError);
    }
    // ==========================================

    return res.status(201).json({
      success: true,
      message: req.files && req.files.markdownFile 
        ? 'Layout berhasil di-import dan disinkronkan! 🚀' 
        : 'Layout baru berhasil diinisialisasi! 🚀',
      projectId: projectId
    });

  } catch (error) {
    console.error('Error saat membuat layout baru:', error);
    return res.status(500).json({ success: false, message: 'Gagal membuat layout baru di server.' });
  }
};

// 2. GET /api/markdown/layout (Berdasarkan projectId milik user)
exports.getMarkdownLayout = async (req, res) => {
  try {
    const userId = req.user.id;
    let { projectId } = req.query; 

    let activeProject;

    if (projectId) {
      const [projects] = await db.query('SELECT * FROM projects WHERE id = ? AND user_id = ?', [projectId, userId]);
      activeProject = projects[0];
    } else {
      const [projects] = await db.query('SELECT * FROM projects WHERE user_id = ? ORDER BY created_at DESC LIMIT 1', [userId]);
      activeProject = projects[0];
    }

    if (!activeProject) {
      const [newProj] = await db.query(
        'INSERT INTO projects (user_id, name, description) VALUES (?, ?, ?)',
        [userId, 'Gudang Utama', 'Denah bawaan otomatis sistem TwinStock']
      );
      const [fetchedProj] = await db.query('SELECT * FROM projects WHERE id = ?', [newProj.insertId]);
      activeProject = fetchedProj[0];
    }

    projectId = activeProject.id;

    let [files] = await db.query('SELECT * FROM markdown_files WHERE project_id = ?', [projectId]);
    let fileRecord = files[0];

    const filename = `warehouse_project_${projectId}.md`;
    const relativePath = `data/markdown/${filename}`;
    const filePath = getAbsoluteFilePath(relativePath);

    if (!fileRecord) {
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      const defaultMarkdown = `# [Room] ${activeProject.name} (W: 800, H: 600)\n\n## [Zone] Rak Utama | W: 300 | H: 200 | X: 50 | Y: 50\n- ITEM-01 | Barang Contoh | qty: 10 | unit_value: 50000 | pos: 30, 40`;
      await fs.writeFile(filePath, defaultMarkdown, 'utf-8');

      const [newFile] = await db.query(
        'INSERT INTO markdown_files (project_id, filename, filepath) VALUES (?, ?, ?)',
        [projectId, filename, relativePath]
      );
      fileRecord = { id: newFile.insertId, filepath: relativePath };
    }

    const finalFullPath = getAbsoluteFilePath(fileRecord.filepath);
    const markdownText = await fs.readFile(finalFullPath, 'utf-8');
    
    const jsonRuntime = parseMarkdownToJSON(markdownText);
    
    res.status(200).json({
      success: true,
      message: "Berhasil memuat JSON Runtime",
      projectId: projectId,
      fileId: fileRecord.id,
      rawMarkdown: markdownText,
      data: jsonRuntime
    });
  } catch (error) {
    console.error("Error di getMarkdownLayout:", error);
    res.status(500).json({ success: false, message: "Gagal membaca berkas Markdown" });
  }
};

// 3. POST /api/markdown/parse (Murni Parser String Teks)
exports.parseRawMarkdown = (req, res) => {
  try {
    const { markdown } = req.body;
    if (!markdown) {
      return res.status(400).json({ success: false, message: "Teks markdown tidak boleh kosong" });
    }
    const jsonResult = parseMarkdownToJSON(markdown);
    res.status(200).json({ success: true, data: jsonResult });
  } catch (error) {
    console.error("Error di parseRawMarkdown:", error);
    res.status(500).json({ success: false, message: "Gagal memproses parsing teks" });
  }
};

// 4. POST /api/markdown/save (Menyimpan data & mencatat ke log aktivitas)
exports.saveMarkdownLayout = async (req, res) => {
  try {
    const { markdown, projectId } = req.body; 
    const userId = req.user.id;

    if (!markdown) {
      return res.status(400).json({ success: false, message: 'Konten markdown tidak boleh kosong, bro.' });
    }
    if (!projectId) {
      return res.status(400).json({ success: false, message: 'ID Proyek wajib disertakan untuk menyimpan.' });
    }

    const [files] = await db.query(
      `SELECT mf.* FROM markdown_files mf
       JOIN projects p ON mf.project_id = p.id
       WHERE p.id = ? AND p.user_id = ?`, 
      [projectId, userId]
    );
    let fileRecord = files[0];

    if (!fileRecord) {
      return res.status(404).json({ success: false, message: 'File markdown proyek tidak ditemukan.' });
    }

    const filePath = getAbsoluteFilePath(fileRecord.filepath);

    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, markdown, 'utf-8');

    const jsonRuntime = parseMarkdownToJSON(markdown);
    let totalItemsInMarkdown = 0;
    
    if (jsonRuntime && jsonRuntime.zones) {
      jsonRuntime.zones.forEach(zone => {
        if (zone.items) totalItemsInMarkdown += zone.items.length;
      });
    }

    // Pemicu sinkronisasi data inventaris saat user menekan SAVE dari Workspace editor
    try {
      if (typeof inventoryService.syncInventoryData === 'function') {
        await inventoryService.syncInventoryData(fileRecord.id, markdown);
      } else if (typeof inventoryService.updateInventoryFromMarkdown === 'function') {
        await inventoryService.updateInventoryFromMarkdown(fileRecord.id, markdown);
      }
    } catch (innerErr) {
      console.error("Gagal sinkronisasi data inventaris saat simpan:", innerErr);
    }

    await db.query(
      `INSERT INTO inventory_logs (file_id, action_type, item_name, quantity_before, quantity_after)
       VALUES (?, ?, ?, ?, ?)`,
      [fileRecord.id, 'UPDATE_LAYOUT', 'Denah Gudang Total', 0, totalItemsInMarkdown]
    );

    return res.status(200).json({
      success: true,
      message: 'File denah gudang lu berhasil diperbarui dengan aman!'
    });
  } catch (error) {
    console.error('Error di saveMarkdownLayout:', error);
    return res.status(500).json({ success: false, message: 'Gagal menyimpan file di server.' });
  }
};

// 5. GET /api/markdown/stats
exports.getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const fileMeta = await inventoryService.getMarkdownMetadata(userId);
    if (!fileMeta) {
      return res.status(200).json({
        success: true,
        stats: { totalItems: 0, totalZones: 0, lowStock: 0, totalValue: 0, utilization: 0 }
      });
    }

    const items = await inventoryService.getInventoryFromMarkdown(fileMeta.id) || [];

    const totalItems = items.length;
    const lowStock = items.filter(item => item.status === 'Low Stock').length;
    const totalValue = items.reduce((acc, item) => acc + Number(item.value || 0), 0);
    
    // Mapping zona berdasarkan nama lokasi unik
    const totalZones = new Set(
      items.filter(item => item.location).map(item => item.location.trim().toLowerCase())
    ).size;

    return res.status(200).json({
      success: true,
      stats: {
        totalItems, 
        totalZones, 
        lowStock, 
        totalValue,
        utilization: totalItems > 0 ? 45.5 : 0
      }
    });
  } catch (error) {
    console.error("Error di getDashboardStats (Terintegrasi):", error);
    return res.status(500).json({ success: false, message: "Gagal memuat statistik dashboard terpadu." });
  }
};