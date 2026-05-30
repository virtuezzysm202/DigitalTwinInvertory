/**
 * Format response AI Assistant untuk ke frontend
 */
exports.formatResponse = (intent, data, errorMessage) => {
    if (errorMessage) return { answer: errorMessage, data: null };
  
    switch (intent) {
  
      case 'search_item':
        if (!data || data.length === 0) return { answer: 'Item tidak ditemukan di inventory.', data: [] };
        return {
          answer: data.length === 1
            ? `📍 **${data[0].name}** berada di zona **${data[0].zone}** (${data[0].sourceFile}), stok: **${data[0].qty}** unit.`
            : `Ditemukan **${data.length}** item:\n` + data.map(i => `• ${i.name} → zona **${i.zone}**, stok: ${i.qty}`).join('\n'),
          data
        };
  
      case 'check_stock':
        if (data?.totalItems !== undefined) {
          return {
            answer: `📊 Total ${data.totalItems} item.\n• In Stock: ${data.inStock}\n• Low Stock: ${data.lowStock}\n• Out of Stock: ${data.outOfStock}`,
            data
          };
        }
        return {
          answer: data.map(i => `• **${i.name}** (${i.id}): stok **${i.qty}** unit — ${i.status}`).join('\n'),
          data
        };
  
      case 'low_stock':
        if (!data || data.length === 0) return { answer: '✅ Tidak ada item dengan stok rendah saat ini.', data: [] };
        return {
          answer: `⚠️ **${data.length}** item stok rendah:\n` + data.map(i => `• ${i.name} → stok: **${i.qty}** unit (zona: ${i.zone})`).join('\n'),
          data
        };
  
      case 'empty_stock':
        if (!data || data.length === 0) return { answer: '✅ Tidak ada item yang stoknya kosong.', data: [] };
        return {
          answer: `🚫 **${data.length}** item stok kosong:\n` + data.map(i => `• ${i.name} (zona: ${i.zone})`).join('\n'),
          data
        };
  
      case 'count_item':
        return {
          answer: `📦 Total item di seluruh layout: **${data.total}** item.`,
          data
        };
  
      case 'count_zone':
        return {
          answer: `🗂️ Total zona: **${data.total}** zona.\n` + data.zones.map(z => `• ${z.name} — ${z.itemCount} item`).join('\n'),
          data
        };
  
      case 'room_information':
        return {
          answer: `🏭 **${data.room?.name || 'Gudang'}**\nUkuran: ${data.room?.width} × ${data.room?.height} px\nTotal zona: **${data.totalZones}** | Total item: **${data.totalItems}**`,
          data
        };
  
      case 'zone_information':
        if (!data || data.length === 0) return { answer: 'Zona tidak ditemukan.', data: [] };
        return {
          answer: data.map(z =>
            `📦 Zona **${z.name}**: ${z.items?.length || z.itemCount} item | ukuran ${z.width}×${z.height}px`
          ).join('\n'),
          data
        };
  
      case 'restock_recommendation':
        if (!data || data.length === 0) return { answer: 'Semua stok aman. Tidak ada yang perlu di-restock.', data: [] };
        return {
          answer: `📋 **${data.length}** item perlu di-restock:\n` + data.map(i => `• ${i.name} → stok: **${i.qty}** unit (zona: ${i.zone})`).join('\n'),
          data
        };
  
      case 'total_value':
        return {
          answer: `💰 Total nilai inventory: **Rp ${data.totalValue.toLocaleString('id-ID')}** dari ${data.totalItems} item.`,
          data
        };
  
      default:
        return { answer: 'Tidak dapat memproses permintaan.', data: null };
    }
  };