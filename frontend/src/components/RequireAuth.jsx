import React, { useContext } from 'react'
import { useLocation, Navigate , Outlet } from 'react-router-dom'
import { AuthContext } from '../Context/AuthContext';

export default function RequireAuth() {

    const location = useLocation();
    const {user} = useContext(AuthContext)

  return (
    user?
        <Outlet/>
        :<Navigate to="/login" state={{from:location}} replace />
  )
}
