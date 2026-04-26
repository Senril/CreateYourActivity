import { useState, useEffect } from 'react';
import { api } from '../services/api';
import BurgerMenu from '../components/BurgerMenu/BurgerMenu';
import './RatingPage.css';
import { useLanguage } from '../context/LanguageContext';

interface Activity {
  id: string;
  title: string;
  category: string;
  likesCount: number;
  dislikesCount: number;
  participantsCount: number;
}

interface CategoryStats {
  category: string;
  totalActivities: number;
  totalLikes: number;
  totalDislikes: number;
  totalParticipants: number;
  averageRating: number;
}

export default function RatingPage() {
  const { t } = useLanguage();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'rating' | 'activities' | 'participants'>('rating');

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const response = await api.get<any>('/activities?page=0&size=100&sortBy=startDate&sortDir=desc');
        if (response.data?.content) {
          const mapped: Activity[] = response.data.content.map((item: any) => ({
            id: item.id,
            title: item.title,
            category: item.category,
            likesCount: item.likesCount || 0,
            dislikesCount: item.dislikesCount || 0,
            participantsCount: item.currentParticipants || 0,
          }));
          setActivities(mapped);
        }
      } catch (error) {
        console.error('Ошибка загрузки активностей', error);
      } finally {
        setLoading(false);
      }
    };
    fetchActivities();
  }, []);

  useEffect(() => {
    if (activities.length === 0) return;

    const categoryMap = new Map<string, CategoryStats>();

    activities.forEach(activity => {
      const category = activity.category;
      const current = categoryMap.get(category) || {
        category,
        totalActivities: 0,
        totalLikes: 0,
        totalDislikes: 0,
        totalParticipants: 0,
        averageRating: 0
      };

      current.totalActivities += 1;
      current.totalLikes += activity.likesCount;
      current.totalDislikes += activity.dislikesCount;
      current.totalParticipants += activity.participantsCount;

      categoryMap.set(category, current);
    });

    const stats = Array.from(categoryMap.values()).map(stat => ({
      ...stat,
      averageRating: stat.totalLikes + stat.totalDislikes > 0
        ? Math.round((stat.totalLikes / (stat.totalLikes + stat.totalDislikes)) * 100)
        : 0
    }));

    const sortedStats = stats.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.averageRating - a.averageRating;
        case 'activities':
          return b.totalActivities - a.totalActivities;
        case 'participants':
          return b.totalParticipants - a.totalParticipants;
        default:
          return b.averageRating - a.averageRating;
      }
    });

    setCategoryStats(sortedStats);
  }, [activities, sortBy]);

  const mostLikedActivities = [...activities]
    .sort((a, b) => b.likesCount - a.likesCount)
    .slice(0, 5);

  const mostParticipatedActivities = [...activities]
    .sort((a, b) => b.participantsCount - a.participantsCount)
    .slice(0, 5);

  if (loading) return <div className="loading">{t.loading}</div>;

  return (
    <div className="rating-page">
      <BurgerMenu />
      <div className="content">
        <h1>{t.activityRating}</h1>

        <div className="stats-overview">
          <div className="stat-card">
            <h3>{t.totalActivities}</h3>
            <div className="stat-value">{activities.length}</div>
          </div>
          <div className="stat-card">
            <h3>{t.totalLikes}</h3>
            <div className="stat-value">
              {activities.reduce((sum, a) => sum + a.likesCount, 0)}
            </div>
          </div>
          <div className="stat-card">
            <h3>{t.totalParticipants}</h3>
            <div className="stat-value">
              {activities.reduce((sum, a) => sum + a.participantsCount, 0)}
            </div>
          </div>
        </div>

        <div className="sort-controls">
          <h3>{t.sortCategoriesBy}</h3>
          <div className="sort-buttons">
            <button
              className={sortBy === 'rating' ? 'active' : ''}
              onClick={() => setSortBy('rating')}
            >
              {t.byRating}
            </button>
            <button
              className={sortBy === 'activities' ? 'active' : ''}
              onClick={() => setSortBy('activities')}
            >
              {t.byActivities}
            </button>
            <button
              className={sortBy === 'participants' ? 'active' : ''}
              onClick={() => setSortBy('participants')}
            >
              {t.byParticipants}
            </button>
          </div>
        </div>

        <div className="category-stats">
          <h2>{t.ratingByCategories}</h2>
          <div className="stats-table">
            <div className="table-header">
              <div>{t.categoryHeader}</div>
              <div>{t.activitiesCount}</div>
              <div>{t.likes}</div>
              <div>{t.dislikes}</div>
              <div>{t.participants}</div>
              <div>{t.ratingHeader}</div>
            </div>
            {categoryStats.map((stat, index) => (
              <div key={stat.category} className="table-row">
                <div className="category-name">
                  <span className="rank">{index + 1}</span>
                  {stat.category}
                </div>
                <div>{stat.totalActivities}</div>
                <div className="likes-cell">{stat.totalLikes}</div>
                <div className="dislikes-cell">{stat.totalDislikes}</div>
                <div>{stat.totalParticipants}</div>
                <div className="rating-cell">
                  <div className="rating-bar">
                    <div
                      className="rating-fill"
                      style={{ width: `${stat.averageRating}%` }}
                    />
                  </div>
                  <span className="rating-value">{stat.averageRating}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="popular-activities">
          <div className="popular-column">
            <h3>{t.mostPopular}</h3>
            <div className="activity-list">
              {mostLikedActivities.map((activity, index) => (
                <div key={activity.id} className="popular-activity">
                  <span className="popular-rank">{index + 1}</span>
                  <div className="popular-info">
                    <div className="popular-title">{activity.title}</div>
                    <div className="popular-stats">
                      <span className="likes">👍 {activity.likesCount}</span>
                      <span className="category">{activity.category}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="popular-column">
            <h3>{t.mostAttended}</h3>
            <div className="activity-list">
              {mostParticipatedActivities.map((activity, index) => (
                <div key={activity.id} className="popular-activity">
                  <span className="popular-rank">{index + 1}</span>
                  <div className="popular-info">
                    <div className="popular-title">{activity.title}</div>
                    <div className="popular-stats">
                      <span className="participants">👥 {activity.participantsCount}</span>
                      <span className="category">{activity.category}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}