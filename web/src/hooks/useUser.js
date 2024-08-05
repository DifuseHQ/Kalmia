import { useState } from 'react';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';

export const useUser = () => {
  const [user, setUser] = useState(() => {
    if (Cookies.get('accessToken')) {
      const tokenData = JSON.parse(Cookies.get('accessToken'));
      return jwtDecode(tokenData.token);
    }
    return null;
  });

  const updateUser = (token) => {
    if (token) {
      const decodedUser = jwtDecode(token);
      setUser(decodedUser);
    } else {
      setUser(null);
    }
  };

  return [user, updateUser];
};
