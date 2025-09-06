import { User } from '../types';

const API_URL =
  'https://script.google.com/macros/s/AKfycbwMCPhSKNab-CvtYfY114MdFqcuDS-SkmM3tlgfAr-Osjfxo0VJ04B76cRzgTiW9bmVUg/exec';

export const getUsers = async (): Promise<User[]> => {
  const res = await fetch(`${API_URL}?action=get`);
  if (!res.ok) throw new Error('Failed to fetch users');
  const data = await res.json();
  return data.data.map((user: any) => ({
    id: String(user.id),
    name: user.name,
    email: user.email,
    password: user.password,
    role: user.role,
    avatar: user.avatar || '',
    watched: user.watched || '{}',
    todo_list: user.todo_list || '[]', // جديد: افتراضي مصفوفة JSON
  })) as User[];
};

export const loginUser = async (
  email: string,
  password: string
): Promise<User | null> => {
  const users = await getUsers();
  const user = users.find(
    (u) => u.email === email && u.password === password
  );
  return user || null;
};

export const createUser = async (user: User): Promise<void> => {
  const formData = new FormData();
  formData.append('action', 'add');
  formData.append('id', user.id);
  formData.append('name', user.name);
  formData.append('email', user.email);
  formData.append('password', user.password);
  formData.append('role', user.role);
  if (user.avatar) formData.append('avatar', user.avatar);
  if (user.watched) formData.append('watched', user.watched);
  if (user.todo_list) formData.append('todo_list', user.todo_list);

  await fetch(API_URL, {
    method: 'POST',
    mode: 'no-cors',
    body: formData,
  });
};

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

  await fetch(API_URL, {
    method: 'POST',
    mode: 'no-cors',
    body: formData,
  });
};

// جديد: تحديث مهمة واحدة داخل todo_list
export const updateUserTodo = async (userId: string, todoList: any[]): Promise<void> => {
  const formData = new FormData();
  formData.append('action', 'update');
  formData.append('id', userId);
  formData.append('todo_list', JSON.stringify(todoList));

  await fetch(API_URL, {
    method: 'POST',
    mode: 'no-cors',
    body: formData,
  });
};
