import React, { useState, useEffect, useMemo } from 'react';
import { CheckInRecord, Trainer, Resident } from '../types';
import { checkInService, trainerService, residentService } from '../services/api';
import { parseISO, format, addYears, differenceInDays } from 'date-fns';
import * as XLSX from 'xlsx'; // הספרייה שהרגע התקנת
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Download, Users, AlertTriangle, TrendingUp, Calendar, Loader2, FileSpreadsheet } from 'lucide-react';

export const ReportsModule: React.FC = () => {
  const [checkIns, setCheckIns] = useState<CheckInRecord[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ci, res] = await Promise.all([
        checkInService.getAll(),
        residentService.getAll()
      ]);
      setCheckIns(ci);
      setResidents(res);
    } catch (err) {
      console.error("Error fetching data", err);
    } finally {
      setLoading(false);
    }
  };

  // פונקציית הייצוא לאקסל
  const exportToExcel = () => {
    // 1. הכנת הנתונים
    const dataToExport = residents.map(r => {
      const expiryDate = r.medicalCertificateStartDate 
        ? addYears(parseISO(r.medicalCertificateStartDate), 1) 
        : null;
      const daysRemaining = expiryDate ? differenceInDays(expiryDate, new Date()) : 'חסר';

      return {
        'שם פרטי': r.firstName,
        'שם משפחה': r.lastName,
        'תאריך אישור רפואי': r.medicalCertificateStartDate ? format(parseISO(r.medicalCertificateStartDate), 'dd/MM/yyyy') : 'לא הוזן',
        'תוקף אישור (שנה קדימה)': expiryDate ? format(expiryDate, 'dd/MM/yyyy') : '---',
        'ימים שנותרו': daysRemaining,
        'סטטוס': daysRemaining === 'חסר' ? 'ללא אישור' : (daysRemaining < 0 ? 'פג תוקף' : 'תקין')
      };
    });

    // 2. יצירת הגיליון
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    
    // הגדרת כיוון גיליון מימין לשמאל (RTL) עבור אקסל בעברית
    worksheet['!dir'] = 'rtl';

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "סטטוס אישורים רפואיים");

    // 3. הורדה
    const fileName = `דוח_דיירים_בית_הכפר_${format(new Date(), 'dd-MM-yyyy')}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  // חישוב התראות רפואיות לתצוגה בטבלה
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

  const trainerStats = useMemo(() => {
    const stats: Record<string, number> = {};
    checkIns.forEach(ci => {
      stats[ci.trainerName] = (stats[ci.trainerName] || 0) + 1;
    });
    return Object.entries(stats).map(([name, count]) => ({ name, count }));
  }, [checkIns]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 space-y-4">
      <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      <span className="font-bold text-gray-600">מעבד נתונים ומפיק דוח...</span>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6 text-right pb-10" dir="rtl">
      
      {/* כותרת ופעולות */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg shadow-blue-200">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-800">מרכז דוחות וניהול</h2>
            <p className="text-sm text-gray-500 font-medium">נתונים בזמן אמת על פעילות המועדון ותקינות אישורים</p>
          </div>
        </div>
        
        <button 
          onClick={exportToExcel}
          className="flex items-center gap-2 bg-green-600 text-white px-8 py-3 rounded-2xl font-black hover:bg-green-700 transition-all shadow-lg shadow-green-100 active:scale-95"
        >
          <FileSpreadsheet className="w-5 h-5" />
          ייצוא דיירים לאקסל
        </button>
      </div>

      {/* קוביות מידע */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border-r-4 border-blue-600 flex justify-between items-center">
          <div><p className="text-gray-500 font-bold text-sm">כניסות החודש</p><h3 className="text-3xl font-black">{checkIns.length}</h3></div>
          <div className="bg-blue-50 p-3 rounded-full text-blue-600"><Users className="w-6 h-6" /></div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border-r-4 border-red-500 flex justify-between items-center">
          <div><p className="text-gray-500 font-bold text-sm">אישורים לטיפול</p><h3 className="text-3xl font-black text-red-600">{medicalAlerts.length}</h3></div>
          <div className="bg-red-50 p-3 rounded-full text-red-500"><AlertTriangle className="w-6 h-6" /></div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border-r-4 border-green-500 flex justify-between items-center">
          <div><p className="text-gray-500 font-bold text-sm">סה"כ דיירים</p><h3 className="text-3xl font-black text-gray-800">{residents.length}</h3></div>
          <div className="bg-green-50 p-3 rounded-full text-green-500"><Calendar className="w-6 h-6" /></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* גרף עומס מאמנים */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-black mb-6 flex items-center gap-2 text-gray-800">כניסות לפי מאמן</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trainerStats}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip cursor={{fill: '#f8fafc'}} />
                <Bar dataKey="count" fill="#2563eb" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* טבלת התראות רפואיות דחופות */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-[400px]">
          <h2 className="text-xl font-black mb-4 text-red-700">אישורים שפגו או פוקעים בקרוב</h2>
          <div className="overflow-y-auto flex-1 custom-scrollbar">
            <table className="w-full text-right border-collapse text-sm">
              <thead className="sticky top-0 bg-gray-50 z-10">
                <tr>
                  <th className="p-3 border-b">דייר</th>
                  <th className="p-3 border-b text-center">ימים</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {medicalAlerts.map(r => {
                  const expiryDate = r.medicalCertificateStartDate ? addYears(parseISO(r.medicalCertificateStartDate), 1) : null;
                  const days = expiryDate ? differenceInDays(expiryDate, new Date()) : -999;
                  return (
                    <tr key={r.id} className="hover:bg-red-50/30">
                      <td className="p-3 font-bold text-gray-700">{r.firstName} {r.lastName}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-1 rounded font-black ${days < 0 ? 'text-red-600 bg-red-50' : 'text-orange-600 bg-orange-50'}`}>
                          {days === -999 ? 'חסר' : days}
                        </span>
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
        <div className="p-6 border-b bg-gray-50/50">
          <h2 className="text-xl font-black text-gray-800">יומן כניסות אחרונות (פעילות בחדר כושר)</h2>
        </div>
        <div className="max-h-96 overflow-y-auto">
          <table className="w-full text-right">
            <thead className="sticky top-0 bg-white shadow-sm z-10 text-xs text-gray-400 font-bold uppercase">
              <tr>
                <th className="px-6 py-4">תאריך</th>
                <th className="px-6 py-4">שעה</th>
                <th className="px-6 py-4">שם הדייר</th>
                <th className="px-6 py-4">מאמן</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {checkIns.slice().reverse().map(record => (
                <tr key={record.id} className="hover:bg-blue-50/20 transition-colors">
                  <td className="px-6 py-4 text-gray-600 font-medium">{format(parseISO(record.timestamp), 'dd/MM/yyyy')}</td>
                  <td className="px-6 py-4 text-gray-400 font-mono">{format(parseISO(record.timestamp), 'HH:mm')}</td>
                  <td className="px-6 py-4 font-bold text-gray-900">{record.residentName}</td>
                  <td className="px-6 py-4"><span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-bold">{record.trainerName}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};