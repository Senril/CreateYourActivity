import { useState, useEffect } from 'react';
import BurgerMenu from '../components/BurgerMenu/BurgerMenu';
import LanguageSwitcher from '../components/LanguageSwitcher/LanguageSwitcher';
import './Settings.css';
import { useLanguage } from '../context/LanguageContext';
import { useAdmin } from '../context/AdminContext';

export default function Settings() {
  const { t } = useLanguage();
  const { user, userProfile, logout, updateUserProfile } = useAdmin();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (userProfile) {
      setFirstName(userProfile.firstName || '');
      setLastName(userProfile.lastName || '');
    }
  }, [userProfile]);

  const handleNameUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!firstName.trim() || !lastName.trim()) {
      setMessage(t.nameRequired);
      return;
    }

    setLoading(true);
    setMessage('');
    
    try {
      await updateUserProfile(firstName.trim(), lastName.trim());
      setMessage(t.nameUpdated);
    } catch (error) {
      setMessage(t.error);
    } finally {
      setLoading(false);
    }
  };

  const hasProfile = userProfile && userProfile.firstName && userProfile.lastName;
  const fullName = hasProfile 
    ? `${userProfile.firstName} ${userProfile.lastName}` 
    : t.fullName;

  return (
    <div className="settings-page">
      <BurgerMenu />
      <div className="content">
        <h1>{t.settings}</h1>
        
        <div className="settings-section">
          <h2>{t.account}</h2>
          
          <div className="account-info">
            <div className="info-item">
              <strong>{t.currentEmail}:</strong>
              <span>{user?.email}</span>
            </div>
            
            {hasProfile && (
              <div className="info-item">
                <strong>{t.fullName}:</strong>
                <span>{fullName}</span>
              </div>
            )}
          </div>
          
          <div className="name-form">
            <h3>{hasProfile ? t.changeName : t.completeProfile}</h3>
            <form onSubmit={handleNameUpdate}>
              <div className="form-row">
                <div className="form-group">
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder={t.enterFirstName}
                    required
                  />
                </div>
                <div className="form-group">
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder={t.enterLastName}
                    required
                  />
                </div>
              </div>
              
              {message && (
                <div className={`message ${message === t.nameUpdated ? 'success' : 'error'}`}>
                  {message}
                </div>
              )}
              
              <button 
                type="submit" 
                className="save-name-btn"
                disabled={loading || !firstName.trim() || !lastName.trim()}
              >
                {loading ? t.loading : t.saveName}
              </button>
            </form>
          </div>
          
          <button onClick={logout} className="logout-button">
            {t.logout}
          </button>
        </div>
        
        <div className="settings-section">
          <h2>{t.changeLanguage}</h2>
          <LanguageSwitcher />
        </div>
      </div>
    </div>
  );
}