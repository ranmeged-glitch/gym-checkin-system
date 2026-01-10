import React, { useState, useEffect, useMemo } from 'react';
import { Resident } from '../types';
import { residentService } from '../services/api';
import { differenceInDays, parseISO, format, addYears } from 'date-fns';
import { Button } from './Button';
import { 
  Edit2, 
  Trash2, 
  Plus, 
  Loader2, 
  Search, 
  X, 
  Users,
  Calendar,
  AlertCircle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

type SortKey = 'name' | 'expiry' | 'days';
type SortDirection = 'asc' | 'desc';

export const AdminResidents: React.FC = () => {
  const [residents, setResidents] = useState<Resident[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Resident>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{key: SortKey, direction: SortDirection}>({ 
    key: 'name', 
    direction: 'asc' 
  });

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
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (key: SortKey) => {
    let direction: SortDirection = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedAndFilteredResidents = useMemo(() => {
    let result = residents.filter(r => 
      `${r.firstName} ${r.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
    );

    result.sort((a, b) => {
      if (sortConfig.key === 'name') {
        const nameA = `${a.firstName} ${a.lastName}`;
        const nameB = `${b.firstName} ${b.lastName}`;
        return sortConfig.direction === 'asc' 
          ? nameA.localeCompare(nameB, 'he') 
          : nameB.localeCompare(nameA, 'he');
      }

      const expiryA = a.medicalCertificateStartDate ? addYears(parseISO(a.medicalCertificateStartDate), 1).getTime() : 0;
      const expiryB = b.medicalCertificateStartDate ? addYears(parseISO(b.medicalCertificateStartDate), 1).getTime() : 0;

      return sortConfig.direction === 'asc' ? expiryA - expiryB : expiryB - expiryA;
    });

    return result;
  }, [residents, searchTerm, sortConfig]);

  const handleEdit = (resident: Resident) => {
    setFormData({
      ...resident,
      medicalCertificateStartDate: resident.medicalCertificateStartDate 
        ? resident.medicalCertificateStartDate.split('T')[0] 
        : ''
    });
    setIsEditing(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`האם אתה בטוח שברצונך למחוק את "${name}"?`)) {
      try {
        await residentService.delete(id);
        await fetchResidents();
      } catch (err) {
        alert('שגיאה במחיקה');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await residentService.upsert(formData);
      setIsEditing(false);
      await fetchResidents();
    } catch (err) {
      alert('שגיאה בשמירה');
    } finally {
      setSaving(false);
    }
  };

  const getSortIcon = (key: SortKey) => {
    if (sortConfig.key !== key) return <ArrowUpDown className="w-4 h-4 opacity-30" />;
    return sortConfig.direction === 'asc' ? <ArrowUp className="w-4 h-4 text-blue-600" /> : <ArrowDown className="w-4 h-4 text-blue-600" />;
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20">
      <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
      <span className="font-bold text-gray-600">טוען נתונים מהמסד...</span>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6 text-right px-4 md:px-0" dir="rtl">
      
      {/* כותרת עליונה - מותאמת למובייל */}
      <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-0 z-30">
        <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg text-white"><Users className="w-5 h-5 md:w-6 md:h-6" /></div>
            <h2 className="text-xl md:text-2xl font-black text-gray-800">ניהול דיירים ואישורים</h2>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative flex-1 sm:w-64">
              <input 
                type="text" 
                placeholder="חיפוש דייר..." 
                className="w-full pr-10 pl-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="absolute right-3 top-2.5 text-gray-400 w-5 h-5" />
            </div>
            <Button 
              className="w-full sm:w-auto"
              onClick={() => {
                setFormData({ medicalCertificateStartDate: new Date().toISOString().split('T')[0] });
                setIsEditing(true);
              }}
            >
              <Plus className="ml-1 inline w-4 h-4"/>דייר חדש
            </Button>
          </div>
        </div>
      </div>

      {/* טבלה עם גלילה אופקית מוגנת למובייל */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[600px] max-h-[70vh] overflow-y-auto relative">
            <table className="w-full text-right border-collapse">
              <thead className="sticky top-0 z-20 bg-gray-50 shadow-sm">
                <tr className="text-gray-500 text-sm">
                  <th className="px-6 py-4 cursor-pointer group" onClick={() => handleSort('name')}>
                    <div className="flex items-center gap-2 group-hover:text-blue-600 transition-colors uppercase tracking-wider font-bold">
                      שם הדייר {getSortIcon('name')}
                    </div>
                  </th>
                  <th className="px-6 py-4 cursor-pointer group" onClick={() => handleSort('expiry')}>
                    <div className="flex items-center gap-2 group-hover:text-blue-600 transition-colors font-bold">
                      תוקף אישור {getSortIcon('expiry')}
                    </div>
                  </th>
                  <th className="px-6 py-4 text-center cursor-pointer group" onClick={() => handleSort('days')}>
                    <div className="flex justify-center items-center gap-2 group-hover:text-blue-600 transition-colors font-bold">
                      ימים {getSortIcon('days')}
                    </div>
                  </th>
                  <th className="px-6 py-4 font-bold">פעולות</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sortedAndFilteredResidents.map((r) => {
                  const expiryDate = r.medicalCertificateStartDate ? addYears(parseISO(r.medicalCertificateStartDate), 1) : null;
                  const daysRemaining = expiryDate ? differenceInDays(expiryDate, new Date()) : -999;

                  return (
                    <tr key={r.id} className="hover:bg-blue-50/30 transition-colors group">
                      <td className="px-6 py-5 font-bold text-gray-900">{r.firstName} {r.lastName}</td>
                      <td className="px-6 py-5 text-gray-600 font-medium">
                        {expiryDate ? format(expiryDate, 'dd/MM/yyyy') : '---'}
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className={`px-4 py-1.5 rounded-full font-black text-sm inline-block min-w-[60px] shadow-sm ${
                          daysRemaining < 0 ? 'bg-red-100 text-red-700 border border-red-200' : 
                          daysRemaining < 30 ? 'bg-orange-100 text-orange-700 border border-orange-200' : 'bg-green-100 text-green-700 border border-green-200'
                        }`}>
                          {daysRemaining === -999 ? 'חסר' : daysRemaining}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex gap-2">
                          <button onClick={() => handleEdit(r)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-all"><Edit2 className="w-5 h-5"/></button>
                          <button onClick={() => handleDelete(r.id, `${r.firstName} ${r.lastName}`)} className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition-all"><Trash2 className="w-5 h-5"/></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* חלונית עריכה */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 relative animate-in fade-in zoom-in duration-200">
            <button onClick={() => setIsEditing(false)} className="absolute top-5 left-5 text-gray-400 hover:text-gray-600 transition-colors p-1"><X className="w-6 h-6" /></button>
            
            <div className="flex items-center gap-3 mb-8 border-b pb-4">
                <div className="bg-blue-100 p-2 rounded-xl text-blue-600"><Edit2 className="w-6 h-6"/></div>
                <h3 className="text-2xl font-black text-gray-800">
                  {formData.id ? 'עדכון פרטי דייר' : 'הוספת דייר חדש'}
                </h3>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 mr-1">שם פרטי</label>
                    <input className="w-full p-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" value={formData.firstName || ''} onChange={e => setFormData({...formData, firstName: e.target.value})} required />
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 mr-1">שם משפחה</label>
                    <input className="w-full p-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" value={formData.lastName || ''} onChange={e => setFormData({...formData, lastName: e.target.value})} required />
                </div>
              </div>
              
              <div className="p-5 bg-blue-50 rounded-2xl border border-blue-100 space-y-3">
                <label className="flex items-center gap-2 text-sm font-bold text-blue-900">
                  <Calendar className="w-4 h-4" /> תאריך קבלת האישור (במסד):
                </label>
                
                <input 
                  type="date" 
                  className="w-full p-3 bg-white border-blue-200 border-2 rounded-xl font-bold text-blue-900 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm" 
                  value={formData.medicalCertificateStartDate || ''} 
                  onChange={e => setFormData({...formData, medicalCertificateStartDate: e.target.value})} 
                  required
                />
                
                <div className="flex items-start gap-2 text-[11px] text-blue-600 leading-tight">
                   <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                   <p>הזן את התאריך המדויק מהמסמך. המערכת תחשב פקיעה ליום: 
                   <span className="font-bold mr-1">
                    {formData.medicalCertificateStartDate ? format(addYears(parseISO(formData.medicalCertificateStartDate), 1), 'dd/MM/yyyy') : '---'}
                   </span>
                   </p>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1 py-4 text-lg font-black shadow-lg shadow-blue-200" disabled={saving}>
                  {saving ? <Loader2 className="w-6 h-6 animate-spin mx-auto"/> : 'שמור נתונים'}
                </Button>
                <Button variant="outline" onClick={() => setIsEditing(false)} type="button" className="px-6 border-2">ביטול</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};