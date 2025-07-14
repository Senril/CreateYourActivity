import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import CreateActivity from './pages/CreateActivity';
import ActivityDetails from './pages/ActivityDetails';
import Settings from './pages/Settings';
import Login from './pages/Login';
import { auth } from './services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useEffect, useState } from 'react';

function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) return <div className="loading-screen">Загрузка...</div>;

  return (
    <Router>
      <Routes>
        {!user ? (
          <Route path="*" element={<Login />} />
        ) : (
          <>
            <Route path="/" element={<Home />} />
            <Route path="/create" element={<CreateActivity />} />
            <Route path="/activity/:id" element={<ActivityDetails />} />
            <Route path="/settings" element={<Settings />} />
          </>
        )}
      </Routes>
    </Router>
  );
}

export default App;