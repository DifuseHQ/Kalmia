import React, { createContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import Cookies from 'js-cookie';
import { toastMessage } from '../utils/Toast';
import { getUsers, refreshJWT, signOut, validateJWT } from '../api/Requests';
import { handleError, isTokenExpiringSoon } from '../utils/Common';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => {
    if (Cookies.get('accessToken')) {
      const tokenData = JSON.parse(Cookies.get('accessToken'));
      const accessToken = tokenData.token;
      return accessToken;
    }
    return null;
  });

  const [user, setUser] = useState(() => {
    if (Cookies.get('accessToken')) {
      const tokenData = JSON.parse(Cookies.get('accessToken'));
      const accessToken = jwtDecode(tokenData.token);
      return accessToken;
    }
    return null;
  });

  const [userDetails, setUserDetails] = useState(null);
  const [createDocumentationModal, setCreateDocumentationModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [createPageGroupModal, setCreatePageGroupModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
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
        const decodedUser = jwtDecode(response?.data?.token);
        setUser(decodedUser);
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

  useEffect(() => {
    const fetchUserDetails = async (user) => {
      const result = await getUsers();
      if (handleError(result, navigate)) return;

      if (result.status === 'success') {
        const data = result.data;
        const filterUser = data.find(
          (obj) => obj?.id.toString() === user?.user_id
        );
        setUserDetails(filterUser);
      }
    };

    if (user) {
      fetchUserDetails(user);
    }
  }, [user, navigate, refresh]);

  const logout = async () => {
    const result = await signOut(token);

    if (handleError(result, navigate)) return;

    if (result.status === 'success') {
      Cookies.remove('accessToken');
      toastMessage('Logged Out', 'success');
      setUser(null);
      setUserDetails(null);
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
        createDocumentationModal,
        setCreateDocumentationModal,
        isSidebarOpen,
        setIsSidebarOpen,
        createPageGroupModal,
        setCreatePageGroupModal,
        editModal,
        setEditModal,
        deleteModal,
        setDeleteModal,
        currentItem,
        setCurrentItem,
        deleteItem,
        setDeleteItem
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
