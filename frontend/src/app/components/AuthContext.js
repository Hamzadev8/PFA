'use client';
import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);
const API = 'http://localhost:8000';

const setCookie = (name, value) => {
  document.cookie = `${name}=${value}; path=/; SameSite=Lax`;
};
const deleteCookie = (name) => {
  document.cookie = `${name}=; path=/; max-age=0`;
};
const getCookie = (name) => {
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? match[2] : null;
};

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const restore = async () => {
      const stored = sessionStorage.getItem('pfa_user');
      const token  = sessionStorage.getItem('pfa_token');

      if (stored && token) {
        // ✅ Cas normal : sessionStorage présent
        setUser(JSON.parse(stored));
        setLoading(false);
        return;
      }

      // ✅ Cas rechargement / autre onglet : cookie présent mais sessionStorage vide
      // On redemande le profil au backend avec le token si disponible
      if (token) {
        try {
          const res = await fetch(`${API}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const userData = await res.json();
            sessionStorage.setItem('pfa_user', JSON.stringify(userData));
            setCookie('pfa_role', userData.role);
            setUser(userData);
          } else {
            // Token expiré → nettoyage
            sessionStorage.removeItem('pfa_token');
            deleteCookie('pfa_role');
          }
        } catch {
          // serveur injoignable, on laisse user = null
        }
      }

      setLoading(false);
    };

    restore();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name: '' }),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.detail ?? 'Erreur de connexion' };

      sessionStorage.setItem('pfa_token', data.access_token);
      sessionStorage.setItem('pfa_user', JSON.stringify(data.user));
      setCookie('pfa_role', data.user.role);
      setUser(data.user);
      return { success: true, user: data.user };
    } catch {
      return { success: false, error: 'Impossible de joindre le serveur' };
    }
  };

  const register = async (email, password, role, name) => {
    try {
      const res = await fetch(`${API}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role, name }),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.detail ?? 'Erreur inscription' };

      sessionStorage.setItem('pfa_token', data.access_token);
      sessionStorage.setItem('pfa_user', JSON.stringify(data.user));
      setCookie('pfa_role', data.user.role);
      setUser(data.user);
      return { success: true, user: data.user };
    } catch {
      return { success: false, error: 'Impossible de joindre le serveur' };
    }
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem('pfa_user');
    sessionStorage.removeItem('pfa_token');
    deleteCookie('pfa_role');
  };

  const authFetch = (url, options = {}) => {
    const token = sessionStorage.getItem('pfa_token');
    return fetch(`${API}${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, authFetch }}>
      {/* ✅ Ne rend rien tant que la session n'est pas restaurée */}
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);