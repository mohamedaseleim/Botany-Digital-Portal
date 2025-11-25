import React, { useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Outgoing } from './pages/Outgoing';
import { Incoming } from './pages/Incoming';
import { Council } from './pages/Council';
import { Committees } from './pages/Committees';
import { Search } from './pages/Search';
import { User, UserRole } from './types';
import { Lock, Sprout } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);

  // Simple Mock Login Screen
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4" dir="rtl">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-green-100">
          <div className="flex flex-col items-center mb-8">
            <div className="bg-green-100 p-4 rounded-full mb-4">
              <Sprout className="w-12 h-12 text-green-700" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 text-center">أرشيف قسم النبات الزراعي</h1>
            <p className="text-gray-500 mt-2 text-center">جامعة الأزهر - فرع أسيوط</p>
          </div>
          
          <div className="space-y-3">
            <p className="text-sm text-gray-600 text-center mb-4">اختر الصلاحية للدخول (نسخة تجريبية):</p>
            <button 
              onClick={() => setUser({ id: '1', name: 'أ.د/ رئيس القسم', role: UserRole.ADMIN })}
              className="w-full bg-green-700 hover:bg-green-800 text-white p-3 rounded-lg flex items-center justify-center gap-2 transition-transform active:scale-95"
            >
              <Lock className="w-4 h-4" />
              دخول كـ مدير النظام (Admin)
            </button>
            <button 
              onClick={() => setUser({ id: '2', name: 'سكرتارية القسم', role: UserRole.DATA_ENTRY })}
              className="w-full bg-white border-2 border-green-600 text-green-700 hover:bg-green-50 p-3 rounded-lg font-semibold transition-transform active:scale-95"
            >
              دخول كـ مدخل بيانات
            </button>
          </div>
          
          <div className="mt-8 text-center text-xs text-gray-400">
            Digital Botany Archive v1.0
          </div>
        </div>
      </div>
    );
  }

  return (
    <HashRouter>
      <Layout user={user} onLogout={() => setUser(null)}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/outgoing" element={<Outgoing user={user} />} />
          <Route path="/incoming" element={<Incoming user={user} />} />
          <Route path="/councils" element={<Council user={user} />} />
          <Route path="/committees" element={<Committees user={user} />} />
          <Route path="/search" element={<Search user={user} />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
};

export default App;