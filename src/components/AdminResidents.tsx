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

  useEffect(() => { fetchResidents(); }, []);

  const fetchResidents = async () => {
    setLoading(true);
    try { 
      const data = await residentService.getAll(); 
      setResidents(data); 
    } catch (err) { 
      console.error('Fetch error:', err); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // שליחת הנתונים עם הערכים המדויקים מה-Schema שלך
      await residentService.upsert(formData);
      setIsEditing(false);
      await fetchResidents();
    } catch (err) {
      console.error('Save error details:', err);
      alert('שגיאה בשמירה. וודא שערכי ה-Enum תואמים למסד הנתונים.');
    } finally {
      setSaving(false);
    }
  };

  const getLimitationLabel = (limitation: string) => {
    switch(limitation) {
      case TrainingLimitation.SITTING_ONLY: return 'בישיבה בלבד';
      case TrainingLimitation.PHYSIO_REQUIRED: return 'בליווי פיזיותרפיסט';
      case TrainingLimitation.OTHER: return 'אחר / לתשומת לב';
      default: return 'ללא הגבלה';
    }
  };

  if (loading) return <div className="p-20 text-center font-bold" dir="rtl">טוען נתונים...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6 text-right p-4" dir="rtl">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-2xl font-black text-gray-800 flex items-center gap-2">
            <Users className="text-blue-600" /> ניהול דיירים ואישורים
        </h2>
        <Button onClick={() => {
          setFormData({ 
            trainingLimitation: TrainingLimitation.NONE, 
            medicalCertificateStartDate: new Date().toISOString().split('T')[0],
            medicalConditions: ''
          });
          setIsEditing(true);
        }}><Plus className="ml-2 w-4 h-4"/>דייר חדש</Button>
      </div>

      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden text-right">
        <table className="w-full text-right border-collapse">
          <thead className="bg-gray-50 border-b">
            <tr className="text-gray-500 text-sm">
              <th className="px-6 py-4 font-bold">שם הדייר</th>
              <th className="px-6 py-4 font-bold">מגבלה</th>
              <th className="px-6 py-4 font-bold">תוקף אישור</th>
              <th className="px-6 py-4 font-bold">פעולות</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {residents.filter(r => `${r.firstName} ${r.lastName}`.includes(searchTerm)).map(r => (
              <tr key={r.id} className="hover:bg-blue-50/30 transition-colors">
                <td className="px-6 py-5 font-bold text-gray-900">{r.firstName} {r.lastName}</td>
                <td className="px-6 py-5">
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${r.trainingLimitation === TrainingLimitation.NONE ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {getLimitationLabel(r.trainingLimitation)}
                  </span>
                </td>
                <td className="px-6 py-5 text-gray-600 font-medium text-right">
                  {r.medicalCertificateStartDate ? format(addYears(parseISO(r.medicalCertificateStartDate), 1), 'dd/MM/yyyy') : '---'}
                </td>
                <td className="px-6 py-5">
                  <button onClick={() => {
                    setFormData({...r, medicalCertificateStartDate: r.medicalCertificateStartDate?.split('T')[0]});
                    setIsEditing(true);
                  }} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg"><Edit2 className="w-5 h-5"/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isEditing && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-8 relative">
            <button onClick={() => setIsEditing(false)} className="absolute top-5 left-5 text-gray-400 p-1"><X className="w-6 h-6" /></button>
            <h3 className="text-2xl font-black mb-6 text-gray-800 border-b pb-4 text-right">עדכון פרטי דייר</h3>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4 text-right">
                <input className="w-full p-3 bg-gray-50 border rounded-xl outline-none" placeholder="שם פרטי" value={formData.firstName || ''} onChange={e => setFormData({...formData, firstName: e.target.value})} required />
                <input className="w-full p-3 bg-gray-50 border rounded-xl outline-none" placeholder="שם משפחה" value={formData.lastName || ''} onChange={e => setFormData({...formData, lastName: e.target.value})} required />
              </div>

              <div className="text-right">
                <label className="block text-sm font-bold text-gray-600 mb-1">תאריך אישור רפואי:</label>
                <input type="date" className="w-full p-3 bg-blue-50 border-blue-200 border-2 rounded-xl font-bold" value={formData.medicalCertificateStartDate || ''} onChange={e => setFormData({...formData, medicalCertificateStartDate: e.target.value})} required />
              </div>

              <div className="text-right">
                <label className="block text-sm font-bold text-gray-600 mb-1">סוג מגבלה:</label>
                <select 
                  className="w-full p-4 bg-white border border-gray-200 rounded-xl font-bold outline-none"
                  value={formData.trainingLimitation}
                  onChange={e => setFormData({...formData, trainingLimitation: e.target.value as TrainingLimitation})}
                >
                  <option value={TrainingLimitation.NONE}>1. ללא הגבלה</option>
                  <option value={TrainingLimitation.SITTING_ONLY}>2. בישיבה בלבד</option>
                  <option value={TrainingLimitation.PHYSIO_REQUIRED}>3. בליווי פיזיותרפיסט</option>
                  <option value={TrainingLimitation.OTHER}>4. אחר (פירוט מטה)</option>
                </select>
              </div>

              <div className="text-right">
                <label className="block text-sm font-bold text-gray-600 mb-1">פירוט (יוצג למאמן):</label>
                <textarea 
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl h-24 text-sm outline-none"
                  placeholder="הכנס הערות נוספות..."
                  value={formData.medicalConditions || ''}
                  onChange={e => setFormData({...formData, medicalConditions: e.target.value})}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1 py-4 text-lg font-black" disabled={saving}>
                  {saving ? 'שומר...' : 'שמור נתונים'}
                </Button>
                <Button variant="outline" onClick={() => setIsEditing(false)} type="button">ביטול</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminResidents;