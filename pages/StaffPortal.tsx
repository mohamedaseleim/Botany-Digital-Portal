
import React, { useEffect, useState } from 'react';
import { Mail, Award, UserCircle, Briefcase, GraduationCap, FileText, CheckCircle2, Download, X, Edit, Save, UploadCloud, Loader2, Coins, User, Plus, Trash2, Plane, BookOpen, Globe } from 'lucide-react';
import { StaffMember, StaffSubRole, StaffDocuments, StaffDocItem, CoursePortfolio } from '../types';
import { getStaff, updateStaff } from '../services/dbService';

export const StaffPortal: React.FC = () => {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [filteredStaff, setFilteredStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Tab State: Faculty (هيئة التدريس) or Assistant (هيئة معاونة)
  const [activeTab, setActiveTab] = useState<StaffSubRole>('FACULTY');
  
  // Modal State
  const [selectedMember, setSelectedMember] = useState<StaffMember | null>(null);
  
  // Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<StaffDocuments>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchStaff = async () => {
      setLoading(true);
      const data = await getStaff();
      setStaff(data);
      setLoading(false);
    };
    fetchStaff();
  }, []);

  useEffect(() => {
    // Filter based on active tab
    // Default to FACULTY if subRole is undefined for backward compatibility
    setFilteredStaff(staff.filter(m => (m.subRole || 'FACULTY') === activeTab));
  }, [staff, activeTab]);

  const openPortfolio = (member: StaffMember) => {
      setSelectedMember(member);
      // Initialize edit form with current docs
      setEditForm({
          ...member.documents,
          // Ensure arrays are initialized
          promotionDecisions: member.documents?.promotionDecisions || [],
          adminPositions: member.documents?.adminPositions || [],
          extensionDecisions: member.documents?.extensionDecisions || [],
          progressReports: member.documents?.progressReports || [],
          efficiencyReports: member.documents?.efficiencyReports || [],
          coursePortfolios: member.documents?.coursePortfolios || [],
          publications: member.documents?.publications || [],
          conferenceCerts: member.documents?.conferenceCerts || [],
          arbitrationCerts: member.documents?.arbitrationCerts || [],
          communityServiceDocs: member.documents?.communityServiceDocs || [],
      }); 
      setIsEditing(false); // Default to view mode
  };

  const closeModal = () => {
      setSelectedMember(null);
      setIsEditing(false);
  };

  // --- Edit Mode Handlers ---
  
  const handleUpload = (field: keyof StaffDocuments) => {
      // Simulate file upload logic
      const mockUrl = `https://drive.google.com/file/d/simulated_upload_${Math.floor(Math.random() * 10000)}`;
      
      setEditForm(prev => ({
          ...prev,
          [field]: mockUrl
      }));
  };

  // Helper for adding items to arrays (Promotions/Admin)
  const handleAddArrayItem = (field: 'promotionDecisions' | 'adminPositions' | 'extensionDecisions' | 'progressReports' | 'efficiencyReports' | 'conferenceCerts' | 'arbitrationCerts' | 'communityServiceDocs', title: string) => {
      if (!title) return;
      const mockUrl = `https://drive.google.com/file/d/simulated_upload_${Math.floor(Math.random() * 10000)}`;
      const newItem: StaffDocItem = {
          id: Math.random().toString(36).substr(2, 9),
          title: title,
          url: mockUrl,
          date: new Date().toISOString().split('T')[0]
      };
      
      setEditForm(prev => ({
          ...prev,
          [field]: [...(prev[field] || []), newItem]
      }));
  };

  const handleRemoveArrayItem = (field: 'promotionDecisions' | 'adminPositions' | 'extensionDecisions' | 'progressReports' | 'efficiencyReports' | 'conferenceCerts' | 'arbitrationCerts' | 'communityServiceDocs', id: string) => {
      setEditForm(prev => ({
          ...prev,
          [field]: (prev[field] || []).filter(item => item.id !== id)
      }));
  };

  // --- Course Portfolio Handlers ---
  
  const handleAddCourse = (courseName: string) => {
      if (!courseName) return;
      const newCourse: CoursePortfolio = { courseName };
      setEditForm(prev => ({
          ...prev,
          coursePortfolios: [...(prev.coursePortfolios || []), newCourse]
      }));
  };

  const handleRemoveCourse = (index: number) => {
      setEditForm(prev => ({
          ...prev,
          coursePortfolios: (prev.coursePortfolios || []).filter((_, i) => i !== index)
      }));
  };

  const handleCourseFileUpload = (index: number, field: keyof CoursePortfolio) => {
      const mockUrl = `https://drive.google.com/file/d/course_upload_${Math.floor(Math.random() * 10000)}`;
      
      setEditForm(prev => {
          const updatedCourses = [...(prev.coursePortfolios || [])];
          updatedCourses[index] = {
              ...updatedCourses[index],
              [field]: mockUrl
          };
          return { ...prev, coursePortfolios: updatedCourses };
      });
  };

  const handleSavePortfolio = async () => {
      if (!selectedMember) return;
      setSaving(true);
      try {
          // Update DB
          await updateStaff(selectedMember.id, { documents: editForm });
          
          // Update Local State
          const updatedMember = { ...selectedMember, documents: editForm };
          setStaff(prev => prev.map(m => m.id === selectedMember.id ? updatedMember : m));
          setSelectedMember(updatedMember);
          
          setIsEditing(false);
      } catch (error) {
          console.error("Failed to save portfolio", error);
          alert("حدث خطأ أثناء حفظ الملف");
      } finally {
          setSaving(false);
      }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">الهيكل الأكاديمي</h1>
          <p className="text-gray-500 text-sm">أعضاء هيئة التدريس والهيئة المعاونة بقسم النبات</p>
        </div>
      </div>

      {/* Role Tabs */}
      <div className="flex border-b border-gray-200">
          <button 
            onClick={() => setActiveTab('FACULTY')}
            className={`px-6 py-3 font-bold text-sm transition-colors flex items-center gap-2 ${activeTab === 'FACULTY' ? 'text-green-700 border-b-2 border-green-700' : 'text-gray-500 hover:text-green-600'}`}
          >
             <Briefcase className="w-4 h-4" /> أعضاء هيئة التدريس
          </button>
          <button 
            onClick={() => setActiveTab('ASSISTANT')}
            className={`px-6 py-3 font-bold text-sm transition-colors flex items-center gap-2 ${activeTab === 'ASSISTANT' ? 'text-green-700 border-b-2 border-green-700' : 'text-gray-500 hover:text-green-600'}`}
          >
             <GraduationCap className="w-4 h-4" /> الهيئة المعاونة
          </button>
      </div>

      {loading ? (
        <div className="text-center p-10 text-gray-500">جاري تحميل البيانات...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStaff.map((member) => (
            <div key={member.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow flex flex-col">
              <div className="bg-green-50 p-6 flex justify-center">
                <div className="w-24 h-24 bg-green-200 rounded-full flex items-center justify-center text-green-700">
                    <UserCircle className="w-16 h-16" />
                </div>
              </div>
              <div className="p-6 text-center flex-1 flex flex-col">
                <h3 className="font-bold text-lg text-gray-800 mb-1">{member.name}</h3>
                <p className="text-green-700 font-medium text-sm mb-4">{member.rank}</p>
                
                <div className="space-y-2 text-sm text-gray-600 text-right bg-gray-50 p-4 rounded-lg mb-4">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-green-600" />
                    <span>التخصص: {member.specialization}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-green-600" />
                    <span className="truncate">{member.email}</span>
                  </div>
                </div>
                
                <div className="mt-auto">
                    <button 
                        onClick={() => openPortfolio(member)}
                        className="w-full py-2 border border-green-600 text-green-700 rounded-lg hover:bg-green-50 transition-colors text-sm font-semibold flex items-center justify-center gap-2"
                    >
                        <FileText className="w-4 h-4" /> عرض الملف الوظيفي
                    </button>
                </div>
              </div>
            </div>
          ))}
          {filteredStaff.length === 0 && (
              <div className="col-span-3 text-center p-8 text-gray-400">
                  لا يوجد أعضاء في هذه الفئة حالياً
              </div>
          )}
        </div>
      )}

      {/* Digital Portfolio Modal */}
      {selectedMember && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl w-full max-w-4xl max-h-[95vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in-95">
                  <div className="bg-green-700 p-6 flex justify-between items-center text-white rounded-t-xl sticky top-0 z-10">
                      <div>
                          <h3 className="text-xl font-bold">{selectedMember.name}</h3>
                          <p className="text-green-100 text-sm">{selectedMember.rank} - {selectedMember.specialization}</p>
                      </div>
                      <div className="flex gap-2">
                          {!isEditing ? (
                              <button 
                                onClick={() => setIsEditing(true)}
                                className="bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 transition-colors border border-green-500"
                              >
                                  <Edit className="w-4 h-4" /> وضع التعديل
                              </button>
                          ) : (
                              <button 
                                onClick={handleSavePortfolio}
                                disabled={saving}
                                className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 transition-colors shadow-sm"
                              >
                                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                  حفظ التغييرات
                              </button>
                          )}
                          <button onClick={closeModal} className="text-green-100 hover:text-white bg-green-800 p-2 rounded-full">
                              <X className="w-6 h-6" />
                          </button>
                      </div>
                  </div>

                  <div className="p-6 space-y-8">
                      {isEditing && (
                          <div className="bg-blue-50 text-blue-800 text-sm p-3 rounded-lg flex items-center gap-2 border border-blue-100">
                              <UploadCloud className="w-4 h-4" />
                              <span>أنت الآن في وضع تعديل الملف الإداري. قم برفع المستندات الناقصة للحفاظ على اكتمال الملف القانوني.</span>
                          </div>
                      )}

                      {/* --- 1. Employment & Promotions (التعيين والترقيات) --- */}
                      <section>
                          <h4 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4 flex items-center gap-2">
                              <Briefcase className="w-5 h-5 text-gray-500" /> 
                              {activeTab === 'FACULTY' ? 'مستندات التعيين والترقيات (التدرج الوظيفي)' : 'مستندات التعيين والوضع الوظيفي'}
                          </h4>
                          <div className="space-y-4">
                              {/* --- FACULTY VIEW --- */}
                              {activeTab === 'FACULTY' && (
                                <>
                                  <DocCard 
                                    title="1. قرار التعيين الأول (الأمر التنفيذي)" 
                                    description="نسخة من قرار رئيس الجامعة بالتعيين لأول مرة (مدرس / أستاذ مساعد / أستاذ)."
                                    url={isEditing ? editForm.appointmentDecision : selectedMember.documents?.appointmentDecision} 
                                    isEditing={isEditing}
                                    onUpload={() => handleUpload('appointmentDecision')}
                                  />
                                  
                                  <MultiDocCard 
                                      title="2. قرارات الترقية (اللقب العلمي)"
                                      description="قرارات منح اللقب العلمي (أستاذ مساعد / أستاذ) المعتمدة من مجلس الجامعة."
                                      items={isEditing ? editForm.promotionDecisions : selectedMember.documents?.promotionDecisions}
                                      isEditing={isEditing}
                                      onAdd={(title) => handleAddArrayItem('promotionDecisions', title)}
                                      onRemove={(id) => handleRemoveArrayItem('promotionDecisions', id)}
                                  />

                                  <DocCard 
                                    title="3. محضر استلام العمل" 
                                    description="المحضر الرسمي الموقع بتاريخ استلام العمل عقب الترقية أو العودة من الإعارة."
                                    url={isEditing ? editForm.joiningReport : selectedMember.documents?.joiningReport} 
                                    isEditing={isEditing}
                                    onUpload={() => handleUpload('joiningReport')}
                                  />
                                  
                                  <MultiDocCard 
                                      title="4. قرارات المناصب الإدارية"
                                      description="قرارات التعيين في المناصب (رئيس قسم، وكيل، عميد)."
                                      items={isEditing ? editForm.adminPositions : selectedMember.documents?.adminPositions}
                                      isEditing={isEditing}
                                      onAdd={(title) => handleAddArrayItem('adminPositions', title)}
                                      onRemove={(id) => handleRemoveArrayItem('adminPositions', id)}
                                  />
                                </>
                              )}

                              {/* --- ASSISTANT VIEW --- */}
                              {activeTab === 'ASSISTANT' && (
                                <>
                                  <DocCard 
                                    title="1. قرار التعيين الأول (معيد)" 
                                    description="نسخة من قرار رئيس الجامعة بالتعيين بوظيفة 'معيد' لأول مرة."
                                    url={isEditing ? editForm.appointmentDecision : selectedMember.documents?.appointmentDecision} 
                                    isEditing={isEditing}
                                    onUpload={() => handleUpload('appointmentDecision')}
                                  />
                                  
                                  <DocCard 
                                    title="2. محضر استلام العمل" 
                                    description="المحضر الرسمي الموقع بتاريخ استلام العمل (بداية احتساب الأقدمية للمعيد)."
                                    url={isEditing ? editForm.joiningReport : selectedMember.documents?.joiningReport} 
                                    isEditing={isEditing}
                                    onUpload={() => handleUpload('joiningReport')}
                                  />

                                  <MultiDocCard 
                                      title="3. قرار الترقية لمدرس مساعد (إن وجد)"
                                      description="قرار الترقية من معيد إلى مدرس مساعد بعد الحصول على الماجستير."
                                      items={isEditing ? editForm.promotionDecisions : selectedMember.documents?.promotionDecisions}
                                      isEditing={isEditing}
                                      onAdd={(title) => handleAddArrayItem('promotionDecisions', title)}
                                      onRemove={(id) => handleRemoveArrayItem('promotionDecisions', id)}
                                  />
                                </>
                              )}
                              
                              <DocCard 
                                title="السيرة الذاتية (CV)" 
                                description="نسخة محدثة من السيرة الذاتية."
                                url={isEditing ? editForm.cv : selectedMember.documents?.cv}
                                isEditing={isEditing}
                                onUpload={() => handleUpload('cv')}
                              />
                          </div>
                      </section>

                      {/* --- 2. Qualifications (المؤهلات العلمية) --- */}
                      <section>
                          <h4 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4 flex items-center gap-2">
                              <GraduationCap className="w-5 h-5 text-purple-600" /> المؤهلات العلمية (الأصول)
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                               <DocCard 
                                    title="شهادة البكالوريوس/الليسانس" 
                                    url={isEditing ? editForm.bachelorCert : selectedMember.documents?.bachelorCert}
                                    isEditing={isEditing}
                                    onUpload={() => handleUpload('bachelorCert')}
                                />
                                
                                <DocCard 
                                    title="شهادة الماجستير" 
                                    url={isEditing ? editForm.masterCert : selectedMember.documents?.masterCert}
                                    isEditing={isEditing}
                                    onUpload={() => handleUpload('masterCert')}
                                />

                                {activeTab === 'FACULTY' && (
                                    <>
                                        <DocCard 
                                            title="شهادة الدكتوراه (الأصل)" 
                                            url={isEditing ? editForm.phdCert : selectedMember.documents?.phdCert}
                                            isEditing={isEditing}
                                            onUpload={() => handleUpload('phdCert')}
                                        />
                                        <DocCard 
                                            title="معادلة الدكتوراه (للشهادات الأجنبية)" 
                                            url={isEditing ? editForm.phdEquivalence : selectedMember.documents?.phdEquivalence}
                                            isEditing={isEditing}
                                            onUpload={() => handleUpload('phdEquivalence')}
                                        />
                                    </>
                                )}
                          </div>
                      </section>

                      {/* --- 3. Personal & Legal (شخصية وقانونية) --- */}
                      <section>
                          <h4 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4 flex items-center gap-2">
                              <User className="w-5 h-5 text-blue-600" /> وثائق شخصية وقانونية
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <DocCard 
                                title="صورة بطاقة الرقم القومي" 
                                url={isEditing ? editForm.idCard : selectedMember.documents?.idCard}
                                isEditing={isEditing}
                                onUpload={() => handleUpload('idCard')}
                              />
                              <DocCard 
                                title="شهادة الميلاد (كمبيوتر)" 
                                url={isEditing ? editForm.birthCert : selectedMember.documents?.birthCert}
                                isEditing={isEditing}
                                onUpload={() => handleUpload('birthCert')}
                              />
                              <DocCard 
                                title="الموقف من التجنيد" 
                                url={isEditing ? editForm.militaryStatus : selectedMember.documents?.militaryStatus}
                                isEditing={isEditing}
                                onUpload={() => handleUpload('militaryStatus')}
                              />
                              <DocCard 
                                title="صحيفة الحالة الجنائية" 
                                url={isEditing ? editForm.criminalRecord : selectedMember.documents?.criminalRecord}
                                isEditing={isEditing}
                                onUpload={() => handleUpload('criminalRecord')}
                              />
                          </div>
                      </section>

                      {/* --- 4. Financial & Leaves (مالية وإجازات) --- */}
                      <section>
                          <h4 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4 flex items-center gap-2">
                              <Coins className="w-5 h-5 text-amber-600" /> الملف المالي والإجازات
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <DocCard 
                                title="إقرار الذمة المالية (هام)" 
                                url={isEditing ? editForm.financialDisclosure : selectedMember.documents?.financialDisclosure}
                                isEditing={isEditing}
                                onUpload={() => handleUpload('financialDisclosure')}
                              />
                              <DocCard 
                                title="الرقم التأميني" 
                                description="وثيقة إثبات الرقم التأميني (طبعة تأمينات)."
                                url={isEditing ? editForm.socialInsuranceNum : selectedMember.documents?.socialInsuranceNum}
                                isEditing={isEditing}
                                onUpload={() => handleUpload('socialInsuranceNum')}
                              />
                              <DocCard 
                                title="بيان حالة وظيفية حديث" 
                                url={isEditing ? editForm.statusStatement : selectedMember.documents?.statusStatement}
                                isEditing={isEditing}
                                onUpload={() => handleUpload('statusStatement')}
                              />
                              <div className="md:col-span-2">
                                <DocCard 
                                    title="قرارات الإجازات والإعارات (History)" 
                                    url={isEditing ? editForm.vacationDecisions : selectedMember.documents?.vacationDecisions}
                                    isEditing={isEditing}
                                    onUpload={() => handleUpload('vacationDecisions')}
                                />
                              </div>
                          </div>
                      </section>

                      {/* --- 5. Academic Modules (Assistant & Faculty Separation) --- */}
                      
                      {activeTab === 'FACULTY' && (
                          <>
                            <section>
                                <h4 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4 flex items-center gap-2">
                                    <CheckCircle2 className="w-5 h-5 text-green-600" /> ملف الجودة (Course Portfolio)
                                </h4>
                                
                                <CoursePortfolioManager 
                                    courses={isEditing ? editForm.coursePortfolios : selectedMember.documents?.coursePortfolios}
                                    isEditing={isEditing}
                                    onAdd={handleAddCourse}
                                    onRemove={handleRemoveCourse}
                                    onUploadFile={handleCourseFileUpload}
                                />
                            </section>

                            <section>
                                <h4 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4 flex items-center gap-2">
                                    <Award className="w-5 h-5 text-blue-600" /> النشاط العلمي والإشراف
                                </h4>
                                
                                <div className="space-y-4">
                                    {/* Google Scholar Link */}
                                    <div className="bg-white p-3 border rounded-lg">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Globe className="w-4 h-4 text-blue-600" />
                                            <label className="text-sm font-bold text-gray-700">رابط الباحث العلمي (Google Scholar / ORCID)</label>
                                        </div>
                                        {isEditing ? (
                                            <input 
                                                type="text" 
                                                placeholder="https://scholar.google.com/..."
                                                value={editForm.googleScholarLink || ''}
                                                onChange={(e) => setEditForm(prev => ({...prev, googleScholarLink: e.target.value}))}
                                                className="w-full text-sm p-2 border rounded focus:outline-none focus:border-green-500"
                                            />
                                        ) : (
                                            selectedMember.documents?.googleScholarLink ? (
                                                <a href={selectedMember.documents.googleScholarLink} target="_blank" className="text-blue-600 hover:underline text-sm truncate block">
                                                    {selectedMember.documents.googleScholarLink}
                                                </a>
                                            ) : (
                                                <span className="text-sm text-gray-400">غير مسجل</span>
                                            )
                                        )}
                                    </div>

                                    {/* Updated List of Publications */}
                                    <DocCard 
                                        title="1. قائمة الأبحاث المنشورة (محدثة)" 
                                        description="ملف يحتوي على قائمة كاملة بالأبحاث، أو نسخ إلكترونية من الأبحاث المنشورة حديثاً."
                                        url={isEditing ? editForm.publicationsListFile : selectedMember.documents?.publicationsListFile}
                                        isEditing={isEditing}
                                        onUpload={() => handleUpload('publicationsListFile')}
                                    />

                                    {/* Supervision Record */}
                                    <DocCard 
                                        title="2. سجل الإشراف على الرسائل العلمية" 
                                        description="كشف بأسماء طلاب الماجستير والدكتوراه المسجلين تحت إشرافك، موضحاً به نسبة الإنجاز."
                                        url={isEditing ? editForm.supervisionRecord : selectedMember.documents?.supervisionRecord}
                                        isEditing={isEditing}
                                        onUpload={() => handleUpload('supervisionRecord')}
                                    />

                                    {/* Conferences - Multi Upload */}
                                    <MultiDocCard 
                                      title="3. شهادات المؤتمرات والندوات"
                                      description="صور شهادات الحضور أو المشاركة بأوراق عمل في المؤتمرات المحلية والدولية."
                                      items={isEditing ? editForm.conferenceCerts : selectedMember.documents?.conferenceCerts}
                                      isEditing={isEditing}
                                      onAdd={(title) => handleAddArrayItem('conferenceCerts', title)}
                                      onRemove={(id) => handleRemoveArrayItem('conferenceCerts', id)}
                                    />

                                    {/* Arbitration - Multi Upload */}
                                    <MultiDocCard 
                                      title="4. إفادات التحكيم العلمي"
                                      description="خطابات الشكر أو الإفادات الرسمية بتحكيم رسائل علمية أو أبحاث لمجلات."
                                      items={isEditing ? editForm.arbitrationCerts : selectedMember.documents?.arbitrationCerts}
                                      isEditing={isEditing}
                                      onAdd={(title) => handleAddArrayItem('arbitrationCerts', title)}
                                      onRemove={(id) => handleRemoveArrayItem('arbitrationCerts', id)}
                                    />

                                    {/* Community Service - Multi Upload */}
                                    <MultiDocCard 
                                      title="5. توثيق خدمة المجتمع"
                                      description="مستندات أو صور توثق الأنشطة الخارجية (قوافل، ندوات عامة، استشارات)."
                                      items={isEditing ? editForm.communityServiceDocs : selectedMember.documents?.communityServiceDocs}
                                      isEditing={isEditing}
                                      onAdd={(title) => handleAddArrayItem('communityServiceDocs', title)}
                                      onRemove={(id) => handleRemoveArrayItem('communityServiceDocs', id)}
                                    />
                                </div>
                            </section>
                          </>
                      )}

                      {/* Assistant Specific Modules */}
                      {activeTab === 'ASSISTANT' && (
                          <>
                            {/* 1. Academic Progress */}
                            <section>
                              <h4 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4 flex items-center gap-2">
                                  <GraduationCap className="w-5 h-5 text-purple-600" /> التقدم الدراسي (تقارير الصلاحية)
                              </h4>
                              
                              <div className="space-y-4">
                                <DocCard 
                                    title="1. إفادة التسجيل / القيد (حديثة)" 
                                    description="نسخة حديثة تجدد سنوياً تثبت القيد الحالي للماجستير أو الدكتوراه."
                                    url={isEditing ? editForm.enrollmentStatus : selectedMember.documents?.enrollmentStatus}
                                    isEditing={isEditing}
                                    onUpload={() => handleUpload('enrollmentStatus')}
                                />

                                <MultiDocCard 
                                    title="2. تقارير الصلاحية (تقارير المشرف)"
                                    description="التقارير الدورية للمشرف التي تثبت الجدية في البحث (نصف سنوية أو سنوية)."
                                    items={isEditing ? editForm.progressReports : selectedMember.documents?.progressReports}
                                    isEditing={isEditing}
                                    onAdd={(title) => handleAddArrayItem('progressReports', title)}
                                    onRemove={(id) => handleRemoveArrayItem('progressReports', id)}
                                />

                                <MultiDocCard 
                                    title="3. قرارات مد فترة التسجيل (إن وجدت)"
                                    description="القرار الإداري بمد الفترة الزمنية للدرجة العلمية في حال تجاوز المدة القانونية الأصلية."
                                    items={isEditing ? editForm.extensionDecisions : selectedMember.documents?.extensionDecisions}
                                    isEditing={isEditing}
                                    onAdd={(title) => handleAddArrayItem('extensionDecisions', title)}
                                    onRemove={(id) => handleRemoveArrayItem('extensionDecisions', id)}
                                />

                                <DocCard 
                                    title="شهادات دورات القدرات (FLDC)" 
                                    url={isEditing ? editForm.fldcCerts : selectedMember.documents?.fldcCerts}
                                    isEditing={isEditing}
                                    onUpload={() => handleUpload('fldcCerts')}
                                />
                              </div>
                            </section>

                            {/* 2. Performance & Penalties */}
                            <section>
                              <h4 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4 flex items-center gap-2">
                                  <Award className="w-5 h-5 text-amber-600" /> التقييم الوظيفي والجزاءات
                              </h4>
                              
                              <div className="space-y-4">
                                <MultiDocCard 
                                    title="1. تقارير الكفاءة السنوية"
                                    description="صور من تقارير الأداء السنوية المعتمدة (ممتاز / جيد جداً)."
                                    items={isEditing ? editForm.efficiencyReports : selectedMember.documents?.efficiencyReports}
                                    isEditing={isEditing}
                                    onAdd={(title) => handleAddArrayItem('efficiencyReports', title)}
                                    onRemove={(id) => handleRemoveArrayItem('efficiencyReports', id)}
                                />

                                <DocCard 
                                    title="2. سجل الجزاءات / ما يفيد خلو الملف" 
                                    description="قرارات الجزاءات أو لفت النظر (إن وجدت)، أو إفادة بخلو الملف من الجزاءات."
                                    url={isEditing ? editForm.penaltiesRecord : selectedMember.documents?.penaltiesRecord}
                                    isEditing={isEditing}
                                    onUpload={() => handleUpload('penaltiesRecord')}
                                />
                              </div>
                            </section>

                            {/* 3. Scholarships */}
                            <section>
                              <h4 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4 flex items-center gap-2">
                                  <Plane className="w-5 h-5 text-blue-500" /> البعثات والإجازات الدراسية
                              </h4>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <DocCard 
                                    title="1. قرار الإجازة الدراسية / البعثة" 
                                    description="قرار الموافقة على المنحة أو التفرغ الدراسي (بالداخل أو الخارج)."
                                    url={isEditing ? editForm.studyLeaveDecision : selectedMember.documents?.studyLeaveDecision}
                                    isEditing={isEditing}
                                    onUpload={() => handleUpload('studyLeaveDecision')}
                                />

                                <DocCard 
                                    title="2. إقرار العودة من البعثة" 
                                    description="محضر استلام العمل بعد انتهاء البعثة (ضروري لإعادة صرف المرتب وتسوية الوضع)."
                                    url={isEditing ? editForm.returnFromScholarship : selectedMember.documents?.returnFromScholarship}
                                    isEditing={isEditing}
                                    onUpload={() => handleUpload('returnFromScholarship')}
                                />
                              </div>
                            </section>
                          </>
                      )}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

// Helper Components for the Modal
interface DocCardProps {
    title: string;
    description?: string;
    url?: string;
    isEditing: boolean;
    onUpload: () => void;
}

const DocCard: React.FC<DocCardProps> = ({ title, description, url, isEditing, onUpload }) => (
    <div className={`flex flex-col p-3 rounded-lg border transition-colors ${url ? 'bg-gray-50 border-gray-100' : 'bg-gray-50 border-gray-200 border-dashed'}`}>
        <div className="flex items-center justify-between mb-1">
             <span className={`text-sm font-bold ${url ? 'text-gray-800' : 'text-gray-500'}`}>{title}</span>
             <div className="flex items-center gap-2">
                {url && (
                    <a href={url} target="_blank" className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200 transition-colors">
                        عرض
                    </a>
                )}
                {isEditing && (
                    <button 
                        onClick={onUpload} 
                        className={`p-1.5 rounded-md border flex items-center gap-1 text-xs ${url ? 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100' : 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100'}`}
                        title={url ? "تحديث الملف" : "رفع ملف"}
                    >
                        <UploadCloud className="w-3 h-3" />
                        {url && <span>تحديث</span>}
                    </button>
                )}
                {!url && !isEditing && (
                    <span className="text-xs text-gray-400">ناقص</span>
                )}
            </div>
        </div>
        {description && <p className="text-xs text-gray-400 leading-relaxed">{description}</p>}
    </div>
);

// Multi-upload Component
interface MultiDocCardProps {
    title: string;
    description: string;
    items?: StaffDocItem[];
    isEditing: boolean;
    onAdd: (title: string) => void;
    onRemove: (id: string) => void;
}

const MultiDocCard: React.FC<MultiDocCardProps> = ({ title, description, items = [], isEditing, onAdd, onRemove }) => {
    const [newTitle, setNewTitle] = useState('');

    return (
        <div className="p-4 rounded-lg border border-gray-200 bg-white">
            <h5 className="text-sm font-bold text-gray-800 mb-1">{title}</h5>
            <p className="text-xs text-gray-500 mb-3">{description}</p>
            
            {items.length > 0 ? (
                <ul className="space-y-2 mb-3">
                    {items.map(item => (
                        <li key={item.id} className="flex items-center justify-between bg-gray-50 p-2 rounded text-sm">
                            <span className="truncate flex-1 ml-2">{item.title}</span>
                            <div className="flex items-center gap-2">
                                <a href={item.url} target="_blank" className="text-xs text-blue-600 hover:underline">عرض</a>
                                {isEditing && (
                                    <button onClick={() => onRemove(item.id)} className="text-red-500 hover:bg-red-50 p-1 rounded">
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                !isEditing && <p className="text-xs text-gray-400 italic mb-3">لا توجد ملفات مرفوعة.</p>
            )}

            {isEditing && (
                <div className="flex gap-2 items-center mt-2 border-t pt-2 border-dashed">
                    <input 
                        type="text" 
                        placeholder="عنوان المستند الجديد"
                        className="flex-1 text-xs p-2 border rounded focus:outline-none focus:border-green-500"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                    />
                    <button 
                        onClick={() => { onAdd(newTitle); setNewTitle(''); }}
                        className="bg-blue-50 text-blue-600 border border-blue-200 text-xs px-3 py-2 rounded hover:bg-blue-100 flex items-center gap-1"
                    >
                        <Plus className="w-3 h-3" /> إضافة ورفع
                    </button>
                </div>
            )}
        </div>
    );
};

// Course Portfolio Manager Component
interface CoursePortfolioManagerProps {
    courses?: CoursePortfolio[];
    isEditing: boolean;
    onAdd: (courseName: string) => void;
    onRemove: (index: number) => void;
    onUploadFile: (index: number, field: keyof CoursePortfolio) => void;
}

const CoursePortfolioManager: React.FC<CoursePortfolioManagerProps> = ({ courses = [], isEditing, onAdd, onRemove, onUploadFile }) => {
    const [newCourseName, setNewCourseName] = useState('');

    return (
        <div className="space-y-4">
            {courses.length > 0 ? (
                courses.map((course, idx) => (
                    <div key={idx} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                        <div className="flex justify-between items-center mb-3 border-b pb-2">
                            <div className="flex items-center gap-2">
                                <BookOpen className="w-5 h-5 text-green-600" />
                                <h5 className="font-bold text-gray-800">{course.courseName}</h5>
                            </div>
                            {isEditing && (
                                <button 
                                    onClick={() => onRemove(idx)}
                                    className="text-red-500 hover:bg-red-50 p-1 rounded"
                                    title="حذف المقرر"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            <CourseFileSlot 
                                label="توصيف المقرر" 
                                url={course.specsUrl} 
                                isEditing={isEditing} 
                                onUpload={() => onUploadFile(idx, 'specsUrl')} 
                            />
                            <CourseFileSlot 
                                label="تقرير المقرر" 
                                url={course.reportUrl} 
                                isEditing={isEditing} 
                                onUpload={() => onUploadFile(idx, 'reportUrl')} 
                            />
                            <CourseFileSlot 
                                label="نماذج امتحانات" 
                                url={course.examsUrl} 
                                isEditing={isEditing} 
                                onUpload={() => onUploadFile(idx, 'examsUrl')} 
                            />
                            <CourseFileSlot 
                                label="عينات / إجابات" 
                                url={course.samplesUrl} 
                                isEditing={isEditing} 
                                onUpload={() => onUploadFile(idx, 'samplesUrl')} 
                            />
                        </div>
                    </div>
                ))
            ) : (
                <p className="text-gray-400 text-sm text-center py-4 border border-dashed rounded-lg">لم يتم إضافة مقررات بعد.</p>
            )}

            {isEditing && (
                <div className="bg-green-50 p-3 rounded-lg flex items-center gap-2 border border-green-200">
                    <input 
                        type="text" 
                        placeholder="اسم المقرر الجديد (مثال: أمراض نبات عامة)" 
                        className="flex-1 p-2 rounded border border-green-300 focus:outline-none focus:ring-1 focus:ring-green-500 text-sm"
                        value={newCourseName}
                        onChange={(e) => setNewCourseName(e.target.value)}
                    />
                    <button 
                        onClick={() => { onAdd(newCourseName); setNewCourseName(''); }}
                        className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 flex items-center gap-1"
                    >
                        <Plus className="w-4 h-4" /> إضافة مقرر
                    </button>
                </div>
            )}
        </div>
    );
};

const CourseFileSlot = ({ label, url, isEditing, onUpload }: { label: string, url?: string, isEditing: boolean, onUpload: () => void }) => (
    <div className={`p-2 rounded border text-center flex flex-col items-center justify-center min-h-[80px] ${url ? 'bg-green-50 border-green-100' : 'bg-gray-50 border-gray-100'}`}>
        <span className="text-xs font-semibold text-gray-700 mb-1">{label}</span>
        <div className="flex items-center gap-1 mt-1">
            {url ? (
                <a href={url} target="_blank" className="text-xs bg-white border border-gray-200 px-2 py-1 rounded text-green-700 hover:text-green-800">
                    عرض
                </a>
            ) : (
                <span className="text-[10px] text-gray-400">فارغ</span>
            )}
            
            {isEditing && (
                <button 
                    onClick={onUpload}
                    className="p-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 border border-blue-200"
                    title="رفع"
                >
                    <UploadCloud className="w-3 h-3" />
                </button>
            )}
        </div>
    </div>
);
