import axios, { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

export const baseURL: string = process.env.NODE_ENV === 'development' ? 'http://127.0.0.1:2727' : '';

const instance: AxiosInstance = axios.create({
  baseURL
});

instance.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    if (error) {
      throw error;
    }
    return Promise.reject(error);
  }
);

instance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
      const parsedToken = JSON.parse(accessToken);
      config.headers.Authorization = `Bearer ${parsedToken?.token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

export const makeRequestWithCustomAuth = (url: string, method: string = 'get', token: string) => {
  return instance({
    method,
    url,
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
};

export default instance;
