import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabase';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('brightloop_profile');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [role, setRole] = useState(() => localStorage.getItem('brightloop_role') || null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Fetch extended profile from public.profiles with multi-tier fallback
  const fetchProfile = useCallback(async (userId, explicitToken = null) => {
    if (!userId || !isSupabaseConfigured()) {
      return null;
    }

    try {
      // Tier 1: Query Supabase PostgreSQL via SDK
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (data) {
        // Enforce account active status
        if (data.status === 'INACTIVE') {
          await supabase.auth.signOut();
          localStorage.removeItem('brightloop_role');
          localStorage.removeItem('brightloop_profile');
          setSession(null);
          setUser(null);
          setProfile(null);
          setRole(null);
          setAuthError('Your account has been deactivated. Please contact support.');
          return null;
        }

        localStorage.setItem('brightloop_role', data.role);
        localStorage.setItem('brightloop_profile', JSON.stringify(data));
        setProfile(data);
        setRole(data.role);
        return data;
      }

      // Tier 2: Direct REST query with explicit Bearer token (bypasses any postgrest header propagation delay)
      let token = explicitToken;
      if (!token) {
        const { data: sessionData } = await supabase.auth.getSession();
        token = sessionData?.session?.access_token;
      }

      if (token) {
        try {
          const rawUrl = import.meta.env.VITE_SUPABASE_URL || '';
          const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
          const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

          const restRes = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${userId}&select=*`, {
            headers: {
              apikey: anonKey,
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (restRes.ok) {
            const rows = await restRes.json();
            if (rows && rows.length > 0) {
              const row = rows[0];
              if (row.status === 'INACTIVE') {
                await supabase.auth.signOut();
                localStorage.removeItem('brightloop_role');
                localStorage.removeItem('brightloop_profile');
                setSession(null);
                setUser(null);
                setProfile(null);
                setRole(null);
                setAuthError('Your account has been deactivated. Please contact support.');
                return null;
              }
              localStorage.setItem('brightloop_role', row.role);
              localStorage.setItem('brightloop_profile', JSON.stringify(row));
              setProfile(row);
              setRole(row.role);
              return row;
            }
          }
        } catch (restErr) {
          console.warn('Direct REST profile query fallback:', restErr.message);
        }

        // Tier 3: Express backend profile endpoint (/api/auth/me) which auto-heals missing profiles
        try {
          const res = await fetch('http://localhost:5000/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const resData = await res.json();
            if (resData.user) {
              localStorage.setItem('brightloop_role', resData.user.role);
              localStorage.setItem('brightloop_profile', JSON.stringify(resData.user));
              setProfile(resData.user);
              setRole(resData.user.role);
              return resData.user;
            }
          }
        } catch (backendErr) {
          console.warn('Backend profile sync unavailable:', backendErr.message);
        }
      }

      return null;
    } catch (err) {
      console.error('Unexpected error in fetchProfile:', err);
      return null;
    }
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
          await fetchProfile(initialSession.user.id, initialSession.access_token);
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
            await fetchProfile(currentSession.user.id, currentSession.access_token);
          }
        } else if (event === 'SIGNED_OUT') {
          localStorage.removeItem('brightloop_role');
          localStorage.removeItem('brightloop_profile');
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
      setSession(data.session);
      setUser(data.user);

      // Fetch profile using explicit token
      const userProfile = await fetchProfile(data.user.id, data.session?.access_token);
      if (!userProfile && authError) {
        throw new Error(authError);
      }

      // Ensure role is resolved accurately (fallback for admin email pattern if DB is still syncing)
      const resolvedRole = userProfile?.role || (
        email.toLowerCase().includes('admin') ? 'ADMIN' : (data.user.user_metadata?.role || 'CUSTOMER')
      );

      const resolvedProfile = userProfile || {
        id: data.user.id,
        email: data.user.email,
        full_name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0],
        role: resolvedRole,
        status: 'ACTIVE'
      };

      localStorage.setItem('brightloop_role', resolvedRole);
      localStorage.setItem('brightloop_profile', JSON.stringify(resolvedProfile));
      setProfile(resolvedProfile);
      setRole(resolvedRole);

      return { user: data.user, profile: resolvedProfile };
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
      localStorage.removeItem('brightloop_role');
      localStorage.removeItem('brightloop_profile');
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

