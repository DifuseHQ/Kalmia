import React from 'react'
import { useLocation, Navigate , Outlet } from 'react-router-dom'
import { checkUserLoginned } from '../utlis/CookiesManagement';

export default function RequireAuth() {

    const location = useLocation();
    const token= checkUserLoginned();

  return (
    token?
        <Outlet/>
        :<Navigate to="/login" state={{from:location}} replace />
  )
}
