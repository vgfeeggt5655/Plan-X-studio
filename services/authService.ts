import { User } from '../types';

const API_URL =
  'https://script.google.com/macros/s/AKfycbwMCPhSKNab-CvtYfY114MdFqcuDS-SkmM3tlgfAr-Osjfxo0VJ04B76cRzgTiW9bmVUg/exec';

// Get all users
export const getUsers = async (requester?: User): Promise<User[]> => {
  const response = await fetch(`${API_URL}?action=get`);
  if (!response.ok) throw new Error('Failed to fetch users');
  const data = await response.json();
  let users: User[] = (data.data || []).map((user: any) => ({
    ...user,
    id: String(user.id),
  }));

  // لو اللى طالب Super Admin يرجعله كل الناس
  if (requester && requester.role === 'super_admin') {
    return users;
  }

  // لو مش Super Admin، يرجع يوزر واحد بس
  if (requester) {
    return users.filter((u) => u.id === requester.id);
  }

  return [];
};

// Login user
export const loginUser = async (
  email: string,
  password: string
): Promise<User> => {
  const response = await fetch(`${API_URL}?action=get`);
  if (!response.ok) throw new Error('Failed to fetch users');
  const data = await response.json();
  const users: User[] = (data.data || []).map((user: any) => ({
    ...user,
    id: String(user.id),
  }));

  const user = users.find(
    (u) => u.email.toLowerCase() === email.toLowerCase()
  );
  if (!user) throw new Error('User not found.');
  if (String(user.password).trim() !== String(password).trim())
    throw new Error('Incorrect password.');

  return user;
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

  const response = await fetch(API_URL, { method: 'POST', body: formData });
  if (!response.ok) throw new Error('Failed to update user');
};

// Delete user
export const deleteUser = async (id: string): Promise<void> => {
  const formData = new FormData();
  formData.append('action', 'delete');
  formData.append('id', id);

  const response = await fetch(API_URL, { method: 'POST', body: formData });
  if (!response.ok) throw new Error('Failed to delete user');
};

/* ================== Todo List Methods ================== */

// Get todo list of a user by ID
export const getUserTodoList = async (userId: string): Promise<any> => {
  const response = await fetch(`${API_URL}?action=get`);
  if (!response.ok) throw new Error('Failed to fetch users');
  const data = await response.json();
  const users: User[] = (data.data || []).map((user: any) => ({
    ...user,
    id: String(user.id),
  }));

  const user = users.find((u) => u.id === userId);
  if (!user) throw new Error('User not found');
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
  const response = await fetch(`${API_URL}?action=get`);
  if (!response.ok) throw new Error('Failed to fetch users');
  const data = await response.json();
  const users: User[] = (data.data || []).map((user: any) => ({
    ...user,
    id: String(user.id),
  }));

  const currentUser = users.find((u) => u.id === userId);
  if (!currentUser) throw new Error('User not found');

  currentUser.todo_list = JSON.stringify(todoList || {});

  const formData = new FormData();
  formData.append('action', 'update');
  formData.append('id', currentUser.id);
  formData.append('todo_list', currentUser.todo_list);

  const res = await fetch(API_URL, { method: 'POST', body: formData });
  if (!res.ok) throw new Error('Failed to update todo list');
};
