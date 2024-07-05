import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { checkUserLoginned } from "../utlis/CookiesManagement";
export default function LoginAuth() {


  const token = checkUserLoginned()

  return token ? (
    <Navigate to="/dashboard" />
  ) : (
    <Outlet />
  );
}
