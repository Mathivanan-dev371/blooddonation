import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, userService, notificationService } from '../services/api';
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
  const [rnFcmToken, setRnFcmToken] = useState<string | null>(null);

  useEffect(() => {
    // 1. Try to recover from LocalStorage first (Critical for Demo/Mock persistence)
    const storedToken = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('auth_user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      setLoading(false);
    }

    // 2. Check Supabase active session (Overrides localstorage if valid session found)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setToken(session.access_token);
        fetchProfile(session.user.id);
      } else {
        if (!storedUser) setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setToken(session.access_token);
        fetchProfile(session.user.id);
        localStorage.setItem('auth_token', session.access_token);
      }
    });

    // 3. Listen for FCM Token from React Native Bridge
    const handleRNMessage = (event: any) => {
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data?.type === 'FCM_TOKEN' && data?.token) {
          console.log('Received FCM Token from RN:', data.token);
          setRnFcmToken(data.token);
          localStorage.setItem('rn_fcm_token', data.token);
        }
      } catch (e) {
        // Not JSON or other message
      }
    };

    const handleCustomEvent = (event: any) => {
      if (event.detail?.token) {
        console.log('Received FCM Token from custom event:', event.detail.token);
        setRnFcmToken(event.detail.token);
        localStorage.setItem('rn_fcm_token', event.detail.token);
      }
    };

    window.addEventListener('message', handleRNMessage);
    window.addEventListener('rn_fcm_token' as any, handleCustomEvent);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('message', handleRNMessage);
      window.removeEventListener('rn_fcm_token' as any, handleCustomEvent);
    };
  }, []);

  // Sync session with FCM token when both are available
  useEffect(() => {
    const syncFcmToken = async () => {
      const tokenToSave = rnFcmToken || localStorage.getItem('rn_fcm_token');
      if (user && tokenToSave) {
        try {
          console.log('Syncing FCM token for user:', user.id);
          await notificationService.saveToken(tokenToSave, 'android');
        } catch (error) {
          console.error('Error syncing FCM token:', error);
        }
      }
    };

    if (user && !loading) {
      syncFcmToken();
    }
  }, [user, rnFcmToken, loading]);

  const fetchProfile = async (userId: string) => {
    try {
      const profile = await userService.getProfile();
      const fullUser = { ...profile, id: userId };
      setUser(fullUser);
      localStorage.setItem('auth_user', JSON.stringify(fullUser));
    } catch (error) {
      console.error("Error fetching profile", error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (usernameOrEmail: string, password: string) => {
    const response = await authService.login(usernameOrEmail, password);
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
    localStorage.clear();
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
