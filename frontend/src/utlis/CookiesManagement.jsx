import Cookies from 'js-cookie';

// Export the function with a named export
export const CookiesDataSave = async(data) => {
 await Cookies.set(
    'accessToken',
    JSON.stringify(data),
    {
      expires: 1, 
      secure: true, 
    }
  );
};

export const getTokenFromCookies = () => {
    const cookieData = Cookies.get('accessToken');
    if (cookieData) {
        const { token } = JSON.parse(cookieData);
        return token;
    }
    return null; // Return null if cookie data or token is not found
};


// Export the function with a named export
export const checkUserLoginned = () => {
  const cookieData = Cookies.get('accessToken');
  if (cookieData) {
      const { status } = JSON.parse(cookieData);
      if(status === "success"){
        return true;
      }
  }
  return false; 
};

export const getUser = () => {
  const cookieData = Cookies.get('accessToken');
  if (cookieData) {
      const userData = JSON.parse(cookieData);
      return userData
  }
  return false; 
};

export const removeCookies = () => {
  Cookies.remove('accessToken');
};