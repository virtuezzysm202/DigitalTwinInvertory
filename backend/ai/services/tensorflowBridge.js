const axios = require('axios');

const AI_SERVER_URL =
  process.env.AI_SERVER_URL ||
  'http://127.0.0.1:5001';

async function predictIntent(message) {
  try {
    const response = await axios.post(
      `${AI_SERVER_URL}/predict`,
      {
        text: message
      }
    );

    return {
      success: true,
      intent: response.data.intent,
      confidence: response.data.confidence
    };
  } catch (error) {
    console.error(
      '[TensorFlow Bridge]',
      error.message
    );

    return {
      success: false,
      intent: null,
      confidence: 0,
      error: error.message
    };
  }
}

module.exports = {
  predictIntent
};