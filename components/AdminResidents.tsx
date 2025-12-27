import React, { useState, useEffect, useMemo } from 'react';
import { Resident, SubscriptionStatus, TrainingLimitation } from '../types';
import { residentService } from '../services/api';
import { differenceInDays, parseISO, format, addYears } from 'date-fns';
import { Button } from './Button';
import { Edit2, Trash2, Plus, AlertCircle, Calendar, ArrowUpDown, ArrowUp, ArrowDown, Loader2, Search, X } from 'lucide-react';

type SortKey = 'name' | 'daysRemaining';
type SortDirection = 'asc' | 'desc';

interface SortConfig {
  key: SortKey;
  direction: SortDirection;
}

export const AdminResidents: React.FC = () => {
  const [residents, setResidents] = useState<Resident[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Resident>>({});
  const [sortConfig, setSortConfig] = useState<SortConfig | null>({ key: 'name', direction: 'asc' });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchResidents();
  }, []);

  const fetchResidents = async () => {
    setLoading(true);
    try {
      const data = await residentService.getAll();
      setResidents(data);
    } catch (err) {
      alert('שגיאה בטעינת הנתונים');
    } finally {
      setLoading(false);
    }
  };

  const getStatus = (expiryStr: string): SubscriptionStatus => {
    const expiry = parseISO(expiryStr);
    const today = new Date();
    const daysLeft = differenceInDays(expiry, today);
    if (daysLeft < 0) return SubscriptionStatus.EXPIRED;
    if (daysLeft <= 45) return SubscriptionStatus.WARNING;
    return SubscriptionStatus.VALID;
  };

  const getDaysRemaining = (expiryStr: string): number => {
    return differenceInDays(parseISO(expiryStr), new Date());
  };

  const filteredResidents = useMemo(() => {
    if (!searchTerm.trim()) return residents;
    const term = searchTerm.toLowerCase();
    return residents.filter(r => 
      `${r.firstName} ${r.lastName}`.toLowerCase().includes(term)
    );
  }, [residents, searchTerm]);

  const sortedResidents = useMemo(() => {
    if (!sortConfig) return filteredResidents;
    return [...filteredResidents].sort((a, b) => {
      if (sortConfig.key === 'name') {
        const nameA = `${a.firstName} ${a.lastName}`;
        const nameB = `${b.firstName} ${b.lastName}`;
        return sortConfig.direction === 'asc' ? nameA.localeCompare(nameB, 'he') : nameB.localeCompare(nameA, 'he');
      }
      if (sortConfig.key === 'daysRemaining') {
        const daysA = getDaysRemaining(a.subscriptionExpiry);
        const daysB = getDaysRemaining(b.subscriptionExpiry);
        return sortConfig.direction === 'asc' ? daysA - daysB : daysB - daysA;
      }
      return 0;
    });
  }, [filteredResidents, sortConfig]);

  const handleSort = (key: SortKey) => {
    let direction: SortDirection = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const renderSortIcon = (key: SortKey) => {
    if (sortConfig?.key !== key) return <ArrowUpDown className="w-4 h-4 ml-1 text-gray-400" />;
    return sortConfig.direction === 'asc' ? <ArrowUp className="w-4 h-4 ml-1 text-blue-600" /> : <ArrowDown className="w-4 h-4 ml-1 text-blue-600" />;
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('האם למחוק דייר זה?')) {
      setSaving(true);
      try {
        await residentService.delete(id);
        await fetchResidents();
      } catch (err) {
        alert('שגיאה במחיקה');
      } finally {
        setSaving(false);
      }
    }
  };

  const handleEdit = (resident: Resident) => {
    setFormData(resident);
    setIsEditing(true);
  };

  const handleAddNew = () => {
    const today = new Date();
    const nextYear = addYears(today, 1);
    setFormData({
      firstName: '',
      lastName: '',
      medicalConditions: '',
      trainingLimitation: TrainingLimitation.NONE,
      medicalCertificateStartDate: format(today, 'yyyy-MM-dd'),
      subscriptionExpiry: nextYear.toISOString()
    });
    setIsEditing(true);
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStart = e.target.value;
    if (!newStart) return;
    const startObj = new Date(newStart);
    const endObj = addYears(startObj, 1);
    setFormData({ ...formData, medicalCertificateStartDate: newStart, subscriptionExpiry: endObj.toISOString() });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.subscriptionExpiry || !formData.medicalCertificateStartDate) return;
    
    setSaving(true);
    try {
      if (formData.id) {
        await residentService.update(formData as Resident);
      } else {
        await residentService.add(formData as Resident);
      }
      await fetchResidents();
      setIsEditing(false);
    } catch (err) {
      alert('שגיאה בשמירה');
    } finally {
      setSaving(false);
    }
  };

  const getLimitationLabel = (lim: TrainingLimitation, details?: string) => {
    switch (lim) {
      case TrainingLimitation.SEATED_ONLY: return 'בישיבה בלבד';
      case TrainingLimitation.PHYSIO_SUPERVISION: return 'ליווי פיזיותרפיסט';
      case TrainingLimitation.OTHER: return details || 'אחר';
      default: return 'ללא';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col h-[calc(100vh-140px)]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-gray-800">ניהול דיירים</h2>
          <p className="text-sm text-gray-500">ניהול רשימת המתאמנים ותוקף האישורים הרפואיים</p>
        </div>
        <Button onClick={handleAddNew} size="sm" disabled={saving}>
          <Plus className="w-4 h-4 ml-1 inline" />
          הוסף דייר חדש
        </Button>
      </div>

      {!isEditing && !loading && (
        <div className="mb-4 flex flex-col sm:flex-row gap-4 items-center bg-gray-50 p-3 rounded-lg border border-gray-100 shrink-0">
          <div className="relative flex-1 w-full">
            <input
              type="text"
              placeholder="חפש דייר לפי שם..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-12 pl-12 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-base bg-white"
            />
            {/* Search Icon - Right Side (RTL Start) */}
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
            
            {/* Clear Button - Left Side (RTL End) */}
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-full transition-all"
                title="נקה חיפוש"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          <div className="text-xs text-gray-500 font-bold whitespace-nowrap bg-white px-3 py-2.5 rounded-full border border-gray-200 shadow-sm">
            מציג {sortedResidents.length} מתוך {residents.length} דיירים
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
           <Loader2 className="w-12 h-12 animate-spin mb-4" />
           <p className="text-lg">טוען נתונים מהמסד...</p>
        </div>
      ) : isEditing ? (
        <div className="overflow-auto">
          <form onSubmit={handleSave} className="space-y-4 max-w-lg bg-gray-50 p-6 rounded-lg relative border border-gray-200 shadow-inner">
            {saving && <div className="absolute inset-0 bg-white/50 z-20 flex items-center justify-center"><Loader2 className="animate-spin" /></div>}
            <h3 className="font-bold text-lg">{formData.id ? 'עריכת פרטי דייר' : 'הוספת דייר חדש'}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">שם פרטי</label>
                <input type="text" required value={formData.firstName || ''} onChange={e => setFormData({...formData, firstName: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">שם משפחה</label>
                <input type="text" required value={formData.lastName || ''} onChange={e => setFormData({...formData, lastName: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            </div>
            
            <div className="bg-blue-50 p-3 rounded border border-blue-100">
              <label className="block text-sm font-bold text-blue-900 mb-1">תאריך קבלת אישור רפואי</label>
              <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <input type="date" required value={formData.medicalCertificateStartDate ? format(parseISO(formData.medicalCertificateStartDate), 'yyyy-MM-dd') : ''} onChange={handleStartDateChange} className="block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-md border border-gray-200 shadow-sm">
               <label className="block text-sm font-bold text-gray-800 mb-2">מגבלות אימון</label>
               <select 
                 value={formData.trainingLimitation || TrainingLimitation.NONE} 
                 onChange={e => setFormData({...formData, trainingLimitation: e.target.value as TrainingLimitation})} 
                 className="block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:ring-2 focus:ring-blue-500 outline-none"
               >
                 <option value={TrainingLimitation.NONE}>ללא הגבלה</option>
                 <option value={TrainingLimitation.SEATED_ONLY}>אימון בישיבה בלבד</option>
                 <option value={TrainingLimitation.PHYSIO_SUPERVISION}>אימון בליווי פיזיותרפיסט בלבד</option>
                 <option value={TrainingLimitation.OTHER}>אחר (פירוט חופשי)</option>
               </select>

               {formData.trainingLimitation === TrainingLimitation.OTHER && (
                 <div className="mt-3 animate-in fade-in slide-in-from-top-2 duration-200">
                    <label className="block text-sm font-medium text-gray-600 mb-1">פרט את המגבלה:</label>
                    <textarea 
                      value={formData.medicalConditions || ''} 
                      onChange={e => setFormData({...formData, medicalConditions: e.target.value})}
                      placeholder="למשל: לא להשתמש במכשיר דחיקת רגליים..."
                      className="w-full rounded-md border-gray-300 shadow-sm p-2 border focus:ring-2 focus:ring-blue-500 outline-none h-20 text-sm"
                    />
                 </div>
               )}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>ביטול</Button>
              <Button type="submit" disabled={saving}>{saving ? 'שומר...' : 'שמור דייר'}</Button>
            </div>
          </form>
        </div>
      ) : (
        <div className="overflow-auto border rounded-lg shadow-sm flex-1">
          <table className="min-w-full divide-y divide-gray-200 relative">
            <thead className="bg-gray-50">
              <tr>
                <th className="sticky top-0 z-10 bg-gray-50 px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 shadow-sm" onClick={() => handleSort('name')}>
                  <div className="flex items-center">שם מלא {renderSortIcon('name')}</div>
                </th>
                <th className="sticky top-0 z-10 bg-gray-50 px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase shadow-sm">מגבלות</th>
                <th className="sticky top-0 z-10 bg-gray-50 px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase shadow-sm">תוקף אישור</th>
                <th className="sticky top-0 z-10 bg-gray-50 px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 shadow-sm" onClick={() => handleSort('daysRemaining')}>
                  <div className="flex items-center justify-center">ימים {renderSortIcon('daysRemaining')}</div>
                </th>
                <th className="sticky top-0 z-10 bg-gray-50 px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase shadow-sm">פעולות</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedResidents.map(r => {
                const status = getStatus(r.subscriptionExpiry);
                const daysRemaining = getDaysRemaining(r.subscriptionExpiry);
                const limitation = r.trainingLimitation || TrainingLimitation.NONE;
                return (
                  <tr key={r.id} className={status === SubscriptionStatus.EXPIRED ? 'bg-red-50' : status === SubscriptionStatus.WARNING ? 'bg-orange-50' : 'hover:bg-gray-50 transition-colors'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{r.firstName} {r.lastName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {limitation !== TrainingLimitation.NONE ? (
                        <div className="flex items-center gap-1 text-orange-700 font-medium">
                          <AlertCircle className="w-4 h-4" />
                          <span className="max-w-[150px] truncate" title={r.medicalConditions}>
                            {getLimitationLabel(limitation, r.medicalConditions)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400">אין</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{format(parseISO(r.subscriptionExpiry), 'dd/MM/yyyy')}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-bold">
                       <span className={daysRemaining < 0 ? 'text-red-600' : daysRemaining <= 45 ? 'text-orange-600' : 'text-green-600'}>
                        {daysRemaining}
                       </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 flex gap-3">
                      <button onClick={() => handleEdit(r)} className="text-blue-600 hover:text-blue-900 transition-colors" title="ערוך">
                        <Edit2 className="w-5 h-5"/>
                      </button>
                      <button onClick={() => handleDelete(r.id)} className="text-red-600 hover:text-red-900 transition-colors" title="מחק">
                        <Trash2 className="w-5 h-5"/>
                      </button>
                    </td>
                  </tr>
                );
              })}
              {sortedResidents.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400 font-medium italic">
                    לא נמצאו דיירים העונים לחיפוש "{searchTerm}"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
