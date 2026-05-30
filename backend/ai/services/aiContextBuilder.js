const db = require('../../config/db');
const { parseMarkdownToJSON } = require('../../parsers/markdownParser');

/** notes : 
 * Membangun context inventory lengkap dari semua markdown file milik user.
 * Output ini digunakan oleh aiAssistantService untuk menjawab pertanyaan.
 *
 * Struktur output contohnya seperti :
 * {
 *   room, zones, items, lowStockItems, emptyItems,
 *   totalItems, totalZones, totalValue, totalFiles, sources
 * }
 */
exports.buildInventoryContext = async (userId) => {
  try {
    // Ambil project aktif milik user
    const [projects] = await db.query(
      'SELECT id FROM projects WHERE user_id = ? LIMIT 1',
      [userId]
    );
    if (projects.length === 0) return null;

    // Ambil semua file markdown dalam layout
    const [files] = await db.query(
      'SELECT id, filename, content FROM markdown_files WHERE project_id = ? ORDER BY created_at ASC',
      [projects[0].id]
    );
    if (files.length === 0) return null;

    const context = {
      totalFiles: files.length,
      sources: [],
      room: null,
      zones: [],
      items: [],
      lowStockItems: [],
      emptyItems: [],
      totalItems: 0,
      totalZones: 0,
      totalValue: 0
    };

    for (const file of files) {
      const parsed = parseMarkdownToJSON(file.content || '');
      context.sources.push(file.filename);

      // Ambil info room dari file pertama yang punya room
      if (!context.room && parsed.room) {
        context.room = parsed.room;
      }

      if (!parsed.zones || !Array.isArray(parsed.zones)) continue;

      for (const zone of parsed.zones) {
        context.zones.push({
          name: zone.name,
          width: zone.width,
          height: zone.height,
          x: zone.x,
          y: zone.y,
          itemCount: zone.items?.length || 0,
          sourceFile: file.filename
        });

        if (!zone.items || !Array.isArray(zone.items)) continue;

        for (const item of zone.items) {
          const qty = Number(item.qty || 0);
          const unitValue = Number(item.unit_value || 0);

          const itemObj = {
            id: item.id,
            name: item.name,
            qty,
            unit_value: unitValue,
            value: qty * unitValue,
            zone: zone.name,
            pos: item.pos || [0, 0],
            tags: item.tags || [],
            status: qty <= 0 ? 'Out of Stock' : qty <= 5 ? 'Low Stock' : 'In Stock',
            sourceFile: file.filename
          };

          context.items.push(itemObj);
          context.totalValue += itemObj.value;

          if (qty <= 0) context.emptyItems.push(itemObj);
          else if (qty <= 5) context.lowStockItems.push(itemObj);
        }
      }
    }

    context.totalItems = context.items.length;
    context.totalZones = context.zones.length;

    return context;
  } catch (error) {
    console.error('Error buildInventoryContext:', error);
    return null;
  }
};