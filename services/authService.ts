import { User } from '../types';

const API_URL = 'https://script.google.com/macros/s/AKfycbwMCPhSKNab-CvtYfY114MdFqcuDS-SkmM3tlgfAr-Osjfxo0VJ04B76cRzgTiW9bmVUg/exec';

// Helper: safe parse JSON
async function safeJson(res: Response) {
  try { return await res.json(); } catch { return null; }
}

// Get all users (admin use)
export const getUsers = async (): Promise<User[]> => {
  const response = await fetch(`${API_URL}?action=get`);
  if (!response.ok) throw new Error('Failed to fetch users');
  const data = await response.json();
  const users = data.data || [];
  return users.map((user: any) => ({ ...user, id: String(user.id) }));
};

// Login user using email+password query (API will return only the matching user or all rows if super_admin)
export const loginUser = async (email: string, password: string): Promise<User> => {
  const url = `${API_URL}?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Login request failed');
  const data = await response.json();
  if (data.error) throw new Error(data.message || 'Login failed');

  // If super_admin, API returns data: all rows and me: user
  if (data.me && String(data.me.role).toLowerCase() === 'super_admin') {
    // Keep 'me' as authenticated user but return me to caller
    return { ...data.me, id: String(data.me.id) } as User;
  }

  const userEntry = (Array.isArray(data.data) && data.data.length > 0) ? data.data[0] : null;
  if (!userEntry) throw new Error('User not found.');
  return { ...userEntry, id: String(userEntry.id) } as User;
};

// Create user -> returns created user object
export const createUser = async (user: Omit<User, 'id'>): Promise<User> => {
  const formData = new FormData();
  formData.append('action', 'create');
  formData.append('name', user.name || '');
  formData.append('email', user.email || '');
  formData.append('password', user.password || '');
  formData.append('role', user.role || '');
  formData.append('watched', user.watched || '{}');
  if (user.avatar) formData.append('avatar', user.avatar);

  const res = await fetch(API_URL, { method: 'POST', body: formData });
  if (!res.ok) throw new Error('Create user failed');
  const data = await res.json();
  if (data.error) throw new Error(data.message || 'Create failed');
  // server returns created object under data
  const created = data.data || {};
  return { ...created, id: String(created.id) } as User;
};

// Update user
export const updateUser = async (user: User): Promise<void> => {
  const formData = new FormData();
  formData.append('action', 'update');
  formData.append('id', user.id);
  if (user.name !== undefined) formData.append('name', user.name);
  if (user.email !== undefined) formData.append('email', user.email);
  if (user.password !== undefined) formData.append('password', user.password);
  if (user.role !== undefined) formData.append('role', user.role);
  if (user.avatar !== undefined) formData.append('avatar', user.avatar as any);
  if (user.watched !== undefined) formData.append('watched', user.watched as any);
  if (user.todo_list !== undefined) formData.append('todo_list', user.todo_list as any);

  const res = await fetch(API_URL, { method: 'POST', body: formData });
  if (!res.ok) throw new Error('Update request failed');
  const data = await res.json();
  if (data.error) throw new Error(data.message || 'Update failed');
};

// Delete user
export const deleteUser = async (id: string): Promise<void> => {
  const formData = new FormData();
  formData.append('action', 'delete');
  formData.append('id', id);

  const res = await fetch(API_URL, { method: 'POST', body: formData });
  if (!res.ok) throw new Error('Delete request failed');
  const data = await res.json();
  if (data.error) throw new Error(data.message || 'Delete failed');
};

/* ================== Todo List Methods ================== */

// Get todo list of a user by ID
export const getUserTodoList = async (userId: string): Promise<any> => {
  // Prefer fetching single user by id
  const response = await fetch(`${API_URL}?id=${encodeURIComponent(userId)}`);
  if (!response.ok) throw new Error('Failed to fetch user');
  const data = await response.json();
  const users = data.data || [];
  const user = users.find((u: any) => String(u.id) === String(userId));
  if (!user) throw new Error('User not found');
  try {
    return user.todo_list ? JSON.parse(user.todo_list) : {};
  } catch {
    return {};
  }
};

// Update todo list of a user by ID
export const updateUserTodoList = async (userId: string, todoList: any): Promise<void> => {
  // Fetch current user to preserve other fields if server-side update logic skips empty values
  const response = await fetch(`${API_URL}?id=${encodeURIComponent(userId)}`);
  if (!response.ok) throw new Error('Failed to fetch user before update');
  const data = await response.json();
  const users = data.data || [];
  const currentUser = users.find((u: any) => String(u.id) === String(userId));
  if (!currentUser) throw new Error('User not found');

  // Ensure todo_list is stringified
  const todoStr = JSON.stringify(todoList || {});

  const formData = new FormData();
  formData.append('action', 'update');
  formData.append('id', currentUser.id);
  // Only send todo_list so server updates that field and keeps others intact (server ignores empty values)
  formData.append('todo_list', todoStr);

  const res = await fetch(API_URL, { method: 'POST', body: formData });
  if (!res.ok) throw new Error('Failed to update todo list');
  const resJson = await res.json();
  if (resJson.error) throw new Error(resJson.message || 'Update todo failed');
};
