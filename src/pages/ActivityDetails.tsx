import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../services/api';
import BurgerMenu from '../components/BurgerMenu/BurgerMenu';
import { useLanguage } from '../context/LanguageContext';
import { useAdmin } from '../context/AdminContext';
import { getTranslatedCategory } from '../translations/categories';
import './ActivityDetails.css';

interface Comment {
  id: string;
  text: string;
  userId: string;
  userEmail: string;
  createdAt: string; // ISO строка
}

interface UserData {
  firstName: string;
  lastName: string;
  email: string;
}

export default function ActivityDetails() {
  const { id } = useParams();
  const [activity, setActivity] = useState<any>(null);
  const { t, language } = useLanguage();
  const { user, isAdmin, isSuperAdmin, userProfile } = useAdmin();
  const [isParticipating, setIsParticipating] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(true);
  const [commentUsers, setCommentUsers] = useState<Map<string, UserData>>(new Map());
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);

  // Загрузка активности
  useEffect(() => {
    const fetchActivity = async () => {
      if (!id) return;
      try {
        const response = await api.get<any>(`/activities/${id}`);
        if (response.status === 200 && response.data) {
          const data = response.data;
          setActivity({
            ...data,
            currentParticipants: data.currentParticipants ?? 0,
          });
          setIsParticipating(data.isParticipating ?? data.participating ?? false);
          setIsLiked(data.isLiked ?? data.liked ?? false);
          setIsDisliked(data.isDisliked ?? data.disliked ?? false);
        }
      } catch (error) {
        console.error('Ошибка загрузки активности', error);
      }
    };
    fetchActivity();
  }, [id, user]);

  // Загрузка комментариев
  useEffect(() => {
    const fetchComments = async () => {
      if (!id) return;
      try {
        const response = await api.get<Comment[]>(`/activities/${id}/comments`);
        if (response.status === 200 && response.data) {
          const commentsData = response.data;
          setComments(commentsData);

          // Загружаем данные пользователей для комментариев
          const usersMap = new Map<string, UserData>();
          const uniqueUserIds = new Set(commentsData.map(c => c.userId));
          const userIdsArray = Array.from(uniqueUserIds);
          const promises = userIdsArray.map(async (userId) => {
            try {
              // Здесь можно сделать запрос к /users/{userId}, но у нас нет такого эндпоинта.
              // Временно используем данные из userProfile или оставим только email.
              // Пока пропустим, чтобы не усложнять.
            } catch (error) {
              console.error(`Ошибка загрузки пользователя ${userId}`, error);
            }
          });
          await Promise.all(promises);
          setCommentUsers(usersMap);
        }
      } catch (error) {
        console.error('Ошибка загрузки комментариев', error);
      } finally {
        setLoadingComments(false);
      }
    };
    fetchComments();
  }, [id]);

  const getStatus = () => {
    if (!activity) return { type: 'active', color: '#9e9e9e', text: t.unknown };

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

  const handleJoin = async () => {
    const status = getStatus();
    if (status.type === 'finished') {
      alert(t.cannotJoinFinished);
      return;
    }
    
    // Проверка на максимальное количество участников
    if (activity.maxPeople > 0 && activity.currentParticipants >= activity.maxPeople) {
      alert(t.cannotJoinMaxParticipants);
      return;
    }
    
    if (!id || !user) return;
    
    try {
      await api.post(`/activities/${id}/join`);
      setIsParticipating(true);
      setActivity((prev: any) => ({
        ...prev,
        currentParticipants: (prev.currentParticipants || 0) + 1,
        isParticipating: true
      }));
      alert(t.joinSuccess);
    } catch (error) {
      console.error('Ошибка присоединения:', error);
      alert(t.error);
    }
  };

  const handleLeave = async () => {
    const status = getStatus();
    if (status.type === 'finished') {
      alert(t.cannotLeaveFinished);
      return;
    }
    
    if (!id || !user) return;
    
    try {
      await api.post(`/activities/${id}/leave`);
      setIsParticipating(false);
      setActivity((prev: any) => ({
        ...prev,
        currentParticipants: Math.max((prev.currentParticipants || 1) - 1, 0),
        isParticipating: false
      }));
      alert(t.leaveSuccess);
    } catch (error) {
      console.error('Ошибка выхода:', error);
      alert(t.error);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !newComment.trim()) return;
    if (!user) return;

    try {
      const response = await api.post<Comment>(`/activities/${id}/comments`, { text: newComment.trim() });
      if (response.status === 201 && response.data) {
        const newCommentData = response.data;
        setComments(prev => [newCommentData, ...prev]);
        setNewComment('');
        alert(t.commentAdded);
        // Обновить кэш пользователей
        if (userProfile) {
          setCommentUsers(prev => new Map(prev).set(user.uid!, {
            firstName: userProfile.firstName,
            lastName: userProfile.lastName,
            email: user.email!
          }));
        }
      } else {
        alert(response.error || t.commentError);
      }
    } catch (error) {
      console.error('Ошибка отправки комментария', error);
      alert(t.commentError);
    }
  };

  const canDeleteComment = (comment: Comment) => {
    if (!user) return false;
    const isOwnComment = comment.userId === user.uid;
    const isCommentBySuperAdmin = comment.userEmail === 'basamykinaa21@oiate.ru';

    if (isSuperAdmin) return true;
    if (isAdmin && !isCommentBySuperAdmin) return true;
    if (isOwnComment) return true;
    return false;
  };

  const handleDeleteComment = async (comment: Comment) => {
    if (!id) return;

    if (window.confirm(t.confirmDeleteComment)) {
      try {
        const response = await api.delete(`/comments/${comment.id}`);
        if (response.status === 204) {
          setComments(prev => prev.filter(c => c.id !== comment.id));
          alert(t.commentDeleted);
        } else {
          alert(response.error || t.error);
        }
      } catch (error) {
        console.error('Ошибка удаления комментария', error);
        alert(t.error);
      }
    }
  };

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

  const formatCommentTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return t.unknown;
    }
  };

  const getDisplayName = (userId: string, userEmail: string) => {
    const userData = commentUsers.get(userId);
    if (userData && userData.firstName && userData.lastName) {
      return `${userData.firstName} ${userData.lastName}`;
    }
    return userEmail;
  };

  if (!activity) return <div>{t.loading}</div>;

  const status = getStatus();
  const isActivityFinished = status.type === 'finished';
  const participationText = getParticipationText();
  const translatedCategory = getTranslatedCategory(activity.category, language);

  return (
    <div className="activity-details-page">
      <BurgerMenu />
      <div className="content">
        <h1>{activity.title}</h1>

        <div
          className="activity-status-badge"
          style={{
            backgroundColor: status.color,
            color: status.type === 'upcoming' ? '#000' : '#fff'
          }}
        >
          {status.text}
        </div>

        <div className="details-card">
          <p><strong>{t.location}:</strong> {activity.location}</p>
          <p><strong>{t.category}:</strong> {translatedCategory}</p>
          <p><strong>{t.date}:</strong> {formatDateTime(activity.startDate)} - {formatDateTime(activity.endDate)}</p>
          <p><strong>{t.description}:</strong> {activity.description}</p>
          <p><strong>{t.creator}:</strong> {activity.creatorEmail}</p>
          <p><strong>{t.participants}:</strong> {activity.currentParticipants || 0}/{activity.maxPeople > 0 ? activity.maxPeople : '∞'}</p>
          <p><strong>{t.likes}:</strong> {activity.likesCount || 0} | <strong>{t.dislikes}:</strong> {activity.dislikesCount || 0}</p>

          {!isActivityFinished ? (
            isParticipating ? (
              <div className="participation-controls">
                <span className="participation-text">{participationText}</span>
                <button onClick={handleLeave} className="leave-btn">
                  {t.leave}
                </button>
              </div>
            ) : (
              <button
                onClick={handleJoin}
                className="join-btn"
                type="button"
                disabled={activity.maxPeople > 0 && (activity.currentParticipants || 0) >= activity.maxPeople}
              >
                {t.join}
              </button>
            )
          ) : (
            <div className="finished-activity-message">
              <p>{t.activityFinished}</p>
              {isParticipating && (
                <div className="participation-badge">{participationText}</div>
              )}
            </div>
          )}
        </div>

        <div className="comments-section">
          <h2>{t.comments} ({comments.length})</h2>

          <form onSubmit={handleCommentSubmit} className="comment-form">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={t.writeComment}
              rows={3}
              required
            />
            <button type="submit" className="comment-submit-btn">
              {t.send}
            </button>
          </form>

          {loadingComments ? (
            <div className="loading-comments">{t.loadingComments}</div>
          ) : comments.length === 0 ? (
            <div className="no-comments">{t.noComments}</div>
          ) : (
            <div className="comments-list">
              {comments.map((comment) => {
                const isOwnComment = comment.userId === user?.uid;
                const displayName = getDisplayName(comment.userId, comment.userEmail);

                return (
                  <div
                    key={comment.id}
                    className={`comment-item ${isOwnComment ? 'own-comment' : 'other-comment'}`}
                  >
                    <div className="comment-header">
                      <span className="comment-author">{displayName}</span>
                    </div>
                    <div className="comment-content">
                      <div className="comment-text">{comment.text}</div>
                      {canDeleteComment(comment) && (
                        <button
                          className="delete-comment-btn"
                          onClick={() => handleDeleteComment(comment)}
                          title={t.deleteComment}
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                    <div className="comment-footer">
                      <span className="comment-time">{formatCommentTime(comment.createdAt)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
