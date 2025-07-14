export interface Activity {
    id?: string; // Опциональное поле, так как его нет при создании, но есть при получении из Firestore
    title: string;
    description: string;
    location: string;
    startDate: string;
    endDate: string;
    maxPeople: number;
    people: string[]; // Массив ID пользователей или их имен
    creatorId: string;
    creatorEmail: string;
  }