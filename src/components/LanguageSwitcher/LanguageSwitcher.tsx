import { useLanguage } from '../../context/LanguageContext';
import './LanguageSwitcher.css';

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="language-switcher">
      <button 
        onClick={() => setLanguage('ru')} 
        className={language === 'ru' ? 'active' : ''}
      >
        RU
      </button>
      <button 
        onClick={() => setLanguage('en')} 
        className={language === 'en' ? 'active' : ''}
      >
        EN
      </button>
    </div>
  );
}