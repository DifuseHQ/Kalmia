import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';

import instance from '../api/AxiosInstance';
import Loading from '../components/Loading/Loading';
import { toastMessage } from '../utils/Toast';

export default function AdminAuth () {
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      let user;
      if (Cookies.get('accessToken')) {
        const tokenData = JSON.parse(Cookies.get('accessToken'));
        const accessToken = jwtDecode(tokenData.token);
        user = accessToken;
      }
      try {
        const response = await instance.get('/auth/users');
        if (response?.status === 200) {
          const foundUser = response?.data.find(
            (obj) => obj.id.toString() === user?.userId
          );
          if (foundUser && foundUser?.admin === true) {
            setIsAdmin(true);
          }
        }
      } catch (err) {
        if (!err.response) {
          toastMessage(err?.message, 'error');
          navigate('/server-down');
        }
        toastMessage(err?.response?.data?.message, 'error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  // Render conditionally based on isAdmin and isLoading state
  if (isLoading) {
    return <div><Loading /></div>; // Placeholder while data is loading
  } else if (isAdmin) {
    return <Outlet />;
  } else {
    return <Navigate to='/dashboard' state={{ from: location }} replace />;
  }
}
