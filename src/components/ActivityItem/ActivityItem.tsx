import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import './ActivityItem.css';
import { Activity } from '../../types/activity';
import { useLanguage } from '../../context/LanguageContext';
import { useAdmin } from '../../context/AdminContext';

interface ActivityItemProps {
  activity: Activity;
  currentUserId: string;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  onDelete: (id: string) => Promise<void> | void;
}

interface UserData {
  firstName: string;
  lastName: string;
  email: string;
}

const ActivityItem: React.FC<ActivityItemProps> = ({
  activity,
  currentUserId,
  isAdmin,
  isSuperAdmin,
  onDelete
}) => {
  const { t } = useLanguage();
  const { userProfile } = useAdmin();

  const canDelete = isAdmin || activity.creatorId === currentUserId;
  const canEdit = isAdmin || activity.creatorId === currentUserId;

  const currentParticipants = activity.people?.length || 0;

  const [localLikes, setLocalLikes] = useState<string[]>(activity.likes || []);
  const [localDislikes, setLocalDislikes] = useState<string[]>(activity.dislikes || []);
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [creatorData, setCreatorData] = useState<UserData | null>(null);

  useEffect(() => {
    setLocalLikes(activity.likes || []);
    setLocalDislikes(activity.dislikes || []);
    setIsLiked(activity.isLiked || false);
    setIsDisliked(activity.isDisliked || false);

    // Загрузка данных создателя (можно получить через /users/{creatorId}, но пока используем creatorEmail)
    // Временное решение: просто отображаем creatorEmail
    setCreatorData(null);
  }, [activity, currentUserId]);

  const likesCount = localLikes.length;
  const dislikesCount = localDislikes.length;

  const formatDateTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const getStatus = () => {
    try {
      const now = new Date();
      const start = new Date(activity.startDate);
      const end = new Date(activity.endDate);

      if (now < start) {
        return { type: 'upcoming', color: '#ff9800', text: t.upcoming };
      } else if (now > end) {
        return { type: 'finished', color: '#f44336', text: t.finished };
      } else {
        return { type: 'active', color: '#4CAF50', text: t.active };
      }
    } catch {
      return { type: 'active', color: '#9e9e9e', text: t.unknown };
    }
  };

  const getParticipationText = () => {
    const status = getStatus();
    const isParticipating = activity.people?.includes(currentUserId) || false;

    if (!isParticipating) return '';

    switch (status.type) {
      case 'upcoming':
        return t.willParticipate;
      case 'finished':
        return t.participated;
      default:
        return t.youParticipate;
    }
  };

  const handleLike = async () => {
    if (!activity.id || !currentUserId) return;

    try {
      const response = await api.post(`/activities/${activity.id}/like`);
      if (response.status === 204 || response.status === 200) {
        // Переключаем локальное состояние
        if (isLiked) {
          setLocalLikes(prev => prev.filter(id => id !== currentUserId));
          setIsLiked(false);
        } else {
          if (isDisliked) {
            setLocalDislikes(prev => prev.filter(id => id !== currentUserId));
            setIsDisliked(false);
          }
          setLocalLikes(prev => [...prev, currentUserId]);
          setIsLiked(true);
        }
      } else {
        throw new Error(response.error || 'Ошибка лайка');
      }
    } catch (error) {
      console.error('Ошибка при оценке активности:', error);
      // Откат изменений при ошибке
      setLocalLikes(activity.likes || []);
      setLocalDislikes(activity.dislikes || []);
      setIsLiked(activity.likes?.includes(currentUserId) || false);
      setIsDisliked(activity.dislikes?.includes(currentUserId) || false);
    }
  };

  const handleDislike = async () => {
    if (!activity.id || !currentUserId) return;

    try {
      const response = await api.post(`/activities/${activity.id}/dislike`);
      if (response.status === 204 || response.status === 200) {
        if (isDisliked) {
          setLocalDislikes(prev => prev.filter(id => id !== currentUserId));
          setIsDisliked(false);
        } else {
          if (isLiked) {
            setLocalLikes(prev => prev.filter(id => id !== currentUserId));
            setIsLiked(false);
          }
          setLocalDislikes(prev => [...prev, currentUserId]);
          setIsDisliked(true);
        }
      } else {
        throw new Error(response.error || 'Ошибка дизлайка');
      }
    } catch (error) {
      console.error('Ошибка при оценке активности:', error);
      setLocalLikes(activity.likes || []);
      setLocalDislikes(activity.dislikes || []);
      setIsLiked(activity.likes?.includes(currentUserId) || false);
      setIsDisliked(activity.dislikes?.includes(currentUserId) || false);
    }
  };

  const status = getStatus();
  const participationText = getParticipationText();
  const isParticipating = activity.people?.includes(currentUserId) || false;

  const displayName = creatorData
    ? (creatorData.firstName && creatorData.lastName
        ? `${creatorData.firstName} ${creatorData.lastName}`
        : creatorData.email)
    : activity.creatorEmail;

  return (
    <div className="activity-item">
      {(canEdit || canDelete) && (
        <div className="activity-actions">
          {canEdit && (
            <Link to={`/edit/${activity.id}`} className="edit-button">
              {t.edit}
            </Link>
          )}
          {canDelete && (
            <button
              className="delete-button"
              onClick={() => activity.id && onDelete(activity.id)}
              aria-label={t.delete}
            >
              {t.delete}
            </button>
          )}
        </div>
      )}

      <h3 className="activity-title">{activity.title}</h3>

      <div className="activity-category">
        <span className="category-badge">{activity.category}</span>
      </div>

      <div className="activity-info">
        <div className="activity-row">
          <span className="label">📍 {t.place}:</span>
          <span className="value">{activity.location}</span>
        </div>

        <div className="activity-row">
          <span className="label">⏱️ {t.start}:</span>
          <span className="value">{formatDateTime(activity.startDate)}</span>
        </div>

        <div className="activity-row">
          <span className="label">⏱️ {t.end}:</span>
          <span className="value">{formatDateTime(activity.endDate)}</span>
        </div>

        <div className="activity-row">
          <span className="label">👥 {t.participants}:</span>
          <span className="value">
            {currentParticipants}/{activity.maxPeople > 0 ? activity.maxPeople : '∞'}
          </span>
        </div>

        <div className="activity-row">
          <span className="label">👤 {t.creator}:</span>
          <span className="value">{displayName}</span>
        </div>

        <div className="activity-row">
          <span className="label">{t.status}:</span>
          <span
            className="status"
            style={{
              backgroundColor: status.color,
              color: status.type === 'upcoming' ? '#000' : '#fff'
            }}
          >
            {status.text}
          </span>
        </div>
      </div>

      <div className="activity-footer">
        <div className="footer-left">
          <Link to={`/activity/${activity.id}`} className="details-button">
            {t.viewDetails}
          </Link>
        </div>

        <div className="footer-center">
          {isParticipating && (
            <div className="participation-badge">{participationText}</div>
          )}
        </div>

        <div className="footer-right">
          <div className="rating-buttons">
            <button
              className={`like-button ${isLiked ? 'active' : ''}`}
              onClick={handleLike}
              aria-label={t.likes}
              type="button"
            >
              <span className="icon">👍</span>
              <span className="count">{likesCount}</span>
            </button>

            <button
              className={`dislike-button ${isDisliked ? 'active' : ''}`}
              onClick={handleDislike}
              aria-label={t.dislikes}
              type="button"
            >
              <span className="icon">👎</span>
              <span className="count">{dislikesCount}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityItem;