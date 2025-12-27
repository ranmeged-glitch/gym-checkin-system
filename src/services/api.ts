import { Resident, Trainer, CheckInRecord, User, SystemUser } from '../types';
import { initialResidents, initialTrainers } from '../mockData';

const networkDelay = () => new Promise(resolve => setTimeout(resolve, 600));

// שימוש ב-LocalStorage כדי שהנתונים יישמרו גם אחרי רענון דף
const getStoredData = (key: string, fallback: any) => {
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : fallback;
};

const setStoredData = (key: string, data: any) => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const residentService = {
  getAll: async (): Promise<Resident[]> => {
    await networkDelay();
    return getStoredData('residents', initialResidents);
  },
  saveAll: async (residents: Resident[]): Promise<void> => {
    await networkDelay();
    setStoredData('residents', residents);
  },
  add: async (resident: Resident): Promise<Resident> => {
    await networkDelay();
    const residents = await residentService.getAll();
    const newResident = { ...resident, id: Date.now().toString() };
    setStoredData('residents', [...residents, newResident]);
    return newResident;
  }
};

export const trainerService = {
  getAll: async (): Promise<Trainer[]> => {
    await networkDelay();
    return getStoredData('trainers', initialTrainers);
  }
};

export const checkInService = {
  getAll: async (): Promise<CheckInRecord[]> => {
    await networkDelay();
    return getStoredData('checkins', []);
  },
  add: async (record: CheckInRecord): Promise<void> => {
    await networkDelay();
    const checkins = await checkInService.getAll();
    setStoredData('checkins', [...checkins, record]);
  }
};

export const authService = {
  login: async (username: string, password: string): Promise<User | null> => {
    // לוגיקת כניסה פשוטה לדוגמה
    if (username === 'admin' && password === '1234') {
      return { id: '1', username: 'admin', role: 'ADMIN' as any, name: 'מנהל' };
    }
    return null;
  }
};