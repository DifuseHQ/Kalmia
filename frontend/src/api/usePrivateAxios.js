// usePrivateAxios.js
import { useContext } from 'react';
import axios from 'axios';
import { useAuth } from '../Context/AuthContext';

const usePrivateAxios = () => {
  const { accessToken, refreshToken, login } = useAuth(); // Access token and refresh token from context

  const privateAxios = axios.create({
    baseURL: 'http://[::1]:2727'
  });

  privateAxios.interceptors.request.use(async (config) => {
    if (accessToken) {
      config.headers['Authorization'] = `Bearer ${accessToken}`;
    }
    return config;
  });

  privateAxios.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (error.message === 'Network Error') {
        console.error('Network error: unable to reach the server');
      }

      const originalRequest = error.config;

      if (error.response && error.response.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        // Handle token refresh logic here
        try {
          // Example token refresh logic (uncomment and adjust as needed)
          // const response = await axios.post(`${baseURL}/refresh-token`, { token: refreshToken });

          // const { accessToken: newAccessToken } = response.data;
          // login({ accessToken: newAccessToken, refreshToken });

          // originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;

          // console.log('Token refreshed:', response);

          // return privateAxios(originalRequest);
        } catch (err) {
          console.error('Token refresh failed', err);
          // Handle failure: Redirect to login or log out
        }
      }

      return Promise.reject(error);
    }
  );

  return privateAxios;
};

export default usePrivateAxios;
