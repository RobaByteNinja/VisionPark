import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { apiClient } from "../api/apiClient";

const AuthContext = createContext({
  user: null,
  token: null,
  isAuthenticated: false,
  login: async () => {},
  refreshMe: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  const logout = useCallback(() => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await apiClient.post("/auth/login", { email, password });

    const nextToken = data?.token;
    const nextUser = data?.user;
    if (!nextToken || !nextUser) {
      throw new Error("Invalid login response from server.");
    }

    localStorage.setItem("accessToken", nextToken);
    localStorage.setItem("user", JSON.stringify(nextUser));
    setToken(nextToken);
    setUser(nextUser);
    return nextUser;
  }, []);

  const refreshMe = useCallback(async () => {
    const me = await apiClient.get("/auth/me");
    setUser(me);
    localStorage.setItem("user", JSON.stringify(me));
    return me;
  }, []);

  useEffect(() => {
    const bootstrapAuth = async () => {
      const storedToken = localStorage.getItem("accessToken");
      if (!storedToken) {
        return;
      }

      setToken(storedToken);
      try {
        await refreshMe();
      } catch {
        logout();
      }
    };

    bootstrapAuth();
  }, [logout, refreshMe]);

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token && user),
      login,
      refreshMe,
      logout,
    }),
    [user, token, login, refreshMe, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

