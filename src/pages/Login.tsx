import { useLanguage } from '../context/LanguageContext';
import './Login.css';

export default function Login() {
  const { t } = useLanguage();

  const handleGoogleLogin = () => {
    window.location.href = 'http://localhost:8080/oauth2/authorization/google';
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