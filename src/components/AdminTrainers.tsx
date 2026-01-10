import React, { useState, useEffect } from 'react';
import { Trainer } from '../types';
import { trainerService } from '../services/api';
import { Button } from './Button';
import { Edit2, Trash2, Plus, UserCheck, UserX, Loader2, X, LayoutDashboard, Save } from 'lucide-react';

export const AdminTrainers: React.FC = () => {
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<Trainer>>({ name: '', active: true });

  useEffect(() => {
    fetchTrainers();
  }, []);

  const fetchTrainers = async () => {
    setLoading(true);
    try {
      const data = await trainerService.getAll();
      setTrainers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    setFormData({ name: '', active: true });
    setIsEditing(true);
  };

  const handleEdit = (trainer: Trainer) => {
    setFormData(trainer);
    setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק מאמן זה?')) {
      try {
        await trainerService.delete(id);
        await fetchTrainers();
      } catch (err) {
        alert('שגיאה במחיקה');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;
    
    setSaving(true);
    try {
      await trainerService.upsert(formData);
      setIsEditing(false);
      await fetchTrainers();
    } catch (err) {
      alert('שגיאה בשמירה');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20">
      <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
      <p className="text-gray-500 font-medium">טוען רשימת מאמנים...</p>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
      
      {/* כותרת ופעולות */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg text-white">
            <LayoutDashboard className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-800">ניהול צוות מאמנים</h2>
            <p className="text-sm text-gray-500">הוספה, עריכה וניהול סטטוס פעילות למאמני חדר הכושר</p>
          </div>
        </div>
        {!isEditing && (
          <Button onClick={handleAddNew} className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            מאמן חדש
          </Button>
        )}
      </div>

      {/* טופס עריכה/הוספה */}
      {isEditing && (
        <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl shadow-inner animate-in slide-in-from-top-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-blue-900 text-lg">
              {formData.id ? 'עריכת מאמן' : 'הוספת מאמן חדש'}
            </h3>
            <button onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 mr-1">שם המאמן</label>
              <input 
                autoFocus
                className="w-full p-3 border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.name || ''}
                onChange={e => setFormData({...formData, name: e.target.value})}
                placeholder="שם מלא..."
              />
            </div>
            <div className="flex items-center gap-3 bg-white p-3 border border-blue-200 rounded-xl h-[50px]">
              <input 
                type="checkbox" 
                id="active"
                className="w-5 h-5 rounded"
                checked={formData.active}
                onChange={e => setFormData({...formData, active: e.target.checked})}
              />
              <label htmlFor="active" className="text-sm font-bold text-gray-700 cursor-pointer">מאמן פעיל במערכת</label>
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="flex-1" disabled={saving}>
                {saving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : (
                  <span className="flex items-center justify-center gap-2"><Save className="w-4 h-4" /> שמור שינויים</span>
                )}
              </Button>
              <Button variant="outline" onClick={() => setIsEditing(false)} type="button">ביטול</Button>
            </div>
          </form>
        </div>
      )}

      {/* טבלת מאמנים */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-gray-50/80 text-gray-400 text-xs uppercase tracking-wider border-b">
                <th className="px-8 py-4 font-bold">שם המאמן</th>
                <th className="px-8 py-4 font-bold">סטטוס</th>
                <th className="px-8 py-4 font-bold text-left">פעולות</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {trainers.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 font-bold border border-gray-200 group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-100 transition-colors">
                        {t.name?.charAt(0) || 'T'}
                      </div>
                      <span className="font-bold text-gray-900 text-lg">{t.name}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    {t.active ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200">
                        <UserCheck className="w-3 h-3 ml-1.5" />
                        פעיל
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-500 border border-gray-200">
                        <UserX className="w-3 h-3 ml-1.5" />
                        לא פעיל
                      </span>
                    )}
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex justify-end gap-3">
                      <button 
                        onClick={() => handleEdit(t)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-5 h-5"/>
                      </button>
                      <button 
                        onClick={() => handleDelete(t.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-5 h-5"/>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};