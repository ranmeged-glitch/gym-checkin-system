import { supabase } from '../lib/supabase';
import { Resident, Trainer, CheckInRecord, User } from '../types';

export const residentService = {
  getAll: async (): Promise<Resident[]> => {
    const { data, error } = await supabase
      .from('residents')
      .select('*')
      .order('last_name', { ascending: true });
    
    if (error) throw error;

    // המרה מפורמט בסיס הנתונים (snake_case) לפורמט האפליקציה (camelCase)
    return (data || []).map(r => ({
      id: r.id,
      firstName: r.first_name,
      lastName: r.last_name,
      subscriptionExpiry: r.subscription_expiry,
      medicalCertificateStartDate: r.medical_certificate_start_date,
      trainingLimitation: r.training_limitation,
      medicalConditions: r.medical_conditions
    }));
  }
};

export const trainerService = {
  getAll: async (): Promise<Trainer[]> => {
    const { data, error } = await supabase
      .from('trainers')
      .select('*')
      .eq('active', true);
    
    if (error) throw error;
    return data || [];
  }
};

export const authService = {
  login: async (username: string, password: string): Promise<User | null> => {
    const { data, error } = await supabase
      .from('system_users')
      .select('*')
      .eq('username', username)
      .eq('password', password)
      .eq('active', true)
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      username: data.username,
      role: data.role,
      name: data.name
    };
  }
};

export const checkInService = {
  getAll: async (): Promise<CheckInRecord[]> => {
    const { data, error } = await supabase
      .from('check_ins')
      .select('*')
      .order('timestamp', { ascending: false });
    
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
    const { error } = await supabase
      .from('check_ins')
      .insert([{
        resident_id: record.residentId,
        resident_name: record.residentName,
        trainer_id: record.trainerId,
        trainer_name: record.trainerName,
        timestamp: record.timestamp
      }]);
    
    if (error) throw error;
  },
  delete: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('check_ins')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

export default { residentService, trainerService, authService, checkInService };