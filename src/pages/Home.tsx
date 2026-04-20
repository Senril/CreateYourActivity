import { useEffect, useState } from 'react';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../services/firebase';
import ActivityItem from '../components/ActivityItem/ActivityItem';
import './Home.css';
import { useLanguage } from '../context/LanguageContext';
import BurgerMenu from '../components/BurgerMenu/BurgerMenu';
import { useAdmin } from '../context/AdminContext';
import { Activity } from '../types/activity';

type SortOption = 'date' | 'likes' | 'dislikes' | 'status';

export default function Home() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const { t } = useLanguage();
  const { user, isAdmin, isSuperAdmin } = useAdmin();

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
        creatorEmail: doc.data().creatorEmail || '',
        description: doc.data().description || '',
        category: doc.data().category || 'Другое',
        likes: doc.data().likes || [],
        dislikes: doc.data().dislikes || []
      })) as Activity[];
      setActivities(activitiesData);
    };
    fetchActivities();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm(t.areYouSure)) {
      await deleteDoc(doc(db, 'activities', id));
      setActivities(prev => prev.filter(a => a.id !== id));
      alert(t.activityDeleted);
    }
  };

  // Функция для получения статуса активности
  const getActivityStatus = (activity: Activity) => {
    try {
      const now = new Date();
      const start = new Date(activity.startDate);
      const end = new Date(activity.endDate);
      
      if (now < start) return 1; // upcoming
      if (now > end) return 3; // finished
      return 2; // active
    } catch (error) {
      return 0; // unknown
    }
  };

  // Сортировка активностей
  const sortedActivities = [...activities].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
      case 'likes':
        return b.likes.length - a.likes.length;
      case 'dislikes':
        return b.dislikes.length - a.dislikes.length;
      case 'status':
        return getActivityStatus(a) - getActivityStatus(b);
      default:
        return 0;
    }
  });

  return (
    <div className="home-page">
      <BurgerMenu />
      <div className="content">
        <div className="header-section">
          <h1>{t.viewActivities}</h1>
          <div className="sort-controls">
            <span className="sort-label">{t.sortBy}:</span>
            <div className="sort-buttons">
              <button 
                className={sortBy === 'date' ? 'active' : ''}
                onClick={() => setSortBy('date')}
              >
                {t.sortByDate}
              </button>
              <button 
                className={sortBy === 'likes' ? 'active' : ''}
                onClick={() => setSortBy('likes')}
              >
                {t.sortByLikes}
              </button>
              <button 
                className={sortBy === 'dislikes' ? 'active' : ''}
                onClick={() => setSortBy('dislikes')}
              >
                {t.sortByDislikes}
              </button>
              <button 
                className={sortBy === 'status' ? 'active' : ''}
                onClick={() => setSortBy('status')}
              >
                {t.sortByStatus}
              </button>
            </div>
          </div>
        </div>
        {sortedActivities.length === 0 ? (
          <div className="no-activities">
            <p>{t.noActivitiesYet}</p>
            <p>{t.createFirstActivity}</p>
          </div>
        ) : (
          <div className="activities-list">
            {sortedActivities.map(activity => (
              <ActivityItem 
                key={activity.id}
                activity={activity}
                currentUserId={user?.uid || ''}
                isAdmin={isAdmin}
                isSuperAdmin={isSuperAdmin}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}