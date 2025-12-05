import React, { useState, useEffect } from 'react';
import { 
    FileText, Search, Download, Eye, Plus, UploadCloud, 
    Trash2, Save, X, Loader2, FileType, Layers, 
    Printer, ExternalLink, FolderOpen, Plane // <--- تم إضافة Plane هنا
} from 'lucide-react';
import { User, UserRole, DeptForm, FormCategory } from '../types';
import { getDeptForms, addDeptForm, deleteDeptForm, uploadFileToDrive, logActivity } from '../services/dbService';
import { useNavigate } from 'react-router-dom';

interface FormsCenterProps {
    user: User;
}

export const FormsCenter: React.FC<FormsCenterProps> = ({ user }) => {
    const navigate = useNavigate();
    const [forms, setForms] = useState<DeptForm[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState<FormCategory | 'ALL'>('ALL');

    // Admin State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [newForm, setNewForm] = useState<Partial<DeptForm>>({
        category: 'ADMIN_FINANCE', isActive: true
    });
    const [sourceFile, setSourceFile] = useState<File | null>(null);
    const [previewFile, setPreviewFile] = useState<File | null>(null);

    // Preview Modal State
    const [previewDoc, setPreviewDoc] = useState<DeptForm | null>(null);

    const isAdmin = user.role === UserRole.ADMIN || user.role === UserRole.DATA_ENTRY;

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const data = await getDeptForms();
            setForms(data);
        } catch (error) {
            console.error("Error fetching forms:", error);
        }
        setLoading(false);
    };

    const handleUploadFiles = async () => {
        let sourceUrl = '';
        let previewUrl = '';

        if (sourceFile) sourceUrl = await uploadFileToDrive(sourceFile);
        if (previewFile) previewUrl = await uploadFileToDrive(previewFile);

        return { sourceUrl, previewUrl };
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const urls = await handleUploadFiles();
            
            await addDeptForm({
                title: newForm.title!,
                category: newForm.category as FormCategory,
                description: newForm.description || '',
                updatedAt: new Date().toISOString().split('T')[0],
                isActive: true,
                sourceFileUrl: urls.sourceUrl,
                previewFileUrl: urls.previewUrl,
                // Mocking fillable logic for demo
                isFillableOnline: newForm.title?.includes('إجازة'),
                fillableLink: newForm.title?.includes('إجازة') ? '/leaves' : undefined
            } as DeptForm);

            await logActivity('إضافة نموذج', user.name, `تم إضافة نموذج: ${newForm.title}`);
            setIsModalOpen(false);
            setNewForm({ category: 'ADMIN_FINANCE', isActive: true });
            setSourceFile(null);
            setPreviewFile(null);
            fetchData();
            alert('تم إضافة النموذج بنجاح');
        } catch (error) {
            alert('حدث خطأ أثناء الحفظ');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string, title: string) => {
        if (!window.confirm('حذف هذا النموذج؟')) return;
        await deleteDeptForm(id);
        await logActivity('حذف نموذج', user.name, `تم حذف: ${title}`);
        fetchData();
    };

    // --- Components ---

    const CategoryBadge = ({ category }: { category: string }) => {
        const map: Record<string, { label: string, color: string }> = {
            'ADMIN_FINANCE': { label: 'شؤون إدارية ومالية', color: 'bg-blue-100 text-blue-800' },
            'STUDENT_AFFAIRS': { label: 'شؤون طلاب', color: 'bg-green-100 text-green-800' },
            'POSTGRAD_RESEARCH': { label: 'دراسات عليا', color: 'bg-purple-100 text-purple-800' },
            'QUALITY': { label: 'ضمان الجودة', color: 'bg-amber-100 text-amber-800' },
        };
        const info = map[category] || { label: category, color: 'bg-gray-100' };
        return <span className={`text-xs px-2 py-1 rounded-full font-bold ${info.color}`}>{info.label}</span>;
    };

    const filteredForms = forms.filter(f => 
        (activeCategory === 'ALL' || f.category === activeCategory) &&
        ((f.title || '').includes(searchTerm) || (f.description || '').includes(searchTerm))
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Layers className="w-8 h-8 text-indigo-600"/> مركز النماذج والمكاتبات
                    </h1>
                    <p className="text-gray-500 text-sm">المستودع الرسمي للنماذج الإدارية والأكاديمية للقسم</p>
                </div>
                {isAdmin && (
                    <button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-md transition-colors">
                        <Plus className="w-5 h-5"/> إضافة نموذج جديد
                    </button>
                )}
            </div>

            {/* Quick Access & Search */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="mb-6">
                    <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2"><ExternalLink className="w-4 h-4"/> الوصول السريع</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <button onClick={() => navigate('/leaves')} className="p-3 bg-blue-50 hover:bg-blue-100 rounded-lg text-blue-700 text-sm font-bold flex items-center justify-center gap-2 transition-colors">
                            <Plane className="w-4 h-4"/> طلب إجازة
                        </button>
                        <button className="p-3 bg-green-50 hover:bg-green-100 rounded-lg text-green-700 text-sm font-bold flex items-center justify-center gap-2 transition-colors">
                            <FileText className="w-4 h-4"/> إفادة مرتب
                        </button>
                        <button className="p-3 bg-purple-50 hover:bg-purple-100 rounded-lg text-purple-700 text-sm font-bold flex items-center justify-center gap-2 transition-colors">
                            <FileText className="w-4 h-4"/> اعتذار مراقبة
                        </button>
                        <button className="p-3 bg-amber-50 hover:bg-amber-100 rounded-lg text-amber-700 text-sm font-bold flex items-center justify-center gap-2 transition-colors">
                            <FolderOpen className="w-4 h-4"/> حزمة الجودة
                        </button>
                    </div>
                </div>

                <div className="relative">
                    <Search className="w-5 h-5 text-gray-400 absolute right-3 top-3" />
                    <input 
                        type="text" 
                        placeholder="ابحث عن نموذج (مثال: انتداب، سلفة، غش...)" 
                        className="w-full border p-3 pr-10 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 focus:bg-white transition-all"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Categories Tabs */}
            <div className="flex overflow-x-auto pb-2 gap-2">
                {[
                    { id: 'ALL', label: 'الكل' },
                    { id: 'ADMIN_FINANCE', label: 'شؤون إدارية ومالية' },
                    { id: 'STUDENT_AFFAIRS', label: 'شؤون التعليم والطلاب' },
                    { id: 'POSTGRAD_RESEARCH', label: 'الدراسات العليا' },
                    { id: 'QUALITY', label: 'الجودة والاعتماد' },
                ].map(cat => (
                    <button 
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id as any)}
                        className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${activeCategory === cat.id ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-100 border'}`}
                    >
                        {cat.label}
                    </button>
                ))}
            </div>

            {/* Forms Grid */}
            {loading ? (
                <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400"/></div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredForms.map(form => (
                        <div key={form.id} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg transition-all group relative">
                            {isAdmin && (
                                <button onClick={() => handleDelete(form.id, form.title)} className="absolute top-4 left-4 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Trash2 className="w-4 h-4"/>
                                </button>
                            )}
                            
                            <div className="flex justify-between items-start mb-3">
                                <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                                    <FileType className="w-6 h-6"/>
                                </div>
                                <CategoryBadge category={form.category} />
                            </div>

                            <h3 className="font-bold text-gray-800 text-lg mb-1">{form.title}</h3>
                            <p className="text-xs text-gray-500 mb-3">تم التحديث: {form.updatedAt}</p>
                            <p className="text-sm text-gray-600 mb-4 line-clamp-2 h-10">{form.description}</p>

                            <div className="flex gap-2 border-t pt-4">
                                {form.sourceFileUrl ? (
                                    <a href={form.sourceFileUrl} target="_blank" rel="noreferrer" className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 flex items-center justify-center gap-2 transition-colors">
                                        <Download className="w-4 h-4"/> تحميل Word
                                    </a>
                                ) : (
                                    <button disabled className="flex-1 bg-gray-100 text-gray-400 py-2 rounded-lg text-sm cursor-not-allowed">غير متاح</button>
                                )}
                                
                                {form.isFillableOnline ? (
                                    <button onClick={() => navigate(form.fillableLink!)} className="px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 border border-green-200" title="تعبئة إلكترونية">
                                        <Printer className="w-5 h-5"/>
                                    </button>
                                ) : form.previewFileUrl ? (
                                    <button onClick={() => setPreviewDoc(form)} className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200" title="معاينة">
                                        <Eye className="w-5 h-5"/>
                                    </button>
                                ) : null}
                            </div>
                        </div>
                    ))}
                    {filteredForms.length === 0 && <div className="col-span-full text-center py-12 text-gray-400">لا توجد نماذج مطابقة للبحث</div>}
                </div>
            )}

            {/* Add Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl animate-in fade-in">
                        <div className="flex justify-between items-center mb-6 border-b pb-4">
                            <h3 className="text-xl font-bold text-gray-800">إضافة نموذج جديد</h3>
                            <button onClick={() => setIsModalOpen(false)}><X className="w-6 h-6 text-gray-400 hover:text-red-500"/></button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold mb-1">اسم النموذج</label>
                                <input type="text" required className="w-full border p-2 rounded" value={newForm.title || ''} onChange={e => setNewForm({...newForm, title: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1">التصنيف</label>
                                <select className="w-full border p-2 rounded bg-white" value={newForm.category} onChange={e => setNewForm({...newForm, category: e.target.value as any})}>
                                    <option value="ADMIN_FINANCE">شؤون إدارية ومالية</option>
                                    <option value="STUDENT_AFFAIRS">شؤون التعليم والطلاب</option>
                                    <option value="POSTGRAD_RESEARCH">الدراسات العليا والبحوث</option>
                                    <option value="QUALITY">الجودة والاعتماد</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1">وصف مختصر</label>
                                <textarea className="w-full border p-2 rounded" rows={2} value={newForm.description || ''} onChange={e => setNewForm({...newForm, description: e.target.value})} />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="border-2 border-dashed p-4 rounded-lg text-center">
                                    <label className="block text-xs font-bold text-blue-600 mb-2">ملف Word (للتعديل)</label>
                                    <input type="file" className="text-xs" accept=".doc,.docx" onChange={e => setSourceFile(e.target.files?.[0] || null)} />
                                </div>
                                <div className="border-2 border-dashed p-4 rounded-lg text-center">
                                    <label className="block text-xs font-bold text-red-600 mb-2">ملف PDF (للمعاينة)</label>
                                    <input type="file" className="text-xs" accept=".pdf" onChange={e => setPreviewFile(e.target.files?.[0] || null)} />
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600">إلغاء</button>
                                <button type="submit" disabled={submitting} className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-indigo-700 flex items-center gap-2">
                                    {submitting && <Loader2 className="w-4 h-4 animate-spin"/>} حفظ
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Preview Modal */}
            {previewDoc && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl">
                        <div className="p-4 border-b flex justify-between items-center">
                            <h3 className="font-bold text-lg">{previewDoc.title}</h3>
                            <button onClick={() => setPreviewDoc(null)}><X className="w-6 h-6 text-gray-500"/></button>
                        </div>
                        <div className="flex-1 bg-gray-100 p-4 overflow-hidden">
                            {previewDoc.previewFileUrl ? (
                                <iframe src={previewDoc.previewFileUrl} className="w-full h-full rounded border" title="Preview"></iframe>
                            ) : (
                                <div className="flex items-center justify-center h-full text-gray-400">لا توجد معاينة متاحة</div>
                            )}
                        </div>
                        <div className="p-4 border-t flex justify-end">
                            <a href={previewDoc.sourceFileUrl} target="_blank" rel="noreferrer" className="bg-indigo-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700">
                                <Download className="w-4 h-4"/> تحميل النسخة القابلة للتعديل
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};