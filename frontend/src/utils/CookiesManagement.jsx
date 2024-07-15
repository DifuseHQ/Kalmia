import Cookies from 'js-cookie';

export const getTokenFromCookies = () => {
  const cookieData = Cookies.get('accessToken');
  if (cookieData) {
    const { token } = JSON.parse(cookieData);
    return token;
  }
  return null; // Return null if cookie data or token is not found
};

export const removeCookies = () => {
  Cookies.remove('accessToken');
};
