import { useState, useEffect } from 'react';
import { api } from '../services/api';
import BurgerMenu from '../components/BurgerMenu/BurgerMenu';
import ActivityItem from '../components/ActivityItem/ActivityItem';
import './Admin.css';
import { useAdmin } from '../context/AdminContext';
import { Activity } from '../types/activity';
import { useLanguage } from '../context/LanguageContext';

interface AdminUser {
  id: number;
  email: string;
  createdAt: string;
  createdBy: string;
}

export default function Admin() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState('');

  const { user, isAdmin, isSuperAdmin } = useAdmin();
  const { t } = useLanguage();

  const SUPER_ADMIN_EMAIL = 'basamykinaa21@oiate.ru';

  useEffect(() => {
    const fetchAdmins = async () => {
      if (!isAdmin) return;
      try {
        const response = await api.get<AdminUser[]>('/admins');
        if (response.status === 200 && response.data) {
          setAdmins(response.data);
        }
      } catch (error) {
        console.error('Ошибка загрузки администраторов', error);
      }
    };

    const fetchActivities = async () => {
      try {
        const response = await api.get<any>('/activities?page=0&size=100&sortBy=startDate&sortDir=desc');
        if (response.data?.content) {
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
            likes: Array(item.likesCount).fill(''),
            dislikes: Array(item.dislikesCount).fill(''),
          }));
          setActivities(mapped);
        }
      } catch (error) {
        console.error('Ошибка загрузки активностей', error);
      }
    };

    if (isAdmin) {
      fetchAdmins();
      fetchActivities();
    }
  }, [isAdmin]);

  const handleAddAdmin = async () => {
    if (!newAdminEmail || !isSuperAdmin || !user) return;

    if (newAdminEmail === SUPER_ADMIN_EMAIL) {
      alert('Этот email является суперадмином и не может быть добавлен как обычный админ');
      return;
    }

    if (admins.some(admin => admin.email === newAdminEmail)) {
      alert('Этот пользователь уже является администратором');
      return;
    }

    try {
      const response = await api.post<AdminUser>('/admins', { email: newAdminEmail });
      if (response.status === 201 && response.data) {
        setNewAdminEmail('');
        setAdmins(prev => [...prev, response.data!]);
        alert(t.adminAdded);
      } else {
        alert(response.error || t.error);
      }
    } catch (error) {
      console.error('Ошибка добавления администратора', error);
      alert(t.error);
    }
  };

  const handleRemoveAdmin = async (adminId: number, adminEmail: string) => {
    if (!isSuperAdmin) return;

    if (adminEmail === SUPER_ADMIN_EMAIL) {
      alert('Суперадминистратора нельзя удалить');
      return;
    }

    if (window.confirm(`${t.areYouSure} ${t.remove} ${adminEmail}?`)) {
      try {
        const response = await api.delete(`/admins/${adminId}`);
        if (response.status === 204) {
          setAdmins(prev => prev.filter(admin => admin.id !== adminId));
          alert(t.adminRemoved);
        } else {
          alert(response.error || t.error);
        }
      } catch (error) {
        console.error('Ошибка удаления администратора', error);
        alert(t.error);
      }
    }
  };

  const handleDeleteActivity = async (activityId: string) => {
    if (!isAdmin) return;

    if (window.confirm(t.areYouSure)) {
      try {
        const response = await api.delete(`/activities/${activityId}`);
        if (response.status === 204) {
          setActivities(prev => prev.filter(activity => activity.id !== activityId));
          alert(t.activityDeleted);
        } else {
          alert(response.error || t.error);
        }
      } catch (error) {
        console.error('Ошибка удаления активности', error);
        alert(t.error);
      }
    }
  };

  if (!isAdmin) {
    return (
      <div className="admin-container">
        <BurgerMenu />
        <div className="content">
          <h1>{t.accessDenied}</h1>
          <p>{t.adminOnly}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <BurgerMenu />
      <div className="content">
        <h1>{t.adminDashboard}</h1>
        <p className="admin-info">
          {isSuperAdmin
            ? `${t.youLoggedAs} ${t.superAdmin}`
            : `${t.youLoggedAs} ${t.regularAdmin}`}
        </p>

        {isSuperAdmin && (
          <section className="admin-section">
            <h2>{t.manageAdmins}</h2>
            <div className="add-admin-form">
              <input
                type="email"
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
                placeholder={t.newAdminEmail}
              />
              <button onClick={handleAddAdmin}>
                {t.add}
              </button>
            </div>

            <div className="admins-list">
              <h3>{t.currentAdmins}</h3>
              {admins.map(admin => (
                <div key={admin.id} className="admin-item">
                  <div>
                    <span>{admin.email}</span>
                    {admin.email === SUPER_ADMIN_EMAIL && (
                      <span className="super-admin-badge">{t.superAdminBadge}</span>
                    )}
                  </div>
                  <div>
                    {isSuperAdmin && admin.email !== SUPER_ADMIN_EMAIL && (
                      <button
                        onClick={() => handleRemoveAdmin(admin.id, admin.email)}
                        className="remove-btn"
                      >
                        {t.remove}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="admin-section">
          <h2>{t.allActivities} ({activities.length})</h2>
          <div className="activities-list">
            {activities.map(activity => (
              <ActivityItem
                key={activity.id}
                activity={activity}
                currentUserId={user?.uid || ''}
                isAdmin={true}
                isSuperAdmin={isSuperAdmin}
                onDelete={handleDeleteActivity}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}