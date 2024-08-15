import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { ApiResponse, getUsers } from "../api/Requests";
import { handleError } from "../utils/Common";

interface User {
  userId: string;
}

export interface UserDetails {
  id: number;
  admin?: boolean;
  username: string;
  email: string;
  password: string;
  createdAt: string;
  updatedAt: string;
  photo?: string;
}

export const useUserDetails = (
  user: User | null,
  refresh: boolean,
): [UserDetails | null, Dispatch<SetStateAction<UserDetails | null>>] => {
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    const fetchUserDetails = async (user: User) => {
      try {
        const result = await getUsers();

        if (handleError(result, navigate, t)) return;

        if (result.status === "success") {
          const data = (result as ApiResponse).data;
          const filterUser = data?.find(
            (obj: UserDetails) => obj?.id.toString() === user?.userId,
          );
          setUserDetails(filterUser || null);
        }
      } catch (error) {
        console.error("Error fetching user details:", error);
        setUserDetails(null);
      }
    };

    if (user) {
      fetchUserDetails(user);
    }
  }, [user, navigate, t, refresh]);

  return [userDetails, setUserDetails];
};
