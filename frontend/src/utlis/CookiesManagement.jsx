import Cookies from 'js-cookie';

// Export the function with a named export
export const CookiesDataSave = async(status, token) => {
 await Cookies.set(
    'CMS_user',
    JSON.stringify({
      status : status,
      token : token,
    }),
    {
      expires: 1, // Expires in 30 days
      secure: true, // Set the secure flag
    }
  );
};

export const getTokenFromCookies = () => {
    const cookieData = Cookies.get('CMS_user');
    if (cookieData) {
        const { token } = JSON.parse(cookieData);
        return token;
    }
    return null; // Return null if cookie data or token is not found
};


// Export the function with a named export
export const checkUserLoginned = () => {
  const userLoginCookie = Cookies.get('userDetails'); // Change 'userLogin' to 'userDetails'
  const isLogin = userLoginCookie ? true : false;
  console.log(isLogin);

  if (isLogin) {
    return false;
  }

  return true;
};