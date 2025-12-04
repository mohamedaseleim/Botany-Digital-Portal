import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Outgoing } from './pages/Outgoing';
import { Incoming } from './pages/Incoming';
import { Council } from './pages/Council';
import { Committees } from './pages/Committees';
import { Search } from './pages/Search';
import { StaffPortal } from './pages/StaffPortal';
import { StudentPortal } from './pages/StudentPortal';
import { AlumniPortal } from './pages/AlumniPortal';
import { UserManagement } from './pages/UserManagement';
import { PostgraduateManager } from './pages/PostgraduateManager';
import { Inventory } from './pages/Inventory';
import { Labs } from './pages/Labs'; 
import { Greenhouse } from './pages/Greenhouse';
import { Events } from './pages/Events';
import { ActivityLogs } from './pages/ActivityLogs';
import { DepartmentFormation } from './pages/DepartmentFormation';
import { AnnualReportPage } from './pages/AnnualReport';
import { ResearchPlanPage } from './pages/ResearchPlan'; // تم إضافة الاستيراد هنا
import { User, UserRole } from './types';
import { loginUser, seedInitialData } from './services/dbService';
import { Sprout, Users, Key, Loader2, ArrowLeft } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  
  // Login Form State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  const [error, setError] = useState('');

  // --- تشغيل زرع البيانات تلقائياً عند فتح التطبيق ---
  useEffect(() => {
    const initApp = async () => {
      try {
        await seedInitialData();
      } catch (error) {
        console.error("Failed to seed initial data:", error);
      }
    };
    initApp();
  }, []);
  // ------------------------------------------------

  const handleLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoggingIn(true);
      setError('');
      
      try {
          const loggedInUser = await loginUser(username, password);
          if (loggedInUser) {
              setUser(loggedInUser);
          } else {
              setError('اسم المستخدم أو كلمة المرور غير صحيحة');
          }
      } catch (err) {
          console.error(err);
          setError('حدث خطأ أثناء الاتصال بالنظام (تأكد من الإنترنت)');
      } finally {
          setLoggingIn(false);
      }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4" dir="rtl">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-4xl w-full border border-green-100 flex flex-col md:flex-row gap-8">
          
          <div className="md:w-1/2 flex flex-col items-center justify-center text-center border-b md:border-b-0 md:border-l border-gray-100 pb-6 md:pb-0 md:pl-6">
            <div className="bg-green-100 p-6 rounded-full mb-6 animate-pulse">
              <Sprout className="w-16 h-16 text-green-700" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">بوابة قسم النبات الزراعي</h1>
            <h2 className="text-xl text-green-700 font-medium mb-4">كلية الزراعة - جامعة الأزهر</h2>
            <p className="text-gray-500 leading-relaxed max-w-sm text-sm">
              المنصة الرقمية الموحدة لإدارة الأرشيف الإداري، شؤون الطلاب، الدراسات العليا، والتواصل مع الخريجين.
            </p>
          </div>
          
          <div className="md:w-1/2 flex flex-col justify-center">
            <h3 className="text-lg font-bold text-gray-700 mb-6 text-center border-b pb-2">تسجيل الدخول للبوابة</h3>
            
            <form onSubmit={handleLogin} className="space-y-4">
                <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1">اسم المستخدم</label>
                    <div className="relative">
                        <Users className="w-5 h-5 text-gray-400 absolute right-3 top-2.5" />
                        <input 
                            type="text" 
                            required
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg p-2.5 pr-10 focus:ring-2 focus:ring-green-500 outline-none transition-all"
                            placeholder="username"
                        />
                    </div>
                </div>
                
                <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1">كلمة المرور</label>
                    <div className="relative">
                        <Key className="w-5 h-5 text-gray-400 absolute right-3 top-2.5" />
                        <input 
                            type="password" 
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg p-2.5 pr-10 focus:ring-2 focus:ring-green-500 outline-none transition-all"
                            placeholder="••••••"
                        />
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center font-semibold animate-in fade-in">
                        {error}
                    </div>
                )}

                <button 
                    type="submit"
                    disabled={loggingIn}
                    className="w-full bg-green-700 hover:bg-green-800 text-white font-bold py-3 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                >
                    {loggingIn ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowLeft className="w-5 h-5" />}
                    <span>دخول</span>
                </button>
            </form>
            
            <div className="mt-8 text-center text-xs text-gray-400 border-t border-gray-100 pt-4">
              Botany Digital Portal v2.0
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <HashRouter>
      <Layout user={user} onLogout={() => { setUser(null); setUsername(''); setPassword(''); }}>
        <Routes>
          <Route path="/" element={
            user.role === UserRole.STUDENT_UG || user.role === UserRole.STUDENT_PG ? <StudentPortal user={user} /> : 
            user.role === UserRole.ALUMNI ? <AlumniPortal user={user} /> : 
            <Dashboard />
          } />
          <Route path="/outgoing" element={<Outgoing user={user} />} />
          <Route path="/incoming" element={<Incoming user={user} />} />
          <Route path="/councils" element={<Council user={user} />} />
          <Route path="/committees" element={<Committees user={user} />} />
          <Route path="/search" element={<Search user={user} />} />
          <Route path="/staff" element={<StaffPortal />} />
          <Route path="/students" element={<StudentPortal user={user} />} />
          <Route path="/alumni" element={<AlumniPortal user={user} />} />
          <Route path="/users" element={<UserManagement />} />
          <Route path="/pg-manager" element={<PostgraduateManager />} />
          <Route path="/inventory" element={<Inventory user={user} />} />
          <Route path="/labs" element={<Labs user={user} />} />
          <Route path="/greenhouse" element={<Greenhouse user={user} />} />
          <Route path="/events" element={<Events user={user} />} />
          <Route path="/formation" element={<DepartmentFormation user={user} />} />
          <Route path="/annual-report" element={<AnnualReportPage user={user} />} />
          <Route path="/research-plan" element={<ResearchPlanPage user={user} />} /> {/* المسار الجديد للخطة البحثية */}
          <Route path="/activity-log" element={<ActivityLogs />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
};

export default App;