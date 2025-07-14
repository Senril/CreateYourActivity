import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Translations } from '../types/translations';
import ru from '../translations/ru';
import en from '../translations/en';
import { auth } from '../services/firebase';
import { User } from 'firebase/auth';

interface LanguageContextType {
  language: 'ru' | 'en';
  setLanguage: (lang: 'ru' | 'en') => void;
  t: Translations;
  user: User | null;
}

const translations: { ru: Translations; en: Translations } = {
  ru: {
    ...ru,
    leave: ru.leave || 'Покинуть',
    delete: ru.delete || 'Удалить',
    active: ru.active || 'Активно',
    upcoming: ru.upcoming || 'Скоро',
    finished: ru.finished || 'Завершено',
    maxPeople: ru.maxPeople || 'Макс. участников'
  },
  en: {
    ...en,
    leave: en.leave || 'Leave',
    delete: en.delete || 'Delete',
    active: en.active || 'Active',
    upcoming: en.upcoming || 'Upcoming',
    finished: en.finished || 'Finished',
    maxPeople: en.maxPeople || 'Max participants'
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<'ru' | 'en'>('ru');
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });
    return unsubscribe;
  }, []);

  return (
    <LanguageContext.Provider value={{ 
      language, 
      setLanguage, 
      t: translations[language],
      user
    }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};