import { useEffect, useState } from 'react';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../services/firebase';
import ActivityItem from '../components/ActivityItem/ActivityItem';
import './Home.css';
import { useLanguage } from '../context/LanguageContext';
import BurgerMenu from '../components/BurgerMenu/BurgerMenu';

interface Activity {
  id: string;
  title: string;
  location: string;
  startDate: string;
  endDate: string;
  maxPeople: number;
  people: string[];
  creatorId: string;
  creatorEmail: string;
}

export default function Home() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const { t, user } = useLanguage();

  useEffect(() => {
    const fetchActivities = async () => {
      const querySnapshot = await getDocs(collection(db, 'activities'));
      const activitiesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        title: doc.data().title || '',
        location: doc.data().location || '',
        startDate: doc.data().startDate || '',
        endDate: doc.data().endDate || '',
        maxPeople: doc.data().maxPeople || 0,
        people: doc.data().people || [],
        creatorId: doc.data().creatorId || '',
        creatorEmail: doc.data().creatorEmail || ''
      } as Activity));
      setActivities(activitiesData);
    };
    fetchActivities();
  }, []);

  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, 'activities', id));
    setActivities(prev => prev.filter(a => a.id !== id));
  };

  return (
    <div className="home-page">
      <BurgerMenu />
      <div className="content">
        <h1>{t.viewActivities}</h1>
        <div className="activities-list">
          {activities.map(activity => (
            <ActivityItem 
              key={activity.id}
              activity={activity}
              currentUserId={user?.uid || ''}
              onDelete={handleDelete}
            />
          ))}
        </div>
      </div>
    </div>
  );
}