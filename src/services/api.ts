import { Resident, Trainer, CheckInRecord, User, SystemUser } from '../types';
import * as mockData from '../mockData';

const networkDelay = () => new Promise(resolve => setTimeout(resolve, 600));

export const residentService = {
  getAll: async (): Promise<Resident[]> => {
    await networkDelay();
    // בדיקה דינמית אם קיימת פונקציה או מערך ב-mockData
    const data = (mockData as any);
    if (typeof data.getResidents === 'function') return data.getResidents();
    return data.initialResidents || data.residents || [];
  },
  add: async (resident: Resident): Promise<Resident> => {
    await networkDelay();
    const newResident = { ...resident, id: Date.now().toString() };
    return newResident;
  }
};

export const trainerService = {
  getAll: async (): Promise<Trainer[]> => {
    await networkDelay();
    const data = (mockData as any);
    if (typeof data.getTrainers === 'function') return data.getTrainers();
    return data.initialTrainers || data.trainers || [];
  }
};

export const checkInService = {
  getAll: async (): Promise<CheckInRecord[]> => {
    await networkDelay();
    const data = (mockData as any);
    if (typeof data.getCheckIns === 'function') return data.getCheckIns();
    return data.initialCheckIns || [];
  },
  add: async (record: CheckInRecord): Promise<void> => {
    await networkDelay();
  }
};

export const authService = {
  login: async (username: string, password: string): Promise<User | null> => {
    const data = (mockData as any);
    if (typeof data.login === 'function') return data.login(username, password);
    if (username === 'admin' && password === '1234') {
      return { id: '1', username: 'admin', role: 'ADMIN' as any, name: 'מנהל' };
    }
    return null;
  }
};

export default { residentService, trainerService, checkInService, authService };