import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
const SESSION_KEY = 'picker-performance-dashboard-session';

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — يضيف JWT تلقائياً في كل request
apiClient.interceptors.request.use((config) => {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) {
      const session = JSON.parse(raw);
      if (session?.token) {
        config.headers.Authorization = `Bearer ${session.token}`;
      }
    }
  } catch {
    // ignore
  }
  return config;
});

// Response interceptor — يتعامل مع 401 تلقائياً
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(SESSION_KEY);
      window.dispatchEvent(new Event('session-expired'));
    }
    return Promise.reject(error);
  },
);

export default apiClient;