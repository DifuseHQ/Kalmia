import React, { createContext, useState, useContext, useEffect } from "react";
import axios, { privateAxios } from "../api/axios";
import { useNavigate } from "react-router-dom";
import { toastError, toastSuccess } from "../utlis/toast";
import { jwtDecode } from "jwt-decode";
import Cookies from "js-cookie";
import { removeCookies } from "../utlis/CookiesManagement";
import instance from "./AxiosInstance";

export const AuthContext = createContext();



export const AuthProvider = ({ children }) => {
  
  const [user, setUser] = useState(() => {
    if (Cookies.get("accessToken")) {
      let tokenData = JSON.parse(Cookies.get("accessToken"));
      let accessToken = jwtDecode(tokenData.token);
      return accessToken;
    }
    return null;
  });

  const [userDetails , setUserDetails] = useState({})

    const fetchUserDetails = async(user) => {
          try{
      const {data, status} = await instance.get('/auth/users')
      if(status === 200){
        const filterUser = data.find((obj) => obj.ID.toString() === user.user_id);
        setUserDetails(filterUser)
      }
    }catch(err){
      console.error(err);
       toastError(err.response.data.message)
    }
  }

  const navigate = useNavigate();

  const [refresh, setRefresh] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const refreshData = () => {
    setRefresh(!refresh);
  };

  const login = async (username, password) => {
    try {
      const { data, status } = await axios.post("/auth/jwt/create", {
        username,
        password,
      });
      if (status === 200) {
        const decodedUser = jwtDecode(data.token);
        setUser(decodedUser);
        Cookies.set("accessToken", JSON.stringify(data), {
          expires: 1,
          secure: true,
        });
        toastSuccess("Login Succesfully");
        navigate("/dashboard", { replace: true });
      }
    } catch (err) {
      console.error(err)
      toastError(err.response.data.message) 
    }
  };

  
  useEffect(() => {
    if (user) {
      fetchUserDetails(user);
    }
  }, [user]);
  

  const logout = async () => {
    let accessToken = JSON.parse(Cookies.get("accessToken"));
    try {
      const { data, status } = await instance.post("/auth/jwt/revoke", {
        token: accessToken.token,
      });
      if (status === 200) {
        removeCookies();
        toastSuccess("Logout Succesfully");
        setUser(null);
        navigate("/");
      }
    } catch (err) {
      // if (!err?.response) {
      //   toastError("No Server Response");
      // } else if (err.response?.status === 400) {
      //   toastError(err.response.data.error);
      // } else if (err.response?.status === 401) {
      //   toastError(err.response.data.message);
      // } else {
      //   toastError(err.response.data.message);
      // }
      console.error(err);
      toastError(err.response.data.message)
    }
  };

  const [fetchPageGroups, setFetchPageGroup] = useState([]);
  const [fetchPage, setFetchPage] = useState([]);
  const [documentationData, setDocumentationData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!user) return;

        const responsePageGroups = await instance.get("/docs/page-groups");
        setFetchPageGroup(responsePageGroups.data);

        const responsePages = await instance.get("/docs/pages");
        setFetchPage(responsePages.data);
      } catch (err) {
        console.error(err);
        toastError(err.response.data.message)
      }
    };

    fetchData();
  }, [user, refresh]);

  useEffect(() => {
    const combineData = () => {
      let filteredGroups = [];
      let filteredPages = [];

      if (fetchPageGroups.length > 0 && fetchPage.length > 0) {
        filteredGroups = fetchPageGroups.filter((obj) => !obj.parentId);
        filteredPages = fetchPage.filter((obj) => !obj.pageGroupId);
      } else if (fetchPageGroups.length > 0) {
        filteredGroups = fetchPageGroups.filter((obj) => !obj.parentId);
      } else if (fetchPage.length > 0) {
        filteredPages = fetchPage.filter((obj) => !obj.pageGroupId);
      } else {
        return [];
      }

      const combinedPages = [...filteredGroups, ...filteredPages];

      combinedPages.sort((a, b) => {
        const orderA = a.order !== null ? a.order : Infinity;
        const orderB = b.order !== null ? b.order : Infinity;

        if (orderA !== orderB) {
          return orderA - orderB;
        } else {
          return combinedPages.indexOf(a) - combinedPages.indexOf(b);
        }
      });

      setDocumentationData(combinedPages);
    };

    combineData();
  }, [fetchPageGroups, fetchPage, refresh]);

  const validateToken = async() => {
    try{
      let accessToken = JSON.parse(Cookies.get("accessToken"));
      const {data, status } = await instance.post('/auth/jwt/validate',{
        token:accessToken.token
      })

      if(status === 200){
        console.log(data);
      }
    }catch(err){
      console.error(err);
      toastError(err.response.data.message)
    }
  }

  const refreshToken = async() =>{
    try{
    let accessToken = JSON.parse(Cookies.get("accessToken"));
   const token =accessToken.token;
    const { data, status } = await axios.post('/auth/jwt/refresh', {
      token: token
    },{
      headers:{
        "Content-Type":"application/json",
        Authorization:`Bearer ${accessToken.token}`
      }
    });

    if (status === 200) {
      console.log('Token refersh success');
      console.log('Token refreshed:', data);
      Cookies.set("accessToken", JSON.stringify(data), {
        expires: 1,
        secure: true,
      });
      // Update the accessToken in cookies or state
      // Example assuming data contains accessToken and refreshToken
     
    } 
  }catch(err){
    console.error(err);
    toastError(err.response.data.message)
  }
  }
 
  useEffect(() => {
    const interval = setInterval(() => {
      const validateToken = async () => {
        // try {
        //   let accessToken = Cookies.get("accessToken");

        //   if (!accessToken) {
        //     Cookies.remove('accessToken');
        //     console.log("from auth side");
        //     setUser(null);
        //     navigate('/');
        //     clearInterval(interval); // Stop the interval
        //     return;
        //   }

        //   accessToken = JSON.parse(accessToken);
        //   const { data, status } = await privateAxios.post('/auth/jwt/validate', {
        //     token: accessToken.token,
        //   });

        //   if (status === 200) {
        //     const expiryDateString = data.expiry.replace(/(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}).*/, '$1');
        //     const expiryDate = new Date(expiryDateString);
        //     const currentTime = new Date();

        //     const timeDifference = expiryDate.getTime() - currentTime.getTime();
        //     const oneHourInMilliseconds = 4 * 60 * 1000;

        //     const isExpiryWithinOneHour = timeDifference < oneHourInMilliseconds;
      
        //     if (isExpiryWithinOneHour) {
        //       refreshToken();
        //     }
        //   }
        // } catch (err) {
        //   console.log("Error is", err);
        // }
      };

      validateToken();
    }, 5 * 1000); // 5 minutes in milliseconds

    // Cleanup interval on component unmount
    return () => clearInterval(interval);
  }, [navigate]);



  return (
    <AuthContext.Provider
      value={{
        login,
        user,
        setUser,
        logout,
        fetchPageGroups,
        fetchPage,
        documentationData,
        refresh,
        refreshData,
        deleteModal,
        setDeleteModal,
        userDetails ,
        setUserDetails,
        validateToken,
        refreshToken
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};