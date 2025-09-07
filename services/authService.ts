import { User } from '../types';

const API_URL =
  'https://script.google.com/macros/s/AKfycbwMCPhSKNab-CvtYfY114MdFqcuDS-SkmM3tlgfAr-Osjfxo0VJ04B76cRzgTiW9bmVUg/exec';

// Get user by ID
export const getUserById = async (id: string): Promise<User> => {
  const response = await fetch(`${API_URL}?action=getUser&id=${id}`);
  if (!response.ok) throw new Error('Failed to fetch user');
  const data = await response.json();
  if (data.error) throw new Error(data.error);
  return { ...data, id: String(data.id) };
};

// Login user
export const loginUser = async (
  email: string,
  password: string
): Promise<User> => {
  const response = await fetch(
    `${API_URL}?action=login&email=${encodeURIComponent(
      email
    )}&password=${encodeURIComponent(password)}`
  );
  if (!response.ok) throw new Error('Login request failed');
  const data = await response.json();
  if (data.error) throw new Error(data.error);
  return { ...data, id: String(data.id) };
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

  await fetch(API_URL, { method: 'POST', body: formData });
};

// Update user
export const updateUser = async (user: User): Promise<void> => {
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

  await fetch(API_URL, { method: 'POST', body: formData });
};

// Delete user
export const deleteUser = async (id: string): Promise<void> => {
  const formData = new FormData();
  formData.append('action', 'delete');
  formData.append('id', id);

  await fetch(API_URL, { method: 'POST', body: formData });
};

/* ================== Todo List Methods ================== */

// Get todo list of a user by ID
export const getUserTodoList = async (userId: string): Promise<any> => {
  const user = await getUserById(userId);
  try {
    return user.todo_list ? JSON.parse(user.todo_list) : {};
  } catch {
    return {};
  }
};

// Update todo list of a user by ID
export const updateUserTodoList = async (
  userId: string,
  todoList: any
): Promise<void> => {
  const formData = new FormData();
  formData.append('action', 'update');
  formData.append('id', userId);
  formData.append('todo_list', JSON.stringify(todoList || {}));

  await fetch(API_URL, { method: 'POST', body: formData });
};
