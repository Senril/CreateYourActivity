import { useLanguage } from '../context/LanguageContext';
import ru from '../translations/ru';
import en from '../translations/en';

const translations = { ru, en };

export default function useTranslation() {
  const { language } = useLanguage();
  return translations[language as keyof typeof translations];
}