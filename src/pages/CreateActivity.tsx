import { useState, FormEvent, ChangeEvent } from 'react';
import { api } from '../services/api';
import BurgerMenu from '../components/BurgerMenu/BurgerMenu';
import './CreateActivity.css';
import { useLanguage } from '../context/LanguageContext';
import { useAdmin } from '../context/AdminContext';
import { categoryTranslations } from '../translations/categories';

interface FormData {
  title: string;
  location: string;
  startDate: string;
  endDate: string;
  description: string;
  maxPeople: number;
  category: string;
}

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

export default function CreateActivity() {
  const { t, language } = useLanguage();
  const { user } = useAdmin();
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const finalMaxPeople = unlimitedPeople ? 0 : formData.maxPeople;

    const payload = {
      ...formData,
      maxPeople: finalMaxPeople,
      // Преобразуем строки в ISO-8601
      startDate: new Date(formData.startDate).toISOString(),
      endDate: new Date(formData.endDate).toISOString(),
    };

    try {
      const response = await api.post('/activities', payload);
      if (response.status === 201) {
        alert(t.activityCreated || 'Активность создана!');
        window.location.href = '/';
      } else {
        alert(response.error || t.error);
      }
    } catch (error) {
      console.error('Ошибка создания активности', error);
      alert(t.error);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.type === 'number' ? parseInt(e.target.value) : e.target.value
    });
  };

  const handleUnlimitedChange = () => {
    setUnlimitedPeople(!unlimitedPeople);
    if (!unlimitedPeople) {
      setFormData({
        ...formData,
        maxPeople: 0
      });
    } else {
      setFormData({
        ...formData,
        maxPeople: 10
      });
    }
  };

  return (
    <div className="create-page">
      <BurgerMenu />
      <div className="content">
        <h1>{t.createActivity}</h1>
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
                  value={formData.maxPeople}
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
          />

          <button type="submit">{t.create}</button>
        </form>
      </div>
    </div>
  );
}