import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { adminApi } from '../api/adminApi';
import type { Admin } from '../api/adminApi';

interface AuthContextType {
  admin: Admin | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    const storedAdmin = localStorage.getItem('adminUser');

    if (token && storedAdmin) {
      setAdmin(JSON.parse(storedAdmin));
      adminApi.getProfile()
        .then(setAdmin)
        .catch(() => {
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminUser');
          setAdmin(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await adminApi.login(email, password);
    localStorage.setItem('adminToken', result.token);
    localStorage.setItem('adminUser', JSON.stringify(result.admin));
    setAdmin(result.admin);
  }, []);

  const signup = useCallback(async (name: string, email: string, password: string) => {
    const result = await adminApi.signup(name, email, password);
    localStorage.setItem('adminToken', result.token);
    localStorage.setItem('adminUser', JSON.stringify(result.admin));
    setAdmin(result.admin);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    setAdmin(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        admin,
        isLoading,
        isAuthenticated: !!admin,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
