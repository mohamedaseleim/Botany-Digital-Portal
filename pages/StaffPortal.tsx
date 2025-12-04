import React, { useState, useEffect } from 'react';
import { 
    UserCircle, Mail, Phone, Edit, Trash2, Plus, 
    Search, GraduationCap, BookOpen, Save, X, Loader2, UploadCloud, Award, Briefcase
} from 'lucide-react';
import { StaffMember, User, UserRole, StaffDocuments, StaffDocItem, CoursePortfolio } from '../types';
import { getStaff, updateStaff, deleteStaff, addStaff, logActivity } from '../services/dbService';

interface StaffPortalProps {
    user: User;
}

export const StaffPortal: React.FC<StaffPortalProps> = ({ user }) => {
    const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [submitting, setSubmitting] = useState(false);
    
    // Tab State
    const [activeTab, setActiveTab] = useState<'FACULTY' | 'ASSISTANT'>('FACULTY');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false); // للمعلومات الأساسية
    const [isDigitalProfileOpen, setIsDigitalProfileOpen] = useState(false); // للملف الرقمي
    const [editingMember, setEditingMember] = useState<StaffMember | null>(null);
    
    // Form States
    const [basicFormData, setBasicFormData] = useState<Partial<StaffMember>>({});
    const [digitalProfileForm, setDigitalProfileForm] = useState<StaffDocuments>({});
    const [saving, setSaving] = useState(false);
    const [isEditingDigital, setIsEditingDigital] = useState(false);

    const isAdmin = user.role === UserRole.ADMIN;

    useEffect(() => {
        fetchStaff();
    }, []);

    const fetchStaff = async () => {
        setLoading(true);
        const data = await getStaff();
        setStaffMembers(data);
        setLoading(false);
    };

    // --- (1) دالة التحقق من الصلاحية ---
    const canEdit = (targetMemberId: string) => {
        // المدير يملك صلاحية كاملة
        if (isAdmin) return true;
        // عضو هيئة التدريس يعدل ملفه الشخصي فقط
        if (user.role === UserRole.STAFF && user.id === targetMemberId) return true;
        return false;
    };

    // --- Handlers ---

    const handleOpenModal = (member?: StaffMember) => {
        if (member) {
            setEditingMember(member);
            setBasicFormData(member);
        } else {
            setEditingMember(null);
            setBasicFormData({
                name: '', rank: '', specialization: '', email: '', phone: '', subRole: 'FACULTY'
            });
        }
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string, name: string) => {
        if (!window.confirm('هل أنت متأكد من حذف هذا العضو؟')) return;
        try {
            await deleteStaff(id);
            await logActivity('حذف عضو هيئة تدريس', user.name, `تم حذف العضو: ${name}`);
            fetchStaff();
        } catch (error) {
            alert('فشل الحذف');
        }
    };

    const handleSubmitBasicData = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (editingMember) {
                await updateStaff(editingMember.id, basicFormData);
                await logActivity('تعديل بيانات عضو', user.name, `تم تعديل بيانات: ${basicFormData.name}`);
                alert('تم التعديل بنجاح');
            } else {
                await addStaff(basicFormData as any);
                await logActivity('إضافة عضو هيئة تدريس', user.name, `تم إضافة العضو: ${basicFormData.name}`);
                alert('تمت الإضافة بنجاح');
            }
            setIsModalOpen(false);
            fetchStaff();
        } catch (error) {
            alert('حدث خطأ أثناء الحفظ');
        } finally {
            setSubmitting(false);
        }
    };

    const openDigitalProfile = (member: StaffMember) => {
        setEditingMember(member);
        setDigitalProfileForm({
            ...member.documents,
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
        setIsEditingDigital(false); 
        setIsDigitalProfileOpen(true);
    };

    const handleUpload = (field: keyof StaffDocuments) => {
        // محاكاة الرفع
        const mockUrl = `https://drive.google.com/file/d/simulated_upload_${Math.floor(Math.random() * 10000)}`;
        setDigitalProfileForm(prev => ({ ...prev, [field]: mockUrl }));
        alert('تم رفع الملف (محاكاة)');
    };

    const handleAddArrayItem = (field: keyof StaffDocuments, title: string) => {
        if (!title) return;
        const mockUrl = `https://drive.google.com/file/d/simulated_upload_${Math.floor(Math.random() * 10000)}`;
        const newItem: StaffDocItem = {
            id: Math.random().toString(36).substr(2, 9),
            title: title,
            url: mockUrl,
            date: new Date().toISOString().split('T')[0]
        };
        setDigitalProfileForm(prev => ({
            ...prev,
            [field]: [...(prev[field] as any[] || []), newItem]
        }));
    };

    const handleRemoveArrayItem = (field: keyof StaffDocuments, id: string) => {
        setDigitalProfileForm(prev => ({
            ...prev,
            [field]: (prev[field] as any[] || []).filter(item => item.id !== id)
        }));
    };

    const handleSaveDigitalProfile = async () => {
        if (!editingMember) return;
        setSaving(true);
        try {
            await updateStaff(editingMember.id, { documents: digitalProfileForm });
            await logActivity('تحديث ملف رقمي', user.name, `تحديث الملف الرقمي للدكتور: ${editingMember.name}`);
            setStaffMembers(prev => prev.map(m => m.id === editingMember.id ? { ...m, documents: digitalProfileForm } : m));
            alert('تم حفظ الملف الرقمي بنجاح');
            setIsEditingDigital(false);
        } catch (error) {
            alert('حدث خطأ أثناء الحفظ');
        } finally {
            setSaving(false);
        }
    };

    // Filter Staff
    const filteredStaff = staffMembers.filter(s => 
        ((s.subRole || 'FACULTY') === activeTab) &&
        (s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.specialization.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <GraduationCap className="w-8 h-8 text-green-600" />
                        الهيكل الأكاديمي
                    </h1>
                    <p className="text-gray-500 text-sm">أعضاء هيئة التدريس والهيئة المعاونة بقسم النبات</p>
                </div>
                
                {/* (2) زر الإضافة يظهر للمدير فقط */}
                {isAdmin && (
                    <button 
                        onClick={() => handleOpenModal()}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 shadow-sm"
                    >
                        <Plus className="w-5 h-5" /> إضافة عضو جديد
                    </button>
                )}
            </div>

            <div className="flex border-b border-gray-200">
                <button onClick={() => setActiveTab('FACULTY')} className={`px-6 py-3 font-bold text-sm transition-colors flex items-center gap-2 ${activeTab === 'FACULTY' ? 'text-green-700 border-b-2 border-green-700' : 'text-gray-500 hover:text-green-600'}`}>
                    <Briefcase className="w-4 h-4" /> هيئة التدريس
                </button>
                <button onClick={() => setActiveTab('ASSISTANT')} className={`px-6 py-3 font-bold text-sm transition-colors flex items-center gap-2 ${activeTab === 'ASSISTANT' ? 'text-green-700 border-b-2 border-green-700' : 'text-gray-500 hover:text-green-600'}`}>
                    <GraduationCap className="w-4 h-4" /> الهيئة المعاونة
                </button>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 relative">
                <Search className="w-5 h-5 text-gray-400 absolute right-6 top-6" />
                <input 
                    type="text" 
                    placeholder="بحث بالاسم أو التخصص..." 
                    className="w-full border p-3 pr-10 rounded-lg outline-none focus:ring-2 focus:ring-green-500"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            {loading ? (
                <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400"/></div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredStaff.map(member => (
                        <div key={member.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow group">
                            <div className="p-6 flex flex-col items-center text-center relative">
                                {/* (3) أزرار التعديل والحذف على البطاقة */}
                                <div className="absolute top-4 left-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {/* زر التعديل: للمدير وصاحب البطاقة */}
                                    {canEdit(member.id) && (
                                        <button 
                                            onClick={() => handleOpenModal(member)} 
                                            className="p-2 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors"
                                            title="تعديل البيانات الأساسية"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                    )}
                                    {/* زر الحذف: للمدير فقط */}
                                    {isAdmin && (
                                        <button 
                                            onClick={() => handleDelete(member.id, member.name)} 
                                            className="p-2 bg-red-50 text-red-600 rounded-full hover:bg-red-100 transition-colors"
                                            title="حذف العضو"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>

                                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4 border-4 border-white shadow-sm">
                                    {member.imageUrl ? (
                                        <img src={member.imageUrl} alt={member.name} className="w-full h-full rounded-full object-cover" />
                                    ) : (
                                        <UserCircle className="w-16 h-16 text-gray-400" />
                                    )}
                                </div>
                                
                                <h3 className="font-bold text-lg text-gray-800 mb-1">{member.name}</h3>
                                <span className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-bold mb-2">
                                    {member.rank}
                                </span>
                                <p className="text-sm text-gray-500 mb-4 flex items-center gap-1">
                                    <BookOpen className="w-4 h-4"/> {member.specialization}
                                </p>

                                <div className="w-full border-t pt-4 flex flex-col gap-2 text-sm text-gray-600">
                                    {member.email && <div className="flex items-center gap-2 justify-center"><Mail className="w-4 h-4 text-gray-400" /><span>{member.email}</span></div>}
                                    {member.phone && <div className="flex items-center gap-2 justify-center"><Phone className="w-4 h-4 text-gray-400" /><span dir="ltr">{member.phone}</span></div>}
                                    
                                    <button 
                                        onClick={() => openDigitalProfile(member)}
                                        className="mt-2 w-full py-2 border border-green-600 text-green-700 rounded-lg hover:bg-green-50 transition-colors text-sm font-semibold flex items-center justify-center gap-2"
                                    >
                                        <FileText className="w-4 h-4" /> الملف الوظيفي الرقمي
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {filteredStaff.length === 0 && (
                        <div className="col-span-full text-center py-12 text-gray-400">
                            لا يوجد أعضاء مطابقين للبحث.
                        </div>
                    )}
                </div>
            )}

            {/* Modal 1: Basic Info (Add/Edit) */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl animate-in fade-in zoom-in-95">
                        <div className="flex justify-between items-center mb-6 border-b pb-4">
                            <h3 className="text-xl font-bold text-gray-800">
                                {editingMember ? 'تعديل البيانات الأساسية' : 'إضافة عضو جديد'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)}><X className="w-6 h-6 text-gray-400 hover:text-red-500"/></button>
                        </div>
                        
                        <form onSubmit={handleSubmitBasicData} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">الاسم رباعي</label>
                                <input type="text" required className="w-full border p-2 rounded-lg" value={basicFormData.name || ''} onChange={e => setBasicFormData({...basicFormData, name: e.target.value})} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-sm font-bold text-gray-700 mb-1">الدرجة</label><input type="text" required className="w-full border p-2 rounded-lg" value={basicFormData.rank || ''} onChange={e => setBasicFormData({...basicFormData, rank: e.target.value})} /></div>
                                <div><label className="block text-sm font-bold text-gray-700 mb-1">التخصص</label><input type="text" required className="w-full border p-2 rounded-lg" value={basicFormData.specialization || ''} onChange={e => setBasicFormData({...basicFormData, specialization: e.target.value})} /></div>
                            </div>
                            <div><label className="block text-sm font-bold text-gray-700 mb-1">البريد</label><input type="email" className="w-full border p-2 rounded-lg" value={basicFormData.email || ''} onChange={e => setBasicFormData({...basicFormData, email: e.target.value})} /></div>
                            <div><label className="block text-sm font-bold text-gray-700 mb-1">الهاتف</label><input type="tel" className="w-full border p-2 rounded-lg" value={basicFormData.phone || ''} onChange={e => setBasicFormData({...basicFormData, phone: e.target.value})} /></div>
                            
                            {/* (4) تغيير الفئة يظهر للمدير فقط */}
                            {isAdmin && (
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">الفئة</label>
                                    <select className="w-full border p-2 rounded-lg bg-white" value={basicFormData.subRole || 'FACULTY'} onChange={e => setBasicFormData({...basicFormData, subRole: e.target.value as any})}>
                                        <option value="FACULTY">عضو هيئة تدريس</option>
                                        <option value="ASSISTANT">هيئة معاونة</option>
                                    </select>
                                </div>
                            )}

                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-bold">إلغاء</button>
                                <button type="submit" disabled={submitting} className="bg-green-600 text-white px-8 py-2 rounded-lg hover:bg-green-700 font-bold flex items-center gap-2 disabled:opacity-50">
                                    {submitting && <Loader2 className="w-4 h-4 animate-spin"/>} حفظ
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal 2: Digital Profile */}
            {isDigitalProfileOpen && editingMember && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                     <div className="bg-white rounded-xl w-full max-w-4xl max-h-[95vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in-95">
                        <div className="bg-green-700 p-6 flex justify-between items-center text-white rounded-t-xl sticky top-0 z-10">
                            <div>
                                <h3 className="text-xl font-bold">{editingMember.name}</h3>
                                <p className="text-green-100 text-sm">الملف الوظيفي الرقمي</p>
                            </div>
                            <div className="flex gap-2">
                                {/* (5) زر تفعيل وضع التعديل: للمدير وصاحب الملف فقط */}
                                {canEdit(editingMember.id) && (
                                    !isEditingDigital ? (
                                        <button onClick={() => setIsEditingDigital(true)} className="bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 transition-colors border border-green-500">
                                            <Edit className="w-4 h-4" /> وضع التعديل
                                        </button>
                                    ) : (
                                        <button onClick={handleSaveDigitalProfile} disabled={saving} className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors shadow-sm font-bold">
                                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} حفظ التغييرات
                                        </button>
                                    )
                                )}
                                <button onClick={() => setIsDigitalProfileOpen(false)} className="text-green-100 hover:text-white bg-green-800 p-2 rounded-full">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-8">
                            {isEditingDigital && (
                                <div className="bg-blue-50 text-blue-800 text-sm p-3 rounded-lg flex items-center gap-2 border border-blue-100">
                                    <UploadCloud className="w-4 h-4" />
                                    <span>أنت الآن في وضع تعديل الملف الإداري. قم برفع المستندات الناقصة للحفاظ على اكتمال الملف القانوني.</span>
                                </div>
                            )}

                            <section>
                                <h4 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4 flex items-center gap-2">
                                    <Briefcase className="w-5 h-5 text-gray-500" /> مستندات التعيين والترقيات
                                </h4>
                                <div className="space-y-4">
                                    <DocCard title="1. قرار التعيين الأول" url={digitalProfileForm.appointmentDecision} isEditing={isEditingDigital} onUpload={() => handleUpload('appointmentDecision')} />
                                    <DocCard title="2. محضر استلام العمل" url={digitalProfileForm.joiningReport} isEditing={isEditingDigital} onUpload={() => handleUpload('joiningReport')} />
                                    <MultiDocCard title="3. قرارات الترقية" description="قرارات منح الألقاب العلمية." items={digitalProfileForm.promotionDecisions} isEditing={isEditingDigital} onAdd={(title) => handleAddArrayItem('promotionDecisions', title)} onRemove={(id) => handleRemoveArrayItem('promotionDecisions', id)} />
                                </div>
                            </section>

                            {/* ... (باقي أقسام الملف الرقمي بنفس النمط) ... */}
                             <section>
                                <h4 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4 flex items-center gap-2">
                                    <GraduationCap className="w-5 h-5 text-purple-600" /> المؤهلات العلمية
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                     <DocCard title="شهادة البكالوريوس" url={digitalProfileForm.bachelorCert} isEditing={isEditingDigital} onUpload={() => handleUpload('bachelorCert')} />
                                    <DocCard title="شهادة الماجستير" url={digitalProfileForm.masterCert} isEditing={isEditingDigital} onUpload={() => handleUpload('masterCert')} />
                                    <DocCard title="شهادة الدكتوراه" url={digitalProfileForm.phdCert} isEditing={isEditingDigital} onUpload={() => handleUpload('phdCert')} />
                                </div>
                            </section>
                             <section>
                                <h4 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4 flex items-center gap-2">
                                    <Award className="w-5 h-5 text-blue-600" /> النشاط العلمي
                                </h4>
                                <div className="space-y-4">
                                    <MultiDocCard title="شهادات المؤتمرات والندوات" description="توثيق الحضور والمشاركة." items={digitalProfileForm.conferenceCerts} isEditing={isEditingDigital} onAdd={(title) => handleAddArrayItem('conferenceCerts', title)} onRemove={(id) => handleRemoveArrayItem('conferenceCerts', id)} />
                                    <DocCard title="قائمة الأبحاث المنشورة" url={digitalProfileForm.publicationsListFile} isEditing={isEditingDigital} onUpload={() => handleUpload('publicationsListFile')} />
                                </div>
                            </section>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- Helper Components ---

interface DocCardProps {
    title: string;
    description?: string;
    url?: string;
    isEditing: boolean;
    onUpload: () => void;
}

const DocCard: React.FC<DocCardProps> = ({ title, description, url, isEditing, onUpload }) => (
    <div className={`flex flex-col p-3 rounded-lg border transition-colors ${url ? 'bg-green-50 border-green-100' : 'bg-gray-50 border-gray-200 border-dashed'}`}>
        <div className="flex items-center justify-between mb-1">
             <span className={`text-sm font-bold ${url ? 'text-gray-800' : 'text-gray-500'}`}>{title}</span>
             <div className="flex items-center gap-2">
                {url && <a href={url} target="_blank" rel="noreferrer" className="text-xs bg-white border border-green-200 text-green-700 px-2 py-1 rounded hover:bg-green-50 transition-colors">عرض</a>}
                {isEditing && (
                    <button onClick={onUpload} className={`p-1.5 rounded-md border flex items-center gap-1 text-xs ${url ? 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100' : 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100'}`} title={url ? "تحديث الملف" : "رفع ملف"}>
                        <UploadCloud className="w-3 h-3" /> {url ? <span>تحديث</span> : <span>رفع</span>}
                    </button>
                )}
                {!url && !isEditing && <span className="text-xs text-red-400 font-medium">ناقص</span>}
            </div>
        </div>
        {description && <p className="text-xs text-gray-400 leading-relaxed">{description}</p>}
    </div>
);

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
        <div className="p-4 rounded-lg border border-gray-200 bg-white shadow-sm">
            <h5 className="text-sm font-bold text-gray-800 mb-1">{title}</h5>
            <p className="text-xs text-gray-500 mb-3">{description}</p>
            {items.length > 0 ? (
                <ul className="space-y-2 mb-3">
                    {items.map(item => (
                        <li key={item.id} className="flex items-center justify-between bg-gray-50 p-2 rounded text-sm border border-gray-100">
                            <span className="truncate flex-1 ml-2 font-medium text-gray-700">{item.title}</span>
                            <div className="flex items-center gap-2">
                                <a href={item.url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline font-bold">عرض</a>
                                {isEditing && <button onClick={() => onRemove(item.id)} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 className="w-3 h-3" /></button>}
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (!isEditing && <p className="text-xs text-gray-400 italic mb-3 bg-gray-50 p-2 rounded text-center">لا توجد ملفات مرفوعة.</p>)}
            {isEditing && (
                <div className="flex gap-2 items-center mt-2 border-t pt-3 border-dashed">
                    <input type="text" placeholder="عنوان المستند الجديد..." className="flex-1 text-xs p-2 border rounded focus:outline-none focus:border-green-500 bg-gray-50 focus:bg-white" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
                    <button onClick={() => { if(newTitle) { onAdd(newTitle); setNewTitle(''); } }} className="bg-blue-600 text-white text-xs px-3 py-2 rounded hover:bg-blue-700 flex items-center gap-1 shadow-sm disabled:opacity-50" disabled={!newTitle}>
                        <Plus className="w-3 h-3" /> إضافة
                    </button>
                </div>
            )}
        </div>
    );
};