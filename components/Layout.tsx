import React from 'react';
import { useApp } from '../context/AppContext';
import { Shield, ShieldAlert, Home, History, User as UserIcon } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: 'home' | 'history' | 'profile';
  onTabChange: (tab: 'home' | 'history' | 'profile') => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange }) => {
  const { safeMode, toggleSafeMode } = useApp();

  return (
    <div className="flex flex-col h-full bg-gray-50 w-full overflow-hidden relative">
      {/* Header */}
      <header className={`px-6 py-4 flex justify-between items-center transition-colors duration-300 ${safeMode ? 'bg-brand-700 text-white' : 'bg-white text-gray-900 border-b border-gray-100'}`}>
        <div className="flex items-center gap-2">
           <div className={`p-1.5 rounded-lg ${safeMode ? 'bg-white/20' : 'bg-brand-600 text-white'}`}>
             <Shield size={20} fill="currentColor" />
           </div>
           <h1 className="font-bold text-lg tracking-tight">PayGuardX</h1>
        </div>
        
        <button 
          onClick={toggleSafeMode}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
            safeMode 
              ? 'bg-white text-brand-700 shadow-sm' 
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          }`}
        >
          {safeMode ? (
            <>
              <Shield size={12} fill="currentColor" />
              SAFE MODE ON
            </>
          ) : (
            <>
              <ShieldAlert size={12} />
              SAFE MODE OFF
            </>
          )}
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden relative bg-gray-50">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="bg-white border-t border-gray-200 px-6 py-3 flex justify-between items-center z-10">
        <button 
          onClick={() => onTabChange('home')}
          className={`flex flex-col items-center gap-1 ${activeTab === 'home' ? 'text-brand-700' : 'text-gray-400'}`}
        >
          <Home size={24} strokeWidth={activeTab === 'home' ? 2.5 : 2} />
          <span className="text-[10px] font-medium">Home</span>
        </button>
        <button 
          onClick={() => onTabChange('history')}
          className={`flex flex-col items-center gap-1 ${activeTab === 'history' ? 'text-brand-700' : 'text-gray-400'}`}
        >
          <History size={24} strokeWidth={activeTab === 'history' ? 2.5 : 2} />
          <span className="text-[10px] font-medium">History</span>
        </button>
        <button 
          onClick={() => onTabChange('profile')}
          className={`flex flex-col items-center gap-1 ${activeTab === 'profile' ? 'text-brand-700' : 'text-gray-400'}`}
        >
          <UserIcon size={24} strokeWidth={activeTab === 'profile' ? 2.5 : 2} />
          <span className="text-[10px] font-medium">Profile</span>
        </button>
      </nav>
    </div>
  );
};