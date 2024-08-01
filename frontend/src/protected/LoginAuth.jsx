import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';

import { AuthContext } from '../context/AuthContext';

export default function LoginAuth () {
  const { user } = useContext(AuthContext);
  return user ? <Navigate to='/dashboard' /> : <Outlet />;
}
