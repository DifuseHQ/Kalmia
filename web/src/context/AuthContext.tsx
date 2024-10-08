import React, {
  createContext,
  ReactNode,
  useCallback,
  useEffect,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { createJWT, refreshJWT, signOut, validateJWT } from "../api/Requests";
import { useToken } from "../hooks/useToken";
import { UpdateUserFunction, UserType, useUser } from "../hooks/useUser";
import { UserDetails, useUserDetails } from "../hooks/useUserDetails";
import { handleError, isTokenExpiringSoon, setCookie } from "../utils/Common";
import { toastMessage } from "../utils/Toast";

export interface AuthContextType {
  login: (
    username: string,
    password: string,
    setSession: boolean,
    redirectTo: string,
  ) => Promise<void>;
  loginOAuth: (code: string) => Promise<void>;
  user: UserType;
  setUser: UpdateUserFunction;
  logout: () => Promise<void>;
  refresh: boolean;
  refreshData: () => void;
  userDetails: UserDetails | null;
  setUserDetails: React.Dispatch<React.SetStateAction<UserDetails | null>>;
  isSidebarOpen: boolean;
  setIsSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  currentItem: unknown | null;
  setCurrentItem: React.Dispatch<React.SetStateAction<unknown | null>>;
  deleteItem: unknown | null;
  setDeleteItem: React.Dispatch<React.SetStateAction<unknown | null>>;
  cloneDocument: boolean;
  setCloneDocument: React.Dispatch<React.SetStateAction<boolean>>;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { t } = useTranslation();
  const [token, setToken] = useToken();
  const [user, setUser] = useUser();
  const [userDetails, setUserDetails] = useUserDetails(user, false);
  const [cloneDocument, setCloneDocument] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<unknown | null>(null);
  const [deleteItem, setDeleteItem] = useState<unknown | null>(null);
  const navigate = useNavigate();
  const [refresh, setRefresh] = useState(false);

  const refreshData = () => {
    setRefresh((prev) => !prev);
  };

  const login = async (
    username: string,
    password: string,
    setSession: boolean = false,
    redirectTo: string = "",
  ) => {
    const response = await createJWT({ username, password });
    if (handleError(response, navigate, t)) return;
    if (response.status === "success") {
      const data = response.data.token;
      setToken(data);
      setUser(data);
      if (setSession !== false) {
        setCookie("viewToken", data, 1);
        if (redirectTo) {
          window.location.href = redirectTo;
          return;
        }
      }
      localStorage.setItem("accessToken", JSON.stringify(response?.data));
      navigate("/dashboard", { replace: true });
    }
  };

  const loginOAuth = async (code: string) => {
    const response = await validateJWT(code);
    if (handleError(response, navigate, t)) return;
    if (response.status === "success") {
      const data = response.data.token;
      setToken(data);
      setUser(data);
      localStorage.setItem("accessToken", JSON.stringify(response?.data));
      navigate("/dashboard", { replace: true });
    }
  };

  const logout = async () => {
    const result = await signOut(token);
    if (handleError(result, navigate, t)) return;
    if (result.status === "success") {
      setToken(null);
      setUser(null);
      setUserDetails(null);
      toastMessage(t("logged_out"), "success");
    }
  };

  const refreshToken = useCallback(async () => {
    const result = await refreshJWT(token);
    if (handleError(result, navigate, t)) return;
    if (result.status === "success") {
      const data = result.data;
      localStorage.setItem("accessToken", JSON.stringify(data));
      window.location.reload();
    }
  }, [navigate, token, t]);

  useEffect(() => {
    const interval = setInterval(
      async () => {
        const validateToken = async () => {
          if (!token) {
            localStorage.removeItem("accessToken");
            setUser(null);
            navigate("/login");
            clearInterval(interval);
            return;
          }
          const result = await validateJWT(token);
          if (handleError(result, navigate, t)) return;
          if (result.status === "success") {
            const data = result.data;
            const isExpiringSoon = await isTokenExpiringSoon(data);
            if (isExpiringSoon) {
              refreshToken();
            }
          }
        };
        await validateToken();
      },
      5 * 60 * 1000,
    );
    return () => clearInterval(interval);
  }, [navigate, refreshToken, setUser, token, t]);

  const contextValue: AuthContextType = {
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
    setCloneDocument,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};
