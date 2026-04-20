import { auth, googleProvider } from '../services/firebase';
import { signInWithPopup } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import { useLanguage } from '../context/LanguageContext';

export default function Login() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      navigate('/');
    } catch (error) {
      console.error('Error signing in with Google:', error);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <h1>{t.appName}</h1>
        <p>{t.loginPrompt}</p>
        <button onClick={handleGoogleLogin} className="google-login-btn">
          {t.loginWithGoogle}
        </button>
      </div>
    </div>
  );
}