import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabase';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Fetch extended profile from public.profiles
  const fetchProfile = useCallback(async (userId) => {
    if (!userId || !isSupabaseConfigured()) {
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error.message);
        return null;
      }

      if (data) {
        // Enforce account active status
        if (data.status === 'INACTIVE') {
          await supabase.auth.signOut();
          setSession(null);
          setUser(null);
          setProfile(null);
          setRole(null);
          setAuthError('Your account has been deactivated. Please contact support.');
          return null;
        }

        setProfile(data);
        setRole(data.role);
        return data;
      }
    } catch (err) {
      console.error('Unexpected error in fetchProfile:', err);
    }
    return null;
  }, []);

  // Initialize and listen to Supabase Auth state changes
  useEffect(() => {
    let mounted = true;

    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    const initAuth = async () => {
      try {
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (mounted && initialSession?.user) {
          setSession(initialSession);
          setUser(initialSession.user);
          await fetchProfile(initialSession.user.id);
        }
      } catch (err) {
        console.error('Auth initialization error:', err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initAuth();

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!mounted) return;

        setSession(currentSession);
        setUser(currentSession?.user || null);

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (currentSession?.user) {
            await fetchProfile(currentSession.user.id);
          }
        } else if (event === 'SIGNED_OUT') {
          setProfile(null);
          setRole(null);
        }

        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      if (authListener?.subscription?.unsubscribe) {
        authListener.subscription.unsubscribe();
      }
    };
  }, [fetchProfile]);

  // Login handler
  const login = async (email, password) => {
    setAuthError(null);

    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured. Please check your .env configuration.');
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      throw error;
    }

    if (data?.user) {
      const userProfile = await fetchProfile(data.user.id);
      if (!userProfile && authError) {
        throw new Error(authError);
      }
      return { user: data.user, profile: userProfile };
    }

    return data;
  };

  // Register handler (Always assigns CUSTOMER role)
  const register = async ({ email, password, fullName }) => {
    setAuthError(null);

    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured. Please check your .env configuration.');
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName
        }
      }
    });

    if (error) {
      throw error;
    }

    return data;
  };

  // Forgot password handler
  const forgotPassword = async (email) => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured.');
    }

    const redirectUrl = `${window.location.origin}/reset-password`;

    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl
    });

    if (error) throw error;
    return data;
  };

  // Reset password handler
  const resetPassword = async (newPassword) => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured.');
    }

    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) throw error;
    return data;
  };

  // Logout handler
  const logout = async () => {
    try {
      if (isSupabaseConfigured()) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setSession(null);
      setUser(null);
      setProfile(null);
      setRole(null);
    }
  };

  const refreshProfile = async () => {
    if (user?.id) {
      return await fetchProfile(user.id);
    }
    return null;
  };

  const value = {
    session,
    user,
    profile,
    role,
    loading,
    authError,
    setAuthError,
    isConfigured: isSupabaseConfigured(),
    login,
    register,
    forgotPassword,
    resetPassword,
    logout,
    refreshProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;

