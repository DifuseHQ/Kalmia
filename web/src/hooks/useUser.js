import { useState } from 'react';
import { jwtDecode } from 'jwt-decode';

export const useUser = () => {
  const [user, setUser] = useState(() => {
    if (localStorage.getItem('accessToken')) {
      const tokenData = JSON.parse(localStorage.getItem('accessToken'));
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
