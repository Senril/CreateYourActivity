export interface Activity {
  id?: string;
  title: string;
  description?: string;
  location: string;
  startDate: string;
  endDate: string;
  maxPeople: number;
  people: string[];
  creatorId: string;
  creatorEmail: string;
  createdAt?: string;
    category: string;
  likes: string[];
  dislikes: string[];

}