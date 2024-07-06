import React, { createContext, useState, useContext } from "react";
import axios, { privateAxios } from "../api/axios";
import { useNavigate } from "react-router-dom";
import { toastError, toastSuccess } from "../utlis/toast";
import { jwtDecode } from "jwt-decode";
import Cookies from 'js-cookie';
import { removeCookies } from "../utlis/CookiesManagement";

export const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(()=>{
    if(Cookies.get('accessToken')){
      let tokenData = JSON.parse(Cookies.get('accessToken'))
      let accessToken = jwtDecode(tokenData.token);
      return accessToken;
    }
    return null;
  });
  const navigate = useNavigate();

 const login = async (username,password) => {
  try{
  const {data, status} = await axios.post(
    "/auth/jwt/create",
    {
      username,
      password,
    });
  if (status === 200) {
    setUser(jwtDecode(data.token));
    Cookies.set('accessToken',JSON.stringify(data),
    {
      expires: 1, 
      secure: true
    }
  )
    toastSuccess("Login Succesfully");
    navigate('/dashboard', { replace: true });
  } 

} catch (err) {
    if (!err?.response) {
      toastError('No Server Response');
  } else if (err.response?.status === 400) {
       toastError(err.response.data.error);
  } else if (err.response?.status === 401) {
       toastError(err.response.data.message) //if password wrong
  } else {
       toastError(err.response.data.message);  //no user found if username false
  }
  
 }
 }

 const logout = async() =>{
 
  let accessToken = JSON.parse(Cookies.get('accessToken'))
    try{
      const {data, status} = await privateAxios.post(
        "/auth/jwt/revoke",
        {
          token:accessToken.token
        });
      if (status === 200) {
        removeCookies();
        toastSuccess(data.message); 
        setUser(null);
        navigate('/');
      } 

    }catch(err){
      if (!err?.response) {
        toastError('No Server Response');
    } else if (err.response?.status === 400) {
         toastError(err.response.data.error);
    } else if (err.response?.status === 401) {
         toastError(err.response.data.message)
    } else {
         toastError(err.response.data.message);
    }
    
    }
 }


  // const fetchUserData = async (token) => {
  //   try {
  //     const response = await fetch('${""}/userData', {
  //       method: "GET",
  //       headers: {
  //         Authorization: "Bearer ${token}",
  //       },
  //     });

  //     if (response.ok) {
  //       const userData = await response.json();
  //       // setUser(userData);
  //     } else {
  //       throw new Error("Failed to fetch user data");
  //     }
  //   } catch (error) {
  //     console.error("Fetch user data error:", error);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // const login = async (username, password) => {
  //   try {
  //     const {data, status} = await axios.post(
  //       "/auth/jwt/create",
  //       {
  //         username,
  //         password,
  //       },
  //       {
  //         headers: {
  //           "Content-Type": "application/json",
  //         },
  //       }
  //     );
  //     if (status === 200) {
  //       const status = data.status;
  //       const token = data.token;
        
  //       CookiesDataSave(status, token);
  //       toastSuccess("Login Succesfully");
  //       navigate("/dashboard", { replace: true });
  //     } 
  //   } catch (error) {
  //     throw error;
  //   }
  // };

  // const logout = async () => {
  //   try {
  //     await fetch("${process.env.NEXT_PUBLIC_BACKEND_URL}/logout", {
  //       method: "POST",
  //       headers: {
  //         Authorization: "Bearer ${localStorage.getItem('token')}",
  //       },
  //     });

  //     localStorage.removeItem("token");
  //     // setUser(null);
  //   } catch (error) {
  //     console.error("Logout error:", error);
  //     throw error;
  //   }
  // };

  // const isAuthenticated = () => !!user;

  return (
    <AuthContext.Provider
      value={{ login , user , setUser , logout  }}
    >
      {children}
    </AuthContext.Provider>
  );
};
