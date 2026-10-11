import axios from "axios";

const adminApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://127.0.0.1:8000",
});

adminApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(
      "admin_access_token"
    );

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("admin_access_token");

      if (
        window.location.pathname !== "/admin-login"
      ) {
        window.location.href = "/admin-login";
      }
    }

    return Promise.reject(error);
  }
);

export default adminApi;