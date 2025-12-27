import React, { useState, useEffect } from 'react';
import { Role, SystemUser } from '../types';
import { getSystemUsers, saveSystemUsers } from '../mockData';
import { Button } from './Button';
import { Edit, Key, Shield, User, Eye, Save } from 'lucide-react';

export const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [passwordInput, setPasswordInput] = useState('');

  useEffect(() => {
    setUsers(getSystemUsers());
  }, []);

  const handleChangePassword = (id: string) => {
    if (!passwordInput) return;
    
    if (window.confirm('האם לשנות את הסיסמה למשתמש זה?')) {
      const updated = users.map(u => 
        u.id === id ? { ...u, password: passwordInput } : u
      );
      setUsers(updated);
      saveSystemUsers(updated);
      setEditingId(null);
      setPasswordInput('');
      alert('הסיסמה שונתה בהצלחה');
    }
  };

  const getRoleLabel = (role: Role) => {
    switch (role) {
      case Role.ADMIN: return 'מנהל מערכת';
      case Role.TRAINER: return 'מאמן';
      case Role.VIEWER: return 'הנהלה (צפייה)';
      default: return role;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800">ניהול משתמשים וסיסמאות</h2>
        <p className="text-gray-500 text-sm">כאן ניתן לאפס סיסמאות למשתמשים השונים במערכת</p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">שם משתמש (Login)</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">שם תצוגה</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">תפקיד</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">ניהול סיסמה</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map(user => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" />
                  {user.username}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {user.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user.role === Role.ADMIN ? 'bg-purple-100 text-purple-800' :
                    user.role === Role.VIEWER ? 'bg-gray-100 text-gray-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {user.role === Role.ADMIN && <Shield className="w-3 h-3 ml-1" />}
                    {user.role === Role.VIEWER && <Eye className="w-3 h-3 ml-1" />}
                    {getRoleLabel(user.role)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {editingId === user.id ? (
                    <div className="flex items-center gap-2">
                      <input 
                        type="text" 
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        placeholder="סיסמה חדשה..."
                        className="border border-blue-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 w-32"
                        autoFocus
                      />
                      <Button size="sm" onClick={() => handleChangePassword(user.id)}>
                        <Save className="w-4 h-4 ml-1 inline" />
                        שמור
                      </Button>
                      <button 
                        onClick={() => { setEditingId(null); setPasswordInput(''); }}
                        className="text-gray-500 hover:text-gray-700 text-sm underline"
                      >
                        ביטול
                      </button>
                    </div>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => { setEditingId(user.id); setPasswordInput(''); }}>
                      <Key className="w-4 h-4 ml-1 inline" />
                      שנה סיסמה
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="mt-6 bg-yellow-50 p-4 rounded-lg border border-yellow-100 text-sm text-yellow-800">
        <strong>שים לב:</strong> שינוי הסיסמה הוא מיידי. המשתמש יצטרך להזין את הסיסמה החדשה בכניסה הבאה.
      </div>
    </div>
  );
};