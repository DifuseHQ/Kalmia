import { useContext, useEffect, useState } from "react";
import { Navigate, Outlet, useSearchParams } from "react-router-dom";

import { AuthContext, AuthContextType } from "../context/AuthContext";
import { b64ToString } from "../utils/Common";

export default function LoginAuth() {
  const [searchParams] = useSearchParams();
  const [docAuth, setDocAuth] = useState<string | null>(null);
  const cookie = document.cookie
    .split(";")
    .find((c) => c.trim().startsWith("viewToken="));

  useEffect(() => {
    const docAuthParam = searchParams.get("docAuth") || "";
    setDocAuth(docAuthParam);
  }, [searchParams]);

  const { user } = useContext(AuthContext) as AuthContextType;

  if (docAuth === null) {
    return <div>Loading...</div>;
  }

  if (docAuth && cookie) {
    window.location.href = b64ToString(docAuth);
  } else if (user) {
    return <Navigate to="/dashboard" />;
  } else {
    return <Outlet />;
  }
}
