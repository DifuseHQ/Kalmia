import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'rspress/runtime';

interface RedirectProps {
  to: string;
  from?: string;
}

export const Redirect: React.FC<RedirectProps> = ({ to, from }) => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!from || location.pathname === from) {
      navigate(to, { replace: true });
    }
  }, [to, from, navigate, location]);

  return null;
};

export default Redirect;