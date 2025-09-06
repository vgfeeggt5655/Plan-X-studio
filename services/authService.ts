// src/services/authService.ts
import { User, Todo } from '../types';

const API_URL = 'https://script.google.com/macros/s/AKfycbwMCPhSKNab-CvtYfY114MdFqcuDS-SkmM3tlgfAr-Osjfxo0VJ04B76cRzgTiW9bmVUg/exec';

// ===== Users =====
export const getUsers = async (): Promise<User[]> => {
  const response = await fetch(`${API_URL}?action=get`);
  if (!response.ok) throw new Error('Failed to fetch users');
  const data = await response.json();
  return (data.data || []).map((u: any) => ({ ...u, id: String(u.id) }));
};

export const loginUser = async (email: string, password: string): Promise<User> => {
  const users = await getUsers();
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) throw new Error("User not found.");
  if (String(user.password).trim() !== String(password).trim()) throw new Error("Incorrect password.");
  return user;
};

export const createUser = async (user: Omit<User, 'id'>): Promise<void> => {
  const formData = new FormData();
  formData.append('action', 'create');
  formData.append('name', user.name);
  formData.append('email', user.email);
  formData.append('password', user.password || '');
  formData.append('role', user.role || '');
  formData.append('watched', user.watched || '{}');
  formData.append('todo_list', user.todo_list || '[]');
  if (user.avatar) formData.append('avatar', user.avatar);

  await fetch(API_URL, { method: 'POST', mode: 'no-cors', body: formData });
};

export const updateUser = async (user: User): Promise<void> => {
  const formData = new FormData();
  formData.append('action', 'update');
  formData.append('id', user.id);
  formData.append('name', user.name);
  formData.append('email', user.email);
  formData.append('password', user.password || '');
  formData.append('role', user.role || '');
  if (user.avatar) formData.append('avatar', user.avatar);
  if (user.watched) formData.append('watched', user.watched);
  if (user.todo_list) formData.append('todo_list', user.todo_list);

  await fetch(API_URL, { method: 'POST', mode: 'no-cors', body: formData });
};

export const deleteUser = async (id: string): Promise<void> => {
  const formData = new FormData();
  formData.append('action', 'delete');
  formData.append('id', id);

  await fetch(API_URL, { method: 'POST', mode: 'no-cors', body: formData });
};

// ===== Todos =====
export const getUserTodos = async (userId: string): Promise<Todo[]> => {
  const users = await getUsers();
  const user = users.find(u => String(u.id) === String(userId));
  if (!user) return [];
  try {
    return user.todo_list ? JSON.parse(user.todo_list) : [];
  } catch {
    return [];
  }
};

export const updateUserTodos = async (userId: string, todos: Todo[]): Promise<void> => {
  const formData = new FormData();
  formData.append('action', 'update');
  formData.append('id', String(userId));
  formData.append('todo_list', JSON.stringify(todos));

  await fetch(API_URL, { method: 'POST', mode: 'no-cors', body: formData });
};
