import React, { createContext, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';

import { createJWT, refreshJWT, signOut, validateJWT } from '../api/Requests';
import { useToken } from '../hooks/useToken';
import { useUser } from '../hooks/useUser';
import { useUserDetails } from '../hooks/useUserDetails';
import { handleError, isTokenExpiringSoon } from '../utils/Common';
import { toastMessage } from '../utils/Toast';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const { t } = useTranslation();
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
    setRefresh((prev) => !prev);
  };

  const login = async (username, password) => {
    const response = await createJWT({ username, password });

    if (handleError(response, navigate, t)) return;

    if (response.status === 'success') {
      const data = response.data.token;
      setToken(data);
      setUser(data);
      Cookies.set('accessToken', JSON.stringify(response?.data), {
        expires: 1,
        secure: !window.location.href.includes('http://')
      });
      navigate('/dashboard', { replace: true });
    }
  };

  const loginOAuth = async (code) => {
    const response = await validateJWT(code);
    if (handleError(response, navigate, t)) return;
    if (response.status === 'success') {
      const data = response.data.token;
      setToken(data);
      setUser(data);
      Cookies.set('accessToken', JSON.stringify(response?.data), {
        expires: 1,
        secure: !window.location.href.includes('http://')
      });
      navigate('/dashboard', { replace: true });
    }
  };

  const logout = async () => {
    const result = await signOut(token);

    if (handleError(result, navigate, t)) return;

    if (result.status === 'success') {
      setToken(null);
      setUser(null);
      setUserDetails(null);
      toastMessage(t('logged_out'), 'success');
    }
  };

  const refreshToken = useCallback(async () => {
    const result = await refreshJWT(token);

    if (handleError(result, navigate, t)) return;

    if (result.status === 'success') {
      const data = result.data;
      Cookies.set('accessToken', JSON.stringify(data), {
        expires: 1,
        secure: true
      });
      window.location.reload();
    }
  }, [navigate, token, t]);

  useEffect(() => {
    const interval = setInterval(
      () => {
        const validateToken = async () => {
          if (!token) {
            Cookies.remove('accessToken');
            setUser(null);
            navigate('/login');
            clearInterval(interval);
            return;
          }

          const result = await validateJWT(token);

          if (handleError(result, navigate, t)) return;

          if (result.status === 'success') {
            const data = result.data;
            const isExpiringSoon = await isTokenExpiringSoon(data);
            if (isExpiringSoon) {
              refreshToken();
            }
          }
        };

        validateToken();
      },
      5 * 60 * 1000
    );

    return () => clearInterval(interval);
  }, [navigate, refreshToken, setUser, token]); //eslint-disable-line

  return (
    <AuthContext.Provider
      value={{
        login,
        loginOAuth,
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
