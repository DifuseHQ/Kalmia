import axios from "axios";
import Cookies from "js-cookie";
import { toastError } from "../utlis/toast";

const instance = axios.create({
  baseURL: "http://[::1]:2727",
});

// Response interceptor to handle different error scenarios
instance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (!error?.response) {
      throw error;
    } else if (error?.response?.status === 400) {
      throw error;
    } else if (error?.response?.status === 401) {
      toastError(error?.response?.data?.error);
      Cookies.remove("accessToken");
      window.location.href = "/";
    } else if (error?.message === "Network Error") {
      toastError(`${error?.message}, please Try agian later'`);
    } else if (error?.response?.data) {
      toastError(error?.message);
      throw error;
    }

    return Promise.reject(error); // Reject the promise to propagate the error further
  }
);

// Request interceptor to add Authorization header with access token
instance.interceptors.request.use(
  (config) => {
    const accessToken = Cookies.get("accessToken");

    if (accessToken) {
      const parsedToken = JSON.parse(accessToken);
      config.headers.Authorization = `Bearer ${parsedToken?.token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default instance;
