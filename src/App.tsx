import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import CreateActivity from './pages/CreateActivity';
import ActivityDetails from './pages/ActivityDetails';
import EditActivity from './pages/EditActivity';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Admin from './pages/Admin';
import RatingPage from './pages/RatingPage';
import CompleteProfile from './pages/CompleteProfile';
import { useAdmin } from './context/AdminContext';
import { useLanguage } from './context/LanguageContext';

function App() {
  const { user, userProfile, loading } = useAdmin();
  const { t } = useLanguage();

  if (loading) return <div className="loading-screen">{t.loading}</div>;

  return (
    <Router>
      <Routes>
        {!user ? (
          <Route path="*" element={<Login />} />
        ) : (
          <>
            {/* Если у пользователя нет имени, перенаправляем на страницу заполнения профиля */}
            {(!userProfile?.firstName || !userProfile?.lastName) && (
              <Route path="*" element={<Navigate to="/complete-profile" replace />} />
            )}
            
            <Route path="/" element={<Home />} />
            <Route path="/create" element={<CreateActivity />} />
            <Route path="/activity/:id" element={<ActivityDetails />} />
            <Route path="/edit/:id" element={<EditActivity />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/rating" element={<RatingPage />} />
            <Route path="/complete-profile" element={<CompleteProfile />} />
          </>
        )}
      </Routes>
    </Router>
  );
}

export default App;