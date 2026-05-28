import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "https://twiller-backend-uymi.onrender.com",
  headers: {
    "Content-Type": "application/json",
  },
});
export default axiosInstance;