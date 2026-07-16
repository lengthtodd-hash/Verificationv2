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
        const sessionId = localStorage.getItem('sessionId');
        if (sessionId) {
          const sessionRef = doc(firestoreDb, 'sessions', sessionId);
          const sessionSnap = await getDoc(sessionRef);
          if (sessionSnap.exists()) {
            const data = sessionSnap.data();
            setToken(data.token);
            setUser(data.user);
          } else {
            localStorage.removeItem('sessionId');
          }
        }
      } catch (error) {
        console.error("Failed to load session from Firestore:", error);
      } finally {
        setLoading(false);
      }
    }
    loadSession();
  }, []);

  const login = async (newToken: string, newUser: User) => {
    try {
      // For Admin, use a deterministic sessionId so their admin state can easily sync.
      // For employees, we use a unique sessionId to differentiate sessions, but store details in Firestore.
      const sessionId = newUser.role === 'admin' 
        ? 'session_admin' 
        : `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      
      localStorage.setItem('sessionId', sessionId);
      
      const sessionRef = doc(firestoreDb, 'sessions', sessionId);
      await setDoc(sessionRef, {
        token: newToken,
        user: newUser,
        createdAt: new Date().toISOString()
      });

      setToken(newToken);
      setUser(newUser);
    } catch (error) {
      console.error("Failed to save session in Firestore:", error);
      // Fallback local-only state to prevent blockages
      setToken(newToken);
      setUser(newUser);
    }
  };

  const logout = async () => {
    try {
      const sessionId = localStorage.getItem('sessionId');
      if (sessionId) {
        const sessionRef = doc(firestoreDb, 'sessions', sessionId);
        await deleteDoc(sessionRef);
        localStorage.removeItem('sessionId');
      }
    } catch (error) {
      console.error("Failed to delete session from Firestore:", error);
    } finally {
      setToken(null);
      setUser(null);
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
