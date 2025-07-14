import { useContext } from 'react';
import BurgerMenu from '../components/BurgerMenu/BurgerMenu';
import LanguageSwitcher from '../components/LanguageSwitcher/LanguageSwitcher';
import './Settings.css';
import { useLanguage } from '../context/LanguageContext';

export default function Settings() {
  const { t } = useLanguage();

  return (
    <div className="settings-page">
      <BurgerMenu />
      <div className="content">
        <h1>{t.settings}</h1>
        <div className="settings-section">
          <h2>{t.language}</h2>
          <LanguageSwitcher />
        </div>
      </div>
    </div>
  );
}