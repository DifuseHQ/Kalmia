import React, { createContext, useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toastError, toastSuccess } from "../utlis/toast";
import { jwtDecode } from "jwt-decode";
import Cookies from "js-cookie";
import { removeCookies } from "../utlis/CookiesManagement";
import instance from "../api/AxiosInstance";

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

  const [userDetails, setUserDetails] = useState({});
  const [isOpenModal, setIsOpenModal] = useState(false);

  const navigate = useNavigate();

  const [refresh, setRefresh] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const refreshData = () => {
    setRefresh(!refresh);
  };

  const login = async (username, password) => {
    try {
      const response = await axios.post("http://[::1]:2727/auth/jwt/create", {
        username,
        password,
      });
      if (response?.status === 200) {
        const decodedUser = jwtDecode(response?.data?.token);
        setUser(decodedUser);
        Cookies.set("accessToken", JSON.stringify(response?.data), {
          expires: 1,
          secure: true,
        });
        toastSuccess("Login Succesfully");
        navigate("/dashboard", { replace: true });
      }
    } catch (err) {
      if(!err.response){
        toastError(err?.message);
        navigate('/server-down')
        return
      }
      toastError(err?.response?.data?.message);
    }
  };

  useEffect(() => {
    const fetchUserDetails = async (user) => {
      try {
        const response = await instance.get("/auth/users");
        if (response?.status === 200) {
          const filterUser = response?.data.find(
            (obj) => obj?.ID.toString() === user?.user_id
          );
          setUserDetails(filterUser);
        }
      } catch (err) {
        if (!err.response) {
          navigate("/server-down");
          return;
        }
        console.error(err);
        toastError(err?.response?.data?.message);
      }
    };

    if (user) {
      fetchUserDetails(user);
    }
  }, [user, navigate]);

  const logout = async () => {
    let accessToken = JSON.parse(Cookies.get("accessToken"));
    try {
      const response = await instance.post("/auth/jwt/revoke", {
        token: accessToken.token,
      });
      if (response?.status === 200) {
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
      if(!err.response){
        toastError(err?.message);
        navigate('/server-down')
        return
      }
      toastError(err?.response?.data?.message);
    }
  };

  const refreshToken = useCallback(async () => {
    try {
      let accessToken = JSON.parse(Cookies.get("accessToken"));
      const token = accessToken?.token;
      const response = await instance.post("/auth/jwt/refresh", { token });

      if (response?.status === 200) {
        Cookies.set("accessToken", JSON.stringify(response?.data), {
          expires: 1,
          secure: true,
        });
      }
    } catch (err) {
      if (!err.response) {
        toastError(err?.message);
        navigate('/server-down');
        return;
      }
      toastError(err?.response?.data?.message);
    }
  }, [navigate]);

  useEffect(() => {
    const interval = setInterval(() => {
      const validateToken = async () => {
        try {
          let accessToken = Cookies.get("accessToken");
          if (!accessToken) {
            Cookies.remove('accessToken');
            setUser(null);
            navigate('/');
            clearInterval(interval); 
            return;
          }
          accessToken = JSON.parse(accessToken);
          const { data, status } = await instance.post('/auth/jwt/validate', {
            token: accessToken?.token,
          });
          if (status === 200) {
            const expiryDateString = data.expiry.replace(/(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}).*/, '$1');
            const expiryDate = new Date(expiryDateString);
            const currentTime = new Date();
            const timeDifference = expiryDate.getTime() - currentTime.getTime();
            const oneHourInMilliseconds = 60 * 60 * 1000;
            const isExpiryWithinOneHour = timeDifference < oneHourInMilliseconds;
            if (isExpiryWithinOneHour) {
              refreshToken();
            }
          }
        } catch (err) {
          if(!err.response){
            toastError(err?.message);
            navigate('/server-down')
            return
          }
          toastError(err?.response?.data?.message);
        }
      };

      validateToken();
    }, 5 * 60 * 1000); // 5 minutes in milliseconds

    // Cleanup interval on component unmount
    return () => clearInterval(interval);
  }, [navigate, refreshToken, setUser]);

  return (
    <AuthContext.Provider
      value={{
        login,
        user,
        setUser,
        logout,
        // fetchPageGroups,
        // fetchPage,
        // documentationData,
        // setDocumentationData,
        refresh,
        refreshData,
        deleteModal,
        setDeleteModal,
        userDetails,
        setUserDetails,
        refreshToken,
        isOpenModal, 
        setIsOpenModal
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
