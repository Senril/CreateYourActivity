import { useState, FormEvent, ChangeEvent } from 'react';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../services/firebase';
import BurgerMenu from '../components/BurgerMenu/BurgerMenu';
import './CreateActivity.css';
import { useLanguage } from '../context/LanguageContext';

interface FormData {
  title: string;
  location: string;
  startDate: string;
  endDate: string;
  description: string;
  maxPeople: number;
}

export default function CreateActivity() {
  const { t, user } = useLanguage();
  const [formData, setFormData] = useState<FormData>({
    title: '',
    location: '',
    startDate: '',
    endDate: '',
    description: '',
    maxPeople: 1
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    await addDoc(collection(db, 'activities'), {
      ...formData,
      people: [],
      creatorId: user.uid,
      creatorEmail: user.email,
      createdAt: new Date().toISOString()
    });
    window.location.href = '/';
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.type === 'number' ? parseInt(e.target.value) : e.target.value
    });
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
          <input
            type="number"
            name="maxPeople"
            value={formData.maxPeople}
            onChange={handleChange}
            min="1"
            max="999"
            placeholder={t.maxPeople}
            required
          />
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