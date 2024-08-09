import { useState } from 'react';

export const useToken = () => {
  const [token, setToken] = useState(() => {
    if (localStorage.getItem('accessToken')) {
      const tokenData = JSON.parse(localStorage.getItem('accessToken'));
      return tokenData.token;
    }
    return null;
  });

  const updateToken = (newToken) => {
    setToken(newToken);
    if (newToken) {
      localStorage.setItem('accessToken', JSON.stringify({ token: newToken }));
    } else {
      localStorage.removeItem('accessToken');
    }
  };

  return [token, updateToken];
};
