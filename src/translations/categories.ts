export const categoryTranslations = {
    'Спортивное мероприятие': {
      ru: 'Спортивное мероприятие',
      en: 'Sports event'
    },
    'Концерт': {
      ru: 'Концерт',
      en: 'Concert'
    },
    'Мастер-класс': {
      ru: 'Мастер-класс',
      en: 'Workshop'
    },
    'Встреча': {
      ru: 'Встреча',
      en: 'Meeting'
    },
    'Лекция': {
      ru: 'Лекция',
      en: 'Lecture'
    },
    'Экскурсия': {
      ru: 'Экскурсия',
      en: 'Excursion'
    },
    'Тренировка': {
      ru: 'Тренировка',
      en: 'Training'
    },
    'Игра': {
      ru: 'Игра',
      en: 'Game'
    },
    'Соревнование': {
      ru: 'Соревнование',
      en: 'Competition'
    },
    'Фестиваль': {
      ru: 'Фестиваль',
      en: 'Festival'
    },
    'Выставка': {
      ru: 'Выставка',
      en: 'Exhibition'
    },
    'Киносеанс': {
      ru: 'Киносеанс',
      en: 'Movie screening'
    },
    'Поход': {
      ru: 'Поход',
      en: 'Hike'
    },
    'Волонтёрство': {
      ru: 'Волонтёрство',
      en: 'Volunteering'
    },
    'Другое': {
      ru: 'Другое',
      en: 'Other'
    }
  };
  
  export type CategoryKey = keyof typeof categoryTranslations;
  
  export const getTranslatedCategory = (category: string, language: 'ru' | 'en'): string => {
    return categoryTranslations[category as CategoryKey]?.[language] || category;
  };