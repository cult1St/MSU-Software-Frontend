import axios from "axios";

const baseURL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL;

if (!baseURL) {
  console.warn(
    "NEXT_PUBLIC_BACKEND_BASE_URL is not set. Requests will use a relative URL."
  );
}

const http = axios.create({
  baseURL: baseURL ?? "",
  timeout: 100000,
  headers: {
    "Content-Type": "application/json",
  },
});

http.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = sessionStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      const hadToken = Boolean(sessionStorage.getItem("authToken"));
      sessionStorage.removeItem("authToken");
      sessionStorage.removeItem("authUser");
      const path = window.location.pathname || "";
      if (hadToken && path.startsWith("/in")) {
        const next = encodeURIComponent(path + window.location.search);
        window.location.href = `/sign-in?next=${next}`;
      }
    }
    return Promise.reject(error);
  }
);

export default http;
