import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, userService } from '../services/api';
import { supabase } from '../services/supabase';

interface User {
  id: string;
  username: string;
  displayName?: string;
  role: 'STUDENT' | 'ADMIN' | 'HOSPITAL';
  trustScore: number;
  isAvailable?: boolean;
  studentDetails?: any;
}

interface AuthContextType {
  user: any | null;
  token: string | null;
  login: (usernameOrEmail: string, password: string) => Promise<any>;
  demoLogin: (role: 'STUDENT' | 'ADMIN' | 'HOSPITAL') => void;
  register: (data: any) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Try to recover from LocalStorage first (Critical for Demo/Mock persistence)
    const storedToken = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('auth_user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      setLoading(false);
      // Optional: Re-verify with backend if it's a real token, but for Demo we trust it
      // Only if it looks like a real JWT maybe?
      // But let's check Supabase session too just in case it's a real session
    }

    // 2. Check Supabase active session (Overrides localstorage if valid session found)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setToken(session.access_token);
        fetchProfile(session.user.id);
      } else {
        // If Supabase has no session, but we have localStorage (Demo user), we keep it.
        // If neither, we stay logged out.
        if (!storedUser) setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setToken(session.access_token);
        fetchProfile(session.user.id);
        // Also update local storage for consistency
        localStorage.setItem('auth_token', session.access_token);
      } else {
        // Only clear if we are using Supabase flow.
        // If we are logged in as Demo user, supabase might fire 'SIGNED_OUT' initially?
        // No, onAuthStateChange fires on distinct events.
        // If we explicitly sign out via Supabase, we should clear everything.
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const profile = await userService.getProfile(); // This uses supabase.auth.getUser internally
      const fullUser = { ...profile, id: userId };
      setUser(fullUser);
      localStorage.setItem('auth_user', JSON.stringify(fullUser));
    } catch (error) {
      console.error("Error fetching profile", error);
      // If profile is missing (deleted by admin), logout the user immediately
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (usernameOrEmail: string, password: string) => {
    const response = await authService.login(usernameOrEmail, password);
    // authService.login now returns { user, token }. 
    // The onAuthStateChange listener will actually pick up the session change too.
    // But setting here ensures immediate feedback.
    // setToken(response.token || null);
    // setUser(response.user);
    // Persist immediately on explicit login
    const t = response.token || '';
    setToken(t);
    setUser(response.user);
    if (t) localStorage.setItem('auth_token', t);
    localStorage.setItem('auth_user', JSON.stringify(response.user));
    return response.user;
  };

  const demoLogin = (role: 'STUDENT' | 'ADMIN' | 'HOSPITAL') => {
    const demoUser = {
      id: 'demo-id',
      username: 'Demo User',
      role: role,
      trustScore: 100
    };
    setUser(demoUser);
    setToken('demo-token');

    // Persist Demo Login
    localStorage.setItem('auth_token', 'demo-token');
    localStorage.setItem('auth_user', JSON.stringify(demoUser));
  };

  const register = async (data: any) => {
    const response = await authService.register(data);
    setToken(response.token || null);
    setUser(response.user);
    if (response.token) localStorage.setItem('auth_token', response.token);
    localStorage.setItem('auth_user', JSON.stringify(response.user));
  };

  const logout = () => {
    supabase.auth.signOut();
    setToken(null);
    setUser(null);
    localStorage.clear(); // Wipe everything to completely "forget" login info
  };

  return (
    <AuthContext.Provider value={{ user, token, login, demoLogin, register, logout, loading }}>
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
