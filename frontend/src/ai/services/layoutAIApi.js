import axios from 'axios';

const API_BASE = 'http://localhost:5000/api/ai';

const getAuthHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
});

export const sendLayoutCommand = async (question) => {
  const response = await axios.post(
    `${API_BASE}/layout`,
    { question },
    getAuthHeader()
  );
  return response.data;
};