import React, { useContext } from 'react'
import { useLocation, Navigate , Outlet } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import { checkUserLoginned } from '../utlis/CookiesManagement';
import { AuthContext } from '../Context/AuthContext';

export default function RequireAuth() {

    const location = useLocation();
    const {isAuthenticated} = useContext(AuthContext)
    const token= checkUserLoginned();

    console.log("user require ? :" , isAuthenticated);

  return (
    token?
        <Outlet/>
        :<Navigate to="/login" state={{from:location}} replace />
  )
}
