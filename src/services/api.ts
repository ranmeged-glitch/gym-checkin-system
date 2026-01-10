import { supabase } from '../lib/supabase';
import { Resident, Trainer, CheckInRecord, User } from '../types';

export const residentService = {
  getAll: async (): Promise<Resident[]> => {
    const { data, error } = await supabase
      .from('residents')
      .select('*')
      .order('last_name', { ascending: true });
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
  
  // פונקציה להוספה או עדכון דייר
  upsert: async (resident: Partial<Resident>): Promise<void> => {
    const dbData = {
      first_name: resident.firstName,
      last_name: resident.lastName,
      subscription_expiry: resident.subscriptionExpiry,
      medical_certificate_start_date: resident.medicalCertificateStartDate,
      training_limitation: resident.trainingLimitation,
      medical_conditions: resident.medicalConditions
    };

    if (resident.id) {
      // עדכון קיים
      const { error } = await supabase.from('residents').update(dbData).eq('id', resident.id);
      if (error) throw error;
    } else {
      // יצירת חדש
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
    if (trainer.id) {
      await supabase.from('trainers').update(trainer).eq('id', trainer.id);
    } else {
      await supabase.from('trainers').insert([trainer]);
    }
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
    const { data, error } = await supabase
      .from('system_users')
      .select('*')
      .eq('username', username)
      .eq('password', password)
      .single();
    if (error || !data) return null;
    return { id: data.id, username: data.username, role: data.role, name: data.name };
  }
};