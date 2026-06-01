const { buildInventoryContext } = require('./aiContextBuilder');
const { formatResponse } = require('../utils/responseFormatter');
const tensorflowBridge = require('./tensorflowBridge');

//Rule based
const detectIntent = (question) => {
  const q = question.toLowerCase().trim();
  if (/dimana|lokasi|letak|where is|find|cari|posisi barang|ada di/.test(q)) return 'search_item';
  if (/low stock|stok rendah|hampir habis|sedikit|menipis|kritis/.test(q)) return 'low_stock';
  if (/kosong|habis|empty|out of stock|nol|tidak ada stok/.test(q)) return 'empty_stock';
  if (/berapa stok|stok|stock|qty|quantity|jumlah stok/.test(q)) return 'check_stock';
  if (/berapa item|total item|jumlah item|berapa barang|total barang/.test(q)) return 'count_item';
  if (/berapa zona|jumlah zona|total zona|how many zone|berapa rak/.test(q)) return 'count_zone';
  if (/room|ruangan|gudang info|ukuran ruang|info gudang/.test(q)) return 'room_information';
  if (/zona|zone|rak|shelf|area/.test(q)) return 'zone_information';
  if (/restock|rekomendasi|saran|perlu dipesan|suggest|order|beli/.test(q)) return 'restock_recommendation';
  if (/nilai|value|harga|total nilai|total harga|worth|aset/.test(q)) return 'total_value';
  return 'unknown';
};

const extractKeyword = (question) => {
  return question
    .toLowerCase()
    .replace(/dimana|lokasi|letak|where is|find|cari|posisi|stok|stock|berapa|info|zona|zone|rak/gi, '')
    .replace(/[?!.,]/g, '')
    .trim();
};

// Handlers
const handlers = {

  search_item: (ctx, question) => {
    const keyword = extractKeyword(question);
    if (!keyword) return formatResponse('search_item', null, 'Sebutkan nama atau kode item. Contoh: "dimana iPhone 15?"');
    const found = ctx.items.filter(i =>
      i.name.toLowerCase().includes(keyword) || i.id.toLowerCase().includes(keyword)
    );
    return formatResponse('search_item', found, null);
  },

  check_stock: (ctx, question) => {
    const keyword = extractKeyword(question);
    if (!keyword) {
      return formatResponse('check_stock', {
        totalItems: ctx.totalItems,
        inStock: ctx.items.filter(i => i.status === 'In Stock').length,
        lowStock: ctx.lowStockItems.length,
        outOfStock: ctx.emptyItems.length
      }, null);
    }
    const found = ctx.items.filter(i =>
      i.name.toLowerCase().includes(keyword) || i.id.toLowerCase().includes(keyword)
    );
    if (found.length === 0) return formatResponse('check_stock', null, `Item "${keyword}" tidak ditemukan.`);
    return formatResponse('check_stock', found, null);
  },

  low_stock:             (ctx) => formatResponse('low_stock', ctx.lowStockItems, null),
  empty_stock:           (ctx) => formatResponse('empty_stock', ctx.emptyItems, null),
  count_item:            (ctx) => formatResponse('count_item', { total: ctx.totalItems, items: ctx.items }, null),
  count_zone:            (ctx) => formatResponse('count_zone', { total: ctx.totalZones, zones: ctx.zones }, null),
  restock_recommendation:(ctx) => formatResponse('restock_recommendation', [...ctx.lowStockItems, ...ctx.emptyItems], null),
  total_value:           (ctx) => formatResponse('total_value', { totalValue: ctx.totalValue, totalItems: ctx.totalItems }, null),

  room_information: (ctx) => formatResponse('room_information', {
    room: ctx.room, totalZones: ctx.totalZones, totalItems: ctx.totalItems
  }, null),

  zone_information: (ctx, question) => {
    const keyword = extractKeyword(question);
    const found = keyword
      ? ctx.zones.filter(z => z.name.toLowerCase().includes(keyword))
      : ctx.zones;
    if (found.length === 0) return formatResponse('zone_information', null, `Zona "${keyword}" tidak ditemukan.`);
    const zonesWithItems = found.map(zone => ({
      ...zone,
      items: ctx.items.filter(i => i.zone.toLowerCase() === zone.name.toLowerCase())
    }));
    return formatResponse('zone_information', zonesWithItems, null);
  },

  unknown: () => formatResponse('unknown', null,
    'Maaf, saya tidak memahami pertanyaan tersebut. Coba tanyakan tentang:\n• Lokasi barang\n• Stok item\n• Zona inventory\n• Rekomendasi restock'
  )
};

// Entry point
exports.processQuestion = async (userId, question) => {
  try {

    // LAYER 1: Greeting check & bypass model, jawab langsung
    const greetingPattern = /^(halo|hai|hi|hello|hey|tes|test|hei|selamat|pagi|siang|sore|malam|apa kabar|siapa kamu|kamu siapa)[\s?!]*$/i;
    if (greetingPattern.test(question.trim())) {
      return {
        success: true,
        intent: 'greeting',
        answer: 'Halo! 👋 Saya asisten inventory TwinStock.\nTanyakan tentang:\n• Lokasi barang\n• Stok item\n• Info zona\n• Rekomendasi restock'
      };
    }

    // LAYER 2: Build inventory context
    const context = await buildInventoryContext(userId);
    if (!context) {
      return {
        success: false,
        intent: 'no_layout',
        answer: 'Kamu belum memiliki layout. Buat layout dulu di Dashboard.'
      };
    }

    // LAYER 3: TF Model ke intent, fallback ke rule-based jika gagal
    let intent = 'unknown';
    let usedModel = false;

    try {
      const prediction = await tensorflowBridge.predictIntent(question);
      if (prediction.success && prediction.intent) {
        intent = prediction.intent;
        usedModel = true;
        console.log(`[AI] TF Model → intent: ${intent} (confidence: ${prediction.confidence?.toFixed(3)})`);
      } else {
        intent = detectIntent(question);
        console.log(`[AI] TF low confidence, fallback → intent: ${intent}`);
      }
    } catch (err) {
      intent = detectIntent(question);
      console.log(`[AI MODEL FAILED] fallback rule-based → intent: ${intent}`);
    }

    // LAYER 4: Jalankan handler
    const handler = handlers[intent] || handlers['unknown'];
    const result = handler(context, question);

    return { success: true, intent, usedModel, ...result };

  } catch (error) {
    console.error('Error processQuestion:', error);
    return { success: false, intent: 'error', answer: 'Terjadi kesalahan server.' };
  }
};