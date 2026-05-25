const fs = require('fs').promises;
const path = require('path');
const db = require('../config/db'); // ⬅️ Pastikan path koneksi database (mysql2 pool) lu bener ya!
const { parseMarkdownToJSON } = require('../parsers/markdownParser');

// GET /api/markdown/layout
// Fungsi untuk membaca berkas .md spesifik milik user dan mengirimkan hasil JSON Runtime
exports.getMarkdownLayout = async (req, res) => {
  try {
    const userId = req.user.id; // ⬅️ Didapat aman dari authMiddleware (JWT)

    // 1. CARI / BUAT PROJECT DEFAULT UNTUK USER INI
    let [projects] = await db.query('SELECT * FROM projects WHERE user_id = ? LIMIT 1', [userId]);
    let activeProject = projects[0];

    // Jika user baru daftar & belum punya project, buatkan otomatis "Gudang Utama"
    if (!activeProject) {
      const [newProj] = await db.query(
        'INSERT INTO projects (user_id, name, description) VALUES (?, ?, ?)',
        [userId, 'Gudang Utama', 'Denah bawaan otomatis sistem TwinStock']
      );
      const [fetchedProj] = await db.query('SELECT * FROM projects WHERE id = ?', [newProj.insertId]);
      activeProject = fetchedProj[0];
    }

    const projectId = activeProject.id;

    // 2. CARI / BUAT FILE MARKDOWN UNTUK PROJECT INI
    let [files] = await db.query('SELECT * FROM markdown_files WHERE project_id = ? LIMIT 1', [projectId]);
    let fileRecord = files[0];

    // Nama file dibuat unik berdasarkan ID Project agar antar user tidak saling menimpa
    const filename = `warehouse_project_${projectId}.md`;
    const relativePath = `data/markdown/${filename}`;
    const filePath = path.join(__dirname, '../', relativePath);

    if (!fileRecord) {
      // Pastikan folder penampung file markdown sudah terbentuk
      await fs.mkdir(path.dirname(filePath), { recursive: true });

      // Isi layout default untuk pengguna baru gres
      const defaultMarkdown = `## [Zone] Rak Utama | W: 300 | H: 200 | X: 50 | Y: 50\n- ITEM-01 | Barang Contoh | pos: 30, 40`;
      await fs.writeFile(filePath, defaultMarkdown, 'utf-8');

      // Daftarkan file baru ini ke database
      const [newFile] = await db.query(
        'INSERT INTO markdown_files (project_id, filename, filepath) VALUES (?, ?, ?)',
        [projectId, filename, relativePath]
      );
      fileRecord = { id: newFile.insertId, filepath: relativePath };
    }

    // 3. BACA FILE FISIK BERDASARKAN RECORD YANG VALID
    const finalFullPath = path.join(__dirname, '../', fileRecord.filepath);
    const markdownText = await fs.readFile(finalFullPath, 'utf-8');
    
    // 4. KONVERSI LEWAT PARSER LU
    const jsonRuntime = parseMarkdownToJSON(markdownText);
    
    // 5. KIRIM BALIK KE FRONTEND
    res.status(200).json({
      success: true,
      message: "Berhasil memuat JSON Runtime Multi-User",
      projectId: projectId,
      fileId: fileRecord.id,
      rawMarkdown: markdownText, // Teks mentah unik milik user ini
      data: jsonRuntime
    });
  } catch (error) {
    console.error("Error di getMarkdownLayout (Multi-User):", error);
    res.status(500).json({ 
      success: false, 
      message: "Gagal membaca berkas Markdown multi-user" 
    });
  }
};

// POST /api/markdown/parse
// Menerima input teks mentah dari editor frontend, langsung dicheck/parse secara real-time (Tidak berubah karena murni fungsi parser string)
exports.parseRawMarkdown = (req, res) => {
  try {
    const { markdown } = req.body;
    
    if (!markdown) {
      return res.status(400).json({ success: false, message: "Teks markdown tidak boleh kosong" });
    }

    const jsonResult = parseMarkdownToJSON(markdown);
    
    res.status(200).json({
      success: true,
      data: jsonResult
    });
  } catch (error) {
    console.error("Error di parseRawMarkdown:", error);
    res.status(500).json({ success: false, message: "Gagal memproses parsing teks markdown" });
  }
};

// POST /api/markdown/save
// Fungsi menyimpan perubahan layout langsung ke file spesifik milik user tersebut
exports.saveMarkdownLayout = async (req, res) => {
  try {
    const { markdown } = req.body;
    const userId = req.user.id; // ⬅️ Proteksi: Hanya bisa mengedit file miliknya sendiri lewat token JWT

    if (!markdown) {
      return res.status(400).json({ success: false, message: 'Konten markdown tidak boleh kosong, bro.' });
    }

    // 1. CARI RECORD FILE BERDASARKAN KEPEMILIKAN USER (JOIN TABLES)
    const [files] = await db.query(
      `SELECT mf.* FROM markdown_files mf
       JOIN projects p ON mf.project_id = p.id
       WHERE p.user_id = ? LIMIT 1`, 
      [userId]
    );
    let fileRecord = files[0];

    if (!fileRecord) {
      return res.status(404).json({ 
        success: false, 
        message: 'File markdown belum diinisialisasi. Silakan load layout terlebih dahulu.' 
      });
    }

    const filePath = path.join(__dirname, '../', fileRecord.filepath);

    // 2. AMANKAN STRUKTUR FOLDER & TULIS KE FILE UNIK USER
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, markdown, 'utf-8');

    // 3. CATAT RIWAYAT AKSI KE INVENTORY_LOGS
    // Karena skema database mewajibkan field item_name NOT NULL, kita beri keterangan global untuk update layout denah
    await db.query(
      `INSERT INTO inventory_logs (file_id, action_type, item_name, quantity_before, quantity_after)
       VALUES (?, ?, ?, ?, ?)`,
      [fileRecord.id, 'UPDATE_LAYOUT', 'Denah Gudang Total', 0, 0]
    );

    return res.status(200).json({
      success: true,
      message: 'File denah gudang lu berhasil diperbarui dengan aman!'
    });
  } catch (error) {
    console.error('=== ERROR DI saveMarkdownLayout (Multi-User) ===');
    console.error(error);
    return res.status(500).json({ 
      success: false, 
      message: 'Gagal menyimpan file di server.',
      error: error.message 
    });
  }
};