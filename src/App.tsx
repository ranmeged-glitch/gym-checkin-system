import React, { useState } from 'react';
import { User, Role } from './types';
import { authService } from './services/api'; // שינוי כאן
import { Layout } from './components/Layout';
import { Button } from './components/Button';
import { CheckInModule } from './components/CheckInModule';
import { AdminResidents } from './components/AdminResidents';
import { AdminTrainers } from './components/AdminTrainers';
import { AdminUsers } from './components/AdminUsers';
import { ReportsModule } from './components/ReportsModule';
import { Lock } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('checkin');
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const loggedUser = await authService.login(username, password); // קריאה ל-DB
      if (loggedUser) {
        setUser(loggedUser);
        setActiveTab(loggedUser.role === Role.VIEWER ? 'reports' : 'checkin');
      } else {
        setError('שם משתמש או סיסמה שגויים');
      }
    } catch (e) {
      setError('שגיאת מערכת בהתחברות');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setActiveTab('checkin');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 font-sans" dir="rtl">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-blue-700 p-8 text-white text-center">
            <div className="bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold">מערכת בקרת חדר כושר</h1>
            <p className="opacity-80">בית הכפר</p>
          </div>
          
          <div className="p-8">
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">שם משתמש</label>
                <input 
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">סיסמה</label>
                <input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  required
                />
              </div>
              <Button type="submit" className="w-full py-3" disabled={loading}>
                {loading ? 'מתחבר...' : 'כנס למערכת'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Layout user={user} activeTab={activeTab} onTabChange={setActiveTab} onLogout={handleLogout}>
      {activeTab === 'checkin' && user.role !== Role.VIEWER && <CheckInModule />}
      {activeTab === 'residents' && user.role === Role.ADMIN && <AdminResidents />}
      {activeTab === 'reports' && <ReportsModule />}
      {activeTab === 'trainers' && user.role === Role.ADMIN && <AdminTrainers />}
      {activeTab === 'users' && user.role === Role.ADMIN && <AdminUsers />}
    </Layout>
  );
}