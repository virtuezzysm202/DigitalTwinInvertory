const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import Routes
const authRoutes = require('./routes/authRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');  
const markdownRoutes = require('./routes/markdownRoutes'); 

const app = express();

// Konfigurasi Keamanan CORS
app.use(cors({
  origin: function (origin, callback) {
    // Izinkan request tanpa origin (Postman) atau yang berasal dari localhost (port berapapun)
    if (!origin || /^http:\/\/localhost(:\d+)?$/.test(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Akses ditolak oleh kebijakan CORS TwinStock'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'], // Mengizinkan token JWT di header
  credentials: true 
}));

// Middleware
app.use(express.json()); 

// Routing API Utama
app.use('/api/auth', authRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/markdown', markdownRoutes); 

// Root Route Test
app.get('/', (req, res) => {
  res.send('API TwinStock Backend Berjalan Normal - Arsitektur Markdown-First!');
});

const aiAssistantRoutes = require('./routes/aiAssistantRoutes');
app.use('/api/ai', aiAssistantRoutes);

const aiLayoutRoutes = require('./routes/aiLayoutRoutes');
app.use('/api/ai', aiLayoutRoutes);

// Jalankan Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server aktif di http://localhost:${PORT}`);
});