import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../services/api';

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
  updatedAt?: string;
}

interface AdminContextType {
  isAdmin: boolean;
  isSuperAdmin: boolean;
  user: { uid: string; email: string } | null;
  userProfile: UserProfile | null;
  adminUsers: string[];
  loading: boolean;
  checkAdminStatus: () => Promise<void>;
  addAdminUser: (email: string) => Promise<void>;
  removeAdminUser: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (firstName: string, lastName: string) => Promise<void>;
  loadUserProfile: () => Promise<void>;
}

export const SUPER_ADMIN_EMAIL = 'basamykinaa21@oiate.ru';

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider = ({ children }: { children: ReactNode }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [user, setUser] = useState<{ uid: string; email: string } | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [adminUsers, setAdminUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCurrentUser = async () => {
    try {
      const response = await api.get<any>('/auth/me');
      if (response.status === 200 && response.data) {
        const data = response.data;
        setUser({ uid: data.userId, email: data.email });
        setUserProfile({
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          email: data.email,
          createdAt: '', // можно добавить поле на бэкенд
        });
        const roles = data.roles || [];
        setIsAdmin(roles.includes('ROLE_ADMIN'));
        setIsSuperAdmin(roles.includes('ROLE_SUPER_ADMIN'));
      } else {
        setUser(null);
        setUserProfile(null);
        setIsAdmin(false);
        setIsSuperAdmin(false);
      }
    } catch (error) {
      console.error('Ошибка загрузки пользователя', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const loadAdminUsers = async () => {
    if (!isAdmin) return;
    try {
      const response = await api.get<{ id: number; email: string }[]>('/admins');
      if (response.data) {
        setAdminUsers(response.data.map(a => a.email));
      }
    } catch (error) {
      console.error('Ошибка загрузки администраторов', error);
    }
  };

  const checkAdminStatus = async () => {
    await loadCurrentUser();
  };

  const logout = async () => {
    await api.post('/auth/logout');
    setUser(null);
    setUserProfile(null);
    setIsAdmin(false);
    setIsSuperAdmin(false);
  };

  const addAdminUser = async (email: string) => {
    if (!isSuperAdmin) return;
    const response = await api.post('/admins', { email });
    if (response.status === 201) {
      await loadAdminUsers();
    }
  };

  const removeAdminUser = async (email: string) => {
    if (!isSuperAdmin) return;
    // Получаем список админов, чтобы найти id по email
    const adminsResponse = await api.get<{ id: number; email: string }[]>('/admins');
    const admin = adminsResponse.data?.find(a => a.email === email);
    if (admin) {
      await api.delete(`/admins/${admin.id}`);
      await loadAdminUsers();
    }
  };

  const updateUserProfile = async (firstName: string, lastName: string) => {
    const response = await api.put('/users/me', { firstName, lastName });
    if (response.status === 200) {
      setUserProfile(prev => prev ? { ...prev, firstName, lastName } : null);
    }
  };

  const loadUserProfile = async () => {
    await loadCurrentUser();
  };

  useEffect(() => {
    loadCurrentUser();
  }, []);

  useEffect(() => {
    if (user) {
      loadAdminUsers();
    }
  }, [user, isAdmin]);

  return (
    <AdminContext.Provider
      value={{
        isAdmin,
        isSuperAdmin,
        user,
        userProfile,
        adminUsers,
        loading,
        checkAdminStatus,
        addAdminUser,
        removeAdminUser,
        logout,
        updateUserProfile,
        loadUserProfile,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};