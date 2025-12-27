import React, { useState } from 'react';
import { User, Role } from './types';
import { login } from './mockData';
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
  
  // Login State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const loggedUser = await login(username, password);
      if (loggedUser) {
        setUser(loggedUser);
        // Viewer lands on reports, others on checkin
        setActiveTab(loggedUser.role === Role.VIEWER ? 'reports' : 'checkin');
      } else {
        setError('שם משתמש או סיסמה שגויים');
      }
    } catch (e) {
      setError('שגיאת מערכת');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setUsername('');
    setPassword('');
  };

  // -- Render Login --
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center mb-4">
             <div className="bg-blue-900 p-3 rounded-full">
                <Lock className="w-8 h-8 text-white" />
             </div>
          </div>
          <h2 className="text-center text-3xl font-extrabold text-blue-900">
            מערכת ניהול חדר כושר
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
           בית בכפר גדרה
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <form className="space-y-6" onSubmit={handleLogin}>
              <div>
                <label className="block text-sm font-medium text-gray-700">שם משתמש</label>
                <div className="mt-1">
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">סיסמה</label>
                <div className="mt-1">
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>

              {error && <div className="text-red-600 text-sm text-center">{error}</div>}

              <div>
                <Button type="submit" className="w-full flex justify-center" disabled={loading}>
                  {loading ? 'מתחבר...' : 'כנס למערכת'}
                </Button>
              </div>
              
              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">
                      פרטי ברירת מחדל (ניתן לשינוי ע"י אדמין)
                    </span>
                  </div>
                </div>
                <div className="mt-2 text-center text-xs text-gray-500">
                  <p>אדמין: admin / 123</p>
                  <p>מאמן: trainer / 123</p>
                  <p>הנהלה: manager / 123</p>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // -- Render Dashboard --
  return (
    <Layout 
      user={user} 
      activeTab={activeTab} 
      onTabChange={setActiveTab} 
      onLogout={handleLogout}
    >
      {activeTab === 'checkin' && user.role !== Role.VIEWER && <CheckInModule />}
      {activeTab === 'residents' && user.role === Role.ADMIN && <AdminResidents />}
      {activeTab === 'reports' && <ReportsModule />}
      {activeTab === 'trainers' && user.role === Role.ADMIN && <AdminTrainers />}
      {activeTab === 'users' && user.role === Role.ADMIN && <AdminUsers />}
    </Layout>
  );
}
