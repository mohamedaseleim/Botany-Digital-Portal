import React, { useState, useEffect } from 'react';
import { Users, GraduationCap, UserPlus, Edit, Trash2, Key, Save, X, BookOpen, Briefcase, BadgeCheck, Phone, Mail, MapPin, MessageCircle, ShieldAlert } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { StaffMember, PostgraduateStudent, UndergraduateStudent, AlumniMember, Employee, StaffSubRole, User, UserRole } from '../types';
import { 
  getStaff, getPGStudents, getUGStudents, getAlumni, getEmployees,
  addStaff, updateStaff, deleteStaff,
  addPGStudent, updatePGStudent, deletePGStudent,
  addUGStudent, updateUGStudent, deleteUGStudent,
  addAlumni, updateAlumni, deleteAlumni,
  addEmployee, updateEmployee, deleteEmployee,
  logActivity
} from '../services/dbService';

// تعريف الخصائص لاستقبال المستخدم الحالي
interface UserManagementProps {
    user: User;
}

export const UserManagement: React.FC<UserManagementProps> = ({ user }) => {
  // --- (تعديل) حماية الصفحة: التحقق من أن المستخدم هو ADMIN ---
  if (user.role !== UserRole.ADMIN) {
      return (
          <div className="flex flex-col items-center justify-center h-[60vh] animate-in fade-in">
              <div className="bg-red-50 p-6 rounded-full mb-4">
                  <ShieldAlert className="w-12 h-12 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">وصول غير مصرح به</h2>
              <p className="text-gray-500 text-center max-w-md">
                  عذراً، هذه الصفحة مخصصة لمدير النظام فقط. لا تملك الصلاحيات الكافية لعرض أو تعديل بيانات المستخدمين.
              </p>
          </div>
      );
  }
  // ------------------------------------------------------------

  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'STAFF' | 'PG' | 'UG' | 'ALUMNI' | 'EMPLOYEE'>('STAFF');
  const [loading, setLoading] = useState(false);
  
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [pgList, setPgList] = useState<PostgraduateStudent[]>([]);
  const [ugList, setUgList] = useState<UndergraduateStudent[]>([]);
  const [alumniList, setAlumniList] = useState<AlumniMember[]>([]);
  const [employeeList, setEmployeeList] = useState<Employee[]>([]);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Unified Form State
  const [formData, setFormData] = useState({
    name: '',
    // Contact Info
    email: '',
    phone: '',
    whatsapp: '',
    address: '',
    // Staff
    subRole: 'FACULTY' as StaffSubRole,
    rank: '', 
    specialization: '', 
    // PG
    degree: 'MSc', 
    researchTopic: '', 
    supervisor: '', 
    status: 'Researching',
    // UG
    year: 'Third',
    section: '',
    // Alumni
    graduationYear: '',
    currentJob: '',
    // Employee
    jobTitle: '',
    department: '',
    // Credentials
    username: '',
    password: ''
  });

  useEffect(() => {
    if (location.state && (location.state as any).initialTab) {
        setActiveTab((location.state as any).initialTab);
    }
  }, [location.state]);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    if (activeTab === 'STAFF') setStaffList(await getStaff());
    else if (activeTab === 'PG') setPgList(await getPGStudents());
    else if (activeTab === 'UG') setUgList(await getUGStudents());
    else if (activeTab === 'ALUMNI') setAlumniList(await getAlumni());
    else if (activeTab === 'EMPLOYEE') setEmployeeList(await getEmployees());
    setLoading(false);
  };

  const handleOpenModal = (item?: any) => {
    if (item) {
      setEditingId(item.id);
      setFormData({
        name: item.name || '',
        email: item.email || '',
        phone: item.phone || '',
        whatsapp: item.whatsapp || '',
        address: item.address || '',
        subRole: item.subRole || 'FACULTY',
        rank: item.rank || '',
        specialization: item.specialization || '',
        degree: item.degree || 'MSc',
        researchTopic: item.researchTopic || '',
        supervisor: item.supervisor || '',
        status: item.status || 'Researching',
        year: item.year || 'Third',
        section: item.section || '',
        graduationYear: item.graduationYear || '',
        currentJob: item.currentJob || '',
        jobTitle: item.jobTitle || '',
        department: item.department || '',
        username: item.username || '',
        password: item.password || ''
      });
    } else {
      setEditingId(null);
      const randomUser = 'user' + Math.floor(Math.random() * 1000);
      setFormData({
        name: '', email: '', phone: '', whatsapp: '', address: '',
        subRole: 'FACULTY', rank: '', specialization: '', 
        degree: 'MSc', researchTopic: '', supervisor: '', status: 'Researching',
        year: 'Third', section: '', graduationYear: '', currentJob: '',
        jobTitle: '', department: '',
        username: randomUser, password: '123'
      });
    }
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المستخدم؟')) return;
    
    try {
      if (activeTab === 'STAFF') await deleteStaff(id);
      else if (activeTab === 'PG') await deletePGStudent(id);
      else if (activeTab === 'UG') await deleteUGStudent(id);
      else if (activeTab === 'ALUMNI') await deleteAlumni(id);
      else if (activeTab === 'EMPLOYEE') await deleteEmployee(id);
      
      await logActivity('حذف مستخدم', 'Admin', `تم حذف المستخدم: ${name} من فئة ${activeTab}`);
      fetchData();
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("حدث خطأ أثناء الحذف");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const contactData = {
        email: formData.email,
        phone: formData.phone,
        whatsapp: formData.whatsapp,
        address: formData.address
    };

    try {
      if (activeTab === 'STAFF') {
        const data = {
          name: formData.name, ...contactData,
          subRole: formData.subRole,
          rank: formData.rank, specialization: formData.specialization,
          username: formData.username, password: formData.password
        };
        if (editingId) await updateStaff(editingId, data); else await addStaff(data as any);

      } else if (activeTab === 'PG') {
        if (editingId) {
            const data = {
              name: formData.name, ...contactData,
              degree: formData.degree, researchTopic: formData.researchTopic, 
              supervisor: formData.supervisor, status: formData.status,
              username: formData.username, password: formData.password
            };
            await updatePGStudent(editingId, data as any);
        } else {
            const data = {
              name: formData.name, ...contactData,
              degree: formData.degree, researchTopic: formData.researchTopic, 
              supervisor: formData.supervisor, status: formData.status,
              username: formData.username, password: formData.password,
              dates: { enrollment: new Date().toISOString().split('T')[0] },
              documents: { publishedPapers: [], otherDocuments: [] },
              alerts: { reportOverdue: false, extensionNeeded: false }
            };
            await addPGStudent(data as any);
        }

      } else if (activeTab === 'UG') {
        const data = {
          name: formData.name, ...contactData,
          year: formData.year, section: formData.section,
          username: formData.username, password: formData.password
        };
        if (editingId) await updateUGStudent(editingId, data as any); else await addUGStudent(data as any);

      } else if (activeTab === 'ALUMNI') {
        const data = {
          name: formData.name, ...contactData,
          graduationYear: formData.graduationYear, currentJob: formData.currentJob,
          username: formData.username, password: formData.password
        };
        if (editingId) await updateAlumni(editingId, data); else await addAlumni(data as any);

      } else if (activeTab === 'EMPLOYEE') {
        const data = {
          name: formData.name, ...contactData,
          jobTitle: formData.jobTitle, department: formData.department,
          username: formData.username, password: formData.password
        };
        if (editingId) await updateEmployee(editingId, data); else await addEmployee(data as any);
      }
      
      await logActivity(editingId ? 'تعديل بيانات مستخدم' : 'إضافة مستخدم جديد', 'Admin', `تم ${editingId ? 'تعديل' : 'إضافة'} المستخدم: ${formData.name} في فئة ${activeTab}`);

      setIsModalOpen(false);
      fetchData();
      alert("تم الحفظ بنجاح ✅");
    } catch (error) {
      console.error("Error saving user:", error);
      alert("حدث خطأ أثناء الحفظ");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Key className="w-6 h-6 text-green-600" />
            إدارة المستخدمين والصلاحيات
          </h1>
          <p className="text-gray-500 text-sm">إدارة كافة منتسبي القسم (أساتذة، موظفين، طلاب، خريجين)</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-colors"
        >
          <UserPlus className="w-5 h-5" />
          <span>إضافة مستخدم جديد</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Tabs */}
        <div className="flex flex-wrap border-b border-gray-200">
          {[
            { id: 'STAFF', icon: Users, label: 'هيئة التدريس' },
            { id: 'EMPLOYEE', icon: BadgeCheck, label: 'الموظفين والإداريين' },
            { id: 'PG', icon: GraduationCap, label: 'الدراسات العليا' },
            { id: 'UG', icon: BookOpen, label: 'الطلاب (3 و 4)' },
            { id: 'ALUMNI', icon: Briefcase, label: 'الخريجين' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 min-w-[120px] py-4 text-center font-semibold text-sm transition-colors ${
                activeTab === tab.id ? 'text-green-700 border-b-2 border-green-700 bg-green-50' : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <tab.icon className="w-4 h-4" /> {tab.label}
              </div>
            </button>
          ))}
        </div>

        {/* Content Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead className="bg-gray-50 text-gray-600 font-medium">
              <tr>
                <th className="p-4">الاسم</th>
                <th className="p-4">
                  {activeTab === 'STAFF' ? 'الدرجة العلمية' : 
                   activeTab === 'EMPLOYEE' ? 'المسمى الوظيفي' :
                   activeTab === 'PG' ? 'القيد' : 
                   activeTab === 'UG' ? 'الفرقة' : 'سنة التخرج'}
                </th>
                <th className="p-4">
                   {activeTab === 'STAFF' ? 'التخصص' : 
                    activeTab === 'EMPLOYEE' ? 'الإدارة / القسم' :
                    activeTab === 'PG' ? 'المشرف' :
                    activeTab === 'UG' ? 'الشعبة' : 'الوظيفة الحالية'}
                </th>
                <th className="p-4">التواصل</th>
                <th className="p-4">اسم المستخدم</th>
                <th className="p-4">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr><td colSpan={6} className="p-8 text-center text-gray-500">جاري التحميل...</td></tr>
              ) : (
                (() => {
                  let list = [];
                  if (activeTab === 'STAFF') list = staffList;
                  else if (activeTab === 'EMPLOYEE') list = employeeList;
                  else if (activeTab === 'PG') list = pgList;
                  else if (activeTab === 'UG') list = ugList;
                  else list = alumniList;

                  if (list.length === 0) return <tr><td colSpan={6} className="p-8 text-center text-gray-400">لا توجد بيانات</td></tr>
                  
                  return list.map((item: any) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="p-4 font-bold text-gray-800">{item.name}</td>
                      <td className="p-4">
                          <span className="bg-green-50 text-green-700 px-2 py-1 rounded text-xs">
                            {activeTab === 'STAFF' ? item.rank : 
                             activeTab === 'EMPLOYEE' ? item.jobTitle :
                             activeTab === 'PG' ? item.degree : 
                             activeTab === 'UG' ? (item.year === 'Third' ? 'الثالثة' : 'الرابعة') : item.graduationYear}
                          </span>
                      </td>
                      <td className="p-4">
                          {activeTab === 'STAFF' ? item.specialization : 
                           activeTab === 'EMPLOYEE' ? item.department :
                           activeTab === 'PG' ? item.supervisor :
                           activeTab === 'UG' ? (item.section || '-') : (item.currentJob || '-')}
                      </td>
                      <td className="p-4 text-xs text-gray-500">
                          {item.phone && <div className="flex items-center gap-1 mb-1"><Phone className="w-3 h-3 text-gray-400"/> {item.phone}</div>}
                          {item.whatsapp && <div className="flex items-center gap-1 mb-1 text-green-600 font-semibold"><MessageCircle className="w-3 h-3"/> {item.whatsapp}</div>}
                          {item.email && <div className="flex items-center gap-1 text-blue-600"><Mail className="w-3 h-3"/> {item.email}</div>}
                      </td>
                      <td className="p-4 font-mono text-gray-600">{item.username || '-'}</td>
                      <td className="p-4 flex gap-2">
                        <button onClick={() => handleOpenModal(item)} className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg" title="تعديل">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(item.id, item.name)} className="text-red-600 hover:bg-red-50 p-2 rounded-lg" title="حذف">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ));
                })()
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in-95">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800">
                {editingId ? 'تعديل بيانات' : 'إضافة مستخدم جديد'}
                <span className="text-sm font-normal text-gray-500 mr-2">
                  ({activeTab === 'STAFF' ? 'هيئة التدريس' : 
                    activeTab === 'EMPLOYEE' ? 'موظف/إداري' :
                    activeTab === 'PG' ? 'دراسات عليا' : 
                    activeTab === 'UG' ? 'طالب جامعي' : 'خريج'})
                </span>
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Common Fields */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الاسم رباعي</label>
                <input 
                  type="text" required 
                  value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                />
              </div>

              {/* بيانات الاتصال (لكل المستخدمين) */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                      <Phone className="w-4 h-4" /> بيانات الاتصال (اختياري)
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                      <div>
                          <label className="block text-xs font-semibold text-gray-500 mb-1">رقم الهاتف</label>
                          <div className="relative">
                              <Phone className="w-3 h-3 absolute right-3 top-3 text-gray-400" />
                              <input type="tel" placeholder="01xxxxxxxxx"
                                  value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                  className="w-full border p-2 pr-8 rounded bg-white text-sm" />
                          </div>
                      </div>
                      <div>
                          <label className="block text-xs font-semibold text-gray-500 mb-1">رقم الواتساب</label>
                          <div className="relative">
                              <MessageCircle className="w-3 h-3 absolute right-3 top-3 text-green-500" />
                              <input type="tel" placeholder="01xxxxxxxxx"
                                  value={formData.whatsapp} onChange={(e) => setFormData({...formData, whatsapp: e.target.value})}
                                  className="w-full border p-2 pr-8 rounded bg-white text-sm" />
                          </div>
                      </div>
                      <div>
                          <label className="block text-xs font-semibold text-gray-500 mb-1">البريد الإلكتروني</label>
                          <div className="relative">
                              <Mail className="w-3 h-3 absolute right-3 top-3 text-gray-400" />
                              <input type="email" placeholder="example@azhar.edu.eg"
                                  value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})}
                                  className="w-full border p-2 pr-8 rounded bg-white text-sm" />
                          </div>
                      </div>
                      <div>
                          <label className="block text-xs font-semibold text-gray-500 mb-1">العنوان</label>
                          <div className="relative">
                              <MapPin className="w-3 h-3 absolute right-3 top-3 text-gray-400" />
                              <input type="text" placeholder="المحافظة - المركز"
                                  value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})}
                                  className="w-full border p-2 pr-8 rounded bg-white text-sm" />
                          </div>
                      </div>
                  </div>
              </div>

              {/* Employee Specific */}
              {activeTab === 'EMPLOYEE' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">المسمى الوظيفي</label>
                    <input type="text" placeholder="مثال: أخصائي شئون طلاب" required
                      value={formData.jobTitle} onChange={(e) => setFormData({...formData, jobTitle: e.target.value})}
                      className="w-full border p-2 rounded-lg outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">القسم / الإدارة</label>
                    <input type="text" placeholder="مثال: رعاية الشباب" required
                      value={formData.department} onChange={(e) => setFormData({...formData, department: e.target.value})}
                      className="w-full border p-2 rounded-lg outline-none" />
                  </div>
                </div>
              )}

              {/* Staff Specific */}
              {activeTab === 'STAFF' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">الفئة الوظيفية</label>
                    <select 
                        value={formData.subRole} 
                        onChange={(e) => setFormData({...formData, subRole: e.target.value as any})}
                        className="w-full border p-2 rounded-lg outline-none bg-white font-bold text-green-700"
                    >
                        <option value="FACULTY">عضو هيئة تدريس (أستاذ - أستاذ مساعد - مدرس)</option>
                        <option value="ASSISTANT">هيئة معاونة (مدرس مساعد - معيد)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">الدرجة العلمية</label>
                    <input type="text" placeholder="مثال: أستاذ مساعد" required 
                      value={formData.rank} onChange={(e) => setFormData({...formData, rank: e.target.value})}
                      className="w-full border p-2 rounded-lg outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">التخصص الدقيق</label>
                    <input type="text" placeholder="مثال: أمراض فيروسية" required
                      value={formData.specialization} onChange={(e) => setFormData({...formData, specialization: e.target.value})}
                      className="w-full border p-2 rounded-lg outline-none" />
                  </div>
                </div>
              )}

              {/* PG Student Specific */}
              {activeTab === 'PG' && (
                <div className="grid grid-cols-2 gap-4">
                   <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">الدرجة</label>
                    <select value={formData.degree} onChange={(e) => setFormData({...formData, degree: e.target.value})}
                      className="w-full border p-2 rounded-lg outline-none bg-white">
                        <option value="MSc">ماجستير</option>
                        <option value="PhD">دكتوراة</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">حالة القيد</label>
                    <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}
                      className="w-full border p-2 rounded-lg outline-none bg-white">
                        <option value="Researching">مرحلة البحث</option>
                        <option value="Writing">مرحلة الكتابة</option>
                        <option value="Defense">المناقشة</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">عنوان الرسالة</label>
                    <input type="text" required
                      value={formData.researchTopic} onChange={(e) => setFormData({...formData, researchTopic: e.target.value})}
                      className="w-full border p-2 rounded-lg outline-none" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">المشرف الرئيسي</label>
                    <input type="text" required placeholder="أ.د/ ..."
                      value={formData.supervisor} onChange={(e) => setFormData({...formData, supervisor: e.target.value})}
                      className="w-full border p-2 rounded-lg outline-none" />
                  </div>
                </div>
              )}

              {/* UG Student Specific */}
              {activeTab === 'UG' && (
                <div className="grid grid-cols-2 gap-4">
                   <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">الفرقة الدراسية</label>
                    <select value={formData.year} onChange={(e) => setFormData({...formData, year: e.target.value})}
                      className="w-full border p-2 rounded-lg outline-none bg-white">
                        <option value="Third">الفرقة الثالثة</option>
                        <option value="Fourth">الفرقة الرابعة</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">الشعبة</label>
                    <input type="text" placeholder="مثال: أمراض نبات"
                      value={formData.section} onChange={(e) => setFormData({...formData, section: e.target.value})}
                      className="w-full border p-2 rounded-lg outline-none" />
                  </div>
                </div>
              )}

              {/* Alumni Specific */}
              {activeTab === 'ALUMNI' && (
                <div className="grid grid-cols-2 gap-4">
                   <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">سنة التخرج</label>
                    <input type="number" placeholder="2023" required
                      value={formData.graduationYear} onChange={(e) => setFormData({...formData, graduationYear: e.target.value})}
                      className="w-full border p-2 rounded-lg outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">الوظيفة الحالية</label>
                    <input type="text" placeholder="اختياري"
                      value={formData.currentJob} onChange={(e) => setFormData({...formData, currentJob: e.target.value})}
                      className="w-full border p-2 rounded-lg outline-none" />
                  </div>
                </div>
              )}

              {/* Login Credentials Section */}
              <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 mt-4">
                <h4 className="text-sm font-bold text-amber-800 mb-3 flex items-center gap-2">
                  <Key className="w-4 h-4" /> بيانات الدخول للبوابة
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">اسم المستخدم</label>
                    <input type="text" required
                      value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})}
                      className="w-full border border-gray-300 p-2 rounded bg-white text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">كلمة المرور</label>
                    <input type="text" required
                      value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})}
                      className="w-full border border-gray-300 p-2 rounded bg-white text-sm" />
                  </div>
                </div>
                <p className="text-xs text-amber-700 mt-2">
                  * قم بتسليم هذه البيانات للمستخدم ليتمكن من الدخول إلى حسابه.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t mt-4">
                 <button type="button" onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">إلغاء</button>
                 <button type="submit"
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2">
                   <Save className="w-4 h-4" /> حفظ البيانات
                 </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};