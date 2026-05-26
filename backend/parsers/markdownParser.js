/**
 * CORE SYSTEM: Markdown to JSON Runtime Parser (FULLY FIXED 🚀)
 * Mengubah format berkas fisik (.md) menjadi JSON Runtime untuk dikonsumsi FE & AI
 */
exports.parseMarkdownToJSON = (markdownText) => {
  const result = {
    room: { name: "Default Warehouse", width: 800, height: 600 },
    zones: []
  };

  if (!markdownText) return result;

  const lines = markdownText.split('\n');
  let currentZone = null;

  for (let line of lines) {
    line = line.trim();

    // 1. PARSE ROOM -> Contoh: # [Room] Warehouse A (W: 1000, H: 800)
    if (line.startsWith('# ') && line.includes('[Room]')) {
      const roomNameMatch = line.match(/\[Room\]\s*([^(]+)/);
      const widthMatch = line.match(/W:\s*(\d+)/i);
      const heightMatch = line.match(/H:\s*(\d+)/i);

      if (roomNameMatch) result.room.name = roomNameMatch[1].trim();
      if (widthMatch) result.room.width = parseInt(widthMatch[1], 10);
      if (heightMatch) result.room.height = parseInt(heightMatch[1], 10);
    }

    // 2. PARSE ZONE -> Contoh: ## [Zone] Rack A | W: 300 | H: 200 | X: 50 | Y: 50
    else if (line.startsWith('## ') && line.includes('[Zone]')) {
      // PERBAIKAN 1: Push klon zona lama sebelum membuat zona baru agar tidak saling menimpa referensi memori
      if (currentZone) {
        result.zones.push(JSON.parse(JSON.stringify(currentZone)));
      }

      const zoneNameMatch = line.match(/\[Zone\]\s*([^|#(\n]+)/);
      const widthMatch = line.match(/W\s*:\s*(\d+)/i);
      const heightMatch = line.match(/H\s*:\s*(\d+)/i);
      const xMatch = line.match(/X\s*:\s*(\d+)/i);
      const yMatch = line.match(/Y\s*:\s*(\d+)/i);

      currentZone = {
        name: zoneNameMatch ? zoneNameMatch[1].trim() : "Unknown Zone",
        width: widthMatch ? parseInt(widthMatch[1], 10) : 100,
        height: heightMatch ? parseInt(heightMatch[1], 10) : 100,
        x: xMatch ? parseInt(xMatch[1], 10) : 0,
        y: yMatch ? parseInt(yMatch[1], 10) : 0,
        items: []
      };
    }

    // 3. PARSE ITEM -> Contoh: - GDT-001 | iPhone 15 Pro Max | qty: 10 | pos: 80,90
    else if (line.startsWith('-') && currentZone) {
      const cleanLine = line.substring(1).trim(); 
      const parts = cleanLine.split('|').map(p => p.trim());

      if (parts.length > 0 && parts[0] !== "") {
        const itemCode = parts[0]; 
        let itemName = itemCode;
        
        let qty = 0;
        let unitValue = 0;
        let pos = [20, 40]; // Default fallback koordinat dari service
        let tags = [];

        // PERBAIKAN 2: Iterasi pembacaan kolom secara aman tanpa merusak ekstraksi nama barang
        parts.forEach((part, index) => {
          const lowerPart = part.toLowerCase();
          
          if (lowerPart.startsWith('qty:')) {
            qty = parseInt(part.replace(/qty:\s*/i, ''), 10) || 0;
          } 
          else if (lowerPart.startsWith('unit_value:')) {
            unitValue = parseFloat(part.replace(/unit_value:\s*/i, '')) || 0;
          }
          else if (lowerPart.startsWith('pos:')) {
            const coords = part.replace(/pos:\s*/i, '').split(',').map(c => parseInt(c.trim(), 10));
            if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
              pos = coords;
            }
          } 
          else if (lowerPart.startsWith('tags:')) {
            tags = part.replace(/tags:\s*/i, '').split(',').map(t => t.trim());
          }
          // Kolom ke-2 (index 1) adalah nama barang, asalkan tidak diawali oleh parameter penanda metadata
          else if (index === 1 && !lowerPart.includes(':')) {
            itemName = part;
          }
        });

        currentZone.items.push({
          id: itemCode,          
          name: itemName,        
          qty: qty,
          unit_value: unitValue,
          pos: pos,
          tags: tags
        });
      }
    }
  }

  // Masukkan zone terakhir setelah looping teks baris selesai
  if (currentZone) {
    result.zones.push(currentZone);
  }

  return result;
};