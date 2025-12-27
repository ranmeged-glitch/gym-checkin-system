import React from 'react';
import { Role, User } from '../types';
import { LogOut, LayoutDashboard, UserCheck, BarChart3, Users, Settings } from 'lucide-react';

interface LayoutProps {
  user: User;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ user, activeTab, onTabChange, onLogout, children }) => {
  
  const NavButton = ({ tab, icon: Icon, label }: { tab: string, icon: any, label: string }) => (
    <button
      onClick={() => onTabChange(tab)}
      className={`flex flex-col items-center justify-center p-3 w-full sm:w-auto sm:flex-row sm:space-x-2 sm:space-x-reverse rounded-lg transition-all ${
        activeTab === tab 
          ? 'bg-blue-100 text-blue-900 font-bold border-b-4 border-blue-700' 
          : 'text-gray-500 hover:bg-gray-100'
      }`}
    >
      <Icon className="w-6 h-6 mb-1 sm:mb-0" />
      <span>{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-md z-10 sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <span className="text-2xl font-black text-blue-900 tracking-tight">בית גיל הזהב</span>
              <span className="mr-4 text-sm bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full border border-blue-200">
                {user.role === Role.ADMIN ? 'ניהול' : user.role === Role.VIEWER ? 'הנהלה' : 'מאמן'}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="hidden sm:block text-gray-700 font-medium">שלום, {user.name}</span>
              <button 
                onClick={onLogout}
                className="p-2 rounded-full hover:bg-red-50 text-red-600 transition-colors"
                title="התנתק"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Navigation Bar */}
        <div className="border-t border-gray-200 bg-white">
          <div className="max-w-7xl mx-auto flex justify-around sm:justify-start sm:gap-4 px-2 py-2">
            
            {/* Trainer & Admin can see Check-in */}
            {user.role !== Role.VIEWER && (
              <NavButton tab="checkin" icon={UserCheck} label="צ'ק-אין" />
            )}

            {/* Admin Only */}
            {user.role === Role.ADMIN && (
              <>
                <NavButton tab="residents" icon={Users} label="דיירים" />
                <NavButton tab="trainers" icon={LayoutDashboard} label="מאמנים" />
                <NavButton tab="users" icon={Settings} label="משתמשים וסיסמאות" />
              </>
            )}

            {/* Everyone sees Reports */}
            <NavButton tab="reports" icon={BarChart3} label="דוחות" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  );
};