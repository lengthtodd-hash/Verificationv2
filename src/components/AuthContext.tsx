import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { firestoreDb } from '../lib/firebase';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSession() {
      try {
        // Load instantly from localStorage first to prevent blockages and handle offline states
        const localSession = localStorage.getItem('session_data');
        if (localSession) {
          try {
            const { token: sToken, user: sUser } = JSON.parse(localSession);
            setToken(sToken);
            setUser(sUser);
          } catch (e) {
            console.warn("Malformed local session data, clearing.");
            localStorage.removeItem('session_data');
          }
        }

        const sessionId = localStorage.getItem('sessionId');
        if (sessionId) {
          const sessionRef = doc(firestoreDb, 'sessions', sessionId);
          const sessionSnap = await getDoc(sessionRef);
          if (sessionSnap.exists()) {
            const data = sessionSnap.data();
            setToken(data.token);
            setUser(data.user);
            localStorage.setItem('session_data', JSON.stringify({ token: data.token, user: data.user }));
          } else {
            localStorage.removeItem('sessionId');
            localStorage.removeItem('session_data');
            setToken(null);
            setUser(null);
          }
        }
      } catch (error) {
        console.warn("Failed to load session from Firestore, relying on local session:", error);
      } finally {
        setLoading(false);
      }
    }
    loadSession();
  }, []);

  const login = async (newToken: string, newUser: User) => {
    // Optimistically update local state & local storage first so login works immediately
    const sessionId = newUser.role === 'admin' 
      ? 'session_admin' 
      : `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    localStorage.setItem('sessionId', sessionId);
    localStorage.setItem('session_data', JSON.stringify({ token: newToken, user: newUser }));
    setToken(newToken);
    setUser(newUser);

    try {
      const sessionRef = doc(firestoreDb, 'sessions', sessionId);
      await setDoc(sessionRef, {
        token: newToken,
        user: newUser,
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      console.warn("Failed to sync session to Firestore, but session is active locally:", error);
    }
  };

  const logout = async () => {
    const sessionId = localStorage.getItem('sessionId');
    
    // Clear local state and storage immediately
    localStorage.removeItem('sessionId');
    localStorage.removeItem('session_data');
    setToken(null);
    setUser(null);

    if (sessionId) {
      try {
        const sessionRef = doc(firestoreDb, 'sessions', sessionId);
        await deleteDoc(sessionRef);
      } catch (error) {
        console.warn("Failed to delete session from Firestore, but logged out locally:", error);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
