import axios, { AxiosInstance, AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";
import { toast } from "sonner";

// ─── Production Backend Configuration ────────────────────────────
const BASE_URL = import.meta.env.VITE_API_URL || "https://amdon-backened.vercel.app/api";

// ─── Create Axios Instance ────────────────────────────────────────
const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

// ─── Request Interceptor: Attach Admin Token ──────────────────────
apiClient.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    // Get admin token from localStorage
    const adminToken = localStorage.getItem("adminToken");
    const adminSecret = localStorage.getItem("amdon_admin_secret");
    
    // Attach Authorization header if token exists
    if (adminToken && config.headers) {
      config.headers.Authorization = `Bearer ${adminToken}`;
    }
    
    // Attach admin secret for legacy support
    if (adminSecret && config.headers) {
      config.headers["x-admin-secret"] = adminSecret;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ─── Response Interceptor: Handle Errors & Token Refresh ────────
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
    
    // Handle 401 Unauthorized - Token expired or invalid
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Clear invalid tokens
      localStorage.removeItem("adminToken");
      localStorage.removeItem("amdon_admin_secret");
      localStorage.removeItem("amdon_admin_email");
      
      // Show error message
      toast.error("Session expired. Please log in again.");
      
      // Redirect to login after a short delay
      setTimeout(() => {
        window.location.href = "/admin/login";
      }, 1500);
      
      return Promise.reject(error);
    }
    
    // Handle 403 Forbidden - Admin access denied
    if (error.response?.status === 403) {
      toast.error("Access denied. Admin privileges required.");
    }
    
    // Handle network errors
    if (!error.response) {
      toast.error("Network error. Please check your connection.");
    }
    
    return Promise.reject(error);
  }
);

// ─── Error Extractor Helper ─────────────────────────────────────
export function extractError(err: unknown): string {
  const e = err as AxiosError<{ error?: string; errors?: { msg: string }[]; message?: string }>;
  
  if (e.response?.data?.errors) {
    return e.response.data.errors.map((x) => x.msg).join(", ");
  }
  
  return e.response?.data?.error || e.response?.data?.message || e.message || "An unexpected error occurred";
}

// ─── Type Definitions ───────────────────────────────────────────
export interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

export interface ApiError {
  error: string;
  status: number;
}

export default apiClient;
