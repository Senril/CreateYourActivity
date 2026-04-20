import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { doc, updateDoc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
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
  
  // Локальное состояние для лайков/дизлайков
  const [localLikes, setLocalLikes] = useState<string[]>(activity.likes || []);
  const [localDislikes, setLocalDislikes] = useState<string[]>(activity.dislikes || []);
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [creatorData, setCreatorData] = useState<UserData | null>(null);
  
  // Обновляем локальные состояния при изменении активности
  useEffect(() => {
    setLocalLikes(activity.likes || []);
    setLocalDislikes(activity.dislikes || []);
    setIsLiked(activity.likes?.includes(currentUserId) || false);
    setIsDisliked(activity.dislikes?.includes(currentUserId) || false);
    
    // Загружаем данные создателя активности
    const loadCreatorData = async () => {
      try {
        if (activity.creatorId) {
          const userDoc = await getDoc(doc(db, 'users', activity.creatorId));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setCreatorData({
              firstName: data.firstName || '',
              lastName: data.lastName || '',
              email: data.email || activity.creatorEmail
            });
          } else {
            setCreatorData({
              firstName: '',
              lastName: '',
              email: activity.creatorEmail
            });
          }
        }
      } catch (error) {
        console.error('Ошибка загрузки данных создателя:', error);
      }
    };
    
    loadCreatorData();
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
    } catch (error) {
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
    } catch (error) {
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
      case 'active':
      default:
        return t.youParticipate;
    }
  };

  const handleLike = async () => {
    if (!activity.id || !currentUserId) return;
    
    try {
      const activityRef = doc(db, 'activities', activity.id);
      
      if (isLiked) {
        // Если уже лайкнуто, убираем лайк
        await updateDoc(activityRef, {
          likes: arrayRemove(currentUserId)
        });
        // Немедленное обновление UI
        setLocalLikes(prev => prev.filter(id => id !== currentUserId));
        setIsLiked(false);
      } else {
        // Если дизлайкнуто, убираем дизлайк и ставим лайк
        if (isDisliked) {
          await updateDoc(activityRef, {
            dislikes: arrayRemove(currentUserId),
            likes: arrayUnion(currentUserId)
          });
          // Немедленное обновление UI
          setLocalDislikes(prev => prev.filter(id => id !== currentUserId));
          setLocalLikes(prev => [...prev, currentUserId]);
          setIsDisliked(false);
          setIsLiked(true);
        } else {
          // Просто ставим лайк
          await updateDoc(activityRef, {
            likes: arrayUnion(currentUserId)
          });
          // Немедленное обновление UI
          setLocalLikes(prev => [...prev, currentUserId]);
          setIsLiked(true);
        }
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
      const activityRef = doc(db, 'activities', activity.id);
      
      if (isDisliked) {
        // Если уже дизлайкнуто, убираем дизлайк
        await updateDoc(activityRef, {
          dislikes: arrayRemove(currentUserId)
        });
        // Немедленное обновление UI
        setLocalDislikes(prev => prev.filter(id => id !== currentUserId));
        setIsDisliked(false);
      } else {
        // Если лайкнуто, убираем лайк и ставим дизлайк
        if (isLiked) {
          await updateDoc(activityRef, {
            likes: arrayRemove(currentUserId),
            dislikes: arrayUnion(currentUserId)
          });
          // Немедленное обновление UI
          setLocalLikes(prev => prev.filter(id => id !== currentUserId));
          setLocalDislikes(prev => [...prev, currentUserId]);
          setIsLiked(false);
          setIsDisliked(true);
        } else {
          // Просто ставим дизлайк
          await updateDoc(activityRef, {
            dislikes: arrayUnion(currentUserId)
          });
          // Немедленное обновление UI
          setLocalDislikes(prev => [...prev, currentUserId]);
          setIsDisliked(true);
        }
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

  const status = getStatus();
  const participationText = getParticipationText();
  const isParticipating = activity.people?.includes(currentUserId) || false;

  // Формируем отображаемое имя создателя
  const displayName = creatorData 
    ? (creatorData.firstName && creatorData.lastName 
        ? `${creatorData.firstName} ${creatorData.lastName}`
        : creatorData.email)
    : activity.creatorEmail;

  return (
    <div className="activity-item">
      {/* Кнопки управления в правом верхнем углу */}
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
      
      {/* Заголовок карточки */}
      <h3 className="activity-title">{activity.title}</h3>
      
      {/* Категория */}
      <div className="activity-category">
        <span className="category-badge">{activity.category}</span>
      </div>
      
      {/* Основная информация об активности */}
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
          <span className="value">{currentParticipants}/{activity.maxPeople > 0 ? activity.maxPeople : '∞'}</span>
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
      
      {/* Нижняя часть карточки */}
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