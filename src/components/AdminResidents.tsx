import React, { useState, useEffect, useMemo } from 'react';
import { Resident, TrainingLimitation } from '../types';
import { residentService } from '../services/api';
import { differenceInDays, parseISO, format, addYears } from 'date-fns';
import { Button } from './Button';
import { 
  Edit2, Trash2, Plus, Loader2, Search, X, Users, Calendar, AlertCircle, ArrowUpDown, ArrowUp, ArrowDown 
} from 'lucide-react';

export const AdminResidents: React.FC = () => {
  const [residents, setResidents] = useState<Resident[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Resident>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{key: 'name' | 'expiry' | 'days', direction: 'asc' | 'desc'}>({ 
    key: 'name', direction: 'asc' 
  });

  useEffect(() => { fetchResidents(); }, []);

  const fetchResidents = async () => {
    setLoading(true);
    try {
      const data = await residentService.getAll();
      setResidents(data);
    } catch (err) { console.error('Fetch error:', err); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await residentService.upsert(formData);
      setIsEditing(false);
      await fetchResidents();
    } catch (err) { 
      console.error('Save error:', err);
      alert('שגיאה בשמירה. וודא שהרצת את סקריפט ה-SQL ב-Supabase.');
    } finally { setSaving(false); }
  };

  const handleEdit = (resident: Resident) => {
    setFormData({
      ...resident,
      medicalCertificateStartDate: resident.medicalCertificateStartDate ? resident.medicalCertificateStartDate.split('T')[0] : '',
      trainingLimitation: resident.trainingLimitation || 'NONE'
    });
    setIsEditing(true);
  };

  // מיפוי תצוגה בעברית עבור הטבלה והטופס
  const limitationMap: Record<string, string> = {
    'NONE': 'ללא הגבלה',
    'SITTING_ONLY': 'בישיבה בלבד',
    'PHYSIO_REQUIRED': 'בליווי פיזיותרפיסט',
    'OTHER': 'אחר (פירוט בטקסט)'
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 text-right px-4 md:px-0" dir="rtl">
      {/* Header עם חיפוש */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
        <h2 className="text-2xl font-black text-gray-800 flex items-center gap-2">
            <Users className="text-blue-600" /> ניהול דיירים
        </h2>
        <div className="flex gap-3 w-full md:w-auto">
          <input 
            type="text" placeholder="חיפוש..." 
            className="p-2 border rounded-xl flex-1 md:w-64"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Button onClick={() => { setFormData({ trainingLimitation: 'NONE' }); setIsEditing(true); }}>
            <Plus className="w-4 h-4 ml-1" /> דייר חדש
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4">שם הדייר</th>
                <th className="px-6 py-4">מגבלה רפואית</th>
                <th className="px-6 py-4">תוקף אישור</th>
                <th className="px-6 py-4 text-center">פעולות</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {residents.filter(r => `${r.firstName} ${r.lastName}`.includes(searchTerm)).map(r => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-6 py-5 font-bold">{r.firstName} {r.lastName}</td>
                  <td className="px-6 py-5">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${r.trainingLimitation === 'NONE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {limitationMap[r.trainingLimitation as string] || 'לא הוגדר'}
                    </span>
                    {r.medicalConditions && <p className="text-xs text-gray-400 mt-1">{r.medicalConditions}</p>}
                  </td>
                  <td className="px-6 py-5">{r.medicalCertificateStartDate ? format(addYears(parseISO(r.medicalCertificateStartDate), 1), 'dd/MM/yyyy') : '---'}</td>
                  <td className="px-6 py-5 flex justify-center gap-2">
                    <button onClick={() => handleEdit(r)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg"><Edit2 className="w-5 h-5"/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-8 relative">
            <button onClick={() => setIsEditing(false)} className="absolute top-5 left-5 text-gray-400"><X className="w-6 h-6" /></button>
            <h3 className="text-2xl font-black mb-6 border-b pb-4">פרטי דייר ומגבלות</h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input className="p-3 bg-gray-50 border rounded-xl" placeholder="שם פרטי" value={formData.firstName || ''} onChange={e => setFormData({...formData, firstName: e.target.value})} required />
                <input className="p-3 bg-gray-50 border rounded-xl" placeholder="שם משפחה" value={formData.lastName || ''} onChange={e => setFormData({...formData, lastName: e.target.value})} required />
              </div>

              <div>
                <label className="block text-sm font-bold mb-1">סוג מגבלה:</label>
                <select 
                  className="w-full p-3 bg-white border rounded-xl font-bold"
                  value={formData.trainingLimitation}
                  onChange={e => setFormData({...formData, trainingLimitation: e.target.value as any})}
                >
                  <option value="NONE">1. ללא הגבלה</option>
                  <option value="SITTING_ONLY">2. בישיבה בלבד</option>
                  <option value="PHYSIO_REQUIRED">3. בליווי פיזיותרפיסט</option>
                  <option value="OTHER">4. אחר (פירוט חופשי)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold mb-1">פירוט חופשי (יוצג למאמן):</label>
                <textarea 
                  className="w-full p-3 bg-gray-50 border rounded-xl h-24"
                  value={formData.medicalConditions || ''}
                  onChange={e => setFormData({...formData, medicalConditions: e.target.value})}
                  placeholder="הוסף כאן הערות נוספות..."
                />
              </div>

              <Button type="submit" className="w-full py-4" disabled={saving}>{saving ? 'שומר...' : 'שמור שינויים'}</Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminResidents;