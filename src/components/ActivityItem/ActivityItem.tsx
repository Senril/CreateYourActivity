import { Link } from 'react-router-dom';
import './ActivityItem.css';
import { useLanguage } from '../../context/LanguageContext';

interface Activity {
  id: string;
  title: string;
  location: string;
  startDate: string;
  endDate: string;
  maxPeople: number;
  people: string[];
  creatorId: string;
  creatorEmail: string;
}

interface ActivityItemProps {
  activity: Activity;
  currentUserId: string;
  onDelete: (id: string) => void;
}

export default function ActivityItem({ activity, currentUserId, onDelete }: ActivityItemProps) {
  const { t } = useLanguage();
  const now = new Date();
  const startDate = new Date(activity.startDate);
  const endDate = new Date(activity.endDate);
  
  let statusColor = 'gray';
  let statusText = '';
  
  if (now < startDate) {
    statusColor = 'orange';
    statusText = t.upcoming;
  } else if (now > endDate) {
    statusColor = 'red';
    statusText = t.finished;
  } else {
    statusColor = 'green';
    statusText = t.active;
  }

  const canDelete = activity.creatorId === currentUserId;
  const isParticipating = activity.people.includes(currentUserId);

  return (
    <div className="activity-item">
      <div className="activity-header">
        <h3>{activity.title}</h3>
        {canDelete && (
          <button 
            onClick={() => onDelete(activity.id)}
            className="delete-btn"
          >
            {t.delete}
          </button>
        )}
      </div>
      <div className="activity-meta">
        <span>📍 {activity.location}</span>
        <span>⏱️ {startDate.toLocaleString()} - {endDate.toLocaleString()}</span>
        <span>👥 {activity.people.length}/{activity.maxPeople}</span>
        <span>✉️ Создатель: {activity.creatorEmail}</span>
        {isParticipating && (
          <div className="participation-badge">{t.youParticipate}</div>
        )}
        <div className="status-indicator">
          <span 
            className="status-dot" 
            style={{ backgroundColor: statusColor }}
          />
          <span className="status-text">{statusText}</span>
        </div>
      </div>
      <Link to={`/activity/${activity.id}`} className="details-btn">
        {t.viewDetails}
      </Link>
    </div>
  );
}