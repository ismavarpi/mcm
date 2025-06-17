import React from 'react';
import axios from 'axios';

const AuthContext = React.createContext({ user: null, requiresAuth: false, login: async () => {}, logout: async () => {} });

export function AuthProvider({ children }) {
  const [user, setUser] = React.useState(null);
  const [requiresAuth, setRequiresAuth] = React.useState(false);

  const checkStatus = async () => {
    try {
      const res = await axios.get('/api/auth/status');
      setUser(res.data.user);
      setRequiresAuth(true);
    } catch {
      setRequiresAuth(false);
      setUser({});
    }
  };

  React.useEffect(() => { checkStatus(); }, []);

  const login = async (username, password) => {
    const res = await axios.post('/api/auth/login', { username, password });
    setUser(res.data);
  };

  const logout = async () => {
    await axios.post('/api/auth/logout');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, requiresAuth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => React.useContext(AuthContext);
