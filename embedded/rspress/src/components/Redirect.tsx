import React, { useEffect } from 'react';
import { useNavigate, useLocation, usePageData } from 'rspress/runtime';

interface RedirectProps {
  to: string;
  from?: string;
}

export const Redirect: React.FC<RedirectProps> = ({ to, from }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const pageData = usePageData();

  useEffect(() => {
    if (!from || location.pathname === from) {
      if (pageData.siteData.base === "/") {
        navigate(`/guides/index.html`, { replace: true });
      } else {
        navigate(to, { replace: true });
      }
    }
  }, [to, from, navigate, location]);

  return null;
};

export default Redirect;