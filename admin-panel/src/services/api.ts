import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001/api',
  withCredentials: true,
});

// Her isteğe otomatik Authorization ekle
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token'); // uygulamandaki login sonrası kaydettiğin anahtar
  if (token && !config.headers?.Authorization) {
    config.headers = {
      ...(config.headers || {}),
      Authorization: `Bearer ${token}`,
    };
  }
  return config;
});

export default api; 