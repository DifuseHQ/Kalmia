import axios from 'axios';
import Cookies from 'js-cookie';

export const baseURL = 'http://[::1]:2727';

const instance = axios.create({
  baseURL
});

instance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error) {
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

export const makeRequestWithCustomAuth = (url, method = 'get', token) => {
  return instance({
    method,
    url,
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
};

export default instance;
