import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'faculty' | 'student';
  profile_picture_url?: string;
}

interface AuthContextType {
  user: UserSession | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, userData: UserSession, rememberMe: boolean) => void;
  logout: () => void;
  updateUserSession: (data: Partial<UserSession>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Attempt to load credentials from storage
    const storedToken = localStorage.getItem('token') || sessionStorage.getItem('token');
    const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch (e) {
        // Clear corrupt storage
        localStorage.clear();
        sessionStorage.clear();
      }
    }
    setIsLoading(false);
  }, []);

  const login = (accessToken: string, userData: UserSession, rememberMe: boolean) => {
    setToken(accessToken);
    setUser(userData);
    
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem('token', accessToken);
    storage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.clear();
    sessionStorage.clear();
  };

  const updateUserSession = (data: Partial<UserSession>) => {
    if (!user) return;
    const updated = { ...user, ...data };
    setUser(updated);
    
    // Update active storage
    if (localStorage.getItem('user')) {
      localStorage.setItem('user', JSON.stringify(updated));
    }
    if (sessionStorage.getItem('user')) {
      sessionStorage.setItem('user', JSON.stringify(updated));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        login,
        logout,
        updateUserSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
