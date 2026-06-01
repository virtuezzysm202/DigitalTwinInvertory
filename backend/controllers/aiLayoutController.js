const tensorflowBridge = require('../ai/services/tensorflowBridge');
const { getIntentCategory } = require('../ai/services/intentRouter');
const aiLayoutService = require('../ai/services/aiLayoutService');

exports.layoutChat = async (req, res) => {
  try {
    const userId = req.user.id;
    const { question } = req.body;

    if (!question?.trim()) {
      return res.status(400).json({ success: false, message: 'Pertanyaan tidak boleh kosong.' });
    }

    // mendeteksiintent via TF model
    let intent = 'unknown';
    try {
      const prediction = await tensorflowBridge.predictIntent(question.trim());
      if (prediction.success && prediction.intent) {
        intent = prediction.intent;
      }
    } catch (err) {
      console.error('[Layout AI] TF Bridge error:', err.message);
    }

    // Ditolak jika bukan layout intent
    if (getIntentCategory(intent) !== 'layout') {
      return res.status(200).json({
        success: false,
        intent,
        answer: `"${intent}" bukan aksi layout. Gunakan AI Assistant untuk pertanyaan tentang inventory.`
      });
    }

    const result = await aiLayoutService.processLayoutAction(userId, question.trim(), intent);

    return res.status(200).json({ success: result.success, intent, ...result });

  } catch (error) {
    console.error('Error aiLayoutController:', error);
    return res.status(500).json({ success: false, answer: 'Terjadi kesalahan server.' });
  }
};