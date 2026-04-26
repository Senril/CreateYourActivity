import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../services/api';
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
  const location = useLocation(); 

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const response = await api.get<any>('/activities?page=0&size=100&sortBy=startDate&sortDir=desc');
        if (response.data?.content) {
          // Преобразуем данные к формату Activity
          const mapped: Activity[] = response.data.content.map((item: any) => ({
            id: item.id,
            title: item.title,
            location: item.location,
            startDate: item.startDate,
            endDate: item.endDate,
            description: item.description,
            maxPeople: item.maxPeople,
            people: [],
            creatorId: item.creatorId,
            creatorEmail: item.creatorEmail,
            category: item.category,
            likes: Array(item.likesCount).fill(''), // для совместимости
            dislikes: Array(item.dislikesCount).fill(''),
            isLiked: item.isLiked ?? item.liked ?? false,
            isDisliked: item.isDisliked ?? item.disliked ?? false,
            isParticipating: item.isParticipating ?? item.participating ?? false,
            currentParticipants: item.currentParticipants ?? 0,
            likesCount: item.likesCount ?? 0,
            dislikesCount: item.dislikesCount ?? 0
          }));
          setActivities(mapped);
        }
      } catch (error) {
        console.error('Ошибка загрузки активностей', error);
      }
    };
    fetchActivities();
  }, [location.key]);

  const handleDelete = async (id: string) => {
    if (window.confirm(t.areYouSure)) {
      const response = await api.delete(`/activities/${id}`);
      if (response.status === 204) {
        setActivities(prev => prev.filter(a => a.id !== id));
        alert(t.activityDeleted);
      } else {
        alert(t.error);
      }
    }
  };

  const getActivityStatus = (activity: Activity) => {
    try {
      const now = new Date();
      const start = new Date(activity.startDate);
      const end = new Date(activity.endDate);
      if (now < start) return 1;
      if (now > end) return 3;
      return 2;
    } catch {
      return 0;
    }
  };

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
              <button className={sortBy === 'date' ? 'active' : ''} onClick={() => setSortBy('date')}>
                {t.sortByDate}
              </button>
              <button className={sortBy === 'likes' ? 'active' : ''} onClick={() => setSortBy('likes')}>
                {t.sortByLikes}
              </button>
              <button className={sortBy === 'dislikes' ? 'active' : ''} onClick={() => setSortBy('dislikes')}>
                {t.sortByDislikes}
              </button>
              <button className={sortBy === 'status' ? 'active' : ''} onClick={() => setSortBy('status')}>
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
