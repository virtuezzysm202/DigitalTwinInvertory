const fs = require('fs').promises;
const path = require('path');
const { parseMarkdownToJSON } = require('../parsers/markdownParser');

// GET /api/markdown/layout
// Fungsi untuk membaca berkas .md dan mengirimkan hasil JSON Runtime ke Frontend
exports.getMarkdownLayout = async (req, res) => {
  try {
    const filePath = path.join(__dirname, '../data/markdown/warehouse.md');
    
    // 1. Baca file teks mentah
    const markdownText = await fs.readFile(filePath, 'utf-8');
    
    // 2. Konversi lewat mesin parser
    const jsonRuntime = parseMarkdownToJSON(markdownText);
    
    // 3. Kirim ke Frontend (Sertakan teks mentah + hasil parse JSON)
    res.status(200).json({
      success: true,
      message: "Berhasil memuat JSON Runtime dari berkas Markdown",
      rawMarkdown: markdownText, // <--- TAMBAHKAN INI AGAR FRONTEND BISA BACA TEKSNYA!
      data: jsonRuntime
    });
  } catch (error) {
    console.error("Error di getMarkdownLayout:", error);
    res.status(500).json({ 
      success: false, 
      message: "Gagal membaca berkas Markdown utama" 
    });
  }
};

// POST /api/markdown/parse
// Menerima input teks mentah dari editor frontend, langsung dicheck/parse secara real-time
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

exports.saveMarkdownLayout = async (req, res) => {
  try {
    const { markdown } = req.body;

    if (!markdown) {
      return res.status(400).json({ success: false, message: 'Konten markdown tidak boleh kosong, bro.' });
    }

    // 1. SAMAKAN PATH dengan fungsi getMarkdownLayout (masuk ke data/markdown/)
    const filePath = path.join(__dirname, '../data/markdown/warehouse.md');

    // 2. AMANKAN STRUKTUR FOLDER (membuat folder otomatis jika belum ada)
    const folderPath = path.dirname(filePath);
    try {
      await fs.mkdir(folderPath, { recursive: true });
    } catch (dirErr) {
      // Abaikan jika folder sudah terbentuk
    }

    // 3. GUNAKAN fs.writeFile (karena di atas lu meng-import fs.promises)
    await fs.writeFile(filePath, markdown, 'utf-8');

    return res.status(200).json({
      success: true,
      message: 'File warehouse.md berhasil diperbarui di server!'
    });
  } catch (error) {
    // Membantu lu melihat logs asli di terminal backend jika ada kendala hak akses file (permission)
    console.error('=== ERROR DI saveMarkdownLayout ===');
    console.error(error);
    console.error('===================================');
    
    return res.status(500).json({ 
      success: false, 
      message: 'Gagal menyimpan file di server.',
      error: error.message 
    });
  }
};