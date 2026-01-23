import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, userService } from '../services/api';
import { supabase } from '../services/supabase';

interface User {
  id: string;
  username: string;
  role: 'STUDENT' | 'ADMIN' | 'HOSPITAL';
  trustScore: number;
  isAvailable?: boolean;
  studentDetails?: any;
}

interface AuthContextType {
  user: any | null;
  token: string | null;
  login: (usernameOrEmail: string, password: string) => Promise<void>;
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
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setToken(session?.access_token ?? null);
      if (session?.user) {
        // Fetch profile logic could go here or we rely on what login returned.
        // For simplicity, let's just fetch profile if we have a user
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setToken(session?.access_token ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const profile = await userService.getProfile(); // This uses supabase.auth.getUser internally
      setUser({ ...profile, id: userId });
    } catch (error) {
      console.error("Error fetching profile", error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (usernameOrEmail: string, password: string) => {
    const response = await authService.login(usernameOrEmail, password);
    // authService.login now returns { user, token }. 
    // The onAuthStateChange listener will actually pick up the session change too.
    // But setting here ensures immediate feedback.
    setToken(response.token || null);
    setUser(response.user);
  };

  const register = async (data: any) => {
    const response = await authService.register(data);
    setToken(response.token || null);
    setUser(response.user);
  };

  const logout = () => {
    supabase.auth.signOut();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading }}>
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
