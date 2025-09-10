import { User } from '../types';

const API_URL = 'https://script.google.com/macros/s/AKfycbwMCPhSKNab-CvtYfY114MdFqcuDS-SkmM3tlgfAr-Osjfxo0VJ04B76cRzgTiW9bmVUg/exec';

// Helper to parse response and return data array
async function fetchJson(url: string, options?: RequestInit): Promise<any> {
  const response = await fetch(url, options);
  if (!response.ok) {
    const txt = await response.text().catch(()=> '');
    throw new Error('Request failed: ' + response.status + ' ' + txt);
  }
  const data = await response.json();
  return data;
}

// Get all users (full sheet). Keep for admin pages.
export const getUsers = async (): Promise<User[]> => {
  const res = await fetchJson(`${API_URL}?action=get`);
  const users = res.data || [];
  return users.map((user: any) => ({ ...user, id: String(user.id) }));
};

// Login user
export const loginUser = async (email: string, password: string): Promise<User> => {
  // call server with email+password so server returns only needed data
  const url = `${API_URL}?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`;
  const res = await fetchJson(url);
  if (res.error) throw new Error(res.message || 'Login failed');
  const data = res.data || [];
  if (!Array.isArray(data) || data.length === 0) throw new Error('User not found or wrong credentials');
  // if super_admin the server returns ALL rows; in that case find the matching user
  const found = data.find((u: any) => String(u.email || '').toLowerCase() === email.toLowerCase());
  const user = found || data[0];
  return { ...user, id: String(user.id) } as User;
};

// Create user
export const createUser = async (user: Omit<User, 'id'>): Promise<User> => {
  // Use FormData to support avatar if present. Do not use mode:'no-cors' so we can read response.
  const formData = new FormData();
  formData.append('action', 'create');
  formData.append('name', user.name);
  formData.append('email', user.email);
  formData.append('password', user.password);
  formData.append('role', user.role || '');
  formData.append('watched', user.watched || '{}');
  if ((user as any).avatar) formData.append('avatar', (user as any).avatar);

  const res = await fetchJson(API_URL, { method: 'POST', body: formData });
  if (res.error) throw new Error(res.message || 'Create user failed');
  // server returns created user in res.data
  const created = res.data || {};
  return { ...created, id: String(created.id) } as User;
};

// Update user
export const updateUser = async (user: User): Promise<User> => {
  const formData = new FormData();
  formData.append('action', 'update');
  formData.append('id', user.id);
  formData.append('name', user.name);
  formData.append('email', user.email);
  formData.append('password', user.password);
  formData.append('role', user.role);
  if ((user as any).avatar) formData.append('avatar', (user as any).avatar);
  if (user.watched) formData.append('watched', user.watched);
  if (user.todo_list) formData.append('todo_list', user.todo_list);

  const res = await fetchJson(API_URL, { method: 'POST', body: formData });
  if (res.error) throw new Error(res.message || 'Update failed');
  const updated = res.data || {};
  return { ...updated, id: String(updated.id || user.id) } as User;
};

// Delete user
export const deleteUser = async (id: string): Promise<void> => {
  const formData = new FormData();
  formData.append('action', 'delete');
  formData.append('id', id);

  const res = await fetchJson(API_URL, { method: 'POST', body: formData });
  if (res.error) throw new Error(res.message || 'Delete failed');
  return;
};

/* ================== Todo List Methods ================== */

// Get todo list of a user by ID
export const getUserTodoList = async (userId: string): Promise<any> => {
  const users = await getUsers();
  const user = users.find(u => u.id === userId);
  if (!user) throw new Error('User not found');
  try {
    return user.todo_list ? JSON.parse(user.todo_list) : {};
  } catch {
    return {};
  }
};

// Update todo list of a user by ID
export const updateUserTodoList = async (userId: string, todoList: any): Promise<void> => {
  const userList = await getUsers();
  const currentUser = userList.find(u => u.id === userId);
  if (!currentUser) throw new Error('User not found');

  currentUser.todo_list = JSON.stringify(todoList || {});

  const formData = new FormData();
  formData.append('action', 'update');
  formData.append('id', currentUser.id);
  formData.append('todo_list', currentUser.todo_list);

  const res = await fetchJson(API_URL, { method: 'POST', body: formData });
  if (res.error) throw new Error(res.message || 'Update todo failed');
  return;
};
