import { User } from '../types';

const API_URL = 'https://script.google.com/macros/s/AKfycbyxx36nHAUGjY5kD_AO_6utHsDqjB74Nklh3k8E8eo9-9_--BL5qDfPnGPI34v2DaDW6w/exec';

// Get all users (كما كان)
export const getUsers = async (): Promise<User[]> => {
  const response = await fetch(`${API_URL}?action=get`);
  if (!response.ok) throw new Error('Failed to fetch users');
  const data = await response.json();
  const users = data.data || [];
  return users.map((user: any) => ({ ...user, id: String(user.id) }));
};

// Login user
// الآن يستدعي الـ API ب email و password في الرابط.
// إذا كان المستخدم role = 'super_admin' فسيُرجع الـ API جميع الصفوف.
// نُعيد كائن المستخدم وفيه حقل اختياري allUsers إذا كان super_admin.
export const loginUser = async (email: string, password: string): Promise<User> => {
  const url = `${API_URL}?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`;
  const response = await fetch(url);
  if (!response.ok) {
    // Google Apps Script قد يرجع 200 مع {error:true} لذا نحاول قراءة الـ JSON
    const txt = await response.text().catch(()=>'');
    throw new Error('Failed to login. ' + (txt || response.statusText));
  }
  const data = await response.json();
  if (data.error) throw new Error(data.message || 'Login failed');
  const rows = data.data || [];
  if (!rows || rows.length === 0) throw new Error('User not found');

  // إذا الـ API أعاد كل الشيت (super_admin) فابحث عن الـ user ضمن الصفوف واعده مع allUsers
  const foundIndex = rows.findIndex((r: any) => String(r.email).toLowerCase() === String(email).toLowerCase());
  const foundUser = (foundIndex !== -1) ? rows[foundIndex] : rows[0];

  // ضمّن allUsers في حالة ال super_admin ليتمكن الداشبورد من استخدامه
  const user: any = { ...foundUser, id: String(foundUser.id) };
  if (rows.length > 1) {
    // لو العدد أكبر من 1 فممكن تكون استجابة كاملة للشيت
    user.allUsers = rows.map((r: any) => ({ ...r, id: String(r.id) }));
  }

  return user as User;
};

// Create user
export const createUser = async (user: Omit<User, 'id'>): Promise<User | void> => {
  const formData = new FormData();
  formData.append('action', 'create');
  formData.append('name', user.name);
  formData.append('email', user.email);
  formData.append('password', user.password);
  formData.append('role', user.role);
  formData.append('watched', user.watched || '{}');
  if (user.avatar) formData.append('avatar', user.avatar);

  // أزلت mode:no-cors حتى نتمكن من قراءة الرد (إذا الخادم يسمح)
  const resp = await fetch(API_URL, { method: 'POST', body: formData });
  if (!resp.ok) {
    // حاول قراءة رسالة الخطأ من الجسم
    const txt = await resp.text().catch(()=>'');
    throw new Error('Create user failed. ' + (txt || resp.statusText));
  }
  // نحاول إرجاع المستخدم المنشأ من رد السيرفر لو وُجد
  try {
    const data = await resp.json();
    if (data && data.user) return { ...data.user, id: String(data.user.id) } as User;
  } catch (e) {
    // لو لم يعد JSON فلا نكسر التنفيذ. createUser يمكن أن تُستخدم بدون انتظار رد.
  }
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

  // أزلت mode:no-cors ليتمكن المطوِّر من قراءة الرد عند الحاجة
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
  const user = await getUsers();
  const currentUser = user.find(u => u.id === userId);
  if (!currentUser) throw new Error('User not found');

  currentUser.todo_list = JSON.stringify(todoList || {});

  const formData = new FormData();
  formData.append('action', 'update');
  formData.append('id', currentUser.id);
  formData.append('todo_list', currentUser.todo_list);

  await fetch(API_URL, { method: 'POST', body: formData });
};
