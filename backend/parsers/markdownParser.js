/**
 * CORE SYSTEM: Markdown to JSON Runtime Parser
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
      if (widthMatch) result.room.width = parseInt(widthMatch[1]);
      if (heightMatch) result.room.height = parseInt(heightMatch[1]);
    }

    // 2. PARSE ZONE -> Contoh: ## [Zone] Rack A (W: 300, H: 200, X: 50, Y: 50)
    else if (line.startsWith('## ') && line.includes('[Zone]')) {
      if (currentZone) {
        result.zones.push(currentZone);
      }

      const zoneNameMatch = line.match(/\[Zone\]\s*([^(]+)/);
      const widthMatch = line.match(/W:\s*(\d+)/i);
      const heightMatch = line.match(/H:\s*(\d+)/i);
      const xMatch = line.match(/X:\s*(\d+)/i);
      const yMatch = line.match(/Y:\s*(\d+)/i);

      currentZone = {
        name: zoneNameMatch ? zoneNameMatch[1].trim() : "Unknown Zone",
        width: widthMatch ? parseInt(widthMatch[1]) : 100,
        height: heightMatch ? parseInt(heightMatch[1]) : 100,
        x: xMatch ? parseInt(xMatch[1]) : 0,
        y: yMatch ? parseInt(yMatch[1]) : 0,
        items: []
      };
    }

    // 3. PARSE ITEM -> Contoh: - Monitor | Qty: 10 | Pos: 80,90 | Tags: Electronics
    else if (line.startsWith('-') && currentZone) {
      const cleanLine = line.substring(1).trim(); 
      const parts = cleanLine.split('|').map(p => p.trim());

      if (parts.length > 0 && parts[0] !== "") {
        const itemName = parts[0];
        let qty = 0;
        let pos = [0, 0];
        let tags = [];

        parts.forEach(part => {
          if (part.toLowerCase().startsWith('qty:')) {
            qty = parseInt(part.replace(/qty:\s*/i, '')) || 0;
          }
          else if (part.toLowerCase().startsWith('pos:')) {
            const coords = part.replace(/pos:\s*/i, '').split(',').map(c => parseInt(c.trim()));
            if (coords.length === 2) pos = coords;
          }
          else if (part.toLowerCase().startsWith('tags:')) {
            tags = part.replace(/tags:\s*/i, '').split(',').map(t => t.trim());
          }
        });

        currentZone.items.push({
          name: itemName,
          qty: qty,
          pos: pos,
          tags: tags
        });
      }
    }
  }

  // Masukkan zone terakhir jika ada sisa di loop
  if (currentZone) {
    result.zones.push(currentZone);
  }

  return result;
};