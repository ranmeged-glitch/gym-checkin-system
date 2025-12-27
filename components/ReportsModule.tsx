import React, { useState, useEffect, useMemo } from 'react';
import { CheckInRecord, Trainer } from '../types';
import { getCheckIns, getTrainers } from '../mockData';
import { parseISO, format, isWithinInterval, startOfDay, endOfDay, startOfMonth, endOfMonth } from 'date-fns';
import { Button } from './Button';
import { Download, Search, FileText, List, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

type ReportViewMode = 'detailed' | 'aggregated';

export const ReportsModule: React.FC = () => {
  const [data, setData] = useState<CheckInRecord[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [viewMode, setViewMode] = useState<ReportViewMode>('detailed');
  
  // Filters
  const [filterTrainer, setFilterTrainer] = useState('');
  const [filterResident, setFilterResident] = useState('');
  
  // Default dates to current month
  const [dateStart, setDateStart] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [dateEnd, setDateEnd] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));

  useEffect(() => {
    setData(getCheckIns());
    setTrainers(getTrainers());
  }, []);

  const setToCurrentMonth = () => {
    const now = new Date();
    setDateStart(format(startOfMonth(now), 'yyyy-MM-dd'));
    setDateEnd(format(endOfMonth(now), 'yyyy-MM-dd'));
  };

  const filteredData = useMemo(() => {
    return data.filter(record => {
      const matchTrainer = filterTrainer ? record.trainerId === filterTrainer : true;
      const matchResident = filterResident ? record.residentName.includes(filterResident) : true;
      
      let matchDate = true;
      if (dateStart && dateEnd) {
        const recordDate = parseISO(record.timestamp);
        matchDate = isWithinInterval(recordDate, {
          start: startOfDay(new Date(dateStart)),
          end: endOfDay(new Date(dateEnd))
        });
      }

      return matchTrainer && matchResident && matchDate;
    });
  }, [data, filterTrainer, filterResident, dateStart, dateEnd]);

  // Aggregated Data for Monthly Report
  const aggregatedData = useMemo(() => {
    const stats: Record<string, { id: string, name: string, count: number, lastVisit: string }> = {};
    
    filteredData.forEach(r => {
      if (!stats[r.residentId]) {
        stats[r.residentId] = { 
          id: r.residentId, 
          name: r.residentName, 
          count: 0, 
          lastVisit: r.timestamp 
        };
      }
      stats[r.residentId].count += 1;
      // Update last visit if newer
      if (new Date(r.timestamp) > new Date(stats[r.residentId].lastVisit)) {
        stats[r.residentId].lastVisit = r.timestamp;
      }
    });

    return Object.values(stats).sort((a, b) => b.count - a.count);
  }, [filteredData]);

  const chartData = useMemo(() => {
    if (viewMode === 'detailed') {
      // Group by Trainer
      const groups: Record<string, number> = {};
      filteredData.forEach(d => {
        groups[d.trainerName] = (groups[d.trainerName] || 0) + 1;
      });
      return Object.entries(groups).map(([name, count]) => ({ name, value: count }));
    } else {
      // Top 10 Residents by attendance
      return aggregatedData.slice(0, 10).map(item => ({
        name: item.name,
        value: item.count
      }));
    }
  }, [filteredData, aggregatedData, viewMode]);

  const downloadCSV = () => {
    let csvContent = '';
    
    if (viewMode === 'detailed') {
      const headers = ['תאריך', 'שעה', 'שם מתאמן', 'שם מאמן'];
      csvContent = [
        headers.join(','),
        ...filteredData.map(row => {
          const d = parseISO(row.timestamp);
          return [
            format(d, 'dd/MM/yyyy'),
            format(d, 'HH:mm'),
            `"${row.residentName}"`,
            `"${row.trainerName}"`
          ].join(',');
        })
      ].join('\n');
    } else {
      const headers = ['שם מתאמן', 'מספר ביקורים בתקופה', 'ביקור אחרון'];
      csvContent = [
        headers.join(','),
        ...aggregatedData.map(row => {
          const d = parseISO(row.lastVisit);
          return [
            `"${row.name}"`,
            row.count,
            format(d, 'dd/MM/yyyy HH:mm')
          ].join(',');
        })
      ].join('\n');
    }

    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', viewMode === 'detailed' ? 'gym_log_detailed.csv' : 'gym_report_summary.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h2 className="text-xl font-bold text-gray-800">דוחות ונתונים</h2>
          
          {/* View Switcher */}
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('detailed')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${
                viewMode === 'detailed' ? 'bg-white text-blue-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <List className="w-4 h-4" />
              יומן מפורט
            </button>
            <button
              onClick={() => setViewMode('aggregated')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${
                viewMode === 'aggregated' ? 'bg-white text-blue-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <FileText className="w-4 h-4" />
              סיכום לדייר (חודשי)
            </button>
          </div>
        </div>
        
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-6 bg-gray-50 p-4 rounded-lg items-end">
          <div className="md:col-span-3">
            <label className="block text-sm font-medium text-gray-700">מתאריך</label>
            <input type="date" value={dateStart} onChange={e => setDateStart(e.target.value)} className="w-full mt-1 border rounded p-2" />
          </div>
          <div className="md:col-span-3">
            <label className="block text-sm font-medium text-gray-700">עד תאריך</label>
            <input type="date" value={dateEnd} onChange={e => setDateEnd(e.target.value)} className="w-full mt-1 border rounded p-2" />
          </div>
          <div className="md:col-span-2">
             <button 
                onClick={setToCurrentMonth}
                className="w-full py-2.5 px-3 bg-white border border-gray-300 rounded text-gray-700 text-sm hover:bg-gray-50 flex items-center justify-center gap-1"
                title="אפס תאריכים לחודש הנוכחי"
             >
                <Calendar className="w-4 h-4" />
                החודש
             </button>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">מאמן</label>
            <select value={filterTrainer} onChange={e => setFilterTrainer(e.target.value)} className="w-full mt-1 border rounded p-2">
              <option value="">הכל</option>
              {trainers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">שם דייר</label>
            <div className="relative">
              <input type="text" value={filterResident} onChange={e => setFilterResident(e.target.value)} placeholder="חיפוש..." className="w-full mt-1 border rounded p-2 pl-8" />
              <Search className="w-4 h-4 absolute left-2 top-3 text-gray-400" />
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center mb-4">
          <div className="text-gray-600">
            {viewMode === 'detailed' 
              ? `נמצאו ${filteredData.length} כניסות`
              : `נמצאו ${aggregatedData.length} מתאמנים פעילים בתקופה`
            }
          </div>
          <Button onClick={downloadCSV} variant="outline" size="sm">
            <Download className="w-4 h-4 ml-1 inline" />
            {viewMode === 'detailed' ? 'ייצוא יומן (CSV)' : 'ייצוא דוח מסכם (CSV)'}
          </Button>
        </div>

        {/* Chart */}
        {filteredData.length > 0 && (
          <div className="h-64 mb-8">
            <h3 className="text-sm font-bold text-gray-500 mb-2">
              {viewMode === 'detailed' ? 'התפלגות לפי מאמנים' : '10 המתאמנים המובילים בתקופה'}
            </h3>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout={viewMode === 'aggregated' ? 'vertical' : 'horizontal'}>
                <CartesianGrid strokeDasharray="3 3" />
                {viewMode === 'aggregated' ? (
                   <>
                     <XAxis type="number" allowDecimals={false} />
                     <YAxis dataKey="name" type="category" width={100} />
                   </>
                ) : (
                   <>
                     <XAxis dataKey="name" />
                     <YAxis allowDecimals={false} />
                   </>
                )}
                <Tooltip />
                <Legend />
                <Bar dataKey="value" name={viewMode === 'detailed' ? "מספר אימונים" : "ביקורים"} fill="#1e3a8a" barSize={viewMode === 'aggregated' ? 20 : undefined} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Table View - Detailed */}
        {viewMode === 'detailed' && (
          <div className="overflow-x-auto border rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">תאריך</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">שעה</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">דייר</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">מאמן</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData.map(row => (
                  <tr key={row.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{format(parseISO(row.timestamp), 'dd/MM/yyyy')}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{format(parseISO(row.timestamp), 'HH:mm')}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{row.residentName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.trainerName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Table View - Aggregated */}
        {viewMode === 'aggregated' && (
          <div className="overflow-x-auto border rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">שם מתאמן</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">סה"כ ביקורים בתקופה</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">ביקור אחרון</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {aggregatedData.map(row => (
                  <tr key={row.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{row.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-bold">
                        {row.count}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(parseISO(row.lastVisit), 'dd/MM/yyyy HH:mm')}
                    </td>
                  </tr>
                ))}
                {aggregatedData.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                      לא נמצאו נתונים בטווח התאריכים שנבחר
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
