import React, { useState, useEffect, useMemo } from 'react';
import { CheckInRecord, Trainer, Resident } from '../types';
import { checkInService, trainerService, residentService } from '../services/api';
import { parseISO, format, addYears, differenceInDays } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Download, Users, AlertTriangle, TrendingUp, Calendar, Loader2 } from 'lucide-react';

export const ReportsModule: React.FC = () => {
  const [checkIns, setCheckIns] = useState<CheckInRecord[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [ci, tr, res] = await Promise.all([
          checkInService.getAll(),
          trainerService.getAll(),
          residentService.getAll()
        ]);
        setCheckIns(ci);
        setTrainers(tr);
        setResidents(res);
      } catch (err) {
        console.error("Error fetching report data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // דיירים שצריכים חידוש אישור (פג תוקף או פוקע ב-30 יום הקרובים)
  const medicalAlerts = useMemo(() => {
    return residents.filter(r => {
      if (!r.medicalCertificateStartDate) return true;
      const expiryDate = addYears(parseISO(r.medicalCertificateStartDate), 1);
      return differenceInDays(expiryDate, new Date()) < 30;
    }).sort((a, b) => {
      const dateA = a.medicalCertificateStartDate ? parseISO(a.medicalCertificateStartDate).getTime() : 0;
      const dateB = b.medicalCertificateStartDate ? parseISO(b.medicalCertificateStartDate).getTime() : 0;
      return dateA - dateB;
    });
  }, [residents]);

  // סטטיסטיקת כניסות לפי מאמן
  const trainerStats = useMemo(() => {
    const stats: Record<string, number> = {};
    checkIns.forEach(ci => {
      stats[ci.trainerName] = (stats[ci.trainerName] || 0) + 1;
    });
    return Object.entries(stats).map(([name, count]) => ({ name, count }));
  }, [checkIns]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 space-y-4">
      <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      <span className="font-bold text-gray-600">מפיק דוח נתונים...</span>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6 text-right" dir="rtl">
      
      {/* כרטיסי סיכום */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border-r-4 border-blue-600">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 font-bold">כניסות (מערכת)</p>
              <h3 className="text-3xl font-black text-gray-800">{checkIns.length}</h3>
            </div>
            <TrendingUp className="text-blue-600 w-8 h-8" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border-r-4 border-red-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 font-bold">אישורים לטיפול</p>
              <h3 className="text-3xl font-black text-red-600">{medicalAlerts.length}</h3>
            </div>
            <AlertTriangle className="text-red-500 w-8 h-8" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border-r-4 border-green-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 font-bold">סה"כ דיירים</p>
              <h3 className="text-3xl font-black text-gray-800">{residents.length}</h3>
            </div>
            <Users className="text-green-500 w-8 h-8" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* גרף כניסות לפי מאמן */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-black mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            כמות כניסות לפי מאמן
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trainerStats}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} name="כניסות" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* טבלת התראות רפואיות */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
          <h2 className="text-xl font-black mb-6 text-red-700 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            אישורים שפגו או פוקעים בקרוב
          </h2>
          <div className="overflow-y-auto flex-1 max-h-64">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-right">שם דייר</th>
                  <th className="px-4 py-2 text-right">ימים</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {medicalAlerts.map(r => {
                  const expiryDate = r.medicalCertificateStartDate ? addYears(parseISO(r.medicalCertificateStartDate), 1) : null;
                  const days = expiryDate ? differenceInDays(expiryDate, new Date()) : -999;
                  return (
                    <tr key={r.id} className="hover:bg-red-50/50">
                      <td className="px-4 py-3 font-bold text-gray-800">{r.firstName} {r.lastName}</td>
                      <td className={`px-4 py-3 font-black ${days < 0 ? 'text-red-600' : 'text-orange-600'}`}>
                        {days === -999 ? 'חסר' : days}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* יומן כניסות מלא */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b flex justify-between items-center bg-gray-50">
          <h2 className="text-xl font-black">יומן כניסות אחרונות</h2>
          <button className="flex items-center gap-2 bg-white border px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-100 shadow-sm transition-all">
            <Download className="w-4 h-4" />
            ייצוא ל-Excel
          </button>
        </div>
        <div className="max-h-96 overflow-y-auto">
          <table className="w-full text-right border-collapse">
            <thead className="sticky top-0 bg-white shadow-sm z-10">
              <tr className="text-gray-500 text-xs font-bold uppercase tracking-wider">
                <th className="px-6 py-4">זמן כניסה</th>
                <th className="px-6 py-4">שם הדייר</th>
                <th className="px-6 py-4">מאמן תורן</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {checkIns.map(record => (
                <tr key={record.id} className="hover:bg-blue-50/20 transition-colors">
                  <td className="px-6 py-4 text-gray-600 text-sm font-mono">
                    {format(parseISO(record.timestamp), 'dd/MM/yyyy HH:mm')}
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-900">{record.residentName}</td>
                  <td className="px-6 py-4">
                    <span className="bg-gray-100 px-3 py-1 rounded-full text-xs font-medium text-gray-600">{record.trainerName}</span>
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