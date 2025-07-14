import { auth, googleProvider } from '../services/firebase';
import { signInWithPopup } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import './Login.css';

export default function Login() {
  const navigate = useNavigate();

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
        <h1>CreateYourActivity</h1>
        <p>Войдите, чтобы продолжить</p>
        <button onClick={handleGoogleLogin} className="google-login-btn">
          Войти c помощью Google
        </button>
      </div>
    </div>
  );
}