import React, { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import { toastError } from "../utlis/toast";
import instance from "../api/AxiosInstance";

export default function AdminAuth() {
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Track loading state
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      let user;
      if (Cookies.get("accessToken")) {
        let tokenData = JSON.parse(Cookies.get("accessToken"));
        let accessToken = jwtDecode(tokenData.token);
        user = accessToken;
      }
      try {
        const response = await instance.get("/auth/users");
        if (response?.status === 200) {
          const foundUser = response?.data.find(
            (obj) => obj.ID.toString() === user?.user_id
          );
          if (foundUser && foundUser?.Admin === true) {
            setIsAdmin(true);
          }
        }
      } catch (err) {
        if (!err.response) {
          toastError(err?.message);
          navigate("/server-down");
        }
        toastError(err?.response?.data?.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  // Render conditionally based on isAdmin and isLoading state
  if (isLoading) {
    return <div>Loading...</div>; // Placeholder while data is loading
  } else if (isAdmin) {
    console.log("Navigating to nested routes...");
    return <Outlet />;
  } else {
    console.log("Redirecting to dashboard...");
    return <Navigate to="/dashboard" state={{ from: location }} replace />;
  }
}
