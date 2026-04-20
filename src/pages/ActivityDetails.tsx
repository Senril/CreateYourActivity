import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  doc, 
  getDoc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  Timestamp,
  deleteDoc 
} from 'firebase/firestore';
import { auth, db } from '../services/firebase';
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
  createdAt: Timestamp;
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

  useEffect(() => {
    const fetchActivity = async () => {
      if (!id) return;
      const docRef = doc(db, 'activities', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setActivity(data);
        if (user && data.people && data.people.includes(user.uid)) {
          setIsParticipating(true);
        }
      }
    };
    fetchActivity();
  }, [id, user]);

  useEffect(() => {
    const fetchComments = async () => {
      if (!id) return;
      
      try {
        const commentsRef = collection(db, 'activities', id, 'comments');
        const q = query(commentsRef, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        
        const commentsData: Comment[] = [];
        querySnapshot.forEach((doc) => {
          commentsData.push({
            id: doc.id,
            ...doc.data()
          } as Comment);
        });
        
        setComments(commentsData);
        
        // Загружаем данные пользователей для комментариев
        const usersMap = new Map<string, UserData>();
        const uniqueUserIds = new Set(commentsData.map(comment => comment.userId));
        
        // Используем Array.from для итерации по Set
        const userIdsArray = Array.from(uniqueUserIds);
        const promises = userIdsArray.map(async (userId) => {
          try {
            const userDoc = await getDoc(doc(db, 'users', userId));
            if (userDoc.exists()) {
              const data = userDoc.data();
              usersMap.set(userId, {
                firstName: data.firstName || '',
                lastName: data.lastName || '',
                email: data.email || ''
              });
            }
          } catch (error) {
            console.error(`Ошибка загрузки данных пользователя ${userId}:`, error);
          }
        });
        
        await Promise.all(promises);
        setCommentUsers(usersMap);
      } catch (error) {
        console.error('Ошибка загрузки комментариев:', error);
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
    } catch (error) {
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
      case 'active':
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
    if (activity.maxPeople > 0 && activity.people?.length >= activity.maxPeople) {
      alert(t.cannotJoinMaxParticipants);
      return;
    }
    
    if (!id || !user) return;
    
    await updateDoc(doc(db, 'activities', id), {
      people: arrayUnion(user.uid)
    });
    setIsParticipating(true);
    setActivity({
      ...activity,
      people: [...activity.people, user.uid]
    });
    alert(t.joinSuccess);
  };

  const handleLeave = async () => {
    const status = getStatus();
    if (status.type === 'finished') {
      alert(t.cannotLeaveFinished);
      return;
    }
    
    if (!id || !user) return;
    
    await updateDoc(doc(db, 'activities', id), {
      people: arrayRemove(user.uid)
    });
    setIsParticipating(false);
    setActivity({
      ...activity,
      people: activity.people.filter((userId: string) => userId !== user.uid)
    });
    alert(t.leaveSuccess);
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !newComment.trim()) return;
    
    if (!user) return;
    
    try {
      const commentsRef = collection(db, 'activities', id, 'comments');
      await addDoc(commentsRef, {
        text: newComment.trim(),
        userId: user.uid,
        userEmail: user.email,
        createdAt: Timestamp.now()
      });
      
      setNewComment('');
      alert(t.commentAdded);
      
      // Обновляем список комментариев
      const q = query(commentsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const commentsData: Comment[] = [];
      querySnapshot.forEach((doc) => {
        commentsData.push({
          id: doc.id,
          ...doc.data()
        } as Comment);
      });
      setComments(commentsData);
      
      // Добавляем данные текущего пользователя в карту
      if (userProfile) {
        const newUserData: UserData = {
          firstName: userProfile.firstName || '',
          lastName: userProfile.lastName || '',
          email: user.email || ''
        };
        setCommentUsers(prev => new Map(prev).set(user.uid, newUserData));
      }
    } catch (error) {
      console.error('Ошибка отправки комментария:', error);
      alert(t.commentError);
    }
  };

  const canDeleteComment = (comment: Comment) => {
    if (!user) return false;

    const isOwnComment = comment.userId === user.uid;
    const isCommentBySuperAdmin = comment.userEmail === 'basamykinaa21@oiate.ru';

    // Суперадмин может удалить любой комментарий
    if (isSuperAdmin) return true;
    
    // Админ может удалить любой комментарий, кроме комментариев суперадмина
    if (isAdmin && !isCommentBySuperAdmin) return true;
    
    // Пользователь может удалить свой комментарий
    if (isOwnComment) return true;

    return false;
  };

  const handleDeleteComment = async (comment: Comment) => {
    if (!id) return;
    
    if (window.confirm(t.confirmDeleteComment)) {
      try {
        await deleteDoc(doc(db, 'activities', id, 'comments', comment.id));
        setComments(prev => prev.filter(c => c.id !== comment.id));
        alert(t.commentDeleted);
      } catch (error) {
        console.error('Ошибка при удалении комментария:', error);
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
    } catch (error) {
      return dateString;
    }
  };

  const formatCommentTime = (timestamp: Timestamp) => {
    try {
      const date = timestamp.toDate();
      return date.toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return t.unknown;
    }
  };

  // Функция для получения отображаемого имени пользователя
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
        
        {/* Бейдж статуса активности */}
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
          <p><strong>{t.participants}:</strong> {activity.people?.length || 0}/{activity.maxPeople > 0 ? activity.maxPeople : '∞'}</p>
          <p><strong>{t.likes}:</strong> {activity.likes?.length || 0} | <strong>{t.dislikes}:</strong> {activity.dislikes?.length || 0}</p>
          
          {/* Управление участием */}
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
                disabled={activity.maxPeople > 0 && activity.people?.length >= activity.maxPeople}
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

        {/* Секция комментариев */}
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