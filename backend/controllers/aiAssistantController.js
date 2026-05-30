const aiAssistantService = require('../ai/services/aiAssistantService');

exports.chat = async (req, res) => {
  try {
    const userId = req.user.id;
    const { question } = req.body;

    if (!question?.trim()) {
      return res.status(400).json({ success: false, message: 'Pertanyaan tidak boleh kosong.' });
    }

    const result = await aiAssistantService.processQuestion(userId, question.trim());
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error aiAssistantController.chat:', error);
    return res.status(500).json({ success: false, answer: 'Terjadi kesalahan server.' });
  }
};