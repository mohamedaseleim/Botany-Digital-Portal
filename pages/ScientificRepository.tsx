import React, { useState, useEffect } from 'react';
import { 
    Library, Search, Filter, Plus, FileText, Book, GraduationCap, 
    Download, Lock, Copy, ExternalLink, 
    Eye, X, Loader2, CheckCircle2, AlertCircle, Edit, Trash2, Save, UploadCloud
} from 'lucide-react';
import { User, UserRole, RepositoryItem, RepositoryItemType, RepositoryRequest } from '../types';
import { 
    getRepositoryItems, addRepositoryItem, requestFullText, 
    getRepoStats, uploadFileToDrive, logActivity, getMyRepoRequests, respondToRepoRequest 
} from '../services/dbService';
import { db } from '../firebaseConfig';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';

interface ScientificRepositoryProps {
    user: User;
}

export const ScientificRepository: React.FC<ScientificRepositoryProps> = ({ user }) => {
    const [activeTab, setActiveTab] = useState<'BROWSE' | 'ADD'>('BROWSE');
    const [items, setItems] = useState<RepositoryItem[]>([]);
    const [stats, setStats] = useState({ totalItems: 0, theses: 0, papers: 0, books: 0 });
    const [loading, setLoading] = useState(true);
    
    // Search & Filter
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState<string>('ALL');

    // Add/Edit Form State
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [addType, setAddType] = useState<RepositoryItemType>('JOURNAL_PAPER');
    
    // تهيئة البيانات بقيم افتراضية لتجنب الأخطاء
    const initialFormState = {
        titleAr: '',
        titleEn: '',
        abstract: '',
        authorNames: '',
        journalName: '',
        conferenceName: '',
        doi: '',
        publicationYear: new Date().getFullYear().toString(),
        supervisors: '',
        shelfLocation: '',
    };
    const [formData, setFormData] = useState<any>(initialFormState);
    
    const [file, setFile] = useState<File | null>(null);
    const [privateFile, setPrivateFile] = useState<File | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // Request Modal
    const [requestModalItem, setRequestModalItem] = useState<RepositoryItem | null>(null);
    const [requestReason, setRequestReason] = useState('RESEARCH');
    const [requestMessage, setRequestMessage] = useState('');

    // Incoming Requests (For Authors)
    const [incomingRequests, setIncomingRequests] = useState<RepositoryRequest[]>([]);

    const canManage = user.role === UserRole.ADMIN || user.role === UserRole.STAFF || user.role === UserRole.DATA_ENTRY;

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [data, statistics] = await Promise.all([getRepositoryItems(), getRepoStats()]);
            setItems(data);
            setStats(statistics);
            
            if (user.role === UserRole.STAFF || user.role === UserRole.ADMIN) {
                const reqs = await getMyRepoRequests(user.id);
                setIncomingRequests(reqs);
            }
        } catch (error) {
            console.error("Error fetching repository data:", error);
        }
        setLoading(false);
    };

    // --- Helper Functions ---
    
    const handleCopyCitation = (item: RepositoryItem) => {
        let citation = '';
        if (item.type.includes('PAPER')) {
            citation = `${item.authorNames || ''} (${item.publicationYear}). "${item.titleAr}". ${item.journalName || item.conferenceName || ''}, ${item.volume || ''}(${item.issue || ''}), ${item.pages || ''}. ${item.doi ? `DOI: ${item.doi}` : ''}`;
        } else if (item.type.includes('THESIS')) {
            citation = `${item.authorNames || ''} (${item.publicationYear}). ${item.titleAr}. [${item.type === 'THESIS_MASTER' ? 'Master Thesis' : 'PhD Thesis'}]. Al-Azhar University.`;
        } else {
            citation = `${item.authorNames || item.publisher || ''} (${item.publicationYear}). ${item.titleAr}. ${item.publisher || ''}.`;
        }
        navigator.clipboard.writeText(citation);
        alert('تم نسخ الاستشهاد المرجعي');
    };

    const handleFileUpload = async (file: File) => {
        try {
            return await uploadFileToDrive(file);
        } catch (e) {
            alert('فشل رفع الملف: ' + (e as Error).message);
            return null;
        }
    };

    const handleEditItem = (item: RepositoryItem) => {
        setIsEditing(true);
        setEditingId(item.id);
        setAddType(item.type);
        setFormData({
            titleAr: item.titleAr || '',
            titleEn: item.titleEn || '',
            abstract: item.abstract || '',
            authorNames: item.authorNames || '',
            journalName: item.journalName || '',
            conferenceName: item.conferenceName || '',
            doi: item.doi || '',
            publicationYear: item.publicationYear || '',
            supervisors: item.supervisors || '',
            shelfLocation: item.shelfLocation || '',
        });
        setActiveTab('ADD');
    };

    const handleDeleteItem = async (id: string, title: string) => {
        if (!window.confirm('هل أنت متأكد من حذف هذا العنصر من المستودع؟')) return;
        try {
            await deleteDoc(doc(db, 'repository_items', id));
            await logActivity('حذف من المستودع', user.name, `تم حذف عنصر: ${title}`);
            fetchData();
        } catch (error) {
            alert('فشل الحذف');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            let publicUrl = undefined;
            let privateUrl = undefined;

            if (file) publicUrl = await handleFileUpload(file);
            if (privateFile) privateUrl = await handleFileUpload(privateFile);

            const itemData = {
                ...formData,
                type: addType,
                // Only update URLs if new files are uploaded
                ...(publicUrl && { fileUrl: publicUrl }),
                ...(privateUrl && { privateFileUrl: privateUrl }),
                addedBy: user.id,
                // If new item, add current user as author if staff
                authorIds: isEditing ? undefined : [user.id], 
                publicationYear: formData.publicationYear || new Date().getFullYear().toString()
            };

            if (isEditing && editingId) {
                await updateDoc(doc(db, 'repository_items', editingId), itemData);
                await logActivity('تعديل في المستودع', user.name, `تم تعديل ${addType}: ${formData.titleAr}`);
                alert('تم التعديل بنجاح');
            } else {
                await addRepositoryItem(itemData);
                await logActivity('إضافة للمستودع', user.name, `تم إضافة ${addType}: ${formData.titleAr}`);
                alert('تمت الإضافة بنجاح');
            }

            // Reset Form
            setIsEditing(false);
            setEditingId(null);
            setFormData(initialFormState);
            setFile(null);
            setPrivateFile(null);
            setActiveTab('BROWSE');
            fetchData();
        } catch (error) {
            console.error(error);
            alert('حدث خطأ أثناء الحفظ');
        } finally {
            setSubmitting(false);
        }
    };

    const handleRequestSubmit = async () => {
        if (!requestModalItem) return;
        try {
            await requestFullText({
                itemId: requestModalItem.id,
                itemTitle: requestModalItem.titleAr,
                itemAuthorId: requestModalItem.addedBy, 
                requesterName: user.name,
                requesterEmail: 'user@example.com', // Placeholder
                reason: requestReason as any,
                message: requestMessage
            });
            await logActivity('طلب نسخة كاملة', user.name, `تم طلب نسخة من: ${requestModalItem.titleAr}`);
            alert('تم إرسال الطلب للمؤلف');
            setRequestModalItem(null);
        } catch (error) {
            alert('فشل إرسال الطلب');
        }
    };

    const handleIncomingAction = async (reqId: string, itemTitle: string, action: 'APPROVED' | 'REJECTED') => {
        await respondToRepoRequest(reqId, action);
        await logActivity('رد على طلب مستودع', user.name, `تم ${action === 'APPROVED' ? 'الموافقة على' : 'رفض'} طلب نسخة لـ: ${itemTitle}`);
        alert(`تم ${action === 'APPROVED' ? 'الموافقة وإرسال الملف' : 'رفض الطلب'}`);
        fetchData(); 
    };

    const handleAddNewClick = () => {
        setActiveTab('ADD'); 
        setFormData(initialFormState); 
        setEditingId(null); 
        setIsEditing(false);
    };

    // --- Components ---

    const renderCard = (item: RepositoryItem) => {
        const isPaper = item.type.includes('PAPER');
        const isThesis = item.type.includes('THESIS');
        const isOwner = item.addedBy === user.id || user.role === UserRole.ADMIN;

        return (
            <div key={item.id} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow flex flex-col gap-3 animate-in fade-in">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                            isPaper ? 'bg-blue-100 text-blue-700' : 
                            isThesis ? 'bg-purple-100 text-purple-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                            {isPaper ? (item.type === 'JOURNAL_PAPER' ? 'بحث مجلة' : 'مؤتمر') : 
                             isThesis ? (item.type === 'THESIS_MASTER' ? 'ماجستير' : 'دكتوراة') : 'كتاب'}
                        </span>
                        <span className="text-gray-500 text-xs">{item.publicationYear}</span>
                    </div>
                    <div className="flex gap-2">
                        {item.doi && (
                            <a href={item.doi} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-blue-600" title="DOI">
                                <ExternalLink className="w-4 h-4" />
                            </a>
                        )}
                        {isOwner && (
                            <div className="flex gap-1">
                                <button onClick={() => handleEditItem(item)} className="text-blue-400 hover:text-blue-600 p-1" title="تعديل"><Edit className="w-4 h-4"/></button>
                                <button onClick={() => handleDeleteItem(item.id, item.titleAr)} className="text-red-400 hover:text-red-600 p-1" title="حذف"><Trash2 className="w-4 h-4"/></button>
                            </div>
                        )}
                    </div>
                </div>
                
                <div>
                    <h3 className="font-bold text-lg text-gray-800 leading-snug mb-1">{item.titleAr}</h3>
                    {item.titleEn && <h4 className="text-sm text-gray-500 font-medium ltr text-right" dir="ltr">{item.titleEn}</h4>}
                </div>

                <div className="text-sm text-gray-600 space-y-1">
                    {isPaper && <p><strong>المؤلفون:</strong> {item.authorNames}</p>}
                    {isPaper && <p><strong>النشر:</strong> {item.journalName || item.conferenceName}, {item.volume}({item.issue})</p>}
                    {isThesis && <p><strong>الباحث:</strong> {item.authorNames}</p>}
                    {isThesis && <p><strong>المشرفون:</strong> {item.supervisors}</p>}
                </div>

                {item.abstract && (
                    <p className="text-xs text-gray-500 line-clamp-3 bg-gray-50 p-2 rounded">
                        {item.abstract}
                    </p>
                )}

                <div className="mt-auto pt-4 border-t flex items-center justify-between gap-2">
                    <div className="flex gap-2">
                        {item.fileUrl ? (
                            <a href={item.fileUrl} target="_blank" rel="noreferrer" className="bg-green-600 text-white px-3 py-1.5 rounded text-sm flex items-center gap-1 hover:bg-green-700">
                                <Download className="w-4 h-4" /> تحميل PDF
                            </a>
                        ) : (
                            <button onClick={() => setRequestModalItem(item)} className="bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1.5 rounded text-sm flex items-center gap-1 hover:bg-amber-100">
                                <Lock className="w-4 h-4" /> طلب نسخة كاملة
                            </button>
                        )}
                    </div>
                    <button onClick={() => handleCopyCitation(item)} className="text-gray-400 hover:text-gray-600" title="نسخ الاستشهاد">
                        <Copy className="w-5 h-5" />
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col lg:flex-row gap-6 min-h-screen">
            
            {/* Sidebar Stats & Filters (Desktop) */}
            <aside className="w-full lg:w-64 shrink-0 space-y-6">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Library className="w-5 h-5 text-green-600" /> إحصائيات
                    </h3>
                    <div className="space-y-3">
                        <div className="flex justify-between text-sm"><span>إجمالي الوعاء</span><span className="font-bold">{stats.totalItems}</span></div>
                        <div className="flex justify-between text-sm"><span>رسائل علمية</span><span className="font-bold text-purple-600">{stats.theses}</span></div>
                        <div className="flex justify-between text-sm"><span>أبحاث منشورة</span><span className="font-bold text-blue-600">{stats.papers}</span></div>
                        <div className="flex justify-between text-sm"><span>كتب ومؤلفات</span><span className="font-bold text-amber-600">{stats.books}</span></div>
                    </div>
                </div>

                {/* Incoming Requests Alert */}
                {incomingRequests.length > 0 && (
                    <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 animate-pulse">
                        <h4 className="font-bold text-amber-800 text-sm mb-2 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4"/> طلبات معلقة ({incomingRequests.length})
                        </h4>
                        <div className="space-y-2">
                            {incomingRequests.map(req => (
                                <div key={req.id} className="bg-white p-2 rounded border text-xs">
                                    <p className="font-bold mb-1">{req.requesterName}</p>
                                    <p className="text-gray-500 mb-2 truncate">يطلب: {req.itemTitle}</p>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleIncomingAction(req.id, req.itemTitle, 'APPROVED')} className="flex-1 bg-green-600 text-white py-1 rounded">إرسال</button>
                                        <button onClick={() => handleIncomingAction(req.id, req.itemTitle, 'REJECTED')} className="flex-1 bg-gray-200 text-gray-700 py-1 rounded">رفض</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </aside>

            {/* Main Content */}
            <main className="flex-1">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">المستودع الرقمي</h1>
                    {canManage && (
                        <div className="flex bg-gray-100 p-1 rounded-lg">
                            <button 
                                onClick={() => { setActiveTab('BROWSE'); setIsEditing(false); }} 
                                className={`px-4 py-2 rounded-md text-sm font-bold transition-colors ${activeTab === 'BROWSE' ? 'bg-white shadow text-green-700' : 'text-gray-500'}`}
                            >
                                تصفح المكتبة
                            </button>
                            <button 
                                onClick={handleAddNewClick} 
                                className={`px-4 py-2 rounded-md text-sm font-bold transition-colors ${activeTab === 'ADD' ? 'bg-white shadow text-green-700' : 'text-gray-500'}`}
                            >
                                إضافة جديد
                            </button>
                        </div>
                    )}
                </div>

                {activeTab === 'BROWSE' && (
                    <div className="space-y-6">
                        {/* Search Bar */}
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4">
                            <div className="flex-1 relative">
                                <Search className="w-5 h-5 text-gray-400 absolute right-3 top-2.5" />
                                <input 
                                    type="text" 
                                    placeholder="بحث بالعنوان، المؤلف، أو الكلمات الدالة..." 
                                    className="w-full border p-2 pr-10 rounded-lg outline-none focus:ring-2 focus:ring-green-500"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <select 
                                className="border p-2 rounded-lg outline-none bg-gray-50 min-w-[150px]"
                                value={typeFilter}
                                onChange={e => setTypeFilter(e.target.value)}
                            >
                                <option value="ALL">كل الأنواع</option>
                                <option value="PAPER">أبحاث علمية</option>
                                <option value="THESIS">رسائل علمية</option>
                                <option value="BOOK">كتب</option>
                            </select>
                        </div>

                        {/* Results Grid */}
                        {loading ? (
                            <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400"/></div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {items
                                    .filter(i => typeFilter === 'ALL' || i.type.includes(typeFilter))
                                    .filter(i => i.titleAr.includes(searchTerm) || (i.titleEn && i.titleEn.toLowerCase().includes(searchTerm.toLowerCase())) || i.authorNames?.includes(searchTerm))
                                    .map(renderCard)
                                }
                                {items.length === 0 && <p className="text-center text-gray-400 col-span-2 py-12">لا توجد نتائج</p>}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'ADD' && (
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 animate-in fade-in">
                        <div className="flex justify-between items-center mb-6 border-b pb-4">
                            <h3 className="font-bold text-lg text-gray-800">
                                {isEditing ? 'تعديل العنصر' : 'إضافة إنتاج علمي جديد'}
                            </h3>
                            {isEditing && <button onClick={() => { setIsEditing(false); setActiveTab('BROWSE'); }} className="text-sm text-gray-500 hover:text-red-500">إلغاء</button>}
                        </div>
                        
                        <div className="flex gap-4 mb-6 overflow-x-auto pb-2">
                            <button onClick={() => setAddType('JOURNAL_PAPER')} className={`flex-1 min-w-[100px] py-3 border rounded-lg text-sm font-bold ${addType === 'JOURNAL_PAPER' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'hover:bg-gray-50'}`}>بحث مجلة</button>
                            <button onClick={() => setAddType('CONF_PAPER')} className={`flex-1 min-w-[100px] py-3 border rounded-lg text-sm font-bold ${addType === 'CONF_PAPER' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'hover:bg-gray-50'}`}>بحث مؤتمر</button>
                            <button onClick={() => setAddType('THESIS_MASTER')} className={`flex-1 min-w-[100px] py-3 border rounded-lg text-sm font-bold ${addType.includes('THESIS') ? 'bg-purple-50 border-purple-500 text-purple-700' : 'hover:bg-gray-50'}`}>رسالة علمية</button>
                            <button onClick={() => setAddType('BOOK')} className={`flex-1 min-w-[100px] py-3 border rounded-lg text-sm font-bold ${addType === 'BOOK' ? 'bg-amber-50 border-amber-500 text-amber-700' : 'hover:bg-gray-50'}`}>كتاب</button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-sm font-bold text-gray-700 mb-1">العنوان (عربي) *</label>
                                    <input type="text" required className="w-full border p-2 rounded-lg" value={formData.titleAr || ''} onChange={e => setFormData({...formData, titleAr: e.target.value})} />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">العنوان (إنجليزي)</label>
                                    <input type="text" className="w-full border p-2 rounded-lg text-left" dir="ltr" value={formData.titleEn || ''} onChange={e => setFormData({...formData, titleEn: e.target.value})} />
                                </div>
                                
                                {addType.includes('PAPER') && (
                                    <>
                                        <div className="col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">المؤلفون (Authors)</label>
                                            <input type="text" placeholder="Ahmed M., Sara H., ..." className="w-full border p-2 rounded-lg" value={formData.authorNames || ''} onChange={e => setFormData({...formData, authorNames: e.target.value})} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">{addType === 'JOURNAL_PAPER' ? 'اسم المجلة' : 'اسم المؤتمر'}</label>
                                            {/* تم فصل الحقول لتجنب التداخل */}
                                            {addType === 'JOURNAL_PAPER' ? (
                                                <input type="text" className="w-full border p-2 rounded-lg" value={formData.journalName || ''} onChange={e => setFormData({...formData, journalName: e.target.value})} />
                                            ) : (
                                                <input type="text" className="w-full border p-2 rounded-lg" value={formData.conferenceName || ''} onChange={e => setFormData({...formData, conferenceName: e.target.value})} />
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">رابط DOI</label>
                                            <input type="text" className="w-full border p-2 rounded-lg" value={formData.doi || ''} onChange={e => setFormData({...formData, doi: e.target.value})} />
                                        </div>
                                    </>
                                )}

                                {addType.includes('THESIS') && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">اسم الباحث</label>
                                            <input type="text" className="w-full border p-2 rounded-lg" value={formData.authorNames || ''} onChange={e => setFormData({...formData, authorNames: e.target.value})} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">لجنة الإشراف</label>
                                            <input type="text" className="w-full border p-2 rounded-lg" value={formData.supervisors || ''} onChange={e => setFormData({...formData, supervisors: e.target.value})} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">سنة المنح</label>
                                            <input type="number" className="w-full border p-2 rounded-lg" value={formData.publicationYear || ''} onChange={e => setFormData({...formData, publicationYear: e.target.value})} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">مكان النسخة الورقية</label>
                                            <input type="text" placeholder="رف رقم..." className="w-full border p-2 rounded-lg" value={formData.shelfLocation || ''} onChange={e => setFormData({...formData, shelfLocation: e.target.value})} />
                                        </div>
                                    </>
                                )}

                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">الملخص (Abstract)</label>
                                    <textarea rows={4} className="w-full border p-2 rounded-lg" value={formData.abstract || ''} onChange={e => setFormData({...formData, abstract: e.target.value})}></textarea>
                                </div>

                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 col-span-2">
                                    <h4 className="font-bold text-sm mb-2">المرفقات</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 mb-1">ملف للعرض العام (Public PDF)</label>
                                            <div className="flex items-center gap-2">
                                                <UploadCloud className="w-4 h-4 text-gray-400"/>
                                                <input type="file" className="text-sm" onChange={e => setFile(e.target.files ? e.target.files[0] : null)} />
                                            </div>
                                            <p className="text-[10px] text-gray-400 mt-1">يظهر لجميع الزوار (مثلاً: الملخص فقط)</p>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 mb-1">النسخة الكاملة (للحفظ فقط)</label>
                                            <div className="flex items-center gap-2">
                                                <Lock className="w-4 h-4 text-amber-400"/>
                                                <input type="file" className="text-sm" onChange={e => setPrivateFile(e.target.files ? e.target.files[0] : null)} />
                                            </div>
                                            <p className="text-[10px] text-gray-400 mt-1">لا تظهر إلا بطلب خاص وموافقة المؤلف</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t mt-4">
                                <button type="button" onClick={() => setActiveTab('BROWSE')} className="px-6 py-2 text-gray-600 hover:bg-gray-50 rounded-lg">إلغاء</button>
                                <button type="submit" disabled={submitting} className="bg-green-600 text-white px-8 py-2 rounded-lg font-bold hover:bg-green-700 flex items-center gap-2">
                                    {submitting ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>} {isEditing ? 'حفظ التعديلات' : 'حفظ للأرشيف'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </main>

            {/* Request Popup */}
            {requestModalItem && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95">
                        <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                            <Lock className="w-5 h-5 text-amber-600"/> طلب نسخة كاملة
                        </h3>
                        <p className="text-sm text-gray-600 mb-4">هذا الملف غير متاح للعامة. يمكنك طلب نسخة خاصة من المؤلف.</p>
                        
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-bold mb-1">سبب الطلب</label>
                                <select className="w-full border p-2 rounded" value={requestReason} onChange={e => setRequestReason(e.target.value)}>
                                    <option value="RESEARCH">للاطلاع البحثي</option>
                                    <option value="CITATION">للاستشهاد به في دراسة</option>
                                    <option value="OTHER">سبب آخر</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1">رسالة للمؤلف (اختياري)</label>
                                <textarea className="w-full border p-2 rounded" rows={3} value={requestMessage} onChange={e => setRequestMessage(e.target.value)} placeholder="مرحباً دكتور..."></textarea>
                            </div>
                            <div className="flex justify-end gap-2 mt-4">
                                <button onClick={() => setRequestModalItem(null)} className="px-4 py-2 text-gray-500">إلغاء</button>
                                <button onClick={handleRequestSubmit} className="bg-amber-600 text-white px-4 py-2 rounded font-bold hover:bg-amber-700">إرسال الطلب</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};