
import React, { useEffect, useState } from 'react';
import { Briefcase, UserPlus, Building, Settings, X, Save, Loader2, PlusCircle, Edit, Trash2, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { JobOpportunity, User, UserRole, JobStatus } from '../types';
import { getJobs, addAlumni, addJob, updateJob, deleteJob } from '../services/dbService';

interface AlumniPortalProps {
    user?: User;
}

export const AlumniPortal: React.FC<AlumniPortalProps> = ({ user }) => {
  const [jobs, setJobs] = useState<JobOpportunity[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Modals
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  
  // Delete Confirmation Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<string | null>(null);
  
  const [submitting, setSubmitting] = useState(false);

  // Form State for Alumni Registration
  const [alumniForm, setAlumniForm] = useState({
    name: '',
    graduationYear: '',
    currentJob: '',
    email: '',
    phone: ''
  });

  // Form State for Jobs
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [jobForm, setJobForm] = useState({
    title: '',
    company: '',
    description: '',
    contactInfo: '',
    datePosted: '',
    status: 'OPEN' as JobStatus
  });
  
  const fetchJobs = async () => {
    setLoading(true);
    const data = await getJobs();
    setJobs(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const goToManagement = () => {
      // Navigate to user management with Alumni tab active state (passed via state)
      navigate('/users', { state: { initialTab: 'ALUMNI' } });
  };

  // --- Alumni Registration Handlers ---
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await addAlumni({
        ...alumniForm,
        username: alumniForm.email.split('@')[0], 
        password: '123' 
      });
      alert('تم تسجيل بياناتك بنجاح! شكراً لانضمامك لرابطة الخريجين.');
      setIsRegisterModalOpen(false);
      setAlumniForm({ name: '', graduationYear: '', currentJob: '', email: '', phone: '' });
    } catch (error) {
      console.error(error);
      alert('حدث خطأ أثناء التسجيل');
    } finally {
      setSubmitting(false);
    }
  };

  // --- Job Management Handlers ---
  const openJobModal = (job?: JobOpportunity) => {
    if (job) {
      setEditingJobId(job.id);
      setJobForm({
        title: job.title,
        company: job.company,
        description: job.description,
        contactInfo: job.contactInfo,
        datePosted: job.datePosted,
        status: job.status || 'OPEN'
      });
    } else {
      setEditingJobId(null);
      setJobForm({
        title: '',
        company: '',
        description: '',
        contactInfo: '',
        datePosted: new Date().toISOString().split('T')[0],
        status: 'OPEN'
      });
    }
    setIsJobModalOpen(true);
  };

  const handleJobSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingJobId) {
        await updateJob(editingJobId, jobForm);
      } else {
        await addJob(jobForm);
      }
      setIsJobModalOpen(false);
      fetchJobs();
    } catch (error) {
      console.error(error);
      alert('حدث خطأ أثناء حفظ الوظيفة');
    } finally {
      setSubmitting(false);
    }
  };

  const initiateDelete = (id: string) => {
      setJobToDelete(id);
      setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!jobToDelete) return;
    
    setSubmitting(true);
    try {
        await deleteJob(jobToDelete);
        setJobs(prevJobs => prevJobs.filter(job => job.id !== jobToDelete));
        setIsDeleteModalOpen(false);
        setJobToDelete(null);
    } catch (error) {
        console.error("Delete failed", error);
        alert("فشل حذف الإعلان");
        fetchJobs(); 
    } finally {
        setSubmitting(false);
    }
  };

  // Permissions Logic
  // Admin and Staff can Edit/Delete
  const canManageJobs = user?.role === UserRole.ADMIN || user?.role === UserRole.STAFF;
  // Admin, Staff, AND Alumni can Add (Post)
  const canPostJobs = canManageJobs || user?.role === UserRole.ALUMNI;

  return (
    <div className="space-y-6">
      <div className="bg-amber-600 rounded-2xl p-8 text-white relative overflow-hidden">
        <div className="relative z-10">
            <h1 className="text-3xl font-bold mb-2">رابطة خريجي قسم النبات</h1>
            <p className="opacity-90 max-w-xl">
                نعتز بخريجينا وهم سفراؤنا في سوق العمل. تهدف هذه المنصة لربط الخريجين بالقسم وتوفير فرص عمل متميزة.
            </p>
            <div className="flex flex-wrap gap-3 mt-6">
                <button 
                  onClick={() => setIsRegisterModalOpen(true)}
                  className="bg-white text-amber-700 px-6 py-2 rounded-lg font-bold hover:bg-amber-50 transition-colors flex items-center gap-2"
                >
                    <UserPlus className="w-5 h-5" /> سجل بياناتك كخريج
                </button>
                {user?.role === UserRole.ADMIN && (
                    <button 
                        onClick={goToManagement}
                        className="bg-amber-800 text-white border border-amber-500 px-6 py-2 rounded-lg font-bold hover:bg-amber-900 transition-colors flex items-center gap-2"
                    >
                        <Settings className="w-5 h-5" /> إدارة الخريجين (Admin)
                    </button>
                )}
            </div>
        </div>
        <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-10 translate-y-10">
            <Briefcase className="w-64 h-64" />
        </div>
      </div>

      <div className="flex items-center justify-between mt-8">
        <div className="flex items-center gap-2 text-xl font-bold text-gray-800">
          <Briefcase className="w-6 h-6 text-amber-600" />
          <h2>فرص العمل المتاحة</h2>
        </div>
        
        {canPostJobs && (
          <button 
            onClick={() => openJobModal()}
            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 flex items-center gap-2 shadow-sm"
          >
            <PlusCircle className="w-4 h-4" /> إضافة فرصة عمل
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {jobs.map(job => (
            <div key={job.id} className={`bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative ${job.status === 'CLOSED' ? 'opacity-70 bg-gray-50' : ''}`}>
                
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="font-bold text-lg text-gray-800">{job.title}</h3>
                        <div className="flex items-center gap-2 text-gray-500 text-sm mt-1">
                            <Building className="w-4 h-4" />
                            <span>{job.company}</span>
                        </div>
                    </div>
                    
                    <div className="flex items-start gap-2">
                        {/* Status Badge */}
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold h-fit ${
                             job.status === 'CLOSED' 
                             ? 'bg-red-100 text-red-700 border border-red-200' 
                             : 'bg-green-100 text-green-700 border border-green-200'
                        }`}>
                            {job.status === 'CLOSED' ? 'مغلق' : 'متاح للتقديم'}
                        </span>
                        
                        {/* Management Buttons */}
                        {canManageJobs && (
                            <div className="flex flex-col gap-1 z-20">
                                <button 
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        openJobModal(job);
                                    }}
                                    className="p-1.5 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 border border-blue-100"
                                    title="تعديل"
                                >
                                    <Edit className="w-4 h-4" />
                                </button>
                                <button 
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        initiateDelete(job.id);
                                    }} 
                                    className="p-1.5 bg-red-50 text-red-600 rounded-md hover:bg-red-100 border border-red-100"
                                    title="حذف"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
                
                <p className="text-gray-600 mt-4 text-sm leading-relaxed">
                    {job.description}
                </p>
                
                <div className="mt-6 pt-4 border-t text-sm">
                    <p className="font-semibold text-gray-700 mb-1">للتواصل والتقديم:</p>
                    <p className="text-amber-600">{job.contactInfo}</p>
                </div>

                <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs text-gray-400">تاريخ النشر: {job.datePosted}</span>
                </div>
            </div>
        ))}
        
        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center text-center text-gray-500 min-h-[250px]">
            <p className="font-medium">هل لديك فرصة عمل؟</p>
            <p className="text-sm mt-1">شاركها مع زملائك الخريجين</p>
            {canPostJobs && (
              <button 
                onClick={() => openJobModal()}
                className="mt-3 text-amber-600 hover:text-amber-700 font-medium text-sm border border-amber-200 px-4 py-1.5 rounded-lg bg-white hover:bg-amber-50"
              >
                  + إضافة وظيفة
              </button>
            )}
        </div>
      </div>

      {/* Registration Modal */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in-95">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800">تسجيل بيانات خريج</h3>
              <button onClick={() => setIsRegisterModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleRegister} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الاسم رباعي</label>
                <input 
                  type="text" required 
                  value={alumniForm.name}
                  onChange={(e) => setAlumniForm({...alumniForm, name: e.target.value})}
                  className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">سنة التخرج</label>
                  <input 
                    type="number" required placeholder="مثال: 2022"
                    value={alumniForm.graduationYear}
                    onChange={(e) => setAlumniForm({...alumniForm, graduationYear: e.target.value})}
                    className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الوظيفة الحالية</label>
                  <input 
                    type="text" placeholder="مثال: مهندس جودة"
                    value={alumniForm.currentJob}
                    onChange={(e) => setAlumniForm({...alumniForm, currentJob: e.target.value})}
                    className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني</label>
                <input 
                  type="email" required
                  value={alumniForm.email}
                  onChange={(e) => setAlumniForm({...alumniForm, email: e.target.value})}
                  className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">رقم الهاتف</label>
                <input 
                  type="tel" required
                  value={alumniForm.phone}
                  onChange={(e) => setAlumniForm({...alumniForm, phone: e.target.value})}
                  className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t mt-4">
                 <button 
                   type="button" 
                   onClick={() => setIsRegisterModalOpen(false)}
                   className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                 >
                   إلغاء
                 </button>
                 <button 
                   type="submit"
                   disabled={submitting}
                   className="bg-amber-600 text-white px-6 py-2 rounded-lg hover:bg-amber-700 flex items-center gap-2"
                 >
                   {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                   تسجيل البيانات
                 </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl w-full max-w-sm shadow-2xl animate-in fade-in zoom-in-95 p-6">
                  <div className="flex flex-col items-center text-center">
                      <div className="bg-red-100 p-3 rounded-full text-red-600 mb-4">
                          <AlertTriangle className="w-8 h-8" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-800 mb-2">حذف الإعلان</h3>
                      <p className="text-gray-500 text-sm mb-6">
                          هل أنت متأكد من رغبتك في حذف هذا الإعلان نهائياً؟ لا يمكن التراجع عن هذا الإجراء.
                      </p>
                      
                      <div className="flex gap-3 w-full">
                          <button 
                            onClick={() => setIsDeleteModalOpen(false)}
                            className="flex-1 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium"
                          >
                              إلغاء
                          </button>
                          <button 
                            onClick={confirmDelete}
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

      {/* Job Management Modal */}
      {isJobModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in-95">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800">
                {editingJobId ? 'تعديل فرصة عمل' : 'إضافة فرصة عمل جديدة'}
              </h3>
              <button onClick={() => setIsJobModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleJobSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">المسمى الوظيفي</label>
                <input 
                  type="text" required 
                  placeholder="مثال: مهندس زراعي"
                  value={jobForm.title}
                  onChange={(e) => setJobForm({...jobForm, title: e.target.value})}
                  className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">اسم الشركة / الجهة</label>
                    <input 
                      type="text" required 
                      value={jobForm.company}
                      onChange={(e) => setJobForm({...jobForm, company: e.target.value})}
                      className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">حالة الإعلان</label>
                    <select 
                        value={jobForm.status} 
                        onChange={(e) => setJobForm({...jobForm, status: e.target.value as any})}
                        className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white font-semibold"
                    >
                        <option value="OPEN" className="text-green-600">مفتوح للتقديم</option>
                        <option value="CLOSED" className="text-red-600">مغلق</option>
                    </select>
                  </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">تفاصيل الوظيفة</label>
                <textarea 
                  required rows={4}
                  placeholder="المهام الوظيفية، الشروط، الخبرة المطلوبة..."
                  value={jobForm.description}
                  onChange={(e) => setJobForm({...jobForm, description: e.target.value})}
                  className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">معلومات التواصل</label>
                <input 
                  type="text" required 
                  placeholder="بريد إلكتروني أو رقم هاتف"
                  value={jobForm.contactInfo}
                  onChange={(e) => setJobForm({...jobForm, contactInfo: e.target.value})}
                  className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ النشر</label>
                <input 
                  type="date" required 
                  value={jobForm.datePosted}
                  onChange={(e) => setJobForm({...jobForm, datePosted: e.target.value})}
                  className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t mt-4">
                 <button 
                   type="button" 
                   onClick={() => setIsJobModalOpen(false)}
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
                   حفظ الإعلان
                 </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
