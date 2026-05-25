# ====================================================================
# TWINSTOCK DIGITAL TWIN - WAREHOUSE LAYOUT TEMPLATE
# ====================================================================
# Panduan Singkat:
# 1. Gunakan baris '## [Zone]' untuk membuat area/rak baru.
# 2. Tentukan Dimensi (W, H) dan Posisi Koordinat (X, Y) pada Kanvas.
# 3. Gunakan tanda minus '-' di bawah zona untuk memasukkan item barang.
# ====================================================================

## [Zone] Area Elektronik | W: 350 | H: 220 | X: 50 | Y: 80
- ITM-001 | Laptop ASUS ROG | qty: 15 | unit_value: 15000000 | pos: 30, 40
- ITM-002 | Monitor LG 24 Inch | qty: 4 | unit_value: 21000000 | pos: 30, 100
- ITM-003 | Mouse Logitech G | qty: 0 | unit_value: 500000 | pos: 200 | Y: 40

## [Zone] Rak Suku Cadang | W: 280 | H: 180 | X: 450 | Y: 80
- ITM-004 | Mechanical Keyboard | qty: 25 | unit_value: 1200000 | pos: 40, 50
- ITM-005 | Kabel HDMI 2K | qty: 2 | unit_value: 75000 | pos: 40, 110

## [Zone] Area Transit (Inbound) | W: 400 | H: 150 | X: 50 | Y: 350
- ITM-006 | Router TP-Link | qty: 50 | unit_value: 350000 | pos: 50, 50