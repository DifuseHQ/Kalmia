import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { getUsers } from '../api/Requests';
import { handleError } from '../utils/Common';

export const useUserDetails = (user, refresh) => {
  const [userDetails, setUserDetails] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserDetails = async (user) => {
      const result = await getUsers();
      if (handleError(result, navigate)) return;

      if (result.status === 'success') {
        const data = result.data;
        const filterUser = data.find(
          (obj) => obj?.id.toString() === user?.userId
        );
        setUserDetails(filterUser);
      }
    };

    if (user) {
      fetchUserDetails(user);
    }
  }, [user, navigate, refresh]);

  return [userDetails, setUserDetails];
};
