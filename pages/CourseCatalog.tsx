import React, { useState, useEffect } from 'react';
import { 
    BookOpen, GraduationCap, Network, Settings, Search, Plus, 
    Edit, Trash2, FileText, Download, UploadCloud, Save, X, 
    ArrowRight, Layout, Filter, Loader2
} from 'lucide-react';
import { User, UserRole, Course, CourseLevel, CourseSemester, CourseType } from '../types';
import { 
    getCourses, addCourse, updateCourse, deleteCourse, 
    uploadFileToDrive, logActivity, seedCourses, getStaff 
} from '../services/dbService';

interface CourseCatalogProps {
    user: User;
}

export const CourseCatalog: React.FC<CourseCatalogProps> = ({ user }) => {
    const [activeTab, setActiveTab] = useState<'UNDERGRAD' | 'POSTGRAD' | 'MAP' | 'ADMIN'>('UNDERGRAD');
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [staffNames, setStaffNames] = useState<string[]>([]);
    
    // Filters
    const [selectedLevel, setSelectedLevel] = useState<CourseLevel>('Level 1');
    const [selectedSemester, setSelectedSemester] = useState<CourseSemester>('First');
    const [selectedDivision, setSelectedDivision] = useState<string>('General');
    const [searchTerm, setSearchTerm] = useState('');

    // Admin Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<Partial<Course>>({});
    const [submitting, setSubmitting] = useState(false);

    // الصلاحيات: المدير وأعضاء هيئة التدريس يمكنهم التعديل
    const canManage = user.role === UserRole.ADMIN || user.role === UserRole.STAFF;

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            await seedCourses(); // التأكد من وجود بيانات أولية
            const [data, staff] = await Promise.all([getCourses(), getStaff()]);
            setCourses(data);
            setStaffNames(staff.map(s => s.name));
            setLoading(false);
        };
        init();
    }, []);

    // --- Handlers ---

    const handleDelete = async (id: string, name: string) => {
        if (!window.confirm('هل أنت متأكد من حذف هذا المقرر؟')) return;
        try {
            await deleteCourse(id);
            await logActivity('حذف مقرر', user.name, `تم حذف مقرر: ${name}`);
            setCourses(prev => prev.filter(c => c.id !== id));
        } catch (e) { alert('فشل الحذف'); }
    };

    const handleOpenModal = (course?: Course) => {
        if (course) {
            setEditingId(course.id);
            setFormData(course);
        } else {
            setEditingId(null);
            setFormData({
                level: 'Level 1', semester: 'First', division: 'General', type: 'Compulsory',
                creditHours: 3, lectureHours: 2, labHours: 1
            });
        }
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (editingId) {
                await updateCourse(editingId, formData);
                await logActivity('تعديل مقرر', user.name, `تم تعديل مقرر: ${formData.nameAr}`);
                setCourses(prev => prev.map(c => c.id === editingId ? { ...c, ...formData } as Course : c));
                alert('تم التعديل بنجاح');
            } else {
                await addCourse(formData as any);
                await logActivity('إضافة مقرر', user.name, `تم إضافة مقرر جديد: ${formData.nameAr}`);
                const newData = await getCourses(); // Refresh to get ID
                setCourses(newData);
                alert('تمت الإضافة بنجاح');
            }
            setIsModalOpen(false);
        } catch (e) {
            alert('حدث خطأ أثناء الحفظ');
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpload = async (field: keyof Course, file: File) => {
        try {
            const url = await uploadFileToDrive(file);
            setFormData(prev => ({ ...prev, [field]: url }));
            alert('تم رفع الملف بنجاح');
        } catch (e) { alert('فشل الرفع: ' + (e as Error).message); }
    };

    // --- Render Tabs ---

    const renderUndergradTab = () => {
        const filtered = courses.filter(c => 
            ['Level 1', 'Level 2', 'Level 3', 'Level 4'].includes(c.level) &&
            (c.level === selectedLevel) &&
            (c.semester === selectedSemester) &&
            (selectedLevel === 'Level 3' || selectedLevel === 'Level 4' ? c.division === selectedDivision : true) &&
            (c.nameAr.includes(searchTerm) || c.code.includes(searchTerm))
        );

        return (
            <div className="space-y-6 animate-in fade-in">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-wrap gap-4 items-end sticky top-0 z-10">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">الفرقة الدراسية</label>
                        <select className="border p-2 rounded bg-gray-50 focus:outline-none focus:border-green-500" value={selectedLevel} onChange={e => setSelectedLevel(e.target.value as any)}>
                            <option value="Level 1">الفرقة الأولى</option>
                            <option value="Level 2">الفرقة الثانية</option>
                            <option value="Level 3">الفرقة الثالثة</option>
                            <option value="Level 4">الفرقة الرابعة</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">الفصل الدراسي</label>
                        <select className="border p-2 rounded bg-gray-50 focus:outline-none focus:border-green-500" value={selectedSemester} onChange={e => setSelectedSemester(e.target.value as any)}>
                            <option value="First">الأول</option>
                            <option value="Second">الثاني</option>
                        </select>
                    </div>
                    {(selectedLevel === 'Level 3' || selectedLevel === 'Level 4') && (
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">الشعبة</label>
                            <select className="border p-2 rounded bg-gray-50 focus:outline-none focus:border-green-500" value={selectedDivision} onChange={e => setSelectedDivision(e.target.value)}>
                                <option value="General">شعبة عامة</option>
                                <option value="Plant Pathology">شعبة أمراض النبات</option>
                                <option value="Genetics">شعبة الوراثة</option>
                                <option value="Physiology">شعبة الفسيولوجي</option>
                            </select>
                        </div>
                    )}
                    <div className="flex-1">
                        <label className="block text-xs font-bold text-gray-500 mb-1">بحث سريع</label>
                        <div className="relative">
                            <Search className="w-4 h-4 absolute right-3 top-3 text-gray-400"/>
                            <input type="text" className="w-full border p-2 pr-9 rounded focus:outline-none focus:border-green-500" placeholder="اسم المقرر أو الكود..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <table className="w-full text-sm text-right">
                        <thead className="bg-gray-50 text-gray-700 font-bold">
                            <tr>
                                <th className="p-4">الكود</th>
                                <th className="p-4">اسم المقرر</th>
                                <th className="p-4">الساعات (نظري+عملي)</th>
                                <th className="p-4">المتطلب السابق</th>
                                <th className="p-4">التوصيف (Specs)</th>
                                <th className="p-4">المحتوى العلمي</th>
                                {canManage && <th className="p-4">إجراءات</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {filtered.map(course => (
                                <tr key={course.id} className="hover:bg-gray-50">
                                    <td className="p-4 font-mono font-bold text-blue-600">{course.code}</td>
                                    <td className="p-4">
                                        <div className="font-bold">{course.nameAr}</div>
                                        <div className="text-xs text-gray-500" dir="ltr">{course.nameEn}</div>
                                    </td>
                                    <td className="p-4">
                                        <span className="bg-gray-100 px-2 py-1 rounded text-xs font-bold">
                                            {course.creditHours} ({course.lectureHours}+{course.labHours})
                                        </span>
                                    </td>
                                    <td className="p-4 text-gray-600">
                                        {course.prerequisiteName ? (
                                            <span className="flex items-center gap-1 text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded border border-amber-200 cursor-help" title="اضغط للانتقال (قريباً)">
                                                <ArrowRight className="w-3 h-3"/> {course.prerequisiteName}
                                            </span>
                                        ) : '-'}
                                    </td>
                                    <td className="p-4">
                                        {course.specsUrl ? (
                                            <a href={course.specsUrl} target="_blank" className="text-green-600 hover:underline flex items-center gap-1 text-xs font-bold">
                                                <FileText className="w-3 h-3"/> تحميل PDF
                                            </a>
                                        ) : <span className="text-gray-300 text-xs">غير متاح</span>}
                                    </td>
                                    <td className="p-4">
                                        {course.materialsUrl ? (
                                            <a href={course.materialsUrl} target="_blank" className="text-blue-600 hover:underline flex items-center gap-1 text-xs font-bold">
                                                <Download className="w-3 h-3"/> تحميل المواد
                                            </a>
                                        ) : <span className="text-gray-300 text-xs">غير متاح</span>}
                                    </td>
                                    {canManage && (
                                        <td className="p-4 flex gap-2">
                                            <button onClick={() => handleOpenModal(course)} className="text-blue-500 hover:bg-blue-50 p-1.5 rounded"><Edit className="w-4 h-4"/></button>
                                            <button onClick={() => handleDelete(course.id, course.nameAr)} className="text-red-500 hover:bg-red-50 p-1.5 rounded"><Trash2 className="w-4 h-4"/></button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                            {filtered.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-gray-400">لا توجد مقررات مطابقة</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const renderPostgradTab = () => {
        const filtered = courses.filter(c => 
            ['Diploma', 'MSc', 'PhD'].includes(c.level) &&
            (c.nameAr.includes(searchTerm) || c.code.includes(searchTerm))
        );

        return (
            <div className="space-y-6 animate-in fade-in">
                <div className="flex gap-4 mb-4">
                     <div className="relative flex-1">
                        <Search className="w-5 h-5 text-gray-400 absolute right-3 top-2.5"/>
                        <input type="text" className="w-full border p-2 pr-10 rounded-lg focus:outline-none focus:border-green-500" placeholder="بحث في مقررات الدراسات العليا..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filtered.map(course => (
                        <div key={course.id} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all relative group">
                            {canManage && (
                                <div className="absolute top-4 left-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleOpenModal(course)} className="p-1.5 bg-blue-50 text-blue-600 rounded"><Edit className="w-4 h-4"/></button>
                                    <button onClick={() => handleDelete(course.id, course.nameAr)} className="p-1.5 bg-red-50 text-red-600 rounded"><Trash2 className="w-4 h-4"/></button>
                                </div>
                            )}
                            <div className="flex justify-between items-start mb-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${course.level === 'MSc' ? 'bg-purple-100 text-purple-700' : course.level === 'PhD' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-700'}`}>
                                    {course.level === 'MSc' ? 'ماجستير' : course.level === 'PhD' ? 'دكتوراه' : 'دبلوم'}
                                </span>
                                <span className="font-mono text-gray-400 font-bold">{course.code}</span>
                            </div>
                            <h3 className="font-bold text-lg text-gray-800 mb-1">{course.nameAr}</h3>
                            <p className="text-sm text-gray-500 mb-4">{course.nameEn}</p>
                            
                            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded mb-4 line-clamp-3">
                                {course.description || 'لا يوجد وصف متاح.'}
                            </p>

                            <div className="text-xs text-gray-500 mb-4 space-y-1">
                                <p><strong>الوحدات:</strong> {course.creditHours} ساعات</p>
                                <p><strong>المسؤول:</strong> {course.coordinator || 'غير محدد'}</p>
                            </div>

                            <div className="flex gap-2 mt-auto pt-4 border-t">
                                {course.materialsUrl ? (
                                    <a href={course.materialsUrl} target="_blank" className="flex-1 text-center bg-green-600 text-white py-2 rounded-lg text-sm hover:bg-green-700 flex items-center justify-center gap-1">
                                        <Download className="w-4 h-4"/> المحتوى العلمي
                                    </a>
                                ) : (
                                    <button disabled className="flex-1 bg-gray-100 text-gray-400 py-2 rounded-lg text-sm cursor-not-allowed">لا يوجد محتوى</button>
                                )}
                                {course.specsUrl && (
                                    <a href={course.specsUrl} target="_blank" className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50" title="توصيف المقرر">
                                        <FileText className="w-4 h-4 text-gray-600"/>
                                    </a>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const renderCourseMap = () => (
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 text-center animate-in fade-in">
            <Network className="w-16 h-16 text-green-200 mx-auto mb-4"/>
            <h3 className="text-xl font-bold text-gray-800 mb-2">خريطة المقررات (Course Map)</h3>
            <p className="text-gray-500 mb-8">توضح هذه الخريطة تسلسل المواد والمتطلبات السابقة.</p>
            
            {/* Simple CSS Tree for Demo */}
            <div className="inline-flex flex-col items-center">
                <div className="p-3 bg-green-100 text-green-800 rounded-lg font-bold border-2 border-green-200">نبات عام (BOT101)</div>
                <div className="h-8 w-0.5 bg-gray-300"></div>
                <div className="flex gap-8">
                     <div className="flex flex-col items-center">
                        <div className="h-4 w-0.5 bg-gray-300"></div>
                        <div className="p-3 bg-white border border-gray-300 rounded-lg shadow-sm text-sm">مورفولوجي (BOT201)</div>
                        <div className="h-4 w-0.5 bg-gray-300"></div>
                        <div className="p-3 bg-white border border-gray-300 rounded-lg shadow-sm text-sm">تشريح نبات (BOT305)</div>
                     </div>
                     <div className="flex flex-col items-center">
                        <div className="h-4 w-0.5 bg-gray-300"></div>
                        <div className="p-3 bg-white border border-gray-300 rounded-lg shadow-sm text-sm">فسيولوجي (BOT202)</div>
                        <div className="h-4 w-0.5 bg-gray-300"></div>
                        <div className="p-3 bg-white border border-gray-300 rounded-lg shadow-sm text-sm">تغذية نبات (BOT308)</div>
                     </div>
                </div>
            </div>
            <p className="text-xs text-gray-400 mt-8">* نسخة تجريبية مبسطة</p>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <BookOpen className="w-8 h-8 text-green-600"/> دليل المقررات الدراسية
                </h1>
                {canManage && (
                    <button onClick={() => handleOpenModal()} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-colors">
                        <Plus className="w-5 h-5"/> إضافة مقرر جديد
                    </button>
                )}
            </div>

            <div className="flex border-b border-gray-200 bg-white rounded-t-xl overflow-x-auto">
                <button onClick={() => setActiveTab('UNDERGRAD')} className={`px-6 py-4 font-bold text-sm flex items-center gap-2 transition-colors ${activeTab === 'UNDERGRAD' ? 'text-green-700 border-b-2 border-green-700' : 'text-gray-500 hover:text-green-600'}`}>
                    <GraduationCap className="w-4 h-4"/> مرحلة البكالوريوس
                </button>
                <button onClick={() => setActiveTab('POSTGRAD')} className={`px-6 py-4 font-bold text-sm flex items-center gap-2 transition-colors ${activeTab === 'POSTGRAD' ? 'text-green-700 border-b-2 border-green-700' : 'text-gray-500 hover:text-green-600'}`}>
                    <Layout className="w-4 h-4"/> الدراسات العليا
                </button>
                <button onClick={() => setActiveTab('MAP')} className={`px-6 py-4 font-bold text-sm flex items-center gap-2 transition-colors ${activeTab === 'MAP' ? 'text-green-700 border-b-2 border-green-700' : 'text-gray-500 hover:text-green-600'}`}>
                    <Network className="w-4 h-4"/> خريطة المقررات
                </button>
            </div>

            <div className="bg-white p-6 rounded-b-xl shadow-sm border border-t-0 border-gray-200 min-h-[400px]">
                {loading ? <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400"/></div> : (
                    <>
                        {activeTab === 'UNDERGRAD' && renderUndergradTab()}
                        {activeTab === 'POSTGRAD' && renderPostgradTab()}
                        {activeTab === 'MAP' && renderCourseMap()}
                    </>
                )}
            </div>

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 p-6">
                        <div className="flex justify-between items-center mb-6 border-b pb-4">
                            <h3 className="text-xl font-bold text-gray-800">{editingId ? 'تعديل بيانات مقرر' : 'إضافة مقرر جديد'}</h3>
                            <button onClick={() => setIsModalOpen(false)}><X className="w-6 h-6 text-gray-400 hover:text-red-500"/></button>
                        </div>
                        
                        <form onSubmit={handleSave} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold mb-1">اسم المقرر (عربي)</label>
                                    <input type="text" required className="w-full border p-2 rounded" value={formData.nameAr || ''} onChange={e => setFormData({...formData, nameAr: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold mb-1">اسم المقرر (إنجليزي)</label>
                                    <input type="text" required className="w-full border p-2 rounded text-left" dir="ltr" value={formData.nameEn || ''} onChange={e => setFormData({...formData, nameEn: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold mb-1">كود المقرر</label>
                                    <input type="text" required className="w-full border p-2 rounded uppercase font-mono" value={formData.code || ''} onChange={e => setFormData({...formData, code: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold mb-1">المرحلة / الفرقة</label>
                                    <select className="w-full border p-2 rounded bg-white" value={formData.level} onChange={e => setFormData({...formData, level: e.target.value as any})}>
                                        <option value="Level 1">الفرقة الأولى</option>
                                        <option value="Level 2">الفرقة الثانية</option>
                                        <option value="Level 3">الفرقة الثالثة</option>
                                        <option value="Level 4">الفرقة الرابعة</option>
                                        <option value="Diploma">دبلوم</option>
                                        <option value="MSc">ماجستير</option>
                                        <option value="PhD">دكتوراه</option>
                                    </select>
                                </div>
                                
                                {['Level 1', 'Level 2', 'Level 3', 'Level 4'].includes(formData.level || '') && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-bold mb-1">الفصل الدراسي</label>
                                            <select className="w-full border p-2 rounded bg-white" value={formData.semester} onChange={e => setFormData({...formData, semester: e.target.value as any})}>
                                                <option value="First">الأول</option>
                                                <option value="Second">الثاني</option>
                                                <option value="Summer">صيفي</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold mb-1">الشعبة (للتخصص)</label>
                                            <select className="w-full border p-2 rounded bg-white" value={formData.division} onChange={e => setFormData({...formData, division: e.target.value})}>
                                                <option value="General">عامة / مشتركة</option>
                                                <option value="Plant Pathology">أمراض نبات</option>
                                                <option value="Genetics">وراثة</option>
                                                <option value="Physiology">فسيولوجي</option>
                                            </select>
                                        </div>
                                    </>
                                )}

                                <div className="grid grid-cols-3 gap-2 col-span-2 bg-gray-50 p-3 rounded border">
                                    <div>
                                        <label className="block text-xs font-bold mb-1">إجمالي الوحدات</label>
                                        <input type="number" className="w-full border p-1 rounded" value={formData.creditHours} onChange={e => setFormData({...formData, creditHours: parseInt(e.target.value)})} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold mb-1">ساعات نظري</label>
                                        <input type="number" className="w-full border p-1 rounded" value={formData.lectureHours} onChange={e => setFormData({...formData, lectureHours: parseInt(e.target.value)})} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold mb-1">ساعات عملي</label>
                                        <input type="number" className="w-full border p-1 rounded" value={formData.labHours} onChange={e => setFormData({...formData, labHours: parseInt(e.target.value)})} />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold mb-1">منسق المقرر</label>
                                    <select className="w-full border p-2 rounded bg-white" value={formData.coordinator || ''} onChange={e => setFormData({...formData, coordinator: e.target.value})}>
                                        <option value="">-- اختر --</option>
                                        {staffNames.map(name => <option key={name} value={name}>{name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold mb-1">المتطلب السابق (اسم الكود)</label>
                                    <input type="text" className="w-full border p-2 rounded" placeholder="مثال: BOT101" value={formData.prerequisiteName || ''} onChange={e => setFormData({...formData, prerequisiteName: e.target.value})} />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-bold mb-1">نبذة / وصف المقرر</label>
                                    <textarea className="w-full border p-2 rounded" rows={2} value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
                                </div>
                            </div>

                            {/* Files Upload */}
                            <div className="space-y-2 bg-blue-50 p-4 rounded border border-blue-100">
                                <h4 className="font-bold text-blue-800 text-sm mb-2">ملفات الجودة والمحتوى</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold mb-1">توصيف المقرر (Specs)</label>
                                        <div className="flex items-center gap-2">
                                            <input type="file" id="file-specs" className="hidden" onChange={e => e.target.files && handleUpload('specsUrl', e.target.files[0])}/>
                                            <label htmlFor="file-specs" className="cursor-pointer bg-white border px-2 py-1 rounded text-xs flex items-center gap-1 hover:bg-gray-50"><UploadCloud className="w-3 h-3"/> رفع PDF</label>
                                            {formData.specsUrl && <span className="text-green-600 text-xs">تم ✔</span>}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold mb-1">مصفوفة المعارف (ILOs)</label>
                                        <div className="flex items-center gap-2">
                                            <input type="file" id="file-ilos" className="hidden" onChange={e => e.target.files && handleUpload('ilosUrl', e.target.files[0])}/>
                                            <label htmlFor="file-ilos" className="cursor-pointer bg-white border px-2 py-1 rounded text-xs flex items-center gap-1 hover:bg-gray-50"><UploadCloud className="w-3 h-3"/> رفع PDF</label>
                                            {formData.ilosUrl && <span className="text-green-600 text-xs">تم ✔</span>}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold mb-1">المحتوى العلمي (Materials)</label>
                                        <div className="flex items-center gap-2">
                                            <input type="file" id="file-mat" className="hidden" onChange={e => e.target.files && handleUpload('materialsUrl', e.target.files[0])}/>
                                            <label htmlFor="file-mat" className="cursor-pointer bg-white border px-2 py-1 rounded text-xs flex items-center gap-1 hover:bg-gray-50"><UploadCloud className="w-3 h-3"/> رفع ملف</label>
                                            {formData.materialsUrl && <span className="text-green-600 text-xs">تم ✔</span>}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2 text-gray-600">إلغاء</button>
                                <button type="submit" disabled={submitting} className="bg-green-600 text-white px-8 py-2 rounded-lg font-bold hover:bg-green-700 flex items-center gap-2">
                                    {submitting && <Loader2 className="w-4 h-4 animate-spin"/>} حفظ البيانات
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};