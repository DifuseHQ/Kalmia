import { useState } from "react";

type TokenType = string | null;
type UpdateTokenFunction = (newToken: TokenType) => void;

export const useToken = (): [TokenType, UpdateTokenFunction] => {
  const [token, setToken] = useState<TokenType>(() => {
    const storedToken = localStorage.getItem("accessToken");
    if (storedToken) {
      try {
        const tokenData = JSON.parse(storedToken);
        return tokenData.token;
      } catch (error) {
        console.error("Error parsing stored token:", error);
        return null;
      }
    }
    return null;
  });

  const updateToken: UpdateTokenFunction = (newToken) => {
    setToken(newToken);
    if (newToken) {
      localStorage.setItem("accessToken", JSON.stringify({ token: newToken }));
    } else {
      localStorage.removeItem("accessToken");
    }
  };

  return [token, updateToken];
};
