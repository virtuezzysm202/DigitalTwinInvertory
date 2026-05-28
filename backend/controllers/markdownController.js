const db = require('../config/db');
const { parseMarkdownToJSON } = require('../parsers/markdownParser');

const DEFAULT_MD = (name) =>
  `# [Room] ${name} (W: 800, H: 600)\n\n## [Zone] Default Zone | W: 300 | H: 200 | X: 50 | Y: 50\n- ITEM-01 | Contoh Item | qty: 0 | unit_value: 0 | pos: 30, 45`;

const calcStats = (content) => {
  const json = parseMarkdownToJSON(content || '');
  const totalZones = json?.zones?.length || 0;
  const totalItems = json?.zones?.reduce((s, z) => s + (z.items?.length || 0), 0) || 0;
  return { totalZones, totalItems };
};

// ─── 1. GET /api/markdown/project/status ───────────────────────────────
exports.getProjectStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const [rows] = await db.query(
      `SELECT p.*, COUNT(mf.id) as file_count
       FROM projects p
       LEFT JOIN markdown_files mf ON mf.project_id = p.id
       WHERE p.user_id = ?
       GROUP BY p.id`,
      [userId]
    );
    const project = rows[0];
    if (!project) return res.status(200).json({ success: true, hasLayout: false, project: null });
    return res.status(200).json({ success: true, hasLayout: true, project });
  } catch (error) {
    console.error('Error getProjectStatus:', error);
    return res.status(500).json({ success: false, message: 'Gagal cek status layout.' });
  }
};

// ─── 2. POST /api/markdown/create-project ──────────────────────────────
exports.createLayout = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Nama layout wajib diisi.' });

    // MAX 1 LAYOUT PER USER — tolak jika sudah ada
    const [existing] = await db.query('SELECT id FROM projects WHERE user_id = ?', [userId]);
    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Kamu sudah punya 1 layout aktif. Hapus layout lama dulu dari Dashboard.'
      });
    }

    const [projectResult] = await db.query(
      'INSERT INTO projects (user_id, name, description) VALUES (?, ?, ?)',
      [userId, name, description || '']
    );
    const projectId = projectResult.insertId;

    // Jika ada file upload
    let markdownContent = DEFAULT_MD(name);
    if (req.files?.markdownFile) {
      const uploadedFile = req.files.markdownFile;
      if (!uploadedFile.name.endsWith('.md'))
        return res.status(400).json({ success: false, message: 'Format file harus .md.' });
      markdownContent = uploadedFile.data.toString('utf-8');
    }

    const filename = `${name.toLowerCase().replace(/\s+/g, '-')}.md`;
    const [fileResult] = await db.query(
      'INSERT INTO markdown_files (project_id, filename, filepath, content) VALUES (?, ?, ?, ?)',
      [projectId, filename, '', markdownContent]
    );

    try {
      const { totalItems } = calcStats(markdownContent);
      await db.query(
        'INSERT INTO inventory_logs (file_id, action_type, item_name, quantity_before, quantity_after) VALUES (?, ?, ?, ?, ?)',
        [fileResult.insertId, 'CREATE_LAYOUT', 'Initial Setup', 0, totalItems]
      );
    } catch (e) { console.warn('Log warning:', e); }

    return res.status(201).json({
      success: true,
      message: req.files?.markdownFile ? 'Layout berhasil di-import!' : 'Layout berhasil dibuat!',
      projectId
    });
  } catch (error) {
    console.error('Error createLayout:', error);
    return res.status(500).json({ success: false, message: 'Gagal membuat layout.' });
  }
};

// ─── 3. DELETE /api/markdown/project ───────────────────────────────────
exports.deleteProject = async (req, res) => {
  try {
    const userId = req.user.id;
    const [projects] = await db.query('SELECT id FROM projects WHERE user_id = ?', [userId]);
    if (!projects[0]) return res.status(404).json({ success: false, message: 'Tidak ada layout untuk dihapus.' });

    // ON DELETE CASCADE di DB akan otomatis hapus markdown_files + inventory_logs
    await db.query('DELETE FROM projects WHERE user_id = ?', [userId]);
    return res.status(200).json({ success: true, message: 'Layout dan semua file berhasil dihapus.' });
  } catch (error) {
    console.error('Error deleteProject:', error);
    return res.status(500).json({ success: false, message: 'Gagal menghapus layout.' });
  }
};

