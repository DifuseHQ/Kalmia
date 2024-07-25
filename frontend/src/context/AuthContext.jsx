import React, { createContext, useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Cookies from 'js-cookie';

import { refreshJWT, signOut, validateJWT } from '../api/Requests';
import { useToken } from '../hooks/useToken';
import { useUser } from '../hooks/useUser';
import { useUserDetails } from '../hooks/useUserDetails';
import { handleError, isTokenExpiringSoon } from '../utils/Common';
import { toastMessage } from '../utils/Toast';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useToken();
  const [user, setUser] = useUser();
  const [userDetails, setUserDetails] = useUserDetails(user);

  const [cloneDocument, setCloneDocument] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [currentItem, setCurrentItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);

  const navigate = useNavigate();

  const [refresh, setRefresh] = useState(false);

  const refreshData = () => {
    setRefresh(prev => !prev);
  };

  const login = async (username, password) => {
    try {
      const response = await axios.post('http://[::1]:2727/auth/jwt/create', {
        username,
        password
      });
      if (response?.status === 200) {
        setToken(response.data.token);
        setUser(response?.data?.token);
        Cookies.set('accessToken', JSON.stringify(response?.data), {
          expires: 1,
          secure: !(window.location.href.includes('http://'))
        });
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      console.error(err);
      if (!err.response || err?.response?.status === 500) {
        toastMessage(err?.message, 'error');
        navigate('/server-down');
        return;
      }
      toastMessage(err?.response?.data?.message, 'error');
    }
  };

  const logout = async () => {
    const result = await signOut(token);

    if (handleError(result, navigate)) return;

    if (result.status === 'success') {
      setToken(null);
      setUser(null);
      setUserDetails(null);
      toastMessage('Logged Out', 'success');
    }
  };

  const refreshToken = useCallback(async () => {
    const result = await refreshJWT(token);

    if (handleError(result, navigate)) return;

    if (result.status === 'success') {
      const data = result.data;
      Cookies.set('accessToken', JSON.stringify(data), {
        expires: 1,
        secure: true
      });
      window.location.reload();
    }
  }, [navigate, token]);

  useEffect(() => {
    const interval = setInterval(() => {
      const validateToken = async () => {
        if (!token) {
          Cookies.remove('accessToken');
          setUser(null);
          navigate('/');
          clearInterval(interval);
          return;
        }

        const result = await validateJWT(token);

        if (handleError(result, navigate)) return;

        if (result.status === 'success') {
          const data = result.data;
          const isExpiringSoon = await isTokenExpiringSoon(data);
          if (isExpiringSoon) {
            refreshToken();
          }
        }
      };

      validateToken();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [navigate, refreshToken, setUser, token]);

  return (
    <AuthContext.Provider
      value={{
        login,
        user,
        setUser,
        logout,
        refresh,
        refreshData,
        userDetails,
        setUserDetails,
        isSidebarOpen,
        setIsSidebarOpen,
        currentItem,
        setCurrentItem,
        deleteItem,
        setDeleteItem,
        cloneDocument,
        setCloneDocument
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
