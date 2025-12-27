import { Resident, Trainer, CheckInRecord, User, SystemUser } from '../types';
import * as mockData from '../mockData';

const networkDelay = () => new Promise(resolve => setTimeout(resolve, 600));

export const residentService = {
  getAll: async (): Promise<Resident[]> => {
    await networkDelay();
    return mockData.getResidents();
  },
  saveAll: async (residents: Resident[]): Promise<void> => {
    await networkDelay();
    mockData.saveResidents(residents);
  },
  update: async (resident: Resident): Promise<void> => {
    await networkDelay();
    const residents = mockData.getResidents();
    const updated = residents.map(r => r.id === resident.id ? resident : r);
    mockData.saveResidents(updated);
  },
  add: async (resident: Resident): Promise<Resident> => {
    await networkDelay();
    const residents = mockData.getResidents();
    const newResident = { ...resident, id: Date.now().toString() };
    mockData.saveResidents([...residents, newResident]);
    return newResident;
  },
  delete: async (id: string): Promise<void> => {
    await networkDelay();
    const residents = mockData.getResidents();
    mockData.saveResidents(residents.filter(r => r.id !== id));
  }
};

export const trainerService = {
  getAll: async (): Promise<Trainer[]> => {
    await networkDelay();
    return mockData.getTrainers();
  },
  saveAll: async (trainers: Trainer[]): Promise<void> => {
    await networkDelay();
    mockData.saveTrainers(trainers);
  }
};

export const checkInService = {
  getAll: async (): Promise<CheckInRecord[]> => {
    await networkDelay();
    return mockData.getCheckIns();
  },
  add: async (record: CheckInRecord): Promise<void> => {
    await networkDelay();
    const checkins = mockData.getCheckIns();
    mockData.saveCheckIns([...checkins, record]);
  },
  deleteRecord: async (id: string): Promise<void> => {
    await networkDelay();
    mockData.deleteCheckInRecord(id);
  },
  deleteTodaysRecords: async (): Promise<void> => {
    await networkDelay();
    mockData.clearCheckInsForToday();
  }
};

export const authService = {
  login: async (username: string, password: string): Promise<User | null> => {
    return mockData.login(username, password);
  },
  getUsers: async (): Promise<SystemUser[]> => {
    await networkDelay();
    return mockData.getSystemUsers();
  },
  updateUser: async (user: SystemUser): Promise<void> => {
    await networkDelay();
    const users = mockData.getSystemUsers();
    mockData.saveSystemUsers(users.map(u => u.id === user.id ? user : u));
  }
};
