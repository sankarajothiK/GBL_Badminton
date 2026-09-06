import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { AdminRole, AdminUser } from '../types/database';
import { initialAdminUsers } from '../data/seedData';

interface AuthContextType {
  currentUser: AdminUser | null;
  role: AdminRole;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  hasRole: (allowedRoles: AdminRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check Supabase session
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && session.user) {
          // Check role from admin_users table or metadata
          const email = session.user.email || '';
          const matched = initialAdminUsers.find((u: AdminUser) => u.email.toLowerCase() === email.toLowerCase());
          setCurrentUser(matched || {
            id: session.user.id,
            email,
            full_name: session.user.user_metadata?.full_name || email.split('@')[0],
            role: (session.user.user_metadata?.role as AdminRole) || 'SUPER ADMIN',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        } else {
          // Check local auth persistence
          const saved = localStorage.getItem('gbl_admin_session');
          if (saved) {
            try {
              setCurrentUser(JSON.parse(saved));
            } catch {
              localStorage.removeItem('gbl_admin_session');
            }
          }
        }
      } catch (err) {
        console.warn('Auth session check error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();

    // Supabase auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session && session.user) {
        const email = session.user.email || '';
        const matched = initialAdminUsers.find((u: AdminUser) => u.email.toLowerCase() === email.toLowerCase());
        const userObj: AdminUser = matched || {
          id: session.user.id,
          email,
          full_name: session.user.user_metadata?.full_name || email.split('@')[0],
          role: (session.user.user_metadata?.role as AdminRole) || 'SUPER ADMIN',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        setCurrentUser(userObj);
        localStorage.setItem('gbl_admin_session', JSON.stringify(userObj));
      } else {
        const saved = localStorage.getItem('gbl_admin_session');
        if (!saved) {
          setCurrentUser(null);
        }
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password?: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      // 1. Try Supabase Auth first if password provided
      if (password && password.length >= 6) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (!error && data.user) {
          const userObj: AdminUser = {
            id: data.user.id,
            email: data.user.email || email,
            full_name: data.user.user_metadata?.full_name || email.split('@')[0],
            role: 'SUPER ADMIN',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          setCurrentUser(userObj);
          localStorage.setItem('gbl_admin_session', JSON.stringify(userObj));
          setIsLoading(false);
          return { success: true };
        }
      }

      // 2. Production Authorized Admin Credential Verification
      const normalizedEmail = email.trim().toLowerCase();
      const authorizedAdmins = [
        {
          email: 'admin@gulfoil.com',
          password: 'GBL2026@Admin!',
          full_name: 'GBL Tournament Director',
          role: 'SUPER ADMIN' as AdminRole
        },
        {
          email: 'auction@gulfoil.com',
          password: 'GBL2026@Auction!',
          full_name: 'GBL Chief Auctioneer',
          role: 'AUCTION ADMIN' as AdminRole
        }
      ];

      const foundAdmin = authorizedAdmins.find(a => a.email === normalizedEmail);
      if (foundAdmin) {
        if (!password || password !== foundAdmin.password) {
          setIsLoading(false);
          return { success: false, error: 'Invalid password. Please check your credentials.' };
        }
        const userObj: AdminUser = {
          id: 'admin_' + normalizedEmail.replace(/[^a-z0-9]/g, '_'),
          email: foundAdmin.email,
          full_name: foundAdmin.full_name,
          role: foundAdmin.role,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        setCurrentUser(userObj);
        localStorage.setItem('gbl_admin_session', JSON.stringify(userObj));
        setIsLoading(false);
        return { success: true };
      }

      setIsLoading(false);
      return { success: false, error: 'Account not recognized. Access restricted to authorized tournament admins.' };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err.message || 'Login failed' };
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    setCurrentUser(null);
    localStorage.removeItem('gbl_admin_session');
  };

  const hasRole = (allowedRoles: AdminRole[]): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'SUPER ADMIN') return true;
    return allowedRoles.includes(currentUser.role);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role: currentUser?.role || 'VIEWER',
        isAuthenticated: !!currentUser,
        isLoading,
        login,
        logout,
        hasRole
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
