import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { Session } from '@supabase/supabase-js';

type UserRole = 'administrator' | 'agent' | 'customer' | null;

interface UserContextType {
  userId: string | null;
  setUserId: (id: string | null) => void;
  userRole: UserRole;
  isAuthenticated: boolean;
  isLoading: boolean;
  session: Session | null;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);

  const fetchUserRole = async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', uid)
        .single();
      
      if (error) throw error;
      return data.role as UserRole;
    } catch (error) {
      console.error('Error fetching user role:', error);
      return null;
    }
  };

  const handleAuthStateChange = async (session: Session | null) => {
    const uid = session?.user?.id ?? null;
    
    // First update the session and userId immediately
    setSession(session);
    setUserId(uid);

    if (!uid) {
      setUserRole(null);
      return;
    }

    try {
      // Then fetch and set the role
      const role = await fetchUserRole(uid);
      setUserRole(role);
    } catch (error) {
      console.error('Error handling auth state change:', error);
      setUserRole(null);
    }
  };

  useEffect(() => {
    let mounted = true;

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      handleAuthStateChange(session).finally(() => {
        if (mounted) {
          setIsLoading(false);
        }
      });
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      handleAuthStateChange(session);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = {
    userId,
    setUserId,
    userRole,
    isAuthenticated: !!session,
    isLoading,
    session
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
} 