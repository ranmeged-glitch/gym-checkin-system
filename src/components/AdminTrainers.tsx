import React, { useState, useEffect } from 'react';
import { Trainer } from '../types';
import { trainerService } from '../services/api'; // שינוי כאן
import { Button } from './Button';
import { Edit2, Trash2, Plus, UserCheck, UserX } from 'lucide-react';

export const AdminTrainers: React.FC = () => {
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrainers();
  }, []);

  const fetchTrainers = async () => {
    setLoading(true);
    try {
      const data = await trainerService.getAll();
      setTrainers(data);
    } catch (err) {
      alert('שגיאה בטעינת המאמנים');
    } finally {
      setLoading(false);
    }
  };

  // הערה: יש להוסיף ב-api.ts פונקציות delete ו-update כדי שהכפתורים יעבדו מול ה-DB
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 overflow-hidden">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">ניהול צוות מאמנים</h2>
        <Button size="sm">
          <Plus className="w-4 h-4 ml-2" />
          מאמן חדש
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">שם המאמן</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">סטטוס</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">פעולות</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {trainers.map((t) => (
              <tr key={t.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{t.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">
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
                  <button className="text-blue-600 hover:text-blue-900"><Edit2 className="w-4 h-4"/></button>
                  <button className="text-red-600 hover:text-red-900"><Trash2 className="w-4 h-4"/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};