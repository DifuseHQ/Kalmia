import axios from "axios";
import Cookies from 'js-cookie';

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
    
  privateAxios.interceptors.response.use(function (response) {
    // console.log("response is working :" ,response);
   if(!response){
    console.log("sorry server off");
   }
    return response;
  }, async (error) => {
    if (error.message === 'Network Error') {
      console.error('Network error: unable to reach the server');
    }
  
    // const originalRequest = error.config;
  
    // if (error.response && error.response.status === 401 && !originalRequest._retry) {
    //   originalRequest._retry = true;
  
    //   try {
    //     const refreshToken = Cookies.get('refreshToken');
    //     const response = await axios.post(`${baseURL}/refresh-token`, { token: refreshToken });
  
    //     const { accessToken } = response.data;
    //     Cookies.set('accessToken', JSON.stringify(accessToken), { secure: true, sameSite: 'Strict' });
  
    //     originalRequest.headers["Authorization"] = `Bearer ${accessToken.token}`;
  
    //     // Log the response when refreshing the token
    //     console.log("Token refreshed: ", response);
  
    //     return privateAxios(originalRequest);
    //   } catch (err) {
    //     console.error('Token refresh failed', err);
    //     // Optional: Redirect to login page or log out the user
    //   }
    
  
    return Promise.reject(error);
  });