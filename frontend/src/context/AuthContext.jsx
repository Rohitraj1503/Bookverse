import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';
import { getInitials } from '../utils/formatters';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('bv_user');
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem('bv_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('bv_user');
    }
  }, [user]);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const userData = await authService.login(email, password);
      // Normalize user role / fields
      const normalizedUser = {
        ...userData,
        role: userData.role || (email.includes('admin') ? 'admin' : 'customer'),
        name: userData.fullName || userData.name || email.split('@')[0],
      };
      setUser(normalizedUser);
      return { success: true, user: normalizedUser };
    } catch (error) {
      console.error('Login error:', error);
      const message = error.response?.data?.message || 'Invalid email or password';
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  const register = async (name, email, password) => {
    setLoading(true);
    try {
      const userData = await authService.register(name, email, password);
      const normalizedUser = {
        ...userData,
        role: userData.role || 'customer',
        name: userData.fullName || userData.name || name,
      };
      setUser(normalizedUser);
      return { success: true, user: normalizedUser };
    } catch (error) {
      console.error('Registration error:', error);
      const message = error.response?.data?.message || error.response?.data?.error || 'Registration failed';
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
  };

  const updateUser = (updatedFields) => {
    setUser((prev) => (prev ? { ...prev, ...updatedFields } : null));
  };

  const isLoggedIn = !!user;
  const isAdmin = user?.role === 'admin';
  const userName = user?.fullName || user?.name || 'Guest';
  const userInitials = getInitials(userName);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isLoggedIn,
        isAdmin,
        userName,
        userInitials,
        login,
        register,
        logout,
        updateUser,
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

export default AuthContext;
