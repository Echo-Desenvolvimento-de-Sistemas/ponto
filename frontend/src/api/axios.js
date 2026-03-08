import axios from 'axios';

// Função para detectar a URL base dinamicamente
const getBaseURL = () => {
  const { hostname } = window.location;

  // Se estiver acessando via localhost no PC
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:8000/api';
  }

  // Se estiver acessando via rede local (IP) ou túnel externo (Ngrok)
  return `http://${hostname}:8000/api`;
};

const api = axios.create({
  baseURL: getBaseURL(),
  params: window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
    ? { 'ngrok-skip-browser-warning': '1' }
    : {},
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
