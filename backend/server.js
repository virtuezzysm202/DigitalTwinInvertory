const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import Routes Baru & Lama yang dipertahankan
const authRoutes = require('./routes/authRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');  
const markdownRoutes = require('./routes/markdownRoutes'); // ➡️ [NEW] Menggantikan layoutRoutes

const app = express();

// 🔽 FIX CORS: Izinkan Header Authorization & Method secara eksplisit
app.use(cors({
  origin: function (origin, callback) {
    // Mengizinkan localhost port berapa saja (3000, 5173, dll) atau request tanpa origin (seperti Postman)
    if (!origin || origin.startsWith('http://localhost:')) {
      callback(null, true);
    } else {
      callback(new Error('Ditolak oleh kebijakan CORS TwinStock'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'], // ⬅️ KUNCI UTAMA: Wajib daftarkan Authorization di sini!
  credentials: true // Izinkan jika frontend mengirimkan cookies/token via session
}));

app.use(express.json()); // Menerima body request format JSON

// Peta Routing API Utama Sistem
app.use('/api/auth', authRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/markdown', markdownRoutes); // ➡️ [NEW] Endpoint beralih ke /api/markdown/...

// Root Test Route
app.get('/', (req, res) => {
  res.send('API TwinStock Backend Berjalan Normal dengan Arsitektur Markdown-First!');
});

// Jalankan Server Aplikasi
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server berjalan lancar di http://localhost:${PORT}`);
});