const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  // 1. Ambil token dari headers 'Authorization'
  const authHeader = req.headers['authorization'];
  
  // Format token: "Bearer <token>"
  const token = authHeader && authHeader.split(' ')[1]; 

  // 2. Kalau token tidak ada, tolak!
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Akses ditolak! Token tidak ditemukan.' 
    });
  }

  // 3. Verifikasi token
  const secretKey = process.env.JWT_SECRET || 'rahasia_negara_123'; 

  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) {
      return res.status(403).json({ 
        success: false, 
        message: 'Token tidak valid atau sudah expired!' 
      });
    }

    // 4. Simpan data user hasil decode ke objek req
    req.user = decoded; 
    
    // 5. Lanjut ke proses berikutnya
    next(); 
  });
};

module.exports = authMiddleware;