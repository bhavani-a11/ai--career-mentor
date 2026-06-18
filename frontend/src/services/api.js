import axios from "axios";

function normalizeApiBaseURL() {
  // Priority:
  // 1) VITE_API_BASE_URL (Render sets this)
  // 2) VITE_API_URL (older config)
  // 3) fallback: local dev uses relative "/api"
  let base =
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_API_URL ||
    "/api";

  // If env gave us just a host (no scheme), add https://
  if (base !== "/api" && !base.startsWith("http://") && !base.startsWith("https://")) {
    base = `https://${base}`;
  }

  return base;
}

const api = axios.create({
  baseURL: normalizeApiBaseURL(),
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor to inject token automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
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