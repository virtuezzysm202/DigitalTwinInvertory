const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');

const app = express();

// Middleware
app.use(cors()); // Mengizinkan request dari frontend
app.use(express.json()); // Menerima body request dalam bentuk JSON

// Routes
app.use('/api/auth', authRoutes);

// Test Route
app.get('/', (req, res) => {
  res.send('API TwinStock Backend Berjalan Normal!');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});