import { useContext } from 'react';
import axios from '../api/axios';
import useAuth from './useAuth';
import { AuthContext } from '../Context/AuthContext';
import { getTokenFromCookies } from '../utlis/CookiesManagement';

const useRefreshToken = () => {
    const { setUser } = useContext(AuthContext);

    const token = getTokenFromCookies()
    console.log(token);
    const refresh = async () => {
        const response = await axios.post(
            '/auth/jwt/refresh',{
                token:token
            },
            {
              headers: {
                'Content-Type': 'application/json',
                Authorization:`bearer ${token}`
              },
            }
          );
          console.log("new token is ");
          console.log(response.data);
        
        return response.data.token;
    }
    return refresh;
};

export default useRefreshToken;