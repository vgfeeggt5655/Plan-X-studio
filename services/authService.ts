import { User } from '../types';

const API_URL = 'https://script.google.com/macros/s/AKfycbxKHbLHjNBhbhXDVuMXWLBjkK1_tbySpc7JoTcwbSjB9HrvZ0oGRaLHhss9eiLPWWlD2w/exec';

// Get all users (now with auth)
export const getUsers = async (email: string, password: string): Promise<User[]> => {
  const response = await fetch(`${API_URL}?action=get&email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`);
  if (!response.ok) throw new Error('Failed to fetch users');
  const data = await response.json();
  if (data.error) throw new Error(data.message);
  const users = data.data || [];
  return users.map((user: any) => ({ ...user, id: String(user.id) }));
};

// Login user
export const loginUser = async (email: string, password: string): Promise<User> => {
  // هنا نطلب بيانات المستخدم الذي يقوم بتسجيل الدخول فقط
  const response = await fetch(`${API_URL}?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`);
  const data = await response.json();
  if (data.error) throw new Error(data.message);
  
  const user = data.data && data.data[0];
  if (!user) throw new Error("User not found or incorrect credentials.");
  
  return { ...user, id: String(user.id) };
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
  formData.append('todo_list', user.todo_list || '{}'); // تأكد من إرسال هذا
  if (user.avatar) formData.append('avatar', user.avatar);

  await fetch(API_URL, { method: 'POST', mode: 'no-cors', body: formData });
};

// Update user
export const updateUser = async (user: User): Promise<void> => {
  const formData = new FormData();
  formData.append('action', 'update');
  formData.append('id', user.id);
  // أضف جميع الحقول هنا لتجنب حذفها
  formData.append('name', user.name);
  formData.append('email', user.email);
  formData.append('password', user.password);
  formData.append('role', user.role);
  formData.append('watched', user.watched || '{}');
  formData.append('todo_list', user.todo_list || '{}');
  if (user.avatar) formData.append('avatar', user.avatar);

  await fetch(API_URL, { method: 'POST', mode: 'no-cors', body: formData });
};

// Delete user
export const deleteUser = async (id: string): Promise<void> => {
  const formData = new FormData();
  formData.append('action', 'delete');
  formData.append('id', id);

  await fetch(API_URL, { method: 'POST', mode: 'no-cors', body: formData });
};

/* ================== Todo List Methods ================== */

// Get todo list of a user by ID
export const getUserTodoList = async (userId: string, email: string, password: string): Promise<any> => {
  // استخدم دالة loginUser للحصول على بيانات المستخدم فقط
  const user = await loginUser(email, password);
  
  if (user.id !== userId) throw new Error('Unauthorized access');
  
  try {
    return user.todo_list ? JSON.parse(user.todo_list) : {};
  } catch {
    return {};
  }
};

// Update todo list of a user by ID
export const updateUserTodoList = async (userId: string, todoList: any, email: string, password: string): Promise<void> => {
  // استخدم دالة loginUser للحصول على بيانات المستخدم الحالية
  const user = await loginUser(email, password);
  
  if (user.id !== userId) throw new Error('Unauthorized access');

  user.todo_list = JSON.stringify(todoList || {});

  const formData = new FormData();
  formData.append('action', 'update');
  formData.append('id', user.id);
  // أضف كل الحقول الأخرى لمنع حذفها
  formData.append('name', user.name);
  formData.append('email', user.email);
  formData.append('password', user.password);
  formData.append('role', user.role);
  formData.append('watched', user.watched || '{}');
  formData.append('todo_list', user.todo_list);

  await fetch(API_URL, { method: 'POST', mode: 'no-cors', body: formData });
};
