export interface Resource {
  id: string;
  title: string;
  Subject_Name: string;
  video_link: string;
  pdf_link: string;
  image_url: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  // WARNING: Storing plain-text passwords is a major security risk.
  // This is implemented based on the requested Google Sheets structure.
  // In a real application, always use a secure authentication provider and password hashing.
  password: string;
  role: 'user' | 'admin' | 'super_admin';
  avatar?: string;
  watched?: string; // JSON string like '{"resourceId": seconds}'
}


// types.ts
export type Resource = {
  id: string;
  title: string;
  Subject_Name: string;
  video_link?: string;
  pdf_link?: string;
  image_url?: string;
  // ... أي حقول تانية عندك
};

export type Subject = {
  id: string;
  Subject_Name: string;
  number: number;
  // ...
};

export type WatchedProgress = { time: number; duration: number };

export type Todo = {
  id?: string;            // uuid محلي أو رقم السطر
  title: string;
  date: string;          // ISO date string (yyyy-mm-dd) أو full ISO
  status: 'pending' | 'done';
  rating?: number;       // 1-5
  notes?: string;
  createdAt?: string;
};

export type User = {
  id: string;
  name: string;
  email: string;
  password?: string;
  role?: string;
  avatar?: string;
  watched?: string;
  todo_list?: string; // serialized JSON in sheet
  // ... أي حقول تانية
};


export interface Subject {
  id: string;
  Subject_Name: string;
  number: number;
}

export interface MCQ {
  question: string;
  options: string[];
  correctAnswer: string;
}

export interface Flashcard {
  front: string;
  back: string;
}
