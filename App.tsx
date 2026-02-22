
import React, { useState, useEffect, useMemo } from 'react';
import { Role, User, AppState, CheckIn, SimSale, DailyReport } from './types';
import Auth from './components/Auth';
import OperatorPanel from './components/OperatorPanel';
import ManagerPanel from './components/ManagerPanel';
import { UserCircle, LogOut, Loader2, Trophy, Activity, Smartphone, Bell, LayoutDashboard } from 'lucide-react';

const STORAGE_KEY = 'sam_brend_db';

// Mahalliy YYYY-MM-DD formatini olish uchun funksiya
export const getTodayStr = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {
      currentUser: null,
      users: [],
      checkIns: [],
      sales: [],
      reports: []
    };
  });

  const [isLoading, setIsLoading] = useState(true);
  const [operatorTab, setOperatorTab] = useState('dashboard');

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save state to localStorage:', e);
      // If quota exceeded, we might want to clear some old data or just ignore
    }
  }, [state]);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const handleLogout = () => {
    setState(prev => ({ ...prev, currentUser: null }));
  };

  const updateUser = (userId: string, updates: Partial<User>) => {
    setState(prev => ({
      ...prev,
      users: prev.users.map(u => u.id === userId ? { ...u, ...updates } : u),
      currentUser: prev.currentUser?.id === userId ? { ...prev.currentUser, ...updates } : prev.currentUser
    }));
  };

  const approveUser = (userId: string) => {
    setState(prev => ({
      ...prev,
      users: prev.users.map(u => u.id === userId ? { ...u, isApproved: true } : u)
    }));
  };

  const addCheckIn = (checkIn: CheckIn) => {
    setState(prev => ({ ...prev, checkIns: [checkIn, ...prev.checkIns] }));
  };

  const updateCheckIn = (userId: string, date: string, updates: Partial<CheckIn>) => {
    setState(prev => ({
      ...prev,
      checkIns: prev.checkIns.map(c => {
        const isSameUser = c.userId === userId;
        const isSameDay = c.timestamp.includes(date);
        return (isSameUser && isSameDay) ? { ...c, ...updates } : c;
      })
    }));
  };

  const addSale = (sale: SimSale) => {
    setState(prev => {
      // Find if a sale with the same company and tariff already exists for this user today
      const existingIndex = prev.sales.findIndex(s => 
        s.userId === sale.userId && 
        s.date === sale.date && 
        s.company === sale.company && 
        s.tariff === sale.tariff
      );

      if (existingIndex > -1) {
        const updatedSales = [...prev.sales];
        updatedSales[existingIndex] = {
          ...updatedSales[existingIndex],
          count: updatedSales[existingIndex].count + sale.count,
          bonus: updatedSales[existingIndex].bonus + sale.bonus,
          timestamp: sale.timestamp // Update to latest timestamp
        };
        return { ...prev, sales: updatedSales };
      }

      return { ...prev, sales: [sale, ...prev.sales] };
    });
  };

  const removeSale = (saleId: string) => {
    setState(prev => ({
      ...prev,
      sales: prev.sales.filter(s => s.id !== saleId)
    }));
  };

  const addReport = (report: DailyReport) => {
    setState(prev => ({ ...prev, reports: [report, ...prev.reports] }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-blue-600 text-white">
        <Loader2 className="w-12 h-12 animate-spin mb-4" />
        <h1 className="text-2xl font-bold">Sam Brend Nomer</h1>
        <p className="opacity-80">Paynet tizimi yuklanmoqda...</p>
      </div>
    );
  }

  if (!state.currentUser) {
    return <Auth state={state} setState={setState} />;
  }

  if (!state.currentUser.isApproved) {
    const isNowApproved = state.users.find(u => u.id === state.currentUser?.id)?.isApproved;
    if (!isNowApproved) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
          <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
            <div className="w-20 h-20 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Loader2 className="w-10 h-10 animate-spin" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Kutib turing</h1>
            <p className="text-gray-600 mb-6">
              Sizning profilingiz menejer tomonidan tasdiqlanishini kuting. Tez orada ruxsat olasiz.
            </p>
            <button onClick={handleLogout} className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 rounded-lg transition">Chiqish</button>
          </div>
        </div>
      );
    }
  }

  const isManager = state.currentUser.role === Role.MANAGER;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="bg-blue-600 text-white p-1.5 rounded-lg"><span className="font-bold tracking-tighter text-lg">SBN</span></div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent hidden sm:block">Sam Brend Nomer</h1>
            </div>

            {state.currentUser && state.currentUser.role !== Role.MANAGER && state.currentUser.isApproved && (
              <nav className="hidden md:flex items-center bg-gray-50 p-1 rounded-xl border border-gray-100">
                <button 
                  onClick={() => setOperatorTab('dashboard')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${operatorTab === 'dashboard' ? 'bg-white text-blue-600 shadow-sm border border-gray-100' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <LayoutDashboard className="w-4 h-4" /> Panel
                </button>
                <button 
                  onClick={() => setOperatorTab('rating')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${operatorTab === 'rating' ? 'bg-white text-blue-600 shadow-sm border border-gray-100' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <Trophy className="w-4 h-4" /> Reyting
                </button>
                <button 
                  onClick={() => setOperatorTab('monitoring')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${operatorTab === 'monitoring' ? 'bg-white text-blue-600 shadow-sm border border-gray-100' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <Activity className="w-4 h-4" /> Monitoring
                </button>
                <button 
                  onClick={() => setOperatorTab('simcards')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${operatorTab === 'simcards' ? 'bg-white text-blue-600 shadow-sm border border-gray-100' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <Smartphone className="w-4 h-4" /> Simkartalar
                </button>
              </nav>
            )}

            <div className="flex items-center space-x-4">
              {state.currentUser && state.currentUser.role !== Role.MANAGER && state.currentUser.isApproved && (
                <button className="relative p-2 text-gray-400 hover:text-blue-600 transition group">
                  <Bell className="w-6 h-6" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white group-hover:scale-125 transition-transform"></span>
                </button>
              )}
              <div className="flex flex-col items-end">
                <span className="text-sm font-semibold text-gray-800">{state.currentUser.firstName} {state.currentUser.lastName}</span>
                <span className="text-xs text-gray-500 capitalize">{state.currentUser.role.replace('_', ' ')}</span>
              </div>
              <div className="h-10 w-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600"><UserCircle className="w-6 h-6" /></div>
              <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-red-500 transition" title="Chiqish"><LogOut className="w-6 h-6" /></button>
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {isManager ? (
          <ManagerPanel state={state} approveUser={approveUser} updateUser={updateUser} />
        ) : (
          state.users.find(u => u.id === state.currentUser?.id) ? (
            <OperatorPanel 
              user={state.users.find(u => u.id === state.currentUser?.id)!} 
              state={state} 
              addCheckIn={addCheckIn} 
              updateCheckIn={updateCheckIn}
              addSale={addSale} 
              removeSale={removeSale} 
              addReport={addReport} 
              activeTab={operatorTab}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-20">
              <p className="text-gray-500">Foydalanuvchi ma'lumotlari topilmadi. Iltimos, qaytadan kiring.</p>
              <button onClick={handleLogout} className="mt-4 text-blue-600 font-bold">Chiqish</button>
            </div>
          )
        )}
      </main>
      <footer className="bg-white border-t py-6 text-center text-sm text-gray-500">&copy; {new Date().getFullYear()} Sam Brend Nomer Management Platform.</footer>
    </div>
  );
};

export default App;
