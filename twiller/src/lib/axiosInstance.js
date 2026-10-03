import axios from "axios";

const getBaseURL = () => {
  if (process.env.NEXT_PUBLIC_BACKEND_URL) {
    return process.env.NEXT_PUBLIC_BACKEND_URL;
  }
  if (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")) {
    return "http://localhost:5001";
  }
  return "https://twiller-backend-uymi.onrender.com";
};

const axiosInstance = axios.create({
  baseURL: getBaseURL(),
  timeout: 8000,
  headers: {
    "Content-Type": "application/json",
  },
});

export default axiosInstance;