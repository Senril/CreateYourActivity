import { useState } from 'react';
import { Link } from 'react-router-dom';
import './BurgerMenu.css';
import { useLanguage } from '../../context/LanguageContext';

export default function BurgerMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useLanguage();

  return (
    <div className="burger-container">
      <button 
        className={`burger-btn ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        ☰
      </button>
      
      {isOpen && (
        <div className="menu-content">
          <Link to="/" onClick={() => setIsOpen(false)}>{t.viewActivities}</Link>
          <Link to="/create" onClick={() => setIsOpen(false)}>{t.createActivity}</Link>
          <Link to="/settings" onClick={() => setIsOpen(false)}>{t.settings}</Link>
        </div>
      )}
    </div>
  );
}