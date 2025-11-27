import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileInput, 
  FileOutput, 
  Search, 
  Menu, 
  LogOut, 
  Leaf,
  Users, 
  ClipboardList, 
  GraduationCap, 
  BookOpen, 
  Briefcase, 
  UserCircle, 
  UserCog, 
  FileClock, 
  Microscope, 
  FlaskConical, 
  Sprout, 
  Megaphone, 
  Activity
} from 'lucide-react';
import { User, UserRole } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, user, onLogout }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  // قائمة الروابط الكاملة
  const allNavItems = [
    { 
      path: '/', 
      label: 'لوحة القيادة', 
      icon: LayoutDashboard, 
      roles: [UserRole.ADMIN, UserRole.STAFF, UserRole.DATA_ENTRY] 
    },
    // 🔥 نقلنا الرابط هنا في الأعلى للاختبار 🔥
    { 
      path: '/activity-log', 
      label: 'سجل النشاطات (تجربة)', 
      icon: Activity, 
      roles: [UserRole.ADMIN] 
    },
    // ------------------------------------
    { 
      path: '/outgoing', 
      label: 'الصادر', 
      icon: FileOutput, 
      roles: [UserRole.ADMIN, UserRole.STAFF, UserRole.DATA_ENTRY] 
    },
    { 
      path: '/incoming', 
      label: 'الوارد', 
      icon: FileInput, 
      roles: [UserRole.ADMIN, UserRole.STAFF, UserRole.DATA_ENTRY] 
    },
    { 
      path: '/councils', 
      label: 'مجالس القسم', 
      icon: Users, 
      roles: [UserRole.ADMIN, UserRole.STAFF] 
    },
    { 
      path: '/committees', 
      label: 'لجان القسم', 
      icon: ClipboardList, 
      roles: [UserRole.ADMIN, UserRole.STAFF] 
    },
    { 
      path: '/events', 
      label: 'أنشطة وفعاليات القسم', 
      icon: Megaphone, 
      roles: [UserRole.ADMIN, UserRole.STAFF, UserRole.STUDENT_PG, UserRole.STUDENT_UG, UserRole.ALUMNI] 
    },
    { 
        path: '/pg-manager', 
        label: 'مدير الدراسات العليا', 
        icon: FileClock, 
        roles: [UserRole.ADMIN, UserRole.STAFF] 
    },
    { 
      path: '/inventory', 
      label: 'سجل العهدة', 
      icon: Microscope, 
      roles: [UserRole.ADMIN, UserRole.STAFF] 
    },
    { 
      path: '/labs', 
      label: 'إدارة المعامل', 
      icon: FlaskConical, 
      roles: [UserRole.ADMIN, UserRole.STAFF, UserRole.STUDENT_PG] 
    },
    { 
      path: '/greenhouse', 
      label: 'إدارة صوبة القسم', 
      icon: Sprout, 
      roles: [UserRole.ADMIN, UserRole.STAFF, UserRole.STUDENT_PG] 
    },
    { 
      path: '/staff', 
      label: 'هيئة التدريس', 
      icon: UserCircle, 
      roles: [UserRole.ADMIN, UserRole.STAFF, UserRole.STUDENT_PG, UserRole.STUDENT_UG] 
    },
    { 
      path: '/students', 
      label: 'بوابة الطلاب', 
      icon: BookOpen, 
      roles: [UserRole.ADMIN, UserRole.STAFF, UserRole.STUDENT_PG, UserRole.STUDENT_UG] 
    },
    { 
      path: '/alumni', 
      label: 'رابطة الخريجين', 
      icon: Briefcase, 
      roles: [UserRole.ADMIN, UserRole.STAFF, UserRole.ALUMNI] 
    },
    { 
      path: '/users', 
      label: 'إدارة المستخدمين', 
      icon: UserCog, 
      roles: [UserRole.ADMIN] 
    },
    { 
      path: '/search', 
      label: 'البحث والاستعلام', 
      icon: Search, 
      roles: [UserRole.ADMIN, UserRole.STAFF, UserRole.DATA_ENTRY] 
    },
  ];

  // تصفية العناصر بناءً على صلاحية المستخدم
  const navItems = allNavItems.filter(item => item.roles.includes(user.role));

  return (
    <div className="min-h-screen flex bg-gray-50">
      {sidebarOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />}
      
      <aside className={`fixed top-0 right-0 h-full w-64 bg-green-900 text-white z-30 transform transition-transform duration-300 ease-in-out shadow-xl ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'} lg:relative lg:translate-x-0`}>
        <div className="p-6 border-b border-green-800 flex items-center gap-3">
          <div className="bg-white p-2 rounded-full"><Leaf className="w-6 h-6 text-green-700" /></div>
          <div><h1 className="font-bold text-sm">بوابة قسم النبات</h1><p className="text-xs text-green-300">جامعة الأزهر - أسيوط</p></div>
        </div>

        {/* تعديل ارتفاع القائمة لضمان ظهور التمرير بشكل أفضل */}
        <nav className="mt-6 px-4 space-y-2 overflow-y-auto h-[calc(100vh-200px)] custom-scrollbar pb-20">
          {navItems.map((item) => (
            <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)} className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive(item.path) ? 'bg-green-700 text-white font-semibold shadow-md' : 'text-green-100 hover:bg-green-800 hover:text-white'}`}>
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-green-800 bg-green-900 z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-green-700 flex items-center justify-center font-bold text-lg border-2 border-green-600">{user.name.charAt(0)}</div>
            <div className="overflow-hidden"><p className="font-medium text-sm truncate">{user.name}</p><p className="text-xs text-green-300 truncate">مدير النظام</p></div>
          </div>
          <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg text-sm transition-colors"><LogOut className="w-4 h-4" /><span>خروج</span></button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white shadow-sm lg:hidden flex items-center justify-between p-4 z-10">
          <h2 className="font-bold text-gray-800 text-sm">بوابة قسم النبات</h2>
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-md hover:bg-gray-100 text-gray-600"><Menu className="w-6 h-6" /></button>
        </header>
        <div className="flex-1 overflow-auto p-4 md:p-8">{children}</div>
      </main>
    </div>
  );
};