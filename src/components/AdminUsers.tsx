import React, { useState, useEffect } from 'react';
import { User, Role } from '../types';
import { authService } from '../services/api';
import { Button } from './Button';
import { Key, Shield, User as UserIcon, Lock, Loader2, CheckCircle, Info, Save, X } from 'lucide-react';

export const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await authService.getAllUsers();
      setUsers(data);
    } catch (err) {
      setMessage({ type: 'error', text: 'שגיאה בטעינת המשתמשים' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (id: string) => {
    if (!passwordInput || passwordInput.length < 4) {
      alert('הסיסמה חייבת להכיל לפחות 4 תווים');
      return;
    }

    setSaving(true);
    try {
      await authService.updatePassword(id, passwordInput);
      setMessage({ type: 'success', text: 'הסיסמה עודכנה בהצלחה!' });
      setEditingId(null);
      setPasswordInput('');
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: 'עדכון הסיסמה נכשל' });
    } finally {
      setSaving(false);
    }
  };

  const getRoleBadge = (role: string) => {
    const styles = {
      [Role.ADMIN]: "bg-purple-100 text-purple-700 border-purple-200",
      [Role.TRAINER]: "bg-blue-100 text-blue-700 border-blue-200",
      [Role.VIEWER]: "bg-gray-100 text-gray-700 border-gray-200"
    };
    const labels = {
      [Role.ADMIN]: "מנהל מערכת",
      [Role.TRAINER]: "מאמן",
      [Role.VIEWER]: "צפייה בלבד"
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${styles[role as Role] || styles[Role.VIEWER]}`}>
        {labels[role as Role] || role}
      </span>
    );
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20">
      <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
      <p className="text-gray-500 font-medium">טוען הגדרות אבטחה...</p>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
      
      {/* הודעות מערכת */}
      {message && (
        <div className={`p-4 rounded-xl flex items-center gap-3 border shadow-sm ${
          message.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <Info className="w-5 h-5" />}
          <span className="font-bold">{message.text}</span>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="bg-gray-50 px-8 py-6 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg text-white">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-800">ניהול משתמשים וסיסמאות</h2>
              <p className="text-sm text-gray-500">ניהול הרשאות גישה ועדכון פרטי התחברות לצוות</p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-gray-50/50 text-gray-400 text-xs uppercase tracking-wider border-b">
                <th className="px-8 py-4 font-bold">משתמש</th>
                <th className="px-8 py-4 font-bold">תפקיד הרשאה</th>
                <th className="px-8 py-4 font-bold">אבטחה</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 font-bold border border-blue-100">
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-gray-900">{u.name}</div>
                        <div className="text-sm text-gray-400 font-mono">{u.username}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    {getRoleBadge(u.role)}
                  </td>
                  <td className="px-8 py-5">
                    {editingId === u.id ? (
                      <div className="flex items-center gap-2 animate-in slide-in-from-left-2">
                        <div className="relative">
                          <input 
                            type="password" 
                            value={passwordInput} 
                            onChange={e => setPasswordInput(e.target.value)} 
                            className="pr-8 pl-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm w-40"
                            placeholder="סיסמה חדשה"
                            autoFocus
                          />
                          <Lock className="absolute right-2 top-2.5 w-4 h-4 text-gray-400" />
                        </div>
                        <Button size="sm" onClick={() => handleUpdate(u.id)} disabled={saving}>
                          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        </Button>
                        <button 
                          onClick={() => {setEditingId(null); setPasswordInput('');}}
                          className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    ) : (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {setEditingId(u.id); setPasswordInput('');}}
                        className="hover:border-blue-500 hover:text-blue-600 transition-all"
                      >
                        <Key className="w-4 h-4 ml-2" />
                        שנה סיסמה
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex gap-3">
        <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800">
          <strong>הערת אבטחה:</strong> שינוי סיסמה משפיע באופן מיידי. מומלץ לבחור סיסמה חזקה המשלבת אותיות ומספרים. המערכת אינה שומרת היסטוריית סיסמאות ישנות.
        </p>
      </div>
    </div>
  );
};