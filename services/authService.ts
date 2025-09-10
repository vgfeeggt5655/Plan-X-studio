// authService.ts (modified)

import { User } from '../types';

const API_URL = 'https://script.google.com/macros/s/AKfycbxKHbLHjNBhbhXDVuMXWLBjkK1_tbySpc7JoTcwbSjB9HrvZ0oGRaLHhss9eiLPWWlD2w/exec';

// Get all users (only for super_admin)
export const getUsers = async (authEmail: string, authPassword: string): Promise<User[]> => {
  const response = await fetch(`${API_URL}?action=get_users&email=${encodeURIComponent(authEmail)}&password=${encodeURIComponent(authPassword)}`);
  if (!response.ok) throw new Error('Failed to fetch users');
  const data = await response.json();
  if (data.error) throw new Error(data.message);
  const users = data.data || [];
  return users.map((user: any) => ({ ...user, id: String(user.id) }));
};

// Login user (returns single user if credentials match)
export const loginUser = async (email: string, password: string): Promise<User> => {
  const response = await fetch(`${API_URL}?action=login&email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`);
  if (!response.ok) throw new Error('Failed to login');
  const data = await response.json();
  if (data.error) throw new Error(data.message);
  return { ...data.data, id: String(data.data.id) };
};

// Create user
export const createUser = async (user: Omit<User, 'id'>): Promise<void> => {
  const formData = new FormData();
  formData.append('action', 'create');
  formData.append('name', user.name);
  formData.append('email', user.email);
  formData.append('password', user.password);
  formData.append('role', user.role);
  formData.append('watched', user.watched || '{}');
  if (user.avatar) formData.append('avatar', user.avatar);

  await fetch(API_URL, { method: 'POST', mode: 'no-cors', body: formData });
};

// Update user (requires auth credentials; can be self or super_admin)
export const updateUser = async (user: User, authEmail: string, authPassword: string): Promise<void> => {
  const formData = new FormData();
  formData.append('action', 'update');
  formData.append('id', user.id);
  formData.append('name', user.name);
  formData.append('email', user.email);
  formData.append('password', user.password);
  formData.append('role', user.role);
  if (user.avatar) formData.append('avatar', user.avatar);
  if (user.watched) formData.append('watched', user.watched);
  if (user.todo_list) formData.append('todo_list', user.todo_list);
  formData.append('auth_email', authEmail);
  formData.append('auth_password', authPassword);

  await fetch(API_URL, { method: 'POST', mode: 'no-cors', body: formData });
};

// Delete user (requires super_admin auth)
export const deleteUser = async (id: string, authEmail: string, authPassword: string): Promise<void> => {
  const formData = new FormData();
  formData.append('action', 'delete');
  formData.append('id', id);
  formData.append('auth_email', authEmail);
  formData.append('auth_password', authPassword);

  await fetch(API_URL, { method: 'POST', mode: 'no-cors', body: formData });
};

/* ================== Todo List Methods ================== */

// Get todo list of a user by ID (requires auth; self or super_admin)
export const getUserTodoList = async (userId: string, authEmail: string, authPassword: string): Promise<any> => {
  let targetUser;
  try {
    const users = await getUsers(authEmail, authPassword);
    targetUser = users.find(u => u.id === userId);
  } catch {
    const user = await loginUser(authEmail, authPassword);
    if (user.id !== userId) throw new Error('Unauthorized');
    targetUser = user;
  }
  if (!targetUser) throw new Error('User not found');
  try {
    return targetUser.todo_list ? JSON.parse(targetUser.todo_list) : {};
  } catch {
    return {};
  }
};

// Update todo list of a user by ID (requires auth; self or super_admin)
export const updateUserTodoList = async (userId: string, todoList: any, authEmail: string, authPassword: string): Promise<void> => {
  const formData = new FormData();
  formData.append('action', 'update');
  formData.append('id', userId);
  formData.append('todo_list', JSON.stringify(todoList || {}));
  formData.append('auth_email', authEmail);
  formData.append('auth_password', authPassword);

  await fetch(API_URL, { method: 'POST', mode: 'no-cors', body: formData });
};
