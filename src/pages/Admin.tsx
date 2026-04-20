import { useState, useEffect } from 'react';
import { collection, getDocs, deleteDoc, doc, addDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import BurgerMenu from '../components/BurgerMenu/BurgerMenu';
import ActivityItem from '../components/ActivityItem/ActivityItem';
import './Admin.css';
import { useAdmin } from '../context/AdminContext';
import { Activity } from '../types/activity';
import { useLanguage } from '../context/LanguageContext';

interface AdminUser {
  id: string;
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
      
      const querySnapshot = await getDocs(collection(db, 'admins'));
      const adminsList: AdminUser[] = querySnapshot.docs.map(doc => ({
        id: doc.id,
        email: doc.data().email || '',
        createdAt: doc.data().createdAt || '',
        createdBy: doc.data().createdBy || ''
      }));
      setAdmins(adminsList);
    };
    
    const fetchActivities = async () => {
      const querySnapshot = await getDocs(collection(db, 'activities'));
      const activitiesList: Activity[] = querySnapshot.docs.map(doc => ({
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
      }));
      setActivities(activitiesList);
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
      await addDoc(collection(db, 'admins'), {
        email: newAdminEmail,
        createdAt: new Date().toISOString(),
        createdBy: user.email
      });
      setNewAdminEmail('');
      
      const querySnapshot = await getDocs(collection(db, 'admins'));
      const adminsList: AdminUser[] = querySnapshot.docs.map(doc => ({
        id: doc.id,
        email: doc.data().email || '',
        createdAt: doc.data().createdAt || '',
        createdBy: doc.data().createdBy || ''
      }));
      setAdmins(adminsList);
      
      alert(t.adminAdded);
    } catch (error) {
      console.error('Ошибка добавления администратора:', error);
      alert(t.error);
    }
  };

  const handleRemoveAdmin = async (adminId: string, adminEmail: string) => {
    if (!isSuperAdmin) return;
    
    if (adminEmail === SUPER_ADMIN_EMAIL) {
      alert('Суперадминистратора нельзя удалить');
      return;
    }
    
    if (window.confirm(`${t.areYouSure} ${t.remove} ${adminEmail}?`)) {
      await deleteDoc(doc(db, 'admins', adminId));
      setAdmins(admins.filter(admin => admin.id !== adminId));
      alert(t.adminRemoved);
    }
  };

  const handleDeleteActivity = async (activityId: string) => {
    if (!isAdmin) return;
    
    if (window.confirm(t.areYouSure)) {
      await deleteDoc(doc(db, 'activities', activityId));
      setActivities(activities.filter(activity => activity.id !== activityId));
      alert(t.activityDeleted);
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