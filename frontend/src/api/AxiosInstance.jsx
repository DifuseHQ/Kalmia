import axios from 'axios';
import Cookies from 'js-cookie';
import { toastMessage } from '../utils/Toast';

const instance = axios.create({
  baseURL: 'http://[::1]:2727'
});

instance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (!error?.response) {
      throw error;
    } else if (error?.response?.status === 500) {
      throw error;
    } else if (error?.response?.status === 400) {
      throw error;
    } else if (error?.response?.status === 401) {
      toastMessage(error?.response?.data?.error, 'error');
      Cookies.remove('accessToken');
      window.location.href = '/';
    } else if (error?.message === 'Network Error') {
      toastMessage(`${error?.message}, please Try agian later'`, 'error');
    } else if (error?.response?.data) {
      toastMessage(error?.message, 'error');
      throw error;
    }

    return Promise.reject(error);
  }
);

instance.interceptors.request.use(
  (config) => {
    const accessToken = Cookies.get('accessToken');

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
