import { useState } from 'react';
import { Link } from 'react-router-dom';
import './BurgerMenu.css';
import { useLanguage } from '../../context/LanguageContext';
import { useAdmin } from '../../context/AdminContext';

export default function BurgerMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useLanguage();
  const { isAdmin } = useAdmin();

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
          <Link to="/" onClick={() => setIsOpen(false)}>{t.home}</Link>
          <Link to="/create" onClick={() => setIsOpen(false)}>{t.createActivity}</Link>
          <Link to="/rating" onClick={() => setIsOpen(false)}>{t.rating}</Link>
          <Link to="/settings" onClick={() => setIsOpen(false)}>{t.settings}</Link>
          {isAdmin && (
            <Link to="/admin" onClick={() => setIsOpen(false)} className="admin-link">
              {t.adminPanel}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}