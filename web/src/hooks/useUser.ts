import { useState } from 'react';
import { jwtDecode, JwtPayload } from 'jwt-decode';

export interface UserPayload extends JwtPayload {
  admin: boolean;
  email: string;
  photo: string;
  status: string;
  userId: string;
  username: string;
  id?: number;
}

export type UserType = UserPayload | null;
export type UpdateUserFunction = (token: string | null) => void;

export const useUser = (): [UserType, UpdateUserFunction] => {
  const [user, setUser] = useState<UserType>(() => {
    const storedToken = localStorage.getItem('accessToken');
    if (storedToken) {
      try {
        const tokenData = JSON.parse(storedToken);
        return jwtDecode<UserPayload>(tokenData.token);
      } catch (error) {
        console.error('Error parsing or decoding stored token:', error);
        return null;
      }
    }
    return null;
  });

  const updateUser: UpdateUserFunction = (token) => {
    if (token) {
      try {
        const decodedUser = jwtDecode<UserPayload>(token);
        setUser(decodedUser);
      } catch (error) {
        console.error('Error decoding token:', error);
        setUser(null);
      }
    } else {
      setUser(null);
    }
  };

  return [user, updateUser];
};