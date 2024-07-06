import React, { createContext, useState, useContext, useEffect } from "react";
import axios, { privateAxios } from "../api/axios";
import { useNavigate } from "react-router-dom";
import { toastError, toastSuccess } from "../utlis/toast";
import { jwtDecode } from "jwt-decode";
import Cookies from "js-cookie";
import { removeCookies } from "../utlis/CookiesManagement";

export const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    if (Cookies.get("accessToken")) {
      let tokenData = JSON.parse(Cookies.get("accessToken"));
      let accessToken = jwtDecode(tokenData.token);
      return accessToken;
    }
    return null;
  });

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
        setUser(jwtDecode(data.token));
        Cookies.set("accessToken", JSON.stringify(data), {
          expires: 1,
          secure: true,
        });
        toastSuccess("Login Succesfully");
        navigate("/dashboard", { replace: true });
      }
    } catch (err) {
      if (!err?.response) {
        toastError("No Server Response");
      } else if (err.response?.status === 400) {
        toastError(err.response.data.error); // bad request
      } else if (err.response?.status === 401) {
        toastError(err.response.data.message); //if password wrong
      } else {
        toastError(err.response.data.message); //no user found if username false
      }
    }
  };

  const logout = async () => {
    let accessToken = JSON.parse(Cookies.get("accessToken"));
    try {
      const { data, status } = await privateAxios.post("/auth/jwt/revoke", {
        token: accessToken.token,
      });
      if (status === 200) {
        removeCookies();
        toastSuccess("Logout Succesfully");
        setUser(null);
        navigate("/");
      }
    } catch (err) {
      if (!err?.response) {
        toastError("No Server Response");
      } else if (err.response?.status === 400) {
        toastError(err.response.data.error);
      } else if (err.response?.status === 401) {
        toastError(err.response.data.message);
      } else {
        toastError(err.response.data.message);
      }
    }
  };

  const [fetchPageGroups, setFetchPageGroup] = useState([]);
  const [fetchPage, setFetchPage] = useState([]);
  const [documentationData, setDocumentationData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!user) return;

        const responsePageGroups = await privateAxios.get("/docs/page-groups");
        setFetchPageGroup(responsePageGroups.data);

        const responsePages = await privateAxios.get("/docs/pages");
        setFetchPage(responsePages.data);
      } catch (error) {
        console.error("Error fetching data:", error);
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
  }, [fetchPageGroups, fetchPage]);

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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
