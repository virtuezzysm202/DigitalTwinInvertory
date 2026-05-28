const db = require('../config/db');

// Ambil project aktif milik user
const getActiveProject = async (userId) => {
  const [rows] = await db.query('SELECT * FROM projects WHERE user_id = ? LIMIT 1', [userId]);
  return rows[0] || null;
};

// Cek apakah user sudah punya layout
const userHasLayout = async (userId) => {
  const [rows] = await db.query('SELECT id FROM projects WHERE user_id = ? LIMIT 1', [userId]);
  return rows.length > 0;
};

// Hitung jumlah file dalam layout
const getFileCount = async (projectId) => {
  const [rows] = await db.query('SELECT COUNT(*) as total FROM markdown_files WHERE project_id = ?', [projectId]);
  return rows[0].total;
};

module.exports = { getActiveProject, userHasLayout, getFileCount };