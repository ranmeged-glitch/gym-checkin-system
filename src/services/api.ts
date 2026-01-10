import { supabase } from '../lib/supabase';
import { Resident, Trainer, CheckInRecord, User } from '../types';

export const residentService = {
  getAll: async (): Promise<Resident[]> => {
    const { data, error } = await supabase.from('residents').select('*').order('last_name');
    if (error) throw error;
    return (data || []).map(r => ({
      id: r.id,
      firstName: r.first_name,
      lastName: r.last_name,
      subscriptionExpiry: r.subscription_expiry,
      medicalCertificateStartDate: r.medical_certificate_start_date,
      trainingLimitation: r.training_limitation,
      medicalConditions: r.medical_conditions
    }));
  },
  upsert: async (resident: Partial<Resident>): Promise<void> => {
    const formatDateForDB = (dateStr?: string) => dateStr ? dateStr.split('T')[0] : null;
    const dbData = {
      first_name: resident.firstName,
      last_name: resident.lastName,
      subscription_expiry: formatDateForDB(resident.subscriptionExpiry),
      medical_certificate_start_date: formatDateForDB(resident.medicalCertificateStartDate),
      training_limitation: resident.trainingLimitation || 'NONE',
      medical_conditions: resident.medicalConditions || ''
    };
    if (resident.id && String(resident.id).length > 5) {
      const { error } = await supabase.from('residents').update(dbData).eq('id', resident.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('residents').insert([dbData]);
      if (error) throw error;
    }
  },
  delete: async (id: string): Promise<void> => {
    const { error } = await supabase.from('residents').delete().eq('id', id);
    if (error) throw error;
  }
};

export const trainerService = {
  getAll: async (): Promise<Trainer[]> => {
    const { data, error } = await supabase.from('trainers').select('*').order('name');
    if (error) throw error;
    return data || [];
  },
  upsert: async (trainer: Partial<Trainer>): Promise<void> => {
    const dbData = { name: trainer.name, active: trainer.active };
    if (trainer.id && String(trainer.id).length > 5) {
      const { error } = await supabase.from('trainers').update(dbData).eq('id', trainer.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('trainers').insert([dbData]);
      if (error) throw error;
    }
  },
  delete: async (id: string): Promise<void> => {
    const { error } = await supabase.from('trainers').delete().eq('id', id);
    if (error) throw error;
  }
};

export const checkInService = {
  getAll: async (): Promise<CheckInRecord[]> => {
    const { data, error } = await supabase.from('check_ins').select('*').order('timestamp', { ascending: false });
    if (error) throw error;
    return (data || []).map(c => ({
      id: c.id,
      residentId: c.resident_id,
      residentName: c.resident_name,
      trainerId: c.trainer_id,
      trainerName: c.trainer_name,
      timestamp: c.timestamp
    }));
  },
  add: async (record: Omit<CheckInRecord, 'id'>): Promise<void> => {
    const { error } = await supabase.from('check_ins').insert([{
      resident_id: record.residentId,
      resident_name: record.residentName,
      trainer_id: record.trainerId,
      trainer_name: record.trainerName,
      timestamp: record.timestamp
    }]);
    if (error) throw error;
  },
  delete: async (id: string): Promise<void> => {
    const { error } = await supabase.from('check_ins').delete().eq('id', id);
    if (error) throw error;
  }
};

export const authService = {
  login: async (username: string, password: string): Promise<User | null> => {
    const { data, error } = await supabase.from('system_users').select('*').eq('username', username).eq('password', password).single();
    if (error || !data) return null;
    return { id: data.id, username: data.username, role: data.role, name: data.name };
  },
  getAllUsers: async (): Promise<User[]> => {
    const { data, error } = await supabase.from('system_users').select('id, username, role, name').order('name');
    if (error) throw error;
    return data || [];
  },
  updatePassword: async (userId: string, newPassword: string): Promise<void> => {
    const { error } = await supabase.from('system_users').update({ password: newPassword }).eq('id', userId);
    if (error) throw error;
  }
};