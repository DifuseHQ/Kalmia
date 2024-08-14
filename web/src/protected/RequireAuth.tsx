import { useContext } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { AuthContext, AuthContextType } from '../context/AuthContext';

export default function RequireAuth () {
  const location = useLocation();
  const { user } = useContext(AuthContext) as AuthContextType;
  return user ? (
    <Outlet />
  ) : (
    <Navigate to="/login" state={{ from: location }} replace />
  );
}
