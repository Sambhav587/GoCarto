import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';

import {
  getMe,
  type AuthUser,
} from '../api/auth';

import {
  onAuthFailure,
} from '../api/client';

import {
  clearAccessToken,
  getAccessToken,
  saveAccessToken,
} from '../api/auth-storage';

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  signIn: (
    accessToken: string,
    user: AuthUser,
  ) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext =
  createContext<AuthContextValue | null>(null);

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] =
    useState<AuthUser | null>(null);

  const [token, setToken] =
    useState<string | null>(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    const unsubscribe = onAuthFailure(() => {
      setToken(null);
      setUser(null);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    let mounted = true;

    async function restoreSession() {
      try {
        const storedToken =
          await getAccessToken();

        if (!storedToken) {
          return;
        }

        const currentUser =
          await getMe(storedToken);

        if (mounted) {
          setToken(storedToken);
          setUser(currentUser);
        }
      } catch {
        await clearAccessToken();

        if (mounted) {
          setToken(null);
          setUser(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void restoreSession();

    return () => {
      mounted = false;
    };
  }, []);

  async function signIn(
    accessToken: string,
    currentUser: AuthUser,
  ) {
    await saveAccessToken(accessToken);
    setToken(accessToken);
    setUser(currentUser);
  }

  async function signOut() {
    await clearAccessToken();
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth must be used inside AuthProvider',
    );
  }

  return context;
}