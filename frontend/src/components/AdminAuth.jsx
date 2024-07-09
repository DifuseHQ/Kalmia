import React, { useContext, useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { AuthContext } from '../Context/AuthContext';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';
import { toastError } from '../utlis/toast';
import instance from '../Context/AxiosInstance';

export default function AdminAuth() {
  const location = useLocation();
  const { userDetails } = useContext(AuthContext);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Track loading state


  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    let user;
    if (Cookies.get('accessToken')) {
      let tokenData = JSON.parse(Cookies.get('accessToken'));
      let accessToken = jwtDecode(tokenData.token);
      user = accessToken;
    }
    try {
      const { data, status } = await instance.get('/auth/users');
      if (status === 200) {
        const foundUser = data.find((obj) => obj.ID.toString() === user.user_id);
        if (foundUser && foundUser.Admin === true) {
          setIsAdmin(true); 
        }
      }
    } catch (err) {
      console.error(err);
       toastError(err.response.data.message)
    } finally {
      setIsLoading(false); 
    }
  };

  // Render conditionally based on isAdmin and isLoading state
  if (isLoading) {
    return <div>Loading...</div>; // Placeholder while data is loading
  } else if (isAdmin) {
    console.log('Navigating to nested routes...');
    return <Outlet />;
  } else {
    console.log('Redirecting to dashboard...');
    return <Navigate to="/dashboard" state={{ from: location }} replace />;
  }
}
