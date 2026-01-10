import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Resident, Trainer, CheckInRecord } from '../types';
import { residentService, trainerService, checkInService } from '../services/api';
import { format, isSameDay, parseISO } from 'date-fns';
import { Button } from './Button';
import { Search, Loader2, Trash2, Accessibility, User, ChevronDown, Check, Info, Calendar } from 'lucide-react';

export const CheckInModule: React.FC = () => {
  const [residents, setResidents] = useState<Resident[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [checkIns, setCheckIns] = useState<CheckInRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  
  const [selectedTrainerId, setSelectedTrainerId] = useState('');
  const [selectedResidentId, setSelectedResidentId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [notification, setNotification] = useState<{type: 'success' | 'error', msg: string} | null>(null);

  useEffect(() => {
    fetchData();
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchData = async () => {
    try {
      const [r, t, c] = await Promise.all([
        residentService.getAll(),
        trainerService.getAll(),
        checkInService.getAll()
      ]);
      setResidents(r);
      setTrainers(t.filter(trainer => trainer.active));
      setCheckIns(c);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    const resident = residents.find(r => r.id === selectedResidentId);
    const trainer = trainers.find(t => t.id === selectedTrainerId);
    if (!resident || !trainer) return;

    setProcessing(true);
    try {
      await checkInService.add({
        residentId: resident.id,
        residentName: `${resident.firstName} ${resident.lastName}`,
        trainerId: trainer.id,
        trainerName: trainer.name,
        timestamp: new Date().toISOString()
      });
      setNotification({ type: 'success', msg: `נרשמה כניסה ל-${resident.firstName} ${resident.lastName}` });
      setSelectedResidentId('');
      setSearchTerm('');
      await fetchData();
      setTimeout(() => setNotification(null), 3000);
    } catch (err) {
      setNotification({ type: 'error', msg: 'שגיאה ברישום הכניסה' });
    } finally {
      setProcessing(false);
    }
  };

  const filteredResidents = useMemo(() => {
    if (!searchTerm) return [];
    return residents.filter(r => 
      `${r.firstName} ${r.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 8);
  }, [residents, searchTerm]);

  const todaysCheckIns = checkIns.filter(c => isSameDay(parseISO(c.timestamp), new Date()));

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 space-y-4">
      <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      <p className="text-gray-500 font-medium">טוען נתונים...</p>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
      
      {/* התראות הצלחה/שגיאה */}
      {notification && (
        <div className={`p-4 rounded-xl flex items-center gap-3 border shadow-sm ${
          notification.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {notification.type === 'success' ? <Check className="w-6 h-6" /> : <Info className="w-6 h-6" />}
          <span className="font-bold">{notification.msg}</span>
        </div>
      )}

      {/* כרטיס רישום כניסה */}
      <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
        <div className="flex items-center gap-3 mb-8 border-b pb-4">
          <div className="bg-blue-100 p-2 rounded-lg text-blue-700">
            <Calendar className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-gray-800">צ'ק-אין חדר כושר</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* בחירת מאמן */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700">מאמן תורן</label>
            <div className="relative">
              <select 
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 appearance-none font-medium"
                value={selectedTrainerId}
                onChange={e => setSelectedTrainerId(e.target.value)}
              >
                <option value="">בחר מאמן...</option>
                {trainers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              <User className="absolute left-4 top-4 text-gray-400 w-5 h-5 pointer-events-none" />
            </div>
          </div>

          {/* חיפוש דייר */}
          <div className="space-y-2 relative" ref={dropdownRef}>
            <label className="block text-sm font-bold text-gray-700">חיפוש דייר</label>
            <div className="relative">
              <input 
                className="w-full p-4 pr-12 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-medium"
                placeholder="הקלד שם דייר..."
                value={searchTerm}
                onChange={(e) => {setSearchTerm(e.target.value); setIsDropdownOpen(true);}}
                onFocus={() => setIsDropdownOpen(true)}
              />
              <Search className="absolute right-4 top-4 text-gray-400 w-5 h-5" />
            </div>
            
            {isDropdownOpen && filteredResidents.length > 0 && (
              <div className="absolute z-50 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-2xl max-h-72 overflow-auto py-2">
                {filteredResidents.map(r => (
                  <div 
                    key={r.id} 
                    className="px-5 py-3 hover:bg-blue-50 cursor-pointer flex justify-between items-center transition-colors"
                    onClick={() => {
                      setSelectedResidentId(r.id);
                      setSearchTerm(`${r.firstName} ${r.lastName}`);
                      setIsDropdownOpen(false);
                    }}
                  >
                    <span className="font-bold text-gray-800">{r.firstName} {r.lastName}</span>
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-500 italic">בחר</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <Button 
          className="w-full mt-10 py-5 rounded-xl shadow-blue-200 shadow-lg text-lg" 
          size="lg" 
          onClick={handleCheckIn} 
          disabled={!selectedResidentId || !selectedTrainerId || processing}
        >
          {processing ? <Loader2 className="animate-spin mx-auto" /> : 'רשום כניסה למתאמן'}
        </Button>
      </div>

      {/* טבלת כניסות היום */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
          <h3 className="font-bold text-gray-700 flex items-center gap-2">
            <Accessibility className="w-5 h-5 text-blue-600" />
            מתאמנים היום ({todaysCheckIns.length})
          </h3>
          <span className="text-sm text-gray-400 font-medium">{format(new Date(), 'dd/MM/yyyy')}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="text-gray-400 text-xs border-b">
                <th className="px-6 py-3 font-medium">שעה</th>
                <th className="px-6 py-3 font-medium text-lg">שם המתאמן</th>
                <th className="px-6 py-3 font-medium">מאמן רושם</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {todaysCheckIns.map(c => (
                <tr key={c.id} className="hover:bg-blue-50/30 transition-colors group">
                  <td className="px-6 py-4 text-sm text-gray-500 font-mono">{format(parseISO(c.timestamp), 'HH:mm')}</td>
                  <td className="px-6 py-4 font-black text-gray-900 text-xl">{c.residentName}</td>
                  <td className="px-6 py-4 text-sm text-gray-400">ע"י {c.trainerName}</td>
                </tr>
              ))}
              {todaysCheckIns.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-20 text-center">
                    <Accessibility className="w-12 h-12 mx-auto text-gray-100 mb-3" />
                    <p className="text-gray-300 font-medium italic text-lg">טרם נרשמו כניסות להיום</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};