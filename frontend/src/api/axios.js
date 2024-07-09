import axios from "axios";
import Cookies from 'js-cookie';
import { toastError } from "../utlis/toast";
import { useNavigate } from "react-router-dom";


const baseURL = 'http://[::1]:2727'


export default axios.create({
    baseURL
});

export const privateAxios = axios.create({
    baseURL
  });


  privateAxios.interceptors.request.use(async (config) => {
    const accessToken = Cookies.get('accessToken');

    if (accessToken) {
      const parsedToken = JSON.parse(accessToken);
      config.headers["Authorization"] = `Bearer ${parsedToken.token}`;
    }
  
    return config;
  });
    
  privateAxios.interceptors.response.use(
    (response) => {
      // Handle the response here
      return response;
    },
    async (error) => {
      if (error.message === 'Network Error') {
        console.error('Network error: unable to reach the server');
        toastError('Network error: unable to reach the server');
      }
  
      const originalRequest = error.config;
  
      if (error.response) {
        const { status } = error.response;
  
        if (status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          // console.log("from axios side");
          // toastError('Unauthorized. Please log in again.');
          // // Clear token or any relevant data here if needed
          // Cookies.remove('accessToken'); // Adjust the cookie name accordingly
          // const navigate = useNavigate();
          // navigate('/login');
        } else if (status === 402) {
          toastError('Payment Required. Please check your subscription status.');
        }
      } else {
        console.error('An unexpected error occurred:', error);
      }
  
      return Promise.reject(error);
    }
  );