const db = require('../config/db');

// =========================
// GET ALL INVENTORY
// =========================
exports.getAllInventory = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM inventory ORDER BY id DESC'
    );

    res.status(200).json(rows);

  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: 'Gagal mengambil data inventory'
    });
  }
};


// =========================
// CREATE INVENTORY
// =========================
exports.createInventory = async (req, res) => {
  try {
    const {
      item_code,
      name,
      category,
      location,
      stock,
      unit_value,
      description,
      notes
    } = req.body;

    const stockNum = Number(stock);

    if (isNaN(stockNum)) {
      return res.status(400).json({
        message: 'Stock harus berupa angka'
      });
    }

    // STATUS LOGIC FIXED
    let status = 'In Stock';

    if (stockNum <= 0) {
      status = 'Out of Stock';
    } else if (stockNum <= 5) {
      status = 'Low Stock';
    }

    await db.query(
      `INSERT INTO inventory (
        item_code,
        name,
        category,
        location,
        stock,
        status,
        unit_value,
        description,
        notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        item_code,
        name,
        category,
        location,
        stockNum,
        status,
        unit_value,
        description,
        notes
      ]
    );

    res.status(201).json({
      message: 'Inventory berhasil ditambahkan'
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: 'Gagal menambahkan inventory'
    });
  }
};


// =========================
// DELETE INVENTORY
// =========================
exports.deleteInventory = async (req, res) => {
  try {
    const { id } = req.params;

    await db.query(
      'DELETE FROM inventory WHERE id=?',
      [id]
    );

    res.status(200).json({
      message: 'Inventory berhasil dihapus'
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: 'Gagal menghapus inventory'
    });
  }
};


// =========================
// UPDATE INVENTORY (FIXED)
// =========================
exports.updateInventory = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      item_code,
      name,
      category,
      location,
      stock,
      unit_value,
      description
    } = req.body;

    const stockNum = Number(stock);

    if (isNaN(stockNum)) {
      return res.status(400).json({
        message: 'Stock harus berupa angka'
      });
    }

    // STATUS AUTO RECALCULATE
    let status = 'In Stock';

    if (stockNum <= 0) {
      status = 'Out of Stock';
    } else if (stockNum <= 5) {
      status = 'Low Stock';
    }

    await db.query(
      `
      UPDATE inventory
      SET
        item_code = ?,
        name = ?,
        category = ?,
        location = ?,
        stock = ?,
        status = ?,
        unit_value = ?,
        description = ?
      WHERE id = ?
      `,
      [
        item_code,
        name,
        category,
        location,
        stockNum,
        status,
        unit_value,
        description,
        id
      ]
    );

    res.json({
      message: 'Inventory berhasil diupdate'
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: 'Server Error'
    });
  }
};