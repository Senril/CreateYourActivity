import { useState, FormEvent, ChangeEvent, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
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
      try {
        const response = await api.get<any>(`/activities/${id}`);
        if (response.status === 200 && response.data) {
          const data = response.data;
          const maxPeople = data.maxPeople || 10;

          // Преобразуем ISO даты в формат для datetime-local
          const formatDateTime = (iso: string) => {
            const date = new Date(iso);
            return date.toISOString().slice(0, 16);
          };

          setFormData({
            title: data.title || '',
            location: data.location || '',
            startDate: formatDateTime(data.startDate),
            endDate: formatDateTime(data.endDate),
            description: data.description || '',
            maxPeople: maxPeople,
            category: data.category || ACTIVITY_CATEGORIES[0]
          });

          setUnlimitedPeople(maxPeople === 0);
          setActivityCreatorId(data.creatorId || '');
        }
      } catch (error) {
        console.error('Ошибка загрузки активности', error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivity();
  }, [id]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!id || (!isAdmin && user?.uid !== activityCreatorId)) return;

    try {
      const finalMaxPeople = unlimitedPeople ? 0 : formData.maxPeople;

      const payload = {
        ...formData,
        maxPeople: finalMaxPeople,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
      };

      const response = await api.put(`/activities/${id}`, payload);
      if (response.status === 200) {
        alert(t.activityUpdated);
        navigate('/');
      } else {
        alert(response.error || t.error);
      }
    } catch (error) {
      console.error('Ошибка при обновлении активности:', error);
      alert(t.error);
    }
  };

  const handleDelete = async () => {
    if (!id || (!isAdmin && user?.uid !== activityCreatorId)) return;

    if (window.confirm(t.areYouSure)) {
      try {
        const response = await api.delete(`/activities/${id}`);
        if (response.status === 204) {
          alert(t.activityDeleted);
          navigate('/');
        } else {
          alert(response.error || t.error);
        }
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
            value={formData.startDate}
            onChange={handleChange}
            required
          />

          <label>{t.endTimeLabel}:</label>
          <input
            type="datetime-local"
            name="endDate"
            value={formData.endDate}
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