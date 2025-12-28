import React, { useState, useEffect } from 'react';
import { CheckInRecord, Trainer } from '../types';
import { checkInService, trainerService } from '../services/api'; // שינוי כאן
import { parseISO, format, startOfMonth, endOfMonth } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const ReportsModule: React.FC = () => {
  const [data, setData] = useState<CheckInRecord[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  
  useEffect(() => {
    const fetchData = async () => {
      const [ci, tr] = await Promise.all([
        checkInService.getAll(),
        trainerService.getAll()
      ]);
      setData(ci);
      setTrainers(tr);
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold mb-4">סיכום כניסות חודשי</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="residentName" hide />
              <YAxis />
              <Tooltip />
              <Bar dataKey="id" fill="#1d4ed8" name="כניסות" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* טבלת פירוט */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-right">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-xs font-medium text-gray-500">דייר</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500">תאריך ושעה</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500">מאמן</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.map(record => (
              <tr key={record.id}>
                <td className="px-6 py-4 text-sm font-bold">{record.residentName}</td>
                <td className="px-6 py-4 text-sm">{format(parseISO(record.timestamp), 'dd/MM/yyyy HH:mm')}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{record.trainerName}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};