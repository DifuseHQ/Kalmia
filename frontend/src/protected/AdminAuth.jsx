import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';

import { getUsers } from '../api/Requests';
import Loading from '../components/Loading/Loading';
import { handleError } from '../utils/Common';

export default function AdminAuth () {
  const { t } = useTranslation();
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

      const response = await getUsers();
      if (handleError(response, navigate, t)) {
        setIsLoading(false);
        return;
      }

      if (response?.status === 'success') {
        const foundUser = response?.data.find(
          (obj) => obj.id.toString() === user?.userId
        );
        if (foundUser && foundUser?.admin === true) {
          setIsAdmin(true);
        }
        setIsLoading(false);
      }
    };

    fetchData();
  }, [navigate]); //eslint-disable-line

  // Render conditionally based on isAdmin and isLoading state
  if (isLoading) {
    return <div><Loading /></div>; // Placeholder while data is loading
  } else if (isAdmin) {
    return <Outlet />;
  } else {
    return <Navigate to='/dashboard' state={{ from: location }} replace />;
  }
}
