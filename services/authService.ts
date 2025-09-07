import { User } from '../types';

const API_URL =
  'https://script.google.com/macros/s/AKfycbwMCPhSKNab-CvtYfY114MdFqcuDS-SkmM3tlgfAr-Osjfxo0VJ04B76cRzgTiW9bmVUg/exec';

// Helper to send requests
async function request(
  method: string,
  endpoint: string = '',
  params: Record<string, string> = {},
  body?: any
) {
  const urlParams = new URLSearchParams(params).toString();
  const url = `${API_URL}${endpoint ? '/' + endpoint : ''}${
    urlParams ? '?' + urlParams : ''
  }`;

  const options: RequestInit = { method };
  if (body) {
    options.headers = { 'Content-Type': 'application/json' };
    options.body = JSON.stringify(body);
  }

  const res = await fetch(url, options);
  if (!res.ok) throw new Error('API request failed');
  return res.json();
}

// Get all users (only for super_admin)
export const getUsers = async (currentUser: User): Promise<User[]> => {
  const data = await request('GET', '', {
    id: currentUser.id,
    role: currentUser.role,
  });

  if (currentUser.role === 'super_admin') {
    return data.users || [];
  } else {
    return data.user ? [data.user] : [];
  }
};

// Login user
export const loginUser = async (
  email: string,
  password: string
): Promise<User> => {
  // fetch all users as super_admin just for login check
  const data = await request('GET', '', { id: '0', role: 'super_admin' });
  const users: User[] = data.users || [];

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
  await request('POST', '', {}, user);
};

// Update user (self or by super_admin)
export const updateUser = async (
  currentUser: User,
  updatedUser: User
): Promise<void> => {
  await request(
    'PUT',
    '',
    { id: currentUser.id, role: currentUser.role },
    {
      targetId: updatedUser.id,
      ...updatedUser,
    }
  );
};

// Delete user (self or by super_admin)
export const deleteUser = async (
  currentUser: User,
  targetId: string
): Promise<void> => {
  await request('DELETE', '', {
    id: currentUser.id,
    role: currentUser.role,
    targetId,
  });
};

/* ================== Todo List Methods ================== */

// Get todo list of a user
export const getUserTodoList = async (
  currentUser: User,
  userId: string
): Promise<any> => {
  const data = await request('GET', '', {
    id: currentUser.id,
    role: currentUser.role,
  });

  let targetUser: User | undefined;

  if (currentUser.role === 'super_admin') {
    targetUser = (data.users || []).find((u: User) => u.id === userId);
  } else {
    targetUser = data.user;
  }

  if (!targetUser) throw new Error('User not found');
  try {
    return targetUser.todo_list ? JSON.parse(targetUser.todo_list) : {};
  } catch {
    return {};
  }
};

// Update todo list
export const updateUserTodoList = async (
  currentUser: User,
  userId: string,
  todoList: any
): Promise<void> => {
  await request(
    'PUT',
    '',
    { id: currentUser.id, role: currentUser.role },
    {
      targetId: userId,
      todo_list: JSON.stringify(todoList || {}),
    }
  );
};
