import { useState } from 'react';
import Cookies from 'js-cookie';

export const useToken = () => {
  const [token, setToken] = useState(() => {
    if (Cookies.get('accessToken')) {
      const tokenData = JSON.parse(Cookies.get('accessToken'));
      return tokenData.token;
    }
    return null;
  });

  const updateToken = (newToken) => {
    setToken(newToken);
    if (newToken) {
      Cookies.set('accessToken', JSON.stringify({ token: newToken }), {
        expires: 1,
        secure: !(window.location.href.includes('http://'))
      });
    } else {
      Cookies.remove('accessToken');
    }
  };

  return [token, updateToken];
};
