import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, setToken, clearToken, getToken, setCartId } from '../api/client.js';
import { useCart } from './CartContext.jsx';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { refresh: refreshCart } = useCart();

  const applyAuthResult = useCallback(
    async (data) => {
      if (data.token) setToken(data.token);
      if (data.cartId) setCartId(data.cartId);
      setUser(data.user);
      await refreshCart();
      return data.user;
    },
    [refreshCart]
  );

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setUser(null);
      setLoading(false);
      return null;
    }
    try {
      const data = await api.me();
      setUser(data.user);
      return data.user;
    } catch {
      clearToken();
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = async (email, password) => {
    const data = await api.login({ email, password });
    return applyAuthResult(data);
  };

  const register = async (name, email, password) => {
    const data = await api.register({ name, email, password });
    return applyAuthResult(data);
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      /* ignore */
    }
    clearToken();
    setUser(null);
    await refreshCart();
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      isAdmin: user?.role === 'admin',
      login,
      register,
      logout,
      refresh,
    }),
    [user, loading, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
