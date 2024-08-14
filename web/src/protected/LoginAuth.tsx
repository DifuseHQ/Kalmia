import { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext, AuthContextType } from '../context/AuthContext';

export default function LoginAuth () {
  const { user } = useContext(AuthContext) as AuthContextType;
  return user ? <Navigate to="/dashboard" /> : <Outlet />;
}
