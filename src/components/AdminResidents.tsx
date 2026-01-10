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
      console.error('Fetch error:', err);
      alert('שגיאה בטעינת הנתונים מהשרת');
    } finally {
      setLoading(false);
    }
  };

  const getStatus = (expiryStr: string): SubscriptionStatus => {
    if (!expiryStr) return SubscriptionStatus.EXPIRED;
    const expiry = parseISO(expiryStr);
    const today = new Date();
    const daysLeft = differenceInDays(expiry, today);
    if (daysLeft < 0) return SubscriptionStatus.EXPIRED;
    if (daysLeft <= 45) return SubscriptionStatus.WARNING;
    return SubscriptionStatus.VALID;
  };

  const getDaysRemaining = (expiryStr: string): number => {
    if (!expiryStr) return 0;
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
    if (window.confirm('האם למחוק דייר זה לצמיתות?')) {
      setSaving(true);
      try {
        await residentService.delete(id);
        await fetchResidents();
      } catch (err) {
        console.error('Delete error:', err);
        alert('שגיאה במחיקת הדייר');
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
    setFormData({ 
      ...formData, 
      medicalCertificateStartDate: newStart, 
      subscriptionExpiry: endObj.toISOString() 
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.subscriptionExpiry) {
      alert('נא למלא שדות חובה (שם פרטי, משפחה ותאריך)');
      return;
    }
    
    setSaving(true);
    try {
      // שימוש בפונקציית ה-upsert המעודכנת מ-api.ts
      await residentService.upsert(formData);
      await fetchResidents();
      setIsEditing(false);
      setFormData({});
    } catch (err) {
      console.error('Save error:', err);
      alert('שגיאה בשמירה למסד הנתונים. וודא שכל הנתונים תקינים.');
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
        {!isEditing && (
          <Button onClick={handleAddNew} size="sm" disabled={loading}>
            <Plus className="w-4 h-4 ml-1 inline" />
            הוסף דייר חדש
          </Button>
        )}
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
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-full transition-all"
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
           <p className="text-lg">טוען נתונים מ-Supabase...</p>
        </div>
      ) : isEditing ? (
        <div className="overflow-auto">
          <form onSubmit={handleSave} className="space-y-4 max-w-lg bg-gray-50 p-6 rounded-lg relative border border-gray-200 shadow-inner">
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
                  <input 
                    type="date" 
                    required 
                    value={formData.medicalCertificateStartDate ? formData.medicalCertificateStartDate.split('T')[0] : ''} 
                    onChange={handleStartDateChange} 
                    className="block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:ring-2 focus:ring-blue-500 outline-none" 
                  />
              </div>
              <p className="text-xs text-blue-700 mt-1">* התוקף יתעדכן אוטומטית לשנה מהתאריך הנבחר</p>
            </div>
            
            <div className="bg-white p-4 rounded-md border border-gray-200 shadow-sm">
               <label className="block text-sm font-bold text-gray-800 mb-2