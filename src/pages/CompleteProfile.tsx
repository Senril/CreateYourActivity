import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAdmin } from '../context/AdminContext';
import './CompleteProfile.css';

export default function CompleteProfile() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user, updateUserProfile } = useAdmin();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!firstName.trim() || !lastName.trim()) {
      setError(t.nameRequired);
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      await updateUserProfile(firstName.trim(), lastName.trim());
      navigate('/');
    } catch (err) {
      setError(t.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="complete-profile-page">
      <div className="profile-container">
        <h1>{t.completeProfile}</h1>
        <p>{t.enterFirstName} {t.and} {t.enterLastName}</p>
        
        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-group">
            <label htmlFor="firstName">{t.firstName} *</label>
            <input
              id="firstName"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder={t.enterFirstName}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="lastName">{t.lastName} *</label>
            <input
              id="lastName"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder={t.enterLastName}
              required
            />
          </div>
          
          <div className="email-info">
            <p><strong>{t.currentEmail}:</strong> {user?.email}</p>
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          <button 
            type="submit" 
            className="submit-btn"
            disabled={loading || !firstName.trim() || !lastName.trim()}
          >
            {loading ? t.loading : t.saveName}
          </button>
        </form>
      </div>
    </div>
  );
}