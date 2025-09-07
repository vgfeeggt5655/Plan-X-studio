import { User } from '../types';

const API_URL = 'https://script.google.com/macros/s/AKfycbwMCPhSKNab-CvtYfY114MdFqcuDS-SkmM3tlgfAr-Osjfxo0VJ04B76cRzgTiW9bmVUg/exec';

// Helper: POST JSON
async function post(body: any) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (data.error) throw new Error(data.message || 'Request failed');
  return data;
}

// Register user
export async function createUser(user: Omit<User, 'id'>): Promise<void> {
  await post({ action: 'register', ...user });
}

// Login user
export async function loginUser(email: string, password: string): Promise<User> {
  const data = await post({ action: 'login', email, password });
  return data.user;
}

// Get users (if super_admin → كل اليوزرز، لو عادي → نفسه فقط)
export async function getUsers(email: string, password: string): Promise<User[]> {
  const data = await post({ action: 'getusers', email, password });
  if (data.users) return data.users;
  if (data.user) return [data.user];
  return [];
}

// Update user
export async function updateUser(requesterEmail: string, password: string, updates: Partial<User> & { targetEmail?: string; targetId?: string }): Promise<void> {
  await post({ action: 'updateuser', email: requesterEmail, password, ...updates });
}

// Delete user
export async function deleteUser(requesterEmail: string, password: string, targetId?: string, targetEmail?: string): Promise<void> {
  await post({ action: 'deleteuser', email: requesterEmail, password, targetId, targetEmail });
}
