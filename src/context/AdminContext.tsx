import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { auth, db } from '../services/firebase';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  addDoc, 
  deleteDoc, 
  doc, 
  getDoc, 
  setDoc,
  updateDoc 
} from 'firebase/firestore';
import { User } from 'firebase/auth';

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
  user: User | null;
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
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [adminUsers, setAdminUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const loadUserProfile = async (currentUser: User | null) => {
    if (!currentUser) {
      setUserProfile(null);
      return;
    }

    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserProfile({
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          email: data.email || currentUser.email || '',
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt
        });
      } else {
        // Создаем новый профиль
        const newProfile: UserProfile = {
          firstName: '',
          lastName: '',
          email: currentUser.email || '',
          createdAt: new Date().toISOString()
        };
        
        await setDoc(userDocRef, newProfile);
        setUserProfile(newProfile);
      }
    } catch (error) {
      console.error('Ошибка загрузки профиля пользователя:', error);
      setUserProfile(null);
    }
  };

  const loadAdminUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'admins'));
      const emails = querySnapshot.docs.map(doc => doc.data().email);
      setAdminUsers(emails);
    } catch (error) {
      console.error('Ошибка загрузки администраторов:', error);
    }
  };

  const checkAdminStatus = async (currentUser: User | null) => {
    if (!currentUser) {
      setIsAdmin(false);
      setIsSuperAdmin(false);
      return;
    }

    const userIsSuperAdmin = currentUser.email === SUPER_ADMIN_EMAIL;
    setIsSuperAdmin(userIsSuperAdmin);

    if (userIsSuperAdmin) {
      setIsAdmin(true);
      return;
    }

    try {
      const adminsRef = collection(db, 'admins');
      const q = query(adminsRef, where('email', '==', currentUser.email));
      const querySnapshot = await getDocs(q);
      setIsAdmin(!querySnapshot.empty);
    } catch (error) {
      console.error('Ошибка проверки прав администратора:', error);
      setIsAdmin(false);
    }
  };

  const logout = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error('Ошибка выхода:', error);
    }
  };

  const addAdminUser = async (email: string) => {
    if (!user || !isSuperAdmin) return;
    
    try {
      await addDoc(collection(db, 'admins'), {
        email,
        createdAt: new Date().toISOString(),
        createdBy: user.email
      });
      await loadAdminUsers();
    } catch (error) {
      console.error('Ошибка добавления администратора:', error);
    }
  };

  const removeAdminUser = async (email: string) => {
    if (!isSuperAdmin) return;
    
    try {
      const q = query(collection(db, 'admins'), where('email', '==', email));
      const querySnapshot = await getDocs(q);
      
      querySnapshot.forEach(async (document) => {
        await deleteDoc(doc(db, 'admins', document.id));
      });
      
      await loadAdminUsers();
    } catch (error) {
      console.error('Ошибка удаления администратора:', error);
    }
  };

  const updateUserProfile = async (firstName: string, lastName: string) => {
    if (!user) return;
    
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        firstName,
        lastName,
        updatedAt: new Date().toISOString()
      });
      
      setUserProfile(prev => prev ? {
        ...prev,
        firstName,
        lastName,
        updatedAt: new Date().toISOString()
      } : null);
    } catch (error) {
      console.error('Ошибка обновления профиля:', error);
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      setUser(currentUser);
      await checkAdminStatus(currentUser);
      if (currentUser) {
        await loadUserProfile(currentUser);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });
    
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (user) {
      loadAdminUsers();
    }
  }, [user]);

  return (
    <AdminContext.Provider value={{
      isAdmin,
      isSuperAdmin,
      user,
      userProfile,
      adminUsers,
      loading,
      checkAdminStatus: () => checkAdminStatus(user),
      addAdminUser,
      removeAdminUser,
      logout,
      updateUserProfile,
      loadUserProfile: () => loadUserProfile(user)
    }}>
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