import React, { useState, useEffect } from 'react';
import { Trainer } from '../types';
import { getTrainers, saveTrainers } from '../mockData';
import { Button } from './Button';
import { Edit2, Trash2, Plus, UserCheck, UserX } from 'lucide-react';

export const AdminTrainers: React.FC = () => {
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Trainer>>({});

  useEffect(() => {
    setTrainers(getTrainers());
  }, []);

  const handleDelete = (id: string) => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק מאמן זה? מומלץ להפוך ל"לא פעיל" אם יש היסטוריית אימונים.')) {
      const updated = trainers.filter(t => t.id !== id);
      setTrainers(updated);
      saveTrainers(updated);
    }
  };

  const handleToggleStatus = (trainer: Trainer) => {
    const updated = trainers.map(t => 
      t.id === trainer.id ? { ...t, active: !t.active } : t
    );
    setTrainers(updated);
    saveTrainers(updated);
  };

  const handleEdit = (trainer: Trainer) => {
    setFormData(trainer);
    setIsEditing(true);
  };

  const handleAddNew = () => {
    setFormData({
      name: '',
      active: true
    });
    setIsEditing(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    let updatedList;
    if (formData.id) {
      // Update
      updatedList = trainers.map(t => t.id === formData.id ? { ...t, ...formData } as Trainer : t);
    } else {
      // Create
      const newTrainer: Trainer = {
        id: Date.now().toString(),
        name: formData.name,
        active: formData.active !== undefined ? formData.active : true
      };
      updatedList = [...trainers, newTrainer];
    }
    
    setTrainers(updatedList);
    saveTrainers(updatedList);
    setIsEditing(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
           <h2 className="text-xl font-bold text-gray-800">ניהול צוות מאמנים</h2>
           <p className="text-sm text-gray-500">מאמנים פעילים יופיעו ברשימת הבחירה בביצוע הצ'ק-אין לדיירים.</p>
        </div>
        <Button onClick={handleAddNew} size="sm">
          <Plus className="w-4 h-4 ml-1 inline" />
          הוסף מאמן
        </Button>
      </div>

      {isEditing ? (
        <form onSubmit={handleSave} className="space-y-4 max-w-lg bg-gray-50 p-6 rounded-lg">
          <h3 className="font-bold text-lg">{formData.id ? 'עריכת פרטי מאמן' : 'מאמן חדש'}</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">שם מלא</label>
            <input 
              type="text" 
              required
              value={formData.name || ''}
              onChange={e => setFormData({...formData, name: e.target.value})}
              placeholder="ישראל ישראלי"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
            />
          </div>

          <div className="flex items-center gap-2">
            <input 
              type="checkbox" 
              id="activeCheck"
              checked={formData.active || false}
              onChange={e => setFormData({...formData, active: e.target.checked})}
              className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 h-5 w-5"
            />
            <label htmlFor="activeCheck" className="text-sm font-medium text-gray-700">מאמן פעיל במערכת</label>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>ביטול</Button>
            <Button type="submit">שמור</Button>
          </div>
        </form>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">שם מאמן</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">סטטוס</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">פעולות</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {trainers.map(t => (
                <tr key={t.id} className={!t.active ? 'bg-gray-50 opacity-75' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {t.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {t.active ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <UserCheck className="w-3 h-3 ml-1" />
                        פעיל
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        <UserX className="w-3 h-3 ml-1" />
                        לא פעיל
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 flex gap-2">
                    <button onClick={() => handleEdit(t)} className="text-blue-600 hover:text-blue-900" title="ערוך">
                        <Edit2 className="w-4 h-4"/>
                    </button>
                    <button onClick={() => handleToggleStatus(t)} className={`${t.active ? 'text-orange-500' : 'text-green-600'} hover:font-bold`} title={t.active ? 'הפוך ללא פעיל' : 'הפוך לפעיל'}>
                        {t.active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                    </button>
                    <button onClick={() => handleDelete(t.id)} className="text-red-600 hover:text-red-900" title="מחק">
                        <Trash2 className="w-4 h-4"/>
                    </button>
                  </td>
                </tr>
              ))}
              {trainers.length === 0 && (
                 <tr>
                    <td colSpan={3} className="px-6 py-4 text-center text-gray-500">לא נמצאו מאמנים במערכת</td>
                 </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};