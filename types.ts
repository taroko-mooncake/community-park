
export enum TaskStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED'
}

export enum ViewState {
  HOME = 'HOME',
  PARKS = 'PARKS',
  PARK_DETAIL = 'PARK_DETAIL',
  ASSISTANT = 'ASSISTANT'
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  volunteers: string[]; // List of names
  date: string;
  urgency: 'Low' | 'Medium' | 'High';
}

export interface Park {
  id: string;
  name: string;
  location: string;
  description: string;
  tasks: Task[];
  googleMapsUrl?: string;
  lat?: number;
  lng?: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  isThinking?: boolean;
}