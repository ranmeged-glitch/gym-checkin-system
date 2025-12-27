import { Resident, Trainer, CheckInRecord, User, SystemUser } from '../types';
import * as mockData from '../mockData';

const networkDelay = () => new Promise(resolve => setTimeout(resolve, 600));

export const residentService = {
  getAll: async (): Promise<Resident[]> => {
    await networkDelay();
    // שימוש בפונקציה מהקובץ שלך
    return typeof (mockData as any).getResidents === 'function' 
      ? (mockData as any).getResidents() 
      : (mockData as any).initialResidents || [];
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
    return typeof (mockData as any).getTrainers === 'function'
      ? (mockData as any).getTrainers()
      : (mockData as any).initialTrainers || [];
  }
};

export const checkInService = {
  getAll: async (): Promise<CheckInRecord[]> => {
    await networkDelay();
    return typeof (mockData as any).getCheckIns === 'function'
      ? (mockData as any).getCheckIns()
      : [];
  },
  add: async (record: CheckInRecord): Promise<void> => {
    await networkDelay();
  }
};

export const authService = {
  login: async (username: string, password: string): Promise<User | null> => {
    if (typeof (mockData as any).login === 'function') {
      return (mockData as any).login(username, password);
    }
    if (username === 'admin' && password === '1234') {
      return { id: '1', username: 'admin', role: 'ADMIN' as any, name: 'מנהל' };
    }
    return null;
  }
};

export default { residentService, trainerService, checkInService, authService };