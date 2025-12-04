import React, { useState, useEffect } from 'react';
import { 
    Briefcase, Plane, ArrowRightLeft, Clock, FileText, UploadCloud, 
    CheckCircle2, AlertTriangle, Loader2, Building2, Globe,
    Plus, Edit, Trash2, X, Save
} from 'lucide-react';
import { User, UserRole, CareerMovementRequest, LoanRequest, SecondmentRequest, TransferRequest } from '../types';
import { 
    addCareerRequest, getMyCareerRequests, getAllCareerRequests, 
    updateCareerRequestStatus, calculateLoanDuration, uploadFileToDrive, logActivity 
} from '../services/dbService';
import { db } from '../firebaseConfig';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';

interface TransferManagementProps {
    user: User;
}

export const TransferManagement: React.FC<TransferManagementProps> = ({ user }) => {
    const [activeTab, setActiveTab] = useState<'LOAN' | 'SECONDMENT' | 'TRANSFER'>('LOAN');
    const [requests, setRequests] = useState<CareerMovementRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [loanYearsUsed, setLoanYearsUsed] = useState(0);

    // Admin View
    const isAdmin = user.role === UserRole.ADMIN;
    const [viewMode, setViewMode] = useState<'MY_REQUESTS' | 'ALL_REQUESTS'>('MY_REQUESTS');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Unified Form State
    const [loanForm, setLoanForm] = useState<Partial<LoanRequest>>({
        loanType: 'EXTERNAL', country: '', institution: '', college: '', 
        requestType: 'NEW', salaryCurrency: 'USD', startDate: '', endDate: ''
    });
    const [secForm, setSecForm] = useState<Partial<SecondmentRequest>>({
        secondmentType: 'PART_TIME', targetInstitution: '', targetCollege: '',
        secondmentDays: [], startDate: '', endDate: ''
    });
    const [transForm, setTransForm] = useState<Partial<TransferRequest>>({
        targetUniversity: '', targetCollege: '', targetDepartment: '', transferType: 'VACANT_DEGREE'
    });
    
    const [files, setFiles] = useState<File[]>([]);

    useEffect(() => {
        fetchData();
    }, [viewMode]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (isAdmin && viewMode === 'ALL_REQUESTS') {
                setRequests(await getAllCareerRequests());
            } else {
                setRequests(await getMyCareerRequests(user.id));
                // حساب سنوات الإعارة فقط للعرض الشخصي
                if (!isAdmin || viewMode === 'MY_REQUESTS') {
                    setLoanYearsUsed(await calculateLoanDuration(user.id));
                }
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        }
        setLoading(false);
    };

    // --- Handlers ---

    const handleOpenModal = (req?: CareerMovementRequest) => {
        setFiles([]);
        if (req) {
            // Edit Mode
            setEditingId(req.id);
            if (req.type === 'LOAN') {
                setLoanForm({ ...req } as LoanRequest);
                setActiveTab('LOAN');
            } else if (req.type === 'SECONDMENT') {
                setSecForm({ ...req } as SecondmentRequest);
                setActiveTab('SECONDMENT');
            } else {
                setTransForm({ ...req } as TransferRequest);
                setActiveTab('TRANSFER');
            }
        } else {
            // Add Mode
            setEditingId(null);
            // Reset forms based on current tab (optional, keeping previous state might be desired or reset all)
            setLoanForm({ loanType: 'EXTERNAL', country: '', institution: '', college: '', requestType: 'NEW', salaryCurrency: 'USD', startDate: '', endDate: '' });
            setSecForm({ secondmentType: 'PART_TIME', targetInstitution: '', targetCollege: '', secondmentDays: [], startDate: '', endDate: '' });
            setTransForm({ targetUniversity: '', targetCollege: '', targetDepartment: '', transferType: 'VACANT_DEGREE' });
        }
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string, type: string) => {
        if (!window.confirm('هل أنت متأكد من حذف هذا الطلب؟')) return;
        try {
            await deleteDoc(doc(db, 'career_requests', id));
            await logActivity('حذف طلب نقل/إعارة', user.name, `تم حذف طلب ${type}`);
            fetchData();
        } catch (error) {
            alert('فشل الحذف');
        }
    };

    const handleStatusChange = async (id: string, newStatus: string, typeName: string) => {
        try {
            await updateCareerRequestStatus(id, newStatus);
            await logActivity('تحديث حالة طلب', user.name, `تم تغيير حالة طلب ${typeName} إلى ${newStatus}`);
            fetchData();
        } catch (error) {
            alert('فشل تحديث الحالة');
        }
    };

    const handleFileUpload = async (file: File) => {
        try {
            return await uploadFileToDrive(file);
        } catch (e) {
            alert("فشل رفع الملف: " + (e as Error).message);
            return null;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            // 1. Handle Loan
            if (activeTab === 'LOAN') {
                if (loanYearsUsed >= 10 && !editingId) {
                    alert("عذراً، لقد استنفذت الحد الأقصى للإعارات (10 سنوات).");
                    setSubmitting(false);
                    return;
                }
                
                let docUrl = undefined;
                if (files.length > 0) {
                    const url = await handleFileUpload(files[0]);
                    if (url) docUrl = url;
                }

                const data = {
                    userId: user.id,
                    userName: user.name,
                    type: 'LOAN',
                    ...loanForm,
                    ...(docUrl && { nominationLetterUrl: docUrl }),
                    status: editingId ? undefined : 'PENDING_DEPT' // Keep status on edit unless logic changes
                };

                if (editingId) {
                    // Remove undefined fields to avoid overwriting with undefined
                    const updateData = { ...data }; 
                    delete (updateData as any).status; // Don't reset status on edit usually
                    if (!docUrl) delete (updateData as any).nominationLetterUrl;

                    await updateDoc(doc(db, 'career_requests', editingId), updateData);
                    await logActivity('تعديل طلب إعارة', user.name, `تعديل طلب إعارة لـ ${loanForm.country}`);
                } else {
                    await addCareerRequest(data as any);
                    await logActivity('طلب إعارة', user.name, `طلب إعارة جديدة لـ ${loanForm.country}`);
                }
            }
            
            // 2. Handle Secondment
            else if (activeTab === 'SECONDMENT') {
                const data = {
                    userId: user.id,
                    userName: user.name,
                    type: 'SECONDMENT',
                    ...secForm,
                    status: editingId ? undefined : 'PENDING_DEPT'
                };

                if (editingId) {
                    const updateData = { ...data };
                    delete (updateData as any).status;
                    await updateDoc(doc(db, 'career_requests', editingId), updateData);
                    await logActivity('تعديل طلب ندب', user.name, `تعديل طلب ندب لـ ${secForm.targetInstitution}`);
                } else {
                    await addCareerRequest(data as any);
                    await logActivity('طلب ندب', user.name, `طلب ندب لـ ${secForm.targetInstitution}`);
                }
            }

            // 3. Handle Transfer
            else if (activeTab === 'TRANSFER') {
                 const data = {
                    userId: user.id,
                    userName: user.name,
                    type: 'TRANSFER',
                    ...transForm,
                    status: editingId ? undefined : 'PENDING_DEPT'
                };

                if (editingId) {
                    const updateData = { ...data };
                    delete (updateData as any).status;
                    await updateDoc(doc(db, 'career_requests', editingId), updateData);
                    await logActivity('تعديل طلب نقل', user.name, `تعديل طلب نقل لـ ${transForm.targetUniversity}`);
                } else {
                    await addCareerRequest(data as any);
                    await logActivity('طلب نقل', user.name, `طلب نقل لـ ${transForm.targetUniversity}`);
                }
            }

            setIsModalOpen(false);
            alert(editingId ? 'تم التعديل بنجاح ✅' : 'تم تقديم الطلب بنجاح ✅');
            fetchData();

        } catch (error) {
            console.error(error);
            alert("حدث خطأ أثناء الحفظ");
        } finally {
            setSubmitting(false);
        }
    };

    // --- Helper Components ---

    const StatusBadge = ({ status }: { status: string }) => {
        const map: any = {
            'PENDING_DEPT': { label: 'مجلس القسم', color: 'bg-yellow-100 text-yellow-800' },
            'PENDING_COLLEGE': { label: 'مجلس الكلية', color: 'bg-orange-100 text-orange-800' },
            'PENDING_UNIV': { label: 'مجلس الجامعة', color: 'bg-blue-100 text-blue-800' },
            'APPROVED': { label: 'قرار تنفيذي', color: 'bg-green-100 text-green-800' },
            'REJECTED': { label: 'مرفوض', color: 'bg-red-100 text-red-800' },
        };
        const info = map[status] || { label: status, color: 'bg-gray-100' };
        return <span className={`px-2 py-1 rounded text-xs font-bold ${info.color}`}>{info.label}</span>;
    };

    const Timeline = ({ status }: { status: string }) => {
        const steps = ['PENDING_DEPT', 'PENDING_COLLEGE', 'PENDING_UNIV', 'APPROVED'];
        const currentIdx = steps.indexOf(status);
        const isRejected = status === 'REJECTED';

        return (
            <div className="flex items-center gap-1 mt-2 text-[10px]">
                {steps.map((step, idx) => (
                    <div key={step} className="flex items-center">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center border 
                            ${idx <= currentIdx ? 'bg-green-600 border-green-600 text-white' : 'bg-white border-gray-300 text-gray-300'}
                            ${isRejected && idx === currentIdx + 1 ? 'bg-red-500 border-red-500' : ''}
                        `}>
                            {idx + 1}
                        </div>
                        {idx < steps.length - 1 && (
                            <div className={`w-4 h-0.5 ${idx < currentIdx ? 'bg-green-600' : 'bg-gray-200'}`}></div>
                        )}
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <Plane className="w-8 h-8 text-blue-600" />
                    النقل والندب والإعارة
                </h1>
                <div className="flex gap-2">
                    {isAdmin && (
                        <div className="flex bg-gray-100 rounded-lg p-1">
                            <button onClick={() => setViewMode('MY_REQUESTS')} className={`px-3 py-1 rounded-md text-xs font-bold ${viewMode === 'MY_REQUESTS' ? 'bg-white shadow text-blue-700' : 'text-gray-500'}`}>طلباتي</button>
                            <button onClick={() => setViewMode('ALL_REQUESTS')} className={`px-3 py-1 rounded-md text-xs font-bold ${viewMode === 'ALL_REQUESTS' ? 'bg-white shadow text-blue-700' : 'text-gray-500'}`}>الكل</button>
                        </div>
                    )}
                    {(!isAdmin || viewMode === 'MY_REQUESTS') && (
                        <button onClick={() => handleOpenModal()} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold">
                            <Plus className="w-4 h-4"/> تقديم طلب
                        </button>
                    )}
                </div>
            </div>

            {/* Legal Duration Tracker (Loan) */}
            {!isAdmin && (
                <div className={`p-4 rounded-xl border flex justify-between items-center ${loanYearsUsed >= 10 ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
                    <div className="flex items-center gap-3">
                        <Clock className={`w-6 h-6 ${loanYearsUsed >= 10 ? 'text-red-600' : 'text-blue-600'}`} />
                        <div>
                            <h4 className={`font-bold ${loanYearsUsed >= 10 ? 'text-red-800' : 'text-blue-800'}`}>عداد الإعارات القانوني</h4>
                            <p className="text-xs text-gray-600">الحد الأقصى المسموح به قانوناً هو 10 سنوات طوال مدة الخدمة.</p>
                        </div>
                    </div>
                    <div className="text-center">
                        <span className={`text-2xl font-bold ${loanYearsUsed >= 10 ? 'text-red-600' : 'text-blue-600'}`}>{loanYearsUsed}</span>
                        <span className="text-gray-500 text-xs"> / 10 سنوات</span>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="flex border-b border-gray-200 bg-white rounded-t-xl">
                <button onClick={() => setActiveTab('LOAN')} className={`flex-1 py-4 font-bold text-sm flex items-center justify-center gap-2 ${activeTab === 'LOAN' ? 'text-blue-700 border-b-2 border-blue-700 bg-blue-50' : 'text-gray-500 hover:bg-gray-50'}`}>
                    <Globe className="w-4 h-4"/> الإعارة
                </button>
                <button onClick={() => setActiveTab('SECONDMENT')} className={`flex-1 py-4 font-bold text-sm flex items-center justify-center gap-2 ${activeTab === 'SECONDMENT' ? 'text-blue-700 border-b-2 border-blue-700 bg-blue-50' : 'text-gray-500 hover:bg-gray-50'}`}>
                    <Briefcase className="w-4 h-4"/> الندب
                </button>
                <button onClick={() => setActiveTab('TRANSFER')} className={`flex-1 py-4 font-bold text-sm flex items-center justify-center gap-2 ${activeTab === 'TRANSFER' ? 'text-blue-700 border-b-2 border-blue-700 bg-blue-50' : 'text-gray-500 hover:bg-gray-50'}`}>
                    <ArrowRightLeft className="w-4 h-4"/> النقل
                </button>
            </div>

            <div className="bg-white p-6 rounded-b-xl shadow-sm border border-t-0 border-gray-200 min-h-[400px]">
                {loading ? (
                    <div className="text-center py-10"><Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400"/></div>
                ) : (
                    <div>
                        {requests.filter(r => r.type === activeTab).length === 0 ? (
                            <div className="text-center py-12 text-gray-400 border-2 border-dashed rounded-xl">
                                <Briefcase className="w-12 h-12 mx-auto mb-2 opacity-20"/>
                                <p>لا توجد طلبات مسجلة في هذا القسم</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-right">
                                    <thead className="bg-gray-50 text-gray-600">
                                        <tr>
                                            <th className="p-3">مقدم الطلب</th>
                                            <th className="p-3">النوع</th>
                                            <th className="p-3">الجهة / الجامعة</th>
                                            <th className="p-3">الفترة</th>
                                            <th className="p-3">الحالة</th>
                                            <th className="p-3">المسار</th>
                                            <th className="p-3">إجراءات</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {requests.filter(r => r.type === activeTab).map(req => (
                                            <tr key={req.id} className="hover:bg-gray-50">
                                                <td className="p-3 font-bold text-gray-800">{req.userName}</td>
                                                <td className="p-3 text-xs">
                                                    {req.type === 'LOAN' ? ((req as LoanRequest).loanType === 'EXTERNAL' ? 'خارجية' : 'داخلية') : 
                                                     req.type === 'SECONDMENT' ? (req as SecondmentRequest).secondmentType : 
                                                     (req as TransferRequest).transferType}
                                                </td>
                                                <td className="p-3 text-gray-600">
                                                    {req.type === 'LOAN' ? (req as LoanRequest).institution :
                                                     req.type === 'SECONDMENT' ? (req as SecondmentRequest).targetInstitution :
                                                     (req as TransferRequest).targetUniversity}
                                                </td>
                                                <td className="p-3 font-mono text-xs">
                                                    {req.type !== 'TRANSFER' ? (
                                                        <>
                                                            {(req as LoanRequest).startDate} <br/> 
                                                            <span className="text-gray-400">إلى</span> {(req as LoanRequest).endDate}
                                                        </>
                                                    ) : '-'}
                                                </td>
                                                <td className="p-3"><StatusBadge status={req.status} /></td>
                                                <td className="p-3"><Timeline status={req.status} /></td>
                                                <td className="p-3 flex items-center gap-2">
                                                    {/* Admin Actions */}
                                                    {isAdmin && viewMode === 'ALL_REQUESTS' && (
                                                        <select 
                                                            className="text-xs border rounded p-1"
                                                            value={req.status}
                                                            onChange={(e) => handleStatusChange(req.id, e.target.value, req.type)}
                                                        >
                                                            <option value="PENDING_DEPT">مجلس القسم</option>
                                                            <option value="PENDING_COLLEGE">مجلس الكلية</option>
                                                            <option value="PENDING_UNIV">مجلس الجامعة</option>
                                                            <option value="APPROVED">تنفيذ</option>
                                                            <option value="REJECTED">رفض</option>
                                                        </select>
                                                    )}
                                                    
                                                    {/* User Actions (Edit/Delete if pending) */}
                                                    {(isAdmin || req.userId === user.id) && req.status.startsWith('PENDING') && (
                                                        <>
                                                            <button onClick={() => handleOpenModal(req)} className="text-blue-500 hover:bg-blue-50 p-1.5 rounded"><Edit className="w-4 h-4"/></button>
                                                            <button onClick={() => handleDelete(req.id, req.type)} className="text-red-500 hover:bg-red-50 p-1.5 rounded"><Trash2 className="w-4 h-4"/></button>
                                                        </>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in-95">
                        <div className="p-6 border-b flex justify-between items-center bg-gray-50 rounded-t-2xl">
                            <h3 className="text-xl font-bold text-gray-800">
                                {editingId ? 'تعديل الطلب' : `تقديم طلب ${activeTab === 'LOAN' ? 'إعارة' : activeTab === 'SECONDMENT' ? 'ندب' : 'نقل'} جديد`}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)}><X className="w-6 h-6 text-gray-400 hover:text-red-500"/></button>
                        </div>
                        
                        <div className="p-6">
                            {activeTab === 'LOAN' && (
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1">نوع الإعارة</label>
                                            <select className="w-full border p-2 rounded" value={loanForm.loanType} onChange={e => setLoanForm({...loanForm, loanType: e.target.value as any})}>
                                                <option value="EXTERNAL">إعارة خارجية</option>
                                                <option value="INTERNAL">إعارة داخلية</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1">نوع الطلب</label>
                                            <select className="w-full border p-2 rounded" value={loanForm.requestType} onChange={e => setLoanForm({...loanForm, requestType: e.target.value as any})}>
                                                <option value="NEW">لأول مرة</option>
                                                <option value="RENEWAL">تجديد إعارة</option>
                                            </select>
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-sm font-bold text-gray-700 mb-1">الدولة</label>
                                            <input type="text" required className="w-full border p-2 rounded" value={loanForm.country} onChange={e => setLoanForm({...loanForm, country: e.target.value})} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1">الجامعة / المؤسسة</label>
                                            <input type="text" required className="w-full border p-2 rounded" value={loanForm.institution} onChange={e => setLoanForm({...loanForm, institution: e.target.value})} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1">الكلية / القسم</label>
                                            <input type="text" required className="w-full border p-2 rounded" value={loanForm.college} onChange={e => setLoanForm({...loanForm, college: e.target.value})} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1">من تاريخ</label>
                                            <input type="date" required className="w-full border p-2 rounded" value={loanForm.startDate} onChange={e => setLoanForm({...loanForm, startDate: e.target.value})} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1">إلى تاريخ</label>
                                            <input type="date" required className="w-full border p-2 rounded" value={loanForm.endDate} onChange={e => setLoanForm({...loanForm, endDate: e.target.value})} />
                                        </div>
                                        
                                        <div className="col-span-2 border-2 border-dashed border-gray-300 p-4 rounded-lg text-center">
                                            <input type="file" className="hidden" id="loan-file" onChange={e => setFiles(Array.from(e.target.files || []))} />
                                            <label htmlFor="loan-file" className="cursor-pointer flex flex-col items-center gap-2">
                                                <UploadCloud className="w-8 h-8 text-blue-500"/>
                                                <span className="text-sm font-bold text-gray-600">
                                                    {loanForm.requestType === 'NEW' ? 'رفع خطاب الترشيح' : 'رفع إيصال سداد التأمينات'}
                                                </span>
                                                {files.length > 0 && <span className="text-xs text-green-600">{files[0].name}</span>}
                                            </label>
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-3 pt-4">
                                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600">إلغاء</button>
                                        <button disabled={submitting} type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 flex items-center gap-2">
                                            {submitting && <Loader2 className="w-4 h-4 animate-spin"/>} حفظ الطلب
                                        </button>
                                    </div>
                                </form>
                            )}

                            {activeTab === 'SECONDMENT' && (
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1">نوع الندب</label>
                                            <select className="w-full border p-2 rounded" value={secForm.secondmentType} onChange={e => setSecForm({...secForm, secondmentType: e.target.value as any})}>
                                                <option value="FULL_TIME">ندب كلي (تفرغ كامل)</option>
                                                <option value="PART_TIME">ندب جزئي (أيام محددة)</option>
                                                <option value="OFF_HOURS">غير أوقات العمل</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1">الجهة المنتدب إليها</label>
                                            <input type="text" required className="w-full border p-2 rounded" value={secForm.targetInstitution} onChange={e => setSecForm({...secForm, targetInstitution: e.target.value})} />
                                        </div>
                                        
                                        {secForm.secondmentType === 'PART_TIME' && (
                                            <div className="col-span-2 bg-blue-50 p-3 rounded border border-blue-100">
                                                <label className="block text-sm font-bold mb-2 text-blue-800">أيام الندب المقترحة</label>
                                                <div className="flex gap-4 flex-wrap">
                                                    {['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'].map(day => (
                                                        <label key={day} className="flex items-center gap-1 text-sm bg-white px-2 py-1 rounded border">
                                                            <input type="checkbox" 
                                                                checked={secForm.secondmentDays?.includes(day)}
                                                                onChange={e => {
                                                                    const current = secForm.secondmentDays || [];
                                                                    setSecForm({
                                                                        ...secForm, 
                                                                        secondmentDays: e.target.checked ? [...current, day] : current.filter(d => d !== day)
                                                                    });
                                                                }}
                                                            /> {day}
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1">من تاريخ</label>
                                            <input type="date" required className="w-full border p-2 rounded" value={secForm.startDate} onChange={e => setSecForm({...secForm, startDate: e.target.value})} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1">إلى تاريخ</label>
                                            <input type="date" required className="w-full border p-2 rounded" value={secForm.endDate} onChange={e => setSecForm({...secForm, endDate: e.target.value})} />
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-3 pt-4">
                                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600">إلغاء</button>
                                        <button disabled={submitting} type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 flex items-center gap-2">
                                            {submitting && <Loader2 className="w-4 h-4 animate-spin"/>} حفظ الطلب
                                        </button>
                                    </div>
                                </form>
                            )}

                            {activeTab === 'TRANSFER' && (
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="bg-red-50 p-4 rounded text-red-700 text-sm border border-red-200 flex items-center gap-2 mb-4">
                                        <AlertTriangle className="w-5 h-5 shrink-0"/>
                                        <span>تنبيه: النقل إجراء نهائي يترتب عليه نقل الدرجة المالية وإنهاء الخدمة بالجامعة الحالية.</span>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">الجامعة المنقول إليها</label>
                                        <input type="text" required className="w-full border p-2 rounded" value={transForm.targetUniversity} onChange={e => setTransForm({...transForm, targetUniversity: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">الكلية / القسم</label>
                                        <input type="text" required className="w-full border p-2 rounded" value={transForm.targetCollege} onChange={e => setTransForm({...transForm, targetCollege: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">نوع النقل المالي</label>
                                        <select className="w-full border p-2 rounded" value={transForm.transferType} onChange={e => setTransForm({...transForm, transferType: e.target.value as any})}>
                                            <option value="VACANT_DEGREE">على درجة شاغرة بالجهة الأخرى</option>
                                            <option value="WITH_DEGREE">نقل بالدرجة المالية (نقل تمويل)</option>
                                        </select>
                                    </div>
                                    <div className="flex justify-end gap-3 pt-4">
                                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600">إلغاء</button>
                                        <button disabled={submitting} type="submit" className="bg-red-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-red-700 flex items-center gap-2">
                                            {submitting && <Loader2 className="w-4 h-4 animate-spin"/>} تأكيد الطلب
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};