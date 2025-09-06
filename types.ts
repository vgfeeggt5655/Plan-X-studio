export interface Resource {
  id: string;
  title: string;
  Subject_Name: string;
  video_link: string;
  pdf_link: string;
  image_url: string;
}

export interface ToDoItem {
  id: string;          // unique id
  task: string;        // نص المهمة
  date: string;        // YYYY-MM-DD
  completed: boolean;  // حالة الإنجاز
}


export interface User {
  id: string;
  name: string;
  email: string;
  // WARNING: Storing plain-text passwords is a major security risk.
  password: string;
  role: 'user' | 'admin' | 'super_admin';
  avatar?: string;
  watched?: string; // JSON string like '{"resourceId": seconds}'
  todo_list?: string; // JSON string array of Task objects
}

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
