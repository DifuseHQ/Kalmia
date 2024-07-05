import React, { createContext, useState, useEffect, useContext } from "react";
import axios from "../api/axios";
import { useNavigate } from "react-router-dom";
import { toastError, toastSuccess } from "../utlis/toast";
import { jwtDecode } from "jwt-decode";
import Cookies from 'js-cookie';

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
    console.log(jwtDecode(data.token));
  if (status === 200) {
    setUser(jwtDecode(data.token));
    Cookies.set('accessToken',JSON.stringify(data),
    {
      expires: 1, 
      secure: true, 
    }
  )
    toastSuccess("Login Succesfully");
    navigate('/dashboard', { replace: true });
  } 

} catch (err) {
  console.log(err);
    if (!err?.response) {
      toastError('No Server Response');
  } else if (err.response?.status === 400) {
    console.log("400");
    console.log(err.response.statusText);
       toastError(err.response.data.error);
  } else if (err.response?.status === 401) {
       toastError(err.response.data.message) //if password wrong
  } else {
       toastError(err.response.data.message);  //no user found if username false
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
      value={{ login , user , setUser  }}
    >
      {children}
    </AuthContext.Provider>
  );
};
