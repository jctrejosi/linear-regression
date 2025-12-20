import axios from "axios";

export const getBaseUrl = () => import.meta.env.VITE_API_BASE_URL;

export const axiosConfiguration = () => {
  axios.defaults.baseURL = getBaseUrl();
};
