import React, { useContext } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { AuthContext } from "../Context/AuthContext";
import { checkUserLoginned } from "../utlis/CookiesManagement";
export default function LoginAuth() {

  const location = useLocation();

  const {isAuthenticated} = useContext(AuthContext)
  const token = checkUserLoginned()

  console.log("user login ? :", isAuthenticated);

  return token ? (
    <Navigate to="/dashboard" />
  ) : (
    <Outlet />
  );
}