// ─── 4. GET /api/markdown/layout — TANPA auto-create ───────────────────
exports.getMarkdownLayout = async (req, res) => {
  try {
    const userId = req.user.id;
    const { projectId } = req.query;

    let activeProject;
    if (projectId) {
      const [rows] = await db.query('SELECT * FROM projects WHERE id = ? AND user_id = ?', [projectId, userId]);
      activeProject = rows[0];
    } else {
      const [rows] = await db.query('SELECT * FROM projects WHERE user_id = ? LIMIT 1', [userId]);
      activeProject = rows[0];
    }

    if (!activeProject)
      return res.status(404).json({ success: false, message: 'Belum ada layout. Buat di Dashboard dulu.' });

    const [files] = await db.query(
      'SELECT * FROM markdown_files WHERE project_id = ? ORDER BY created_at DESC LIMIT 1',
      [activeProject.id]
    );
    if (!files[0])
      return res.status(404).json({ success: false, message: 'Belum ada file .md di layout ini.' });

    const markdownText = files[0].content || '';
    return res.status(200).json({
      success: true,
      projectId: activeProject.id,
      fileId: files[0].id,
      filename: files[0].filename,
      rawMarkdown: markdownText,
      data: parseMarkdownToJSON(markdownText)
    });
  } catch (error) {
    console.error('Error getMarkdownLayout:', error);
    return res.status(500).json({ success: false, message: 'Gagal memuat layout.' });
  }
};

// ─── 5. POST /api/markdown/parse ───────────────────────────────────────
exports.parseRawMarkdown = (req, res) => {
  try {
    const { markdown } = req.body;
    if (!markdown) return res.status(400).json({ success: false, message: 'Teks markdown kosong.' });
    return res.status(200).json({ success: true, data: parseMarkdownToJSON(markdown) });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Gagal parsing.' });
  }
};

// ─── 6. POST /api/markdown/save ────────────────────────────────────────
exports.saveMarkdownLayout = async (req, res) => {
  try {
    const { markdown, projectId, fileId } = req.body;
    const userId = req.user.id;
    if (!markdown) return res.status(400).json({ success: false, message: 'Konten markdown kosong.' });

    let fileRecord;
    if (fileId) {
      const [rows] = await db.query(
        `SELECT mf.* FROM markdown_files mf JOIN projects p ON mf.project_id = p.id WHERE mf.id = ? AND p.user_id = ?`,
        [fileId, userId]
      );
      fileRecord = rows[0];
    } else if (projectId) {
      const [rows] = await db.query(
        `SELECT mf.* FROM markdown_files mf JOIN projects p ON mf.project_id = p.id WHERE p.id = ? AND p.user_id = ? ORDER BY mf.created_at DESC LIMIT 1`,
        [projectId, userId]
      );
      fileRecord = rows[0];
    }

    if (!fileRecord) return res.status(404).json({ success: false, message: 'File tidak ditemukan.' });

    await db.query('UPDATE markdown_files SET content = ? WHERE id = ?', [markdown, fileRecord.id]);

    const { totalItems } = calcStats(markdown);
    await db.query(
      'INSERT INTO inventory_logs (file_id, action_type, item_name, quantity_before, quantity_after) VALUES (?, ?, ?, ?, ?)',
      [fileRecord.id, 'UPDATE_LAYOUT', 'Save Changes', 0, totalItems]
    );

    return res.status(200).json({ success: true, message: 'Layout berhasil disimpan!' });
  } catch (error) {
    console.error('Error saveMarkdownLayout:', error);
    return res.status(500).json({ success: false, message: 'Gagal menyimpan.' });
  }
};

// ─── 7. GET /api/markdown/stats ────────────────────────────────────────
exports.getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const [files] = await db.query(
      `SELECT mf.content FROM markdown_files mf JOIN projects p ON mf.project_id = p.id WHERE p.user_id = ?`,
      [userId]
    );

    let totalItems = 0, totalZones = 0, totalValue = 0;
    files.forEach(file => {
      const json = parseMarkdownToJSON(file.content || '');
      if (json?.zones) {
        totalZones += json.zones.length;
        json.zones.forEach(zone => {
          totalItems += zone.items?.length || 0;
          zone.items?.forEach(item => {
            totalValue += Number(item.unit_value || 0) * Number(item.qty || 0);
          });
        });
      }
    });

    return res.status(200).json({
      success: true,
      stats: { totalItems, totalZones, lowStock: 0, totalValue, utilization: totalItems > 0 ? 45.5 : 0 }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Gagal memuat statistik.' });
  }
};

// ─── 8. GET /api/markdown/files ────────────────────────────────────────
exports.getAllMarkdownFiles = async (req, res) => {
  try {
    const userId = req.user.id;
    const [files] = await db.query(
      `SELECT mf.id, mf.filename, mf.content, mf.created_at, p.name as project_name, p.id as project_id
       FROM markdown_files mf JOIN projects p ON mf.project_id = p.id
       WHERE p.user_id = ? ORDER BY mf.created_at DESC`,
      [userId]
    );

    const result = files.map(file => {
      try {
        const text = file.content || '';
        const json = parseMarkdownToJSON(text);
        return {
          id: file.id, filename: file.filename,
          project_name: file.project_name, project_id: file.project_id,
          created_at: file.created_at,
          totalZones: json?.zones?.length || 0,
          totalItems: json?.zones?.reduce((s, z) => s + (z.items?.length || 0), 0) || 0,
          totalLines: text ? text.split('\n').length : 0
        };
      } catch {
        return { id: file.id, filename: file.filename, project_name: file.project_name, project_id: file.project_id, created_at: file.created_at, totalZones: 0, totalItems: 0, totalLines: 0 };
      }
    });

    return res.status(200).json({ success: true, files: result });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Gagal mengambil daftar file.' });
  }
};

