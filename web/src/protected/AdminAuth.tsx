import { jwtDecode } from "jwt-decode";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";

import { ApiResponse, getUser } from "../api/Requests";
import Loading from "../components/Loading/Loading";
import { UserPayload } from "../hooks/useUser";
import { User } from "../types/auth";
import { handleError } from "../utils/Common";

export default function AdminAuth() {
  const { t } = useTranslation();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      let user: UserPayload | undefined;

      if (localStorage.getItem("accessToken")) {
        const accessTokenString = localStorage.getItem("accessToken");
        if (accessTokenString) {
          const tokenData = JSON.parse(accessTokenString);
          const accessToken = jwtDecode<UserPayload>(tokenData.token);
          user = accessToken;
        }
      }

      if (!user) {
        setIsLoading(false);
        return;
      }

      const response: ApiResponse = await getUser(parseInt(user.userId));
      if (handleError(response, navigate, t)) {
        setIsLoading(false);
        return;
      }

      const foundUser = response.data as User;

      if (response?.status === "success") {

        if (foundUser && foundUser?.admin === true) {
          setIsAdmin(true);
        }

        setIsLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  if (isLoading) {
    return (
      <div>
        <Loading />
      </div>
    );
  } else if (isAdmin) {
    return <Outlet />;
  } else {
    return <Navigate to="/dashboard" state={{ from: location }} replace />;
  }
}
