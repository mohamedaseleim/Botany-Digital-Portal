
import React, { useState, useEffect } from 'react';
import { BookOpen, GraduationCap, Download, FileText, Search, PlusCircle, Trash2, X, Save, Loader2, UploadCloud, AlertTriangle, Calendar, ClipboardList } from 'lucide-react';
import { User, UserRole, PostgraduateStudent, CourseMaterial, Announcement, ScheduleItem, ScheduleType } from '../types';
import { getPGStudents, getMaterials, addMaterial, deleteMaterial, getAnnouncements, addAnnouncement, deleteAnnouncement, getSchedules, addSchedule, deleteSchedule, logActivity } from '../services/dbService';

interface StudentPortalProps {
  user: User;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({ user }) => {
  // Tab States
  const [activeTab, setActiveTab] = useState<'PG' | 'UG'>(
    user.role === UserRole.STUDENT_PG ? 'PG' : 'UG'
  );
  
  // Content Type Tab (Materials vs Schedules)
  const [contentType, setContentType] = useState<'MATERIALS' | 'SCHEDULES'>('MATERIALS');

  // Data States
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  
  const [displayedMaterials, setDisplayedMaterials] = useState<CourseMaterial[]>([]);
  const [displayedSchedules, setDisplayedSchedules] = useState<ScheduleItem[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // --- Modals State ---
  
  // 1. Materials Add
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newMaterial, setNewMaterial] = useState({
      title: '',
      year: (activeTab === 'UG' ? 'Third' : 'Pre-Master') as 'Third' | 'Fourth' | 'Pre-Master' | 'Pre-PhD',
      fileUrl: '',
      description: ''
  });

  // 2. Materials Delete
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [materialToDelete, setMaterialToDelete] = useState<string | null>(null);

  // 3. Announcements Add/Delete
  const [isAnnounceModalOpen, setIsAnnounceModalOpen] = useState(false);
  const [isAnnounceDeleteModalOpen, setIsAnnounceDeleteModalOpen] = useState(false);
  const [announceToDelete, setAnnounceToDelete] = useState<string | null>(null);
  const [newAnnounce, setNewAnnounce] = useState({ content: '', isImportant: false });

  // 4. Schedules Add
  const [isAddScheduleModalOpen, setIsAddScheduleModalOpen] = useState(false);
  const [newSchedule, setNewSchedule] = useState({
      title: '',
      type: 'LECTURE' as ScheduleType,
      year: (activeTab === 'UG' ? 'Third' : 'Pre-Master') as 'Third' | 'Fourth' | 'Pre-Master' | 'Pre-PhD',
      fileUrl: '',
  });

  // 5. Schedules Delete
  const [isDeleteScheduleModalOpen, setIsDeleteScheduleModalOpen] = useState(false);
  const [scheduleToDelete, setScheduleToDelete] = useState<string | null>(null);


  // Check permissions
  const canManage = user.role === UserRole.ADMIN || user.role === UserRole.STAFF;

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
      // Filter materials and schedules based on active Tab
      const targetYears = activeTab === 'UG' ? ['Third', 'Fourth'] : ['Pre-Master', 'Pre-PhD'];
      
      setDisplayedMaterials(materials.filter(m => targetYears.includes(m.year)));
      setDisplayedSchedules(schedules.filter(s => targetYears.includes(s.year)));

      // Set default year for forms
      const defaultYear = activeTab === 'UG' ? 'Third' : 'Pre-Master';
      setNewMaterial(prev => ({...prev, year: defaultYear as any}));
      setNewSchedule(prev => ({...prev, year: defaultYear as any}));

  }, [activeTab, materials, schedules]);

  const loadData = async () => {
    setLoading(true);
    const [matData, annData, schData] = await Promise.all([
        getMaterials(), 
        getAnnouncements(),
        getSchedules()
    ]);
    setMaterials(matData);
    setAnnouncements(annData);
    setSchedules(schData);
    setLoading(false);
  };

  // --- Handlers ---

  const handleAddMaterial = async (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitting(true);
      try {
          await addMaterial({
              title: newMaterial.title,
              year: newMaterial.year,
              fileUrl: newMaterial.fileUrl || '#',
              description: newMaterial.description,
              uploadedBy: user.name,
              date: new Date().toISOString().split('T')[0]
          });
          logActivity('إضافة مادة علمية', user.name, `العنوان: ${newMaterial.title} - المرحلة: ${newMaterial.year}`);
          await loadData();
          setIsAddModalOpen(false);
          setNewMaterial({ title: '', year: activeTab === 'UG' ? 'Third' : 'Pre-Master', fileUrl: '', description: '' });
      } catch (error) {
          console.error(error);
          alert('حدث خطأ أثناء الإضافة');
      } finally {
          setSubmitting(false);
      }
  };

  const confirmDeleteMaterial = async () => {
      if (!materialToDelete) return;
      setSubmitting(true);
      try {
          const mat = materials.find(m => m.id === materialToDelete);
          await deleteMaterial(materialToDelete);
          logActivity('حذف مادة علمية', user.name, `تم حذف المادة: ${mat?.title}`);
          await loadData(); // Reload all to stay sync
          setIsDeleteModalOpen(false);
          setMaterialToDelete(null);
      } catch (error) {
          console.error(error);
          alert('فشل في الحذف');
      } finally {
          setSubmitting(false);
      }
  };

  const handleAddAnnouncement = async (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitting(true);
      try {
          await addAnnouncement({
              content: newAnnounce.content,
              isImportant: newAnnounce.isImportant,
              date: new Date().toISOString().split('T')[0]
          });
          logActivity('إضافة إعلان', user.name, newAnnounce.content.substring(0, 50) + '...');
          await loadData();
          setIsAnnounceModalOpen(false);
          setNewAnnounce({ content: '', isImportant: false });
      } catch (error) {
          console.error(error);
          alert('حدث خطأ أثناء إضافة الإعلان');
      } finally {
          setSubmitting(false);
      }
  };

  const confirmDeleteAnnouncement = async () => {
      if (!announceToDelete) return;
      setSubmitting(true);
      try {
          await deleteAnnouncement(announceToDelete);
          logActivity('حذف إعلان', user.name, 'تم حذف إعلان من اللوحة');
          await loadData();
          setIsAnnounceDeleteModalOpen(false);
          setAnnounceToDelete(null);
      } catch (error) {
          console.error(error);
          alert('فشل في حذف الإعلان');
      } finally {
          setSubmitting(false);
      }
  };

  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
        await addSchedule({
            title: newSchedule.title,
            type: newSchedule.type,
            year: newSchedule.year,
            fileUrl: newSchedule.fileUrl || '#',
            uploadedBy: user.name,
            date: new Date().toISOString().split('T')[0]
        });
        logActivity('إضافة جدول', user.name, `العنوان: ${newSchedule.title}`);
        await loadData();
        setIsAddScheduleModalOpen(false);
        setNewSchedule({ title: '', type: 'LECTURE', year: activeTab === 'UG' ? 'Third' : 'Pre-Master', fileUrl: '' });
    } catch (error) {
        console.error(error);
        alert('حدث خطأ أثناء إضافة الجدول');
    } finally {
        setSubmitting(false);
    }
  };

  const confirmDeleteSchedule = async () => {
    if (!scheduleToDelete) return;
    setSubmitting(true);
    try {
        const sch = schedules.find(s => s.id === scheduleToDelete);
        await deleteSchedule(scheduleToDelete);
        logActivity('حذف جدول', user.name, `تم حذف الجدول: ${sch?.title}`);
        await loadData();
        setIsDeleteScheduleModalOpen(false);
        setScheduleToDelete(null);
    } catch (error) {
        console.error(error);
        alert('فشل في حذف الجدول');
    } finally {
        setSubmitting(false);
    }
  };

  // Mock file upload simulation
  const handleSimulateUpload = (setter: any) => {
      const mockUrl = `https://picsum.photos/seed/${Math.random()}/800/600`;
      setter((prev: any) => ({ ...prev, fileUrl: mockUrl }));
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">بوابة الطلاب</h1>
        <p className="text-gray-500 text-sm">
            {activeTab === 'UG' ? 'المقررات والجداول لطلاب البكالوريوس' : 'المقررات والجداول لطلاب الدراسات العليا'}
        </p>
        
        {/* Main Tabs (UG vs PG) */}
        <div className="flex gap-4 mt-6 border-b border-gray-200">
          <button 
            onClick={() => setActiveTab('UG')}
            className={`pb-3 px-4 text-sm font-semibold transition-colors flex items-center gap-2 ${
              activeTab === 'UG' 
                ? 'border-b-2 border-green-600 text-green-700' 
                : 'text-gray-500 hover:text-green-600'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            طلاب القسم (الفرقة 3 و 4)
          </button>
          <button 
            onClick={() => setActiveTab('PG')}
            className={`pb-3 px-4 text-sm font-semibold transition-colors flex items-center gap-2 ${
              activeTab === 'PG' 
                ? 'border-b-2 border-green-600 text-green-700' 
                : 'text-gray-500 hover:text-green-600'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            الدراسات العليا (تمهيدي)
          </button>
        </div>

        {/* Sub Tabs (Materials vs Schedules) */}
        <div className="flex gap-2 mt-4">
            <button 
                onClick={() => setContentType('MATERIALS')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-2 ${
                    contentType === 'MATERIALS' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
            >
                <FileText className="w-4 h-4" /> المواد العلمية
            </button>
            <button 
                onClick={() => setContentType('SCHEDULES')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-2 ${
                    contentType === 'SCHEDULES' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
            >
                <Calendar className="w-4 h-4" /> الجداول والامتحانات
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in">
          
          {/* Main Content Area (Materials OR Schedules) */}
          <div className="md:col-span-2 space-y-4">
             
             {/* === VIEW: COURSE MATERIALS === */}
             {contentType === 'MATERIALS' && (
                <>
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-bold text-gray-700">
                            {activeTab === 'UG' ? 'المحاضرات والمواد العلمية' : 'مقررات الدراسات العليا'}
                        </h3>
                        {canManage && (
                            <button 
                                onClick={() => setIsAddModalOpen(true)}
                                className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 flex items-center gap-1 shadow-sm"
                            >
                                <PlusCircle className="w-3 h-3" /> إضافة مادة جديدة
                            </button>
                        )}
                    </div>

                    {displayedMaterials.length > 0 ? (
                        displayedMaterials.map(mat => (
                            <div key={mat.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex items-start justify-between group">
                                <div className="flex items-start gap-3">
                                    <div className="bg-green-50 p-3 rounded-lg">
                                        <FileText className="w-6 h-6 text-green-600" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-800">{mat.title}</h4>
                                        <p className="text-sm text-gray-500 mt-1">
                                            {mat.year === 'Third' && 'الفرقة الثالثة'}
                                            {mat.year === 'Fourth' && 'الفرقة الرابعة'}
                                            {mat.year === 'Pre-Master' && 'تمهيدي ماجستير'}
                                            {mat.year === 'Pre-PhD' && 'تمهيدي دكتوراه'}
                                            {' | '} 
                                            بواسطة: {mat.uploadedBy}
                                        </p>
                                        {mat.description && <p className="text-xs text-gray-400 mt-1">{mat.description}</p>}
                                        <p className="text-xs text-gray-300 mt-1">{mat.date}</p>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <a href={mat.fileUrl} target="_blank" rel="noreferrer" className="text-green-600 hover:bg-green-50 p-2 rounded-lg flex items-center gap-1 text-sm font-medium border border-transparent hover:border-green-100">
                                        <Download className="w-4 h-4" /> تحميل
                                    </a>
                                    {canManage && (
                                        <button 
                                            onClick={() => { setMaterialToDelete(mat.id); setIsDeleteModalOpen(true); }}
                                            className="text-red-500 hover:bg-red-50 p-2 rounded-lg flex items-center justify-center text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                                            title="حذف"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center p-8 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                            <p className="text-gray-400">لا توجد مواد دراسية مرفوعة حالياً</p>
                        </div>
                    )}
                </>
             )}

             {/* === VIEW: SCHEDULES (Lectures & Exams) === */}
             {contentType === 'SCHEDULES' && (
                 <>
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-bold text-gray-700">جداول المحاضرات والامتحانات</h3>
                        {canManage && (
                            <button 
                                onClick={() => setIsAddScheduleModalOpen(true)}
                                className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 flex items-center gap-1 shadow-sm"
                            >
                                <PlusCircle className="w-3 h-3" /> إضافة جدول
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {displayedSchedules.length > 0 ? (
                            displayedSchedules.map(sch => (
                                <div key={sch.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow group relative">
                                    {/* Image Preview */}
                                    <div className="h-40 bg-gray-100 relative overflow-hidden">
                                        <img src={sch.fileUrl} alt={sch.title} className="w-full h-full object-cover" />
                                        <div className="absolute top-2 right-2">
                                            <span className={`px-2 py-1 rounded text-xs font-bold shadow-sm ${
                                                sch.type === 'EXAM' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                                            }`}>
                                                {sch.type === 'EXAM' ? 'جدول امتحانات' : 'جدول محاضرات'}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className="p-4">
                                        <h4 className="font-bold text-gray-800 text-sm mb-1">{sch.title}</h4>
                                        <p className="text-xs text-gray-500 mb-3">
                                            {sch.year === 'Third' && 'الفرقة الثالثة'}
                                            {sch.year === 'Fourth' && 'الفرقة الرابعة'}
                                            {sch.year === 'Pre-Master' && 'تمهيدي ماجستير'}
                                            {sch.year === 'Pre-PhD' && 'تمهيدي دكتوراه'}
                                            {' | '}{sch.date}
                                        </p>
                                        
                                        <a 
                                            href={sch.fileUrl} 
                                            target="_blank" 
                                            rel="noreferrer" 
                                            className="block text-center w-full bg-blue-50 text-blue-600 py-2 rounded-lg text-sm font-semibold hover:bg-blue-100 transition-colors"
                                        >
                                            <Download className="w-4 h-4 inline-block ml-1" /> تحميل / عرض
                                        </a>

                                        {canManage && (
                                            <button 
                                                onClick={() => { setScheduleToDelete(sch.id); setIsDeleteScheduleModalOpen(true); }}
                                                className="absolute top-2 left-2 bg-white text-red-500 p-1.5 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
                                                title="حذف الجدول"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="md:col-span-2 text-center p-8 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                                <p className="text-gray-400">لا توجد جداول مرفوعة حالياً</p>
                            </div>
                        )}
                    </div>
                 </>
             )}

          </div>

          {/* Announcements Sidebar */}
          <div className="bg-green-900 text-white p-6 rounded-xl h-fit">
            <div className="flex justify-between items-center mb-4 border-b border-green-700 pb-2">
                <h3 className="font-bold text-lg">لوحة الإعلانات</h3>
                {canManage && (
                    <button 
                        onClick={() => setIsAnnounceModalOpen(true)}
                        className="bg-green-800 hover:bg-green-700 p-1.5 rounded text-xs flex items-center gap-1"
                    >
                        <PlusCircle className="w-3 h-3" /> إضافة
                    </button>
                )}
            </div>
            
            {announcements.length > 0 ? (
                <ul className="space-y-4 text-sm">
                    {announcements.map(ann => (
                        <li key={ann.id} className="flex gap-2 relative group">
                            <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${ann.isImportant ? 'bg-red-400 animate-pulse' : 'bg-green-400'}`}></span>
                            <div className="flex-1">
                                <p>{ann.content}</p>
                                <p className="text-green-300 text-xs mt-1">{ann.date}</p>
                            </div>
                            {canManage && (
                                <button 
                                    onClick={() => { setAnnounceToDelete(ann.id); setIsAnnounceDeleteModalOpen(true); }}
                                    className="text-red-300 hover:text-red-100 opacity-0 group-hover:opacity-100 transition-opacity absolute left-0 top-0"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-green-300 text-sm italic">لا توجد إعلانات حالياً.</p>
            )}
          </div>
        </div>

      {/* --- MODALS --- */}

      {/* Add Material Modal */}
      {isAddModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95">
                  <div className="p-6 border-b flex justify-between items-center">
                      <h3 className="text-xl font-bold text-gray-800">إضافة مادة علمية</h3>
                      <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                          <X className="w-6 h-6" />
                      </button>
                  </div>
                  
                  <form onSubmit={handleAddMaterial} className="p-6 space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">عنوان المحاضرة/الملف</label>
                          <input 
                              type="text" required 
                              className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                              value={newMaterial.title}
                              onChange={(e) => setNewMaterial({...newMaterial, title: e.target.value})}
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">المرحلة الدراسية</label>
                          <select 
                              className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white"
                              value={newMaterial.year}
                              onChange={(e) => setNewMaterial({...newMaterial, year: e.target.value as any})}
                          >
                              {activeTab === 'UG' ? (
                                  <>
                                    <option value="Third">الفرقة الثالثة</option>
                                    <option value="Fourth">الفرقة الرابعة</option>
                                  </>
                              ) : (
                                  <>
                                    <option value="Pre-Master">تمهيدي ماجستير</option>
                                    <option value="Pre-PhD">تمهيدي دكتوراه</option>
                                  </>
                              )}
                          </select>
                      </div>
                      {activeTab === 'PG' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">وصف إضافي (اختياري)</label>
                            <input 
                                type="text"
                                placeholder="مثال: خاص بمقرر الإحصاء"
                                className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                value={newMaterial.description}
                                onChange={(e) => setNewMaterial({...newMaterial, description: e.target.value})}
                            />
                        </div>
                      )}
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">ملف المحاضرة (PDF)</label>
                          <div className="flex gap-2">
                              <input 
                                  type="text" readOnly 
                                  placeholder="رابط الملف..."
                                  className="w-full border p-2 rounded-lg bg-gray-50 text-xs"
                                  value={newMaterial.fileUrl}
                              />
                              <button 
                                  type="button"
                                  onClick={() => handleSimulateUpload(setNewMaterial)}
                                  className="px-3 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-100 flex items-center gap-1 text-xs whitespace-nowrap"
                              >
                                  <UploadCloud className="w-4 h-4" /> رفع
                              </button>
                          </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-4 border-t mt-4">
                          <button 
                              type="button" 
                              onClick={() => setIsAddModalOpen(false)}
                              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                          >
                              إلغاء
                          </button>
                          <button 
                              type="submit"
                              disabled={submitting}
                              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
                          >
                              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                              نشر
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {/* Add Schedule Modal */}
      {isAddScheduleModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95">
                  <div className="p-6 border-b flex justify-between items-center">
                      <h3 className="text-xl font-bold text-gray-800">إضافة جدول جديد</h3>
                      <button onClick={() => setIsAddScheduleModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                          <X className="w-6 h-6" />
                      </button>
                  </div>
                  
                  <form onSubmit={handleAddSchedule} className="p-6 space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">عنوان الجدول</label>
                          <input 
                              type="text" required 
                              placeholder="مثال: جدول الامتحانات النهائية - ترم أول"
                              className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                              value={newSchedule.title}
                              onChange={(e) => setNewSchedule({...newSchedule, title: e.target.value})}
                          />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">النوع</label>
                            <select 
                                className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white font-semibold"
                                value={newSchedule.type}
                                onChange={(e) => setNewSchedule({...newSchedule, type: e.target.value as any})}
                            >
                                <option value="LECTURE">جدول محاضرات</option>
                                <option value="EXAM">جدول امتحانات</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">المرحلة الدراسية</label>
                            <select 
                                className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                value={newSchedule.year}
                                onChange={(e) => setNewSchedule({...newSchedule, year: e.target.value as any})}
                            >
                                {activeTab === 'UG' ? (
                                    <>
                                        <option value="Third">الفرقة الثالثة</option>
                                        <option value="Fourth">الفرقة الرابعة</option>
                                    </>
                                ) : (
                                    <>
                                        <option value="Pre-Master">تمهيدي ماجستير</option>
                                        <option value="Pre-PhD">تمهيدي دكتوراه</option>
                                    </>
                                )}
                            </select>
                          </div>
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">صورة الجدول (Image/PDF)</label>
                          <div className="flex gap-2">
                              <input 
                                  type="text" readOnly 
                                  placeholder="رابط الملف..."
                                  className="w-full border p-2 rounded-lg bg-gray-50 text-xs"
                                  value={newSchedule.fileUrl}
                              />
                              <button 
                                  type="button"
                                  onClick={() => handleSimulateUpload(setNewSchedule)}
                                  className="px-3 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-100 flex items-center gap-1 text-xs whitespace-nowrap"
                              >
                                  <UploadCloud className="w-4 h-4" /> رفع
                              </button>
                          </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-4 border-t mt-4">
                          <button 
                              type="button" 
                              onClick={() => setIsAddScheduleModalOpen(false)}
                              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                          >
                              إلغاء
                          </button>
                          <button 
                              type="submit"
                              disabled={submitting}
                              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                          >
                              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                              نشر
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {/* Add Announcement Modal */}
      {isAnnounceModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl w-full max-w-sm shadow-2xl animate-in fade-in zoom-in-95">
                  <div className="p-6 border-b flex justify-between items-center">
                      <h3 className="text-lg font-bold text-gray-800">إضافة إعلان جديد</h3>
                      <button onClick={() => setIsAnnounceModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                          <X className="w-6 h-6" />
                      </button>
                  </div>
                  
                  <form onSubmit={handleAddAnnouncement} className="p-6 space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">نص الإعلان</label>
                          <textarea 
                              required rows={3}
                              className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                              value={newAnnounce.content}
                              onChange={(e) => setNewAnnounce({...newAnnounce, content: e.target.value})}
                          />
                      </div>
                      <div className="flex items-center gap-2">
                          <input 
                            type="checkbox" 
                            id="isImportant"
                            checked={newAnnounce.isImportant}
                            onChange={(e) => setNewAnnounce({...newAnnounce, isImportant: e.target.checked})}
                            className="w-4 h-4 text-green-600 rounded"
                          />
                          <label htmlFor="isImportant" className="text-sm text-gray-700">تنبيه هام (Urgent)</label>
                      </div>

                      <div className="flex justify-end gap-2 pt-4 border-t mt-4">
                          <button 
                              type="button" 
                              onClick={() => setIsAnnounceModalOpen(false)}
                              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                          >
                              إلغاء
                          </button>
                          <button 
                              type="submit"
                              disabled={submitting}
                              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
                          >
                              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                              نشر
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {/* Delete Confirmation Modal (Materials) */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl w-full max-w-sm shadow-2xl animate-in fade-in zoom-in-95 p-6">
                <div className="flex flex-col items-center text-center">
                    <div className="bg-red-100 p-3 rounded-full text-red-600 mb-4">
                        <AlertTriangle className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 mb-2">حذف المادة</h3>
                    <p className="text-gray-500 text-sm mb-6">
                        هل أنت متأكد من رغبتك في حذف هذه المادة العلمية نهائياً؟
                    </p>
                    
                    <div className="flex gap-3 w-full">
                        <button 
                          onClick={() => setIsDeleteModalOpen(false)}
                          className="flex-1 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium"
                        >
                            إلغاء
                        </button>
                        <button 
                          onClick={confirmDeleteMaterial}
                          disabled={submitting}
                          className="flex-1 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                        >
                            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                            تأكيد الحذف
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Delete Confirmation Modal (Schedules) */}
      {isDeleteScheduleModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl w-full max-w-sm shadow-2xl animate-in fade-in zoom-in-95 p-6">
                <div className="flex flex-col items-center text-center">
                    <div className="bg-red-100 p-3 rounded-full text-red-600 mb-4">
                        <AlertTriangle className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 mb-2">حذف الجدول</h3>
                    <p className="text-gray-500 text-sm mb-6">
                        هل أنت متأكد من حذف هذا الجدول؟
                    </p>
                    
                    <div className="flex gap-3 w-full">
                        <button 
                          onClick={() => setIsDeleteScheduleModalOpen(false)}
                          className="flex-1 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium"
                        >
                            إلغاء
                        </button>
                        <button 
                          onClick={confirmDeleteSchedule}
                          disabled={submitting}
                          className="flex-1 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                        >
                            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                            تأكيد الحذف
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

       {/* Delete Confirmation Modal (Announcements) */}
       {isAnnounceDeleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl w-full max-w-sm shadow-2xl animate-in fade-in zoom-in-95 p-6">
                <div className="flex flex-col items-center text-center">
                    <div className="bg-red-100 p-3 rounded-full text-red-600 mb-4">
                        <AlertTriangle className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 mb-2">حذف الإعلان</h3>
                    <p className="text-gray-500 text-sm mb-6">
                        هل أنت متأكد من حذف هذا الإعلان؟
                    </p>
                    
                    <div className="flex gap-3 w-full">
                        <button 
                          onClick={() => setIsAnnounceDeleteModalOpen(false)}
                          className="flex-1 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium"
                        >
                            إلغاء
                        </button>
                        <button 
                          onClick={confirmDeleteAnnouncement}
                          disabled={submitting}
                          className="flex-1 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                        >
                            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                            تأكيد الحذف
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
