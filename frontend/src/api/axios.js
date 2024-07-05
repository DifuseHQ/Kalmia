import axios from "axios";
import Cookies from "js-cookie"
import { getTokenFromCookies } from "../utlis/CookiesManagement";

const baseURL = 'http://[::1]:2727'

let accessToken = getTokenFromCookies(); 

export default axios.create({
    baseURL
});

export const privateAxios = axios.create({
    baseURL,
    headers:{
      'Content-Type':'application/json'  
      ,Authorization: `Bearer ${accessToken}`
    }
  });


  privateAxios.interceptors.request.use(async (config) => {
    console.log("before if not token");
    console.log(accessToken);
    if (!accessToken) {
      accessToken = getTokenFromCookies();
      config.headers.Authorization = `Bearer ${accessToken}`;
      console.log("if condition" );
    }
    console.log("ok fine");
    return config;
  });
    