import { useState, FormEvent, ChangeEvent, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import BurgerMenu from '../components/BurgerMenu/BurgerMenu';
import './EditActivity.css';
import { useLanguage } from '../context/LanguageContext';
import { useAdmin } from '../context/AdminContext';
import { categoryTranslations } from '../translations/categories';

const ACTIVITY_CATEGORIES = [
  'Спортивное мероприятие',
  'Концерт',
  'Мастер-класс',
  'Встреча',
  'Лекция',
  'Экскурсия',
  'Тренировка',
  'Игра',
  'Соревнование',
  'Фестиваль',
  'Выставка',
  'Киносеанс',
  'Поход',
  'Волонтёрство',
  'Другое'
] as const;

interface FormData {
  title: string;
  location: string;
  startDate: string;
  endDate: string;
  description: string;
  maxPeople: number;
  category: string;
}

export default function EditActivity() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { user, isAdmin } = useAdmin();
  const [formData, setFormData] = useState<FormData>({
    title: '',
    location: '',
    startDate: '',
    endDate: '',
    description: '',
    maxPeople: 10,
    category: ACTIVITY_CATEGORIES[0]
  });
  const [unlimitedPeople, setUnlimitedPeople] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activityCreatorId, setActivityCreatorId] = useState('');

  useEffect(() => {
    const fetchActivity = async () => {
      if (!id) return;
      
      const docRef = doc(db, 'activities', id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        const maxPeople = data.maxPeople || 10;
        
        setFormData({
          title: data.title || '',
          location: data.location || '',
          startDate: data.startDate || '',
          endDate: data.endDate || '',
          description: data.description || '',
          maxPeople: maxPeople,
          category: data.category || ACTIVITY_CATEGORIES[0]
        });
        
        setUnlimitedPeople(maxPeople === 0);
        setActivityCreatorId(data.creatorId || '');
      }
      setLoading(false);
    };
    
    fetchActivity();
  }, [id]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!id || (!isAdmin && user?.uid !== activityCreatorId)) return;
    
    try {
      const finalMaxPeople = unlimitedPeople ? 0 : formData.maxPeople;
      
      await updateDoc(doc(db, 'activities', id), {
        ...formData,
        maxPeople: finalMaxPeople,
        updatedAt: new Date().toISOString()
      });
      alert(t.activityUpdated);
      navigate('/');
    } catch (error) {
      console.error('Ошибка при обновлении активности:', error);
      alert(t.error);
    }
  };

  const handleDelete = async () => {
    if (!id || (!isAdmin && user?.uid !== activityCreatorId)) return;
    
    if (window.confirm(t.areYouSure)) {
      try {
        await deleteDoc(doc(db, 'activities', id));
        alert(t.activityDeleted);
        navigate('/');
      } catch (error) {
        console.error('Ошибка при удалении активности:', error);
        alert(t.error);
      }
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.type === 'number' ? parseInt(e.target.value) : e.target.value
    });
  };

  const handleUnlimitedChange = () => {
    const newUnlimitedState = !unlimitedPeople;
    setUnlimitedPeople(newUnlimitedState);
    
    if (newUnlimitedState) {
      setFormData({
        ...formData,
        maxPeople: 0
      });
    } else {
      setFormData({
        ...formData,
        maxPeople: formData.maxPeople === 0 ? 10 : formData.maxPeople
      });
    }
  };

  const formatDateTimeForInput = (dateString: string) => {
    const date = new Date(dateString);
    return date.toISOString().slice(0, 16);
  };

  if (loading) return <div>{t.loading}</div>;
  
  if (!isAdmin && user?.uid !== activityCreatorId) {
    return (
      <div className="edit-page">
        <BurgerMenu />
        <div className="content">
          <h1>{t.accessDenied}</h1>
          <p>Вы не можете редактировать эту активность.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="edit-page">
      <BurgerMenu />
      <div className="content">
        <h1>{t.editActivity}</h1>
        <form onSubmit={handleSubmit}>
          <input
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder={t.title}
            required
          />
          
          <input
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder={t.location}
            required
          />
          
          <label>{t.category}:</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
          >
            {ACTIVITY_CATEGORIES.map(category => (
              <option key={category} value={category}>
                {categoryTranslations[category]?.[language] || category}
              </option>
            ))}
          </select>
          
          <label>{t.startTimeLabel}:</label>
          <input
            type="datetime-local"
            name="startDate"
            value={formatDateTimeForInput(formData.startDate)}
            onChange={handleChange}
            required
          />
          
          <label>{t.endTimeLabel}:</label>
          <input
            type="datetime-local"
            name="endDate"
            value={formatDateTimeForInput(formData.endDate)}
            onChange={handleChange}
            required
          />
          
          <div className="max-people-container">
            <div className="unlimited-checkbox">
              <input
                type="checkbox"
                id="unlimitedPeople"
                checked={unlimitedPeople}
                onChange={handleUnlimitedChange}
              />
              <label htmlFor="unlimitedPeople">{t.unlimitedParticipants}</label>
            </div>
            
            {!unlimitedPeople && (
              <div className="max-people-input">
                <label htmlFor="maxPeople">{t.maxPeople}:</label>
                <input
                  type="number"
                  id="maxPeople"
                  name="maxPeople"
                  value={formData.maxPeople === 0 ? 10 : formData.maxPeople}
                  onChange={handleChange}
                  min="1"
                  max="9999"
                  required={!unlimitedPeople}
                  disabled={unlimitedPeople}
                />
              </div>
            )}
          </div>
          
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder={t.description}
            required
            rows={5}
          />
          
          <div className="form-actions">
            <button type="button" onClick={handleDelete} className="delete-btn">
              {t.delete}
            </button>
            <button type="submit" className="save-btn">
              {t.saveChanges}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}