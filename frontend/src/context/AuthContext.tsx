'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, AuthContextType } from '../types/auth';
import { api } from '../lib/api';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Demo user for when backend is unavailable
const DEMO_USERS = [
  {
    id: 'demo-user-1',
    name: 'Demo User',
    email: 'demo@swapwear.com',
    password: 'Demo@123',
    role: 'USER' as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'demo-admin-1',
    name: 'Admin User',
    email: 'admin@swapwear.com',
    password: 'Admin@SwapWear2026!',
    role: 'ADMIN' as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'demo-user-2',
    name: 'Jane Doe',
    email: 'user@swapwear.com',
    password: 'User@SwapWear2026!',
    role: 'USER' as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const LOCAL_STORAGE_KEY = 'swapwear_demo_user';

function getDemoUser(): User | null {
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) return JSON.parse(stored) as User;
  } catch {}
  return null;
}

function setDemoUser(user: User | null) {
  try {
    if (user) localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(user));
    else localStorage.removeItem(LOCAL_STORAGE_KEY);
  } catch {}
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [backendAvailable, setBackendAvailable] = useState<boolean | null>(null);

  const refreshUser = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await api.getCurrentUser();
      if (res.success && res.data?.user) {
        setUser(res.data.user);
        setBackendAvailable(true);
        setDemoUser(null);
        return;
      }
      setUser(null);
      setBackendAvailable(true);
    } catch {
      // Backend not available — try local demo session
      setBackendAvailable(false);
      const storedDemo = getDemoUser();
      if (storedDemo) {
        setUser(storedDemo);
      } else {
        setUser(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const res = await api.login({ email, password });
      if (res.success && res.data?.user) {
        setUser(res.data.user);
        setBackendAvailable(true);
        return { success: true };
      }
      return { success: false, error: res.message || 'Login failed' };
    } catch (err: any) {
      // Backend not available — try demo user credentials
      const demoMatch = DEMO_USERS.find(
        (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
      );
      if (demoMatch) {
        const { password: _p, ...safeUser } = demoMatch;
        const userObj: User = {
          ...safeUser,
          createdAt: new Date(safeUser.createdAt),
          updatedAt: new Date(safeUser.updatedAt),
        };
        setUser(userObj);
        setDemoUser(userObj);
        setBackendAvailable(false);
        return { success: true };
      }

      const errorMsg =
        err.status === 401
          ? 'Invalid email or password.'
          : err.message?.includes('fetch') || err.message?.includes('network') || err.name === 'TypeError'
          ? 'Cannot connect to server. Try: demo@swapwear.com / Demo@123'
          : err.message || 'Login failed';

      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      setIsLoading(true);
      const res = await api.register({ name, email, password });
      if (res.success && res.data?.user) {
        setUser(res.data.user);
        setBackendAvailable(true);
        return { success: true };
      }
      return { success: false, error: res.message || 'Registration failed' };
    } catch (err: any) {
      // Backend not available — create demo session locally
      const isNetworkError =
        err.message?.includes('fetch') || err.message?.includes('network') || err.name === 'TypeError';

      if (isNetworkError) {
        // Check email doesn't conflict with demo users
        const exists = DEMO_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase());
        if (exists) {
          return { success: false, error: 'This email is already registered. Try logging in.' };
        }
        const newUser: User = {
          id: `local-${Date.now()}`,
          name,
          email,
          role: 'USER',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        setUser(newUser);
        setDemoUser(newUser);
        setBackendAvailable(false);
        return { success: true };
      }

      return { success: false, error: err.message || 'Registration failed' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (backendAvailable) {
        await api.logout();
      }
    } catch {
      // ignore
    } finally {
      setUser(null);
      setDemoUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
