import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../services/firebase';
import BurgerMenu from '../components/BurgerMenu/BurgerMenu';
import { useLanguage } from '../context/LanguageContext';
import './ActivityDetails.css';

export default function ActivityDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activity, setActivity] = useState<any>(null);
  const { t, user } = useLanguage();
  const [isParticipating, setIsParticipating] = useState(false);

  useEffect(() => {
    const fetchActivity = async () => {
      if (!id) return;
      const docRef = doc(db, 'activities', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setActivity(data);
        setIsParticipating(data.people.includes(user?.uid));
      }
    };
    fetchActivity();
  }, [id, user]);

  const handleJoin = async () => {
    if (!id || !user?.uid) return;
    await updateDoc(doc(db, 'activities', id), {
      people: arrayUnion(user.uid)
    });
    setIsParticipating(true);
    setActivity({
      ...activity,
      people: [...activity.people, user.uid]
    });
  };

  const handleLeave = async () => {
    if (!id || !user?.uid) return;
    await updateDoc(doc(db, 'activities', id), {
      people: arrayRemove(user.uid)
    });
    setIsParticipating(false);
    setActivity({
      ...activity,
      people: activity.people.filter((id: string) => id !== user.uid)
    });
  };

  if (!activity) return <div>Loading...</div>;

  return (
    <div className="activity-details-page">
      <BurgerMenu />
      <div className="content">
        <h1>{activity.title}</h1>
        <div className="details-card">
          <p><strong>{t.location}:</strong> {activity.location}</p>
          <p><strong>{t.date}:</strong> {new Date(activity.startDate).toLocaleString()} - {new Date(activity.endDate).toLocaleString()}</p>
          <p><strong>{t.description}:</strong> {activity.description}</p>
          <p><strong>Создатель:</strong> {activity.creatorEmail}</p>
          <p><strong>Участники:</strong> {activity.people?.length || 0}/{activity.maxPeople}</p>
          
          {isParticipating ? (
            <div className="participation-controls">
              <span className="participation-text">Вы участвуете</span>
              <button onClick={handleLeave} className="leave-btn">
                Покинуть
              </button>
            </div>
          ) : (
            <button onClick={handleJoin} className="join-btn">
              {t.join}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}