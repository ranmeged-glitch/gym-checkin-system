import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Resident, Trainer, CheckInRecord, SubscriptionStatus, TrainingLimitation } from '../types';
import { residentService, trainerService, checkInService } from '../services/api';
import { differenceInDays, parseISO, format, isSameDay } from 'date-fns';
import { Button } from './Button';
import { Check, AlertTriangle, XCircle, Trash2, Accessibility, Loader2, AlertCircle, Search, ChevronDown, X, Info, User } from 'lucide-react';

export const CheckInModule: React.FC = () => {
  const [residents, setResidents] = useState<Resident[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [checkIns, setCheckIns] = useState<CheckInRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  
  const [selectedTrainerId, setSelectedTrainerId] = useState<string>('');
  const [selectedResidentId, setSelectedResidentId] = useState<string>('');
  const [residentSearchTerm, setResidentSearchTerm] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [notification, setNotification] = useState<{type: 'success' | 'error' | 'warning', msg: string} | null>(null);

  useEffect(() => {
    fetchData();
    
    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [res, trn, chk] = await Promise.all([
        residentService.getAll(),
        trainerService.getAll(),
        checkInService.getAll()
      ]);
      setResidents(res);
      setTrainers(trn);
      setCheckIns(chk);
    } catch (err) {
      alert('שגיאה בתקשורת עם השרת');
    } finally {
      setLoading(false);
    }
  };

  const getStatus = (resident: Resident): SubscriptionStatus => {
    const expiry = parseISO(resident.subscriptionExpiry);
    const today = new Date();
    const daysLeft = differenceInDays(expiry, today);
    if (daysLeft < 0) return SubscriptionStatus.EXPIRED;
    if (daysLeft <= 45) return SubscriptionStatus.WARNING;
    return SubscriptionStatus.VALID;
  };

  const getDaysRemaining = (resident: Resident): number => {
    return differenceInDays(parseISO(resident.subscriptionExpiry), new Date());
  };

  const processedResidents = useMemo(() => {
    return [...residents].map(r => ({
      ...r,
      status: getStatus(r),
      daysLeft: getDaysRemaining(r),
      fullName: `${r.firstName} ${r.lastName}`
    })).sort((a, b) => {
      const priority = { [SubscriptionStatus.EXPIRED]: 0, [SubscriptionStatus.WARNING]: 1, [SubscriptionStatus.VALID]: 2 };
      if (priority[a.status] !== priority[b.status]) {
        return priority[a.status] - priority[b.status];
      }
      return a.fullName.localeCompare(b.fullName, 'he');
    });
  }, [residents]);

  const filteredResidents = useMemo(() => {
    if (!residentSearchTerm) return processedResidents;
    const term = residentSearchTerm.toLowerCase();
    return processedResidents.filter(r => 
      r.fullName.toLowerCase().includes(term) || 
      r.id.toLowerCase().includes(term)
    );
  }, [processedResidents, residentSearchTerm]);

  const todaysCheckIns = useMemo(() => {
    const today = new Date();
    return checkIns.filter(c => isSameDay(parseISO(c.timestamp), today))
    .sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [checkIns]);

  const selectedResidentInfo = useMemo(() => {
    return processedResidents.find(r => r.id === selectedResidentId);
  }, [selectedResidentId, processedResidents]);

  const activeTrainerName = useMemo(() => {
    const trainer = trainers.find(t => t.id === selectedTrainerId);
    return trainer ? trainer.name : null;
  }, [selectedTrainerId, trainers]);

  const handleCheckIn = async () => {
    setNotification(null);
    if (!selectedTrainerId || !selectedResidentId) {
      setNotification({ type: 'error', msg: 'יש למלא את כל השדות' });
      return;
    }

    const resident = residents.find(r => r.id === selectedResidentId);
    const trainer = trainers.find(t => t.id === selectedTrainerId);
    if (!resident || !trainer) return;

    if (todaysCheckIns.some(c => c.residentId === resident.id)) {
      setNotification({ type: 'warning', msg: 'מתאמן זה כבר נרשם היום' });
      return;
    }

    setProcessing(true);
    try {
      const newCheckIn: CheckInRecord = {
        id: Date.now().toString(),
        residentId: resident.id,
        residentName: `${resident.firstName} ${resident.lastName}`,
        trainerId: trainer.id,
        trainerName: trainer.name,
        timestamp: new Date().toISOString()
      };

      await checkInService.add(newCheckIn);
      const updatedCheckins = await checkInService.getAll();
      setCheckIns(updatedCheckins);
      setNotification({ type: 'success', msg: 'נרשם בהצלחה' });
      setSelectedResidentId('');
      setResidentSearchTerm('');
    } catch (err) {
      setNotification({ type: 'error', msg: 'שגיאה ברישום' });
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteRecord = async (id: string, name: string) => {
    if (window.confirm(`האם למחוק את הרישום של ${name}?`)) {
      setProcessing(true);
      try {
        await checkInService.deleteRecord(id);
        const updated = await checkInService.getAll();
        setCheckIns(updated);
        setNotification({ type: 'success', msg: `הרישום של ${name} הוסר` });
      } catch (err) {
        setNotification({ type: 'error', msg: 'שגיאה במחיקת הרישום' });
      } finally {
        setProcessing(false);
      }
    }
  };

  const clearDailyData = async () => {
    setNotification(null);
    if (window.confirm('האם למחוק את כל רשימת הנוכחים של היום?')) {
      setProcessing(true);
      try {
        await checkInService.deleteTodaysRecords();
        const updated = await checkInService.getAll();
        setCheckIns(updated);
        setNotification({ type: 'success', msg: 'הרשימה היומית נוקתה בהצלחה' });
      } catch (err) {
        setNotification({ type: 'error', msg: 'שגיאה בניקוי הרשימה' });
      } finally {
        setProcessing(false);
      }
    }
  };

  const selectResident = (resident: typeof processedResidents[0]) => {
    setSelectedResidentId(resident.id);
    setResidentSearchTerm(resident.fullName);
    setIsDropdownOpen(false);
  };

  const getLimitationDisplay = (lim: TrainingLimitation, details?: string) => {
    switch (lim) {
      case TrainingLimitation.SEATED_ONLY: return 'אימון בישיבה בלבד';
      case TrainingLimitation.PHYSIO_SUPERVISION: return 'אימון בליווי פיזיותרפיסט בלבד';
      case TrainingLimitation.OTHER: return details || 'מגבלה רפואית אחרת';
      default: return null;
    }
  };

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto w-12 h-12 text-blue-900" /><p className="mt-4">מתחבר למסד הנתונים...</p></div>;

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative">
        {processing && <div className="absolute inset-0 bg-white/40 z-10 flex items-center justify-center"><Loader2 className="animate-spin" /></div>}
        
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <h2 className="text-xl font-black text-gray-800">רישום כניסה מהיר</h2>
          
          {/* Trainer Status Banner */}
          {activeTrainerName && (
            <div className="bg-blue-900 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-in slide-in-from-left-4 duration-300">
              <User className="w-4 h-4" />
              <span className="text-sm font-bold">מאמן תורן: {activeTrainerName}</span>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Trainer Selection */}
          <div className="space-y-2">
            <label className="block text-lg font-medium text-gray-700">מאמן אחראי</label>
            <select 
              value={selectedTrainerId} 
              onChange={(e) => setSelectedTrainerId(e.target.value)} 
              className="w-full p-4 text-lg border-2 border-gray-300 rounded-lg focus:border-blue-500 outline-none transition-all shadow-sm bg-white"
            >
              <option value="">-- בחר מאמן --</option>
              {trainers.filter(t => t.active).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>

          {/* Searchable Resident Selection */}
          <div className="space-y-2 relative" ref={dropdownRef}>
            <label className="block text-lg font-medium text-gray-700">חיפוש מתאמן</label>
            <div className="relative">
              <input
                type="text"
                value={residentSearchTerm}
                onChange={(e) => {
                  setResidentSearchTerm(e.target.value);
                  setIsDropdownOpen(true);
                  if (selectedResidentId) setSelectedResidentId('');
                }}
                onFocus={() => setIsDropdownOpen(true)}
                placeholder="הקלד שם לחיפוש..."
                className={`w-full p-4 pr-12 text-lg border-2 rounded-lg focus:border-blue-500 outline-none transition-all shadow-sm ${
                  selectedResidentInfo?.status === SubscriptionStatus.EXPIRED ? 'border-red-500 bg-red-50' : 
                  selectedResidentInfo?.status === SubscriptionStatus.WARNING ? 'border-orange-400 bg-orange-50' : 'border-gray-300 bg-white'
                }`}
              />
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              {residentSearchTerm && (
                <button 
                  onClick={() => { setResidentSearchTerm(''); setSelectedResidentId(''); }}
                  className="absolute left-12 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              >
                <ChevronDown className={`w-5 h-5 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* Dropdown Results */}
            {isDropdownOpen && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-2xl max-h-72 overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
                {filteredResidents.length > 0 ? (
                  filteredResidents.map(r => (
                    <div 
                      key={r.id}
                      onClick={() => selectResident(r)}
                      className="p-4 hover:bg-blue-50 cursor-pointer border-b last:border-b-0 flex justify-between items-center group"
                    >
                      <div className="flex flex-col">
                        <span className={`font-bold text-lg ${
                          r.status === SubscriptionStatus.EXPIRED ? 'text-red-700' : 
                          r.status === SubscriptionStatus.WARNING ? 'text-orange-700' : 'text-gray-800'
                        }`}>
                          {r.fullName}
                        </span>
                        {r.trainingLimitation !== TrainingLimitation.NONE && (
                          <span className="text-xs text-orange-600 font-medium">יש מגבלות אימון</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {r.status === SubscriptionStatus.EXPIRED && <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">פג תוקף</span>}
                        {r.status === SubscriptionStatus.WARNING && <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-bold">לחדש</span>}
                        <span className="text-xs text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">בחר</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-gray-500 italic font-medium">לא נמצאו תוצאות</div>
                )}
              </div>
            )}
          </div>
        </div>

        {selectedResidentInfo && (
          <div className="mt-6 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
            {/* Status Warnings */}
            {selectedResidentInfo.status === SubscriptionStatus.EXPIRED && (
              <div className="flex items-center gap-3 p-4 bg-red-100 border border-red-200 text-red-800 rounded-xl shadow-sm">
                <XCircle className="w-8 h-8 shrink-0" />
                <div>
                  <p className="font-black text-xl">חסום! תוקף האישור הרפואי פג</p>
                  <p className="text-sm">האישור פקע ב-{format(parseISO(selectedResidentInfo.subscriptionExpiry), 'dd/MM/yyyy')}. אין לאשר כניסה.</p>
                </div>
              </div>
            )}
            
            {/* Training Limitations - High Visibility */}
            {selectedResidentInfo.trainingLimitation !== TrainingLimitation.NONE && (
              <div className="flex items-start gap-3 p-4 bg-amber-50 border-2 border-amber-200 text-amber-900 rounded-xl shadow-sm">
                <Info className="w-8 h-8 shrink-0 mt-1" />
                <div>
                  <p className="font-black text-xl">שימו לב למגבלות אימון:</p>
                  <p className="text-lg font-bold bg-white/50 px-2 py-1 rounded inline-block mt-1">
                    {getLimitationDisplay(selectedResidentInfo.trainingLimitation, selectedResidentInfo.medicalConditions)}
                  </p>
                </div>
              </div>
            )}

            {selectedResidentInfo.status === SubscriptionStatus.WARNING && (
              <div className="flex items-center gap-3 p-3 bg-orange-50 border border-orange-200 text-orange-800 rounded-xl">
                <AlertTriangle className="w-6 h-6 shrink-0" />
                <div>
                  <p className="font-bold">תזכורת: לחדש אישור רפואי בקרוב</p>
                  <p className="text-sm">נותרו {selectedResidentInfo.daysLeft} ימים לתוקף ({format(parseISO(selectedResidentInfo.subscriptionExpiry), 'dd/MM/yyyy')}).</p>
                </div>
              </div>
            )}
            
            {selectedResidentInfo.status === SubscriptionStatus.VALID && selectedResidentInfo.trainingLimitation === TrainingLimitation.NONE && (
              <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 text-green-800 rounded-xl">
                <Check className="w-6 h-6 shrink-0" />
                <div>
                  <p className="font-bold">האישור בתוקף והכל תקין</p>
                  <p className="text-sm">תוקף עד: {format(parseISO(selectedResidentInfo.subscriptionExpiry), 'dd/MM/yyyy')}</p>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-8">
          <Button 
            onClick={handleCheckIn} 
            size="lg" 
            className="w-full flex justify-center items-center gap-3 py-6 shadow-xl active:scale-[0.98] transition-all bg-blue-900" 
            disabled={processing || !selectedResidentId || !selectedTrainerId}
          >
            {processing ? <Loader2 className="animate-spin" /> : <Check className="w-8 h-8" />}
            <span className="text-2xl">בצע רישום כניסה</span>
          </Button>
        </div>

        {notification && (
          <div className={`mt-4 p-4 rounded-xl flex items-center gap-3 animate-in slide-in-from-bottom-4 duration-300 shadow-sm ${
            notification.type === 'error' ? 'bg-red-100 text-red-800 border border-red-200' : 
            notification.type === 'warning' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
            'bg-green-100 text-green-800 border border-green-200'
          }`}>
             {notification.type === 'warning' ? <AlertCircle className="w-5 h-5" /> : notification.type === 'success' ? <Check className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
             <span className="font-bold text-lg">{notification.msg}</span>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50/50">
          <h3 className="text-lg font-bold text-blue-900 flex items-center gap-2">
            <Accessibility className="w-5 h-5" />
            נוכחים היום ({todaysCheckIns.length})
          </h3>
          <Button variant="outline" size="sm" onClick={clearDailyData} disabled={processing || todaysCheckIns.length === 0} className="text-xs">נקה רשימה</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <tbody className="bg-white">
              {todaysCheckIns.map(c => (
                <tr key={c.id} className="hover:bg-blue-50/30 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-bold">{format(parseISO(c.timestamp), 'HH:mm')}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-xl font-black text-gray-900">{c.residentName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 font-medium">בנוכחות: {c.trainerName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-left">
                    <button 
                      onClick={() => handleDeleteRecord(c.id, c.residentName)}
                      className="p-2 text-red-200 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
                      title="ביטול רישום"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
              {todaysCheckIns.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center text-gray-300 italic">
                    <div className="flex flex-col items-center gap-3">
                      <Accessibility className="w-16 h-16 opacity-5" />
                      <p className="text-xl font-medium">טרם נרשמו מתאמנים היום</p>
                    </div>
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