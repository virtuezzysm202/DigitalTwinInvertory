import axios from 'axios';

const API_BASE = 'http://localhost:5000/api/ai';

const getAuthHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
});

export const sendChatMessage = async (question) => {
  const response = await axios.post(
    `${API_BASE}/chat`,
    { question },
    getAuthHeader()
  );
  return response.data;
};