// ─── 9. POST /api/markdown/files ───────────────────────────────────────
exports.createMarkdownFile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { filename } = req.body;
    if (!filename) return res.status(400).json({ success: false, message: 'Nama file wajib diisi.' });

    // Cek project milik user
    const [projects] = await db.query('SELECT * FROM projects WHERE user_id = ? LIMIT 1', [userId]);
    const project = projects[0];
    if (!project) return res.status(403).json({ success: false, message: 'Buat layout dulu di halaman Dashboard.' });

    // MAX 10 FILE PER LAYOUT
    const [fileCount] = await db.query('SELECT COUNT(*) as total FROM markdown_files WHERE project_id = ?', [project.id]);
    if (fileCount[0].total >= 10)
      return res.status(400).json({ success: false, message: 'Maksimal 10 file per layout sudah tercapai.' });

    const safeFilename = filename.endsWith('.md') ? filename : `${filename}.md`;
    const [existing] = await db.query(
      'SELECT id FROM markdown_files WHERE filename = ? AND project_id = ?',
      [safeFilename, project.id]
    );
    if (existing.length > 0) return res.status(409).json({ success: false, message: 'Nama file sudah digunakan.' });

    const [result] = await db.query(
      'INSERT INTO markdown_files (project_id, filename, filepath, content) VALUES (?, ?, ?, ?)',
      [project.id, safeFilename, '', DEFAULT_MD(filename)]
    );

    return res.status(201).json({ success: true, message: 'File berhasil dibuat!', fileId: result.insertId });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Gagal membuat file.' });
  }
};

// ─── 10. DELETE /api/markdown/files/:fileId ────────────────────────────
exports.deleteMarkdownFile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { fileId } = req.params;
    const [files] = await db.query(
      `SELECT mf.* FROM markdown_files mf JOIN projects p ON mf.project_id = p.id WHERE mf.id = ? AND p.user_id = ?`,
      [fileId, userId]
    );
    if (!files[0]) return res.status(404).json({ success: false, message: 'File tidak ditemukan.' });
    await db.query('DELETE FROM markdown_files WHERE id = ?', [fileId]);
    return res.status(200).json({ success: true, message: 'File berhasil dihapus.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Gagal menghapus file.' });
  }
};

// ─── 11. GET /api/markdown/files/:fileId ───────────────────────────────
exports.getMarkdownFileById = async (req, res) => {
  try {
    const userId = req.user.id;
    const { fileId } = req.params;
    const [files] = await db.query(
      `SELECT mf.*, p.name as project_name FROM markdown_files mf JOIN projects p ON mf.project_id = p.id WHERE mf.id = ? AND p.user_id = ?`,
      [fileId, userId]
    );
    if (!files[0]) return res.status(404).json({ success: false, message: 'File tidak ditemukan.' });

    const markdownText = files[0].content || '';
    return res.status(200).json({
      success: true, fileId: files[0].id, filename: files[0].filename,
      projectId: files[0].project_id, rawMarkdown: markdownText,
      data: parseMarkdownToJSON(markdownText)
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Gagal membaca file.' });
  }
};

// ─── 12. PUT /api/markdown/files/:fileId/rename ────────────────────────
exports.renameMarkdownFile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { fileId } = req.params;
    const { filename } = req.body;
    if (!filename?.trim()) return res.status(400).json({ success: false, message: 'Nama baru wajib diisi.' });

    const [files] = await db.query(
      `SELECT mf.* FROM markdown_files mf JOIN projects p ON mf.project_id = p.id WHERE mf.id = ? AND p.user_id = ?`,
      [fileId, userId]
    );
    if (!files[0]) return res.status(404).json({ success: false, message: 'File tidak ditemukan.' });

    const safeFilename = filename.trim().endsWith('.md') ? filename.trim() : `${filename.trim()}.md`;
    const [existing] = await db.query(
      'SELECT id FROM markdown_files WHERE filename = ? AND project_id = ? AND id != ?',
      [safeFilename, files[0].project_id, fileId]
    );
    if (existing.length > 0) return res.status(409).json({ success: false, message: 'Nama sudah digunakan.' });

    await db.query('UPDATE markdown_files SET filename = ? WHERE id = ?', [safeFilename, fileId]);
    return res.status(200).json({ success: true, message: 'Nama file berhasil diubah.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Gagal mengubah nama.' });
  }
};