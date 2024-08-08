import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { getUsers } from '../api/Requests';
import { handleError } from '../utils/Common';

export const useUserDetails = (user, refresh) => {
  const [userDetails, setUserDetails] = useState(null);
  const navigate = useNavigate();

  const { t } = useTranslation();

  useEffect(() => {
    const fetchUserDetails = async (user) => {
      const result = await getUsers();
      if (handleError(result, navigate, t)) return;

      if (result.status === 'success') {
        const data = result.data;
        const filterUser = data?.find(
          (obj) => obj?.id.toString() === user?.userId
        );
        setUserDetails(filterUser);
      }
    };

    if (user) {
      fetchUserDetails(user);
    }
	}, [user, navigate, refresh]); //eslint-disable-line

  return [userDetails, setUserDetails];
};
