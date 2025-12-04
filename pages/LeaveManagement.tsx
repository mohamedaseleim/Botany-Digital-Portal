import React, { useState, useEffect } from 'react';
import { 
    CalendarDays, Plus, Clock, CheckCircle2, XCircle, AlertTriangle, 
    FileText, UserCheck, Plane, Baby, Stethoscope, MapPin, Phone, 
    UploadCloud, Loader2, X, User, Edit, Trash2, Save
} from 'lucide-react';
import { User as UserType, LeaveRequest, LeaveType, StaffMember, UserRole } from '../types';
import { 
    addLeaveRequest, getMyLeaves, getSubstituteRequests, respondToSubstituteRequest, 
    getStaff, uploadFileToDrive, logActivity, getAllLeaves, getEmployees 
} from '../services/dbService';
import { db } from '../firebaseConfig';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';

interface LeaveManagementProps {
    user: UserType;
}

export const LeaveManagement: React.FC<LeaveManagementProps> = ({ user }) => {
    const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'NEW' | 'HISTORY' | 'SUBSTITUTE' | 'ALL_REQUESTS'>('DASHBOARD');
    const [myLeaves, setMyLeaves] = useState<LeaveRequest[]>([]);
    const [subRequests, setSubRequests] = useState<LeaveRequest[]>([]);
    const [allLeaves, setAllLeaves] = useState<LeaveRequest[]>([]); // للمدير
    const [staffList, setStaffList] = useState<{id: string, name: string, role: string}[]>([]);
    const [loading, setLoading] = useState(true);
    
    const isAdmin = user.role === UserRole.ADMIN;

    // Form State
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<any>({
        type: 'CASUAL',
        startDate: '',
        endDate: '',
        substituteId: '',
        // Dynamic fields
        address: '',
        phone: '',
        hospital: '',
        conferenceName: '',
        conferenceLocation: '',
        spouseName: '',
        spouseJob: '',
        country: '',
    });
    const [files, setFiles] = useState<File[]>([]);
    const [submitting, setSubmitting] = useState(false);

    // Substitute Modal
    const [selectedSubRequest, setSelectedSubRequest] = useState<LeaveRequest | null>(null);
    const [subAction, setSubAction] = useState<'ACCEPT' | 'DECLINE' | null>(null);
    const [declineReason, setDeclineReason] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // جلب البيانات الأساسية
            const [leaves, subs, staff, employees] = await Promise.all([
                getMyLeaves(user.id),
                getSubstituteRequests(user.id),
                getStaff(),
                getEmployees()
            ]);
            
            setMyLeaves(leaves);
            setSubRequests(subs);
            
            // دمج الموظفين وأعضاء التدريس في قائمة البدلاء
            // استثناء المستخدم الحالي من القائمة
            const allPotentialSubstitutes = [
                ...staff.map(s => ({ id: s.id, name: s.name, role: s.rank || 'عضو هيئة تدريس' })),
                ...employees.map(e => ({ id: e.id, name: e.name, role: e.jobTitle || 'موظف' }))
            ].filter(p => p.id !== user.id);

            setStaffList(allPotentialSubstitutes);

            // إذا كان مديراً، اجلب كل الإجازات
            if (isAdmin) {
                const all = await getAllLeaves();
                setAllLeaves(all);
            }

        } catch (error) {
            console.error("Error fetching data:", error);
        }
        setLoading(false);
    };

    // --- Calculations ---
    const calculateDays = () => {
        if (!formData.startDate || !formData.endDate) return 0;
        const start = new Date(formData.startDate);
        const end = new Date(formData.endDate);
        const diff = end.getTime() - start.getTime();
        return Math.ceil(diff / (1000 * 3600 * 24)) + 1;
    };

    const getLeaveLabel = (type: LeaveType) => {
        switch(type) {
            case 'CASUAL': return 'إجازة عارضة';
            case 'ANNUAL': return 'إجازة اعتيادية';
            case 'SICK': return 'إجازة مرضية';
            case 'SCIENTIFIC': return 'مهمة علمية / مؤتمر';
            case 'SPOUSE': return 'مرافقة الزوج/ة';
            case 'CHILD_CARE': return 'رعاية طفل';
            case 'HAJJ': return 'حج / عمرة';
            default: return type;
        }
    };

    // --- Handlers ---
    const handleInitForm = () => {
        setIsEditing(false);
        setEditingId(null);
        setFormData({
            type: 'CASUAL', startDate: '', endDate: '', substituteId: '',
            address: '', phone: '', hospital: '', conferenceName: '', 
            conferenceLocation: '', spouseName: '', spouseJob: '', country: '',
        });
        setFiles([]);
        setActiveTab('NEW');
    };

    const handleEditRequest = (req: LeaveRequest) => {
        if (req.status === 'APPROVED' || req.status === 'REJECTED') {
            alert('لا يمكن تعديل الطلبات المنتهية');
            return;
        }
        setIsEditing(true);
        setEditingId(req.id);
        setFormData({
            type: req.type,
            startDate: req.startDate,
            endDate: req.endDate,
            substituteId: req.substituteId || '',
            address: req.address || '',
            phone: req.phone || '',
            hospital: req.hospital || '',
            conferenceName: req.conferenceName || '',
            conferenceLocation: req.conferenceLocation || '',
            spouseName: req.spouseName || '',
            spouseJob: req.spouseJob || '',
            country: req.country || '',
        });
        setFiles([]); 
        setActiveTab('NEW');
    };

    const handleDeleteRequest = async (id: string, type: string) => {
        if (!window.confirm('هل أنت متأكد من حذف هذا الطلب؟')) return;
        try {
            await deleteDoc(doc(db, 'leave_requests', id));
            await logActivity('حذف طلب إجازة', user.name, `تم حذف طلب ${getLeaveLabel(type as LeaveType)}`);
            fetchData();
        } catch (error) {
            alert('فشل الحذف');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const days = calculateDays();
        if (days <= 0) { alert('تاريخ النهاية يجب أن يكون بعد البداية'); return; }
        
        if (formData.type === 'CASUAL' && !isEditing) {
            const usedCasual = myLeaves.filter(l => l.type === 'CASUAL' && l.status === 'APPROVED').reduce((acc, curr) => acc + curr.daysCount, 0);
            if (usedCasual + days > 7) {
                alert(`عذراً، رصيدك المتبقي من العارضة (${7 - usedCasual} أيام) لا يكفي.`);
                return;
            }
        }

        setSubmitting(true);
        try {
            const uploadedUrls = [];
            for (const file of files) {
                const url = await uploadFileToDrive(file);
                uploadedUrls.push(url);
            }

            const substituteName = staffList.find(s => s.id === formData.substituteId)?.name;

            const requestData = {
                userId: user.id,
                userName: user.name,
                type: formData.type,
                startDate: formData.startDate,
                endDate: formData.endDate,
                daysCount: days,
                substituteId: formData.substituteId,
                substituteName: substituteName,
                
                address: formData.address,
                phone: formData.phone,
                hospital: formData.hospital,
                conferenceName: formData.conferenceName,
                conferenceLocation: formData.conferenceLocation,
                spouseName: formData.spouseName,
                spouseJob: formData.spouseJob,
                country: formData.country,
                ...(uploadedUrls.length > 0 && { documentsUrls: uploadedUrls, medicalReportUrl: uploadedUrls[0] })
            };

            if (isEditing && editingId) {
                await updateDoc(doc(db, 'leave_requests', editingId), requestData);
                await logActivity('تعديل طلب إجازة', user.name, `تم تعديل طلب ${getLeaveLabel(formData.type)}`);
                alert('تم تعديل الطلب بنجاح');
            } else {
                await addLeaveRequest(requestData as any);
                await logActivity('طلب إجازة', user.name, `طلب إجازة ${getLeaveLabel(formData.type)} لمدة ${days} أيام`);
                alert('تم تقديم الطلب بنجاح');
            }

            setActiveTab('HISTORY');
            fetchData();
        } catch (error) {
            console.error(error);
            alert('حدث خطأ أثناء التقديم');
        } finally {
            setSubmitting(false);
        }
    };

    const handleSubstituteResponse = async (accept: boolean) => {
        if (!selectedSubRequest) return;
        try {
            await respondToSubstituteRequest(selectedSubRequest.id, accept, declineReason);
            await logActivity('رد على بديل', user.name, `${accept ? 'وافق' : 'رفض'} القيام بعمل ${selectedSubRequest.userName}`);
            alert('تم تسجيل الرد');
            setSelectedSubRequest(null);
            setSubAction(null);
            fetchData();
        } catch (error) {
            alert('حدث خطأ');
        }
    };
    
    // Admin Action: Approve/Reject as Head of Dept
    const handleAdminAction = async (reqId: string, status: 'APPROVED' | 'REJECTED') => {
        if(!window.confirm(`هل أنت متأكد من ${status === 'APPROVED' ? 'اعتماد' : 'رفض'} هذا الطلب؟`)) return;
        try {
            await updateDoc(doc(db, 'leave_requests', reqId), { status });
            await logActivity('قرار إجازة', user.name, `تم ${status === 'APPROVED' ? 'اعتماد' : 'رفض'} طلب إجازة`);
            fetchData();
        } catch (e) { alert("خطأ"); }
    };

    // --- Components ---

    const renderDashboard = () => {
        const casualUsed = myLeaves.filter(l => l.type === 'CASUAL' && l.status === 'APPROVED').reduce((acc, l) => acc + l.daysCount, 0);
        const pendingCount = myLeaves.filter(l => l.status.includes('PENDING')).length;
        const pendingAdminCount = isAdmin ? allLeaves.filter(l => l.status === 'PENDING_HEAD').length : 0;

        return (
            <div className="space-y-6 animate-in fade-in">
                {/* Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-orange-50 p-6 rounded-xl border border-orange-100">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-orange-600 font-bold text-sm">رصيد العارضة</p>
                                <h3 className="text-3xl font-bold text-orange-800 mt-2">{7 - casualUsed} <span className="text-sm text-orange-600">/ 7</span></h3>
                            </div>
                            <div className="p-2 bg-orange-100 rounded-full"><Clock className="w-6 h-6 text-orange-600"/></div>
                        </div>
                        <div className="mt-4 w-full bg-orange-200 rounded-full h-2">
                            <div className="bg-orange-500 h-2 rounded-full" style={{width: `${(casualUsed/7)*100}%`}}></div>
                        </div>
                    </div>

                    <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                         <div className="flex justify-between items-start">
                            <div>
                                <p className="text-blue-600 font-bold text-sm">طلباتي النشطة</p>
                                <h3 className="text-3xl font-bold text-blue-800 mt-2">{pendingCount}</h3>
                            </div>
                            <div className="p-2 bg-blue-100 rounded-full"><FileText className="w-6 h-6 text-blue-600"/></div>
                        </div>
                        <p className="text-xs text-blue-500 mt-4">قيد المراجعة من البديل أو رئيس القسم</p>
                    </div>

                    <div className="bg-purple-50 p-6 rounded-xl border border-purple-100 cursor-pointer hover:bg-purple-100 transition-colors" onClick={() => setActiveTab('SUBSTITUTE')}>
                         <div className="flex justify-between items-start">
                            <div>
                                <p className="text-purple-600 font-bold text-sm">طلبات البديل الواردة</p>
                                <h3 className="text-3xl font-bold text-purple-800 mt-2">{subRequests.length}</h3>
                            </div>
                            <div className="p-2 bg-purple-100 rounded-full relative">
                                <UserCheck className="w-6 h-6 text-purple-600"/>
                                {subRequests.length > 0 && <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full animate-ping"></span>}
                            </div>
                        </div>
                        <p className="text-xs text-purple-500 mt-4">زملاء بانتظار موافقتك للقيام بعملهم</p>
                    </div>
                    
                    {/* Admin Card */}
                    {isAdmin && (
                        <div className="bg-green-50 p-6 rounded-xl border border-green-100 cursor-pointer hover:bg-green-100 transition-colors md:col-span-3" onClick={() => setActiveTab('ALL_REQUESTS')}>
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-green-200 rounded-full"><CheckCircle2 className="w-6 h-6 text-green-700"/></div>
                                    <div>
                                        <h3 className="text-lg font-bold text-green-900">لوحة المدير (موافقة رئيس القسم)</h3>
                                        <p className="text-sm text-green-700">يوجد {pendingAdminCount} طلب بانتظار الاعتماد النهائي</p>
                                    </div>
                                </div>
                                <button className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold">مراجعة الطلبات</button>
                            </div>
                        </div>
                    )}
                </div>

                {/* New Request Button */}
                <button 
                    onClick={handleInitForm}
                    className="w-full py-4 bg-green-600 text-white rounded-xl font-bold text-lg shadow-md hover:bg-green-700 transition-all flex items-center justify-center gap-2"
                >
                    <Plus className="w-6 h-6" /> تقديم طلب إجازة جديد
                </button>
            </div>
        );
    };

    const renderNewRequestForm = () => (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
                <h3 className="font-bold text-xl text-gray-800 flex items-center gap-2">
                    <CalendarDays className="w-6 h-6 text-green-600"/> {isEditing ? 'تعديل طلب الإجازة' : 'طلب إجازة جديد'}
                </h3>
                {isEditing && <button onClick={handleInitForm} className="text-sm text-gray-500 hover:text-red-500">إلغاء التعديل</button>}
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Type & Dates */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">نوع الإجازة</label>
                        <select 
                            className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-green-500 bg-white"
                            value={formData.type}
                            onChange={e => setFormData({...formData, type: e.target.value})}
                            disabled={isEditing} 
                        >
                            <option value="CASUAL">إجازة عارضة</option>
                            <option value="ANNUAL">إجازة اعتيادية</option>
                            <option value="SICK">إجازة مرضية</option>
                            <option value="SCIENTIFIC">مهمة علمية / مؤتمر</option>
                            <option value="SPOUSE">مرافقة الزوج/الزوجة</option>
                            <option value="CHILD_CARE">رعاية طفل</option>
                            <option value="HAJJ">حج / عمرة</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">تاريخ البداية</label>
                        <input type="date" required className="w-full p-3 border border-gray-300 rounded-lg" 
                            value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">تاريخ النهاية</label>
                        <input type="date" required className="w-full p-3 border border-gray-300 rounded-lg" 
                            value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})}
                        />
                        {calculateDays() > 0 && <p className="text-xs text-green-600 mt-1 font-bold">المدة: {calculateDays()} يوم</p>}
                    </div>
                </div>

                {/* Substitute Selection */}
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                    <label className="block text-sm font-bold text-purple-900 mb-2 flex items-center gap-2">
                        <UserCheck className="w-4 h-4"/> القائم بالعمل (الزميل البديل)
                    </label>
                    <select 
                        className="w-full p-3 border border-purple-200 rounded-lg outline-none focus:border-purple-500 bg-white"
                        value={formData.substituteId}
                        onChange={e => setFormData({...formData, substituteId: e.target.value})}
                        required={formData.type !== 'CHILD_CARE' && formData.type !== 'SPOUSE'}
                    >
                        <option value="">-- اختر الزميل --</option>
                        {staffList.length === 0 ? (
                             <option disabled>لا يوجد زملاء مسجلين حالياً (تواصل مع المسؤول)</option>
                        ) : (
                             staffList.map(s => <option key={s.id} value={s.id}>{s.name} - {s.role}</option>)
                        )}
                    </select>
                    {staffList.length === 0 && (
                        <p className="text-xs text-red-500 font-bold mt-1">
                            تنبيه: القائمة فارغة لأنك المستخدم الوحيد المسجل. يرجى إضافة مستخدمين آخرين من لوحة "إدارة المستخدمين" لتجربة ميزة البديل.
                        </p>
                    )}
                    <p className="text-xs text-purple-600 mt-2">* سيتم إرسال إشعار للزميل للموافقة على تغطية محاضراتك.</p>
                </div>

                {/* Dynamic Fields */}
                {(formData.type === 'CASUAL' || formData.type === 'ANNUAL' || formData.type === 'HAJJ') && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">العنوان أثناء الإجازة</label>
                            <input type="text" required className="w-full p-2 border rounded-lg" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">رقم الطوارئ</label>
                            <input type="tel" required className="w-full p-2 border rounded-lg" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                        </div>
                    </div>
                )}

                {formData.type === 'SICK' && (
                    <div className="space-y-4 animate-in fade-in">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">مكان العلاج</label>
                            <input type="text" placeholder="مستشفى / عيادة / منزل" required className="w-full p-2 border rounded-lg" value={formData.hospital} onChange={e => setFormData({...formData, hospital: e.target.value})} />
                        </div>
                        <div className="border-2 border-dashed border-gray-300 p-4 rounded-lg text-center">
                            <input type="file" className="hidden" id="med-report" onChange={e => setFiles(Array.from(e.target.files || []))} />
                            <label htmlFor="med-report" className="cursor-pointer flex flex-col items-center gap-2">
                                <Stethoscope className="w-8 h-8 text-red-500"/>
                                <span className="text-sm font-bold text-gray-600">رفع التقرير الطبي (صورة/PDF)</span>
                                {files.length > 0 && <span className="text-xs text-green-600">{files[0].name}</span>}
                            </label>
                        </div>
                    </div>
                )}

                {formData.type === 'SCIENTIFIC' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in">
                        <div className="col-span-2">
                            <label className="block text-sm font-bold text-gray-700 mb-1">اسم المؤتمر / الجهة</label>
                            <input type="text" required className="w-full p-2 border rounded-lg" value={formData.conferenceName} onChange={e => setFormData({...formData, conferenceName: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">المكان / الدولة</label>
                            <input type="text" required className="w-full p-2 border rounded-lg" value={formData.conferenceLocation} onChange={e => setFormData({...formData, conferenceLocation: e.target.value})} />
                        </div>
                        <div className="border-2 border-dashed border-gray-300 p-2 rounded-lg text-center flex items-center justify-center">
                            <input type="file" className="hidden" id="conf-invite" onChange={e => setFiles(Array.from(e.target.files || []))} />
                            <label htmlFor="conf-invite" className="cursor-pointer text-sm text-blue-600 hover:underline">
                                {files.length > 0 ? files[0].name : 'رفع دعوة المؤتمر'}
                            </label>
                        </div>
                    </div>
                )}

                {formData.type === 'SPOUSE' && (
                    <div className="space-y-4 animate-in fade-in bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-bold text-gray-800 flex items-center gap-2"><Plane className="w-4 h-4"/> بيانات المرافقة</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input type="text" placeholder="اسم الزوج/الزوجة" required className="w-full p-2 border rounded-lg" value={formData.spouseName} onChange={e => setFormData({...formData, spouseName: e.target.value})} />
                            <input type="text" placeholder="جهة العمل بالخارج" required className="w-full p-2 border rounded-lg" value={formData.foreignEntity} onChange={e => setFormData({...formData, foreignEntity: e.target.value})} />
                            <input type="text" placeholder="الدولة" required className="w-full p-2 border rounded-lg" value={formData.country} onChange={e => setFormData({...formData, country: e.target.value})} />
                        </div>
                        <div className="border-2 border-dashed border-gray-300 p-4 rounded-lg text-center">
                            <input type="file" multiple className="hidden" id="spouse-docs" onChange={e => setFiles(Array.from(e.target.files || []))} />
                            <label htmlFor="spouse-docs" className="cursor-pointer flex flex-col items-center gap-1">
                                <UploadCloud className="w-6 h-6 text-gray-400"/>
                                <span className="text-sm text-gray-600">رفع المستندات (عقد العمل، القسيمة، التأشيرة)</span>
                                {files.length > 0 && <span className="text-xs text-green-600">{files.length} ملفات تم اختيارها</span>}
                            </label>
                        </div>
                    </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t">
                    <button type="button" onClick={() => setActiveTab('DASHBOARD')} className="px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-bold">إلغاء</button>
                    <button type="submit" disabled={submitting} className="px-8 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold flex items-center gap-2 disabled:opacity-50">
                        {submitting ? <Loader2 className="w-5 h-5 animate-spin"/> : (isEditing ? <Save className="w-5 h-5"/> : <CheckCircle2 className="w-5 h-5"/>)} 
                        {isEditing ? 'حفظ التعديلات' : 'إرسال الطلب'}
                    </button>
                </div>
            </form>
        </div>
    );

    const renderSubstituteRequests = () => (
        <div className="space-y-4 animate-in fade-in">
            <h3 className="font-bold text-gray-700 mb-4">طلبات القيام بالعمل الواردة إليك</h3>
            {subRequests.length === 0 && <div className="text-center p-12 bg-gray-50 rounded-xl text-gray-400">لا توجد طلبات جديدة</div>}
            
            <div className="grid gap-4">
                {subRequests.map(req => (
                    <div key={req.id} className="bg-white border-l-4 border-purple-500 shadow-sm rounded-r-xl p-6 flex flex-col md:flex-row justify-between items-center gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full font-bold">طلب بديل</span>
                                <h4 className="font-bold text-gray-800 text-lg">{req.userName}</h4>
                            </div>
                            <p className="text-gray-600 text-sm">يرغب في إجازة <span className="font-bold">{getLeaveLabel(req.type)}</span></p>
                            <div className="flex gap-4 mt-2 text-sm text-gray-500 font-mono">
                                <span>من: {req.startDate}</span>
                                <span>إلى: {req.endDate}</span>
                                <span>({req.daysCount} أيام)</span>
                            </div>
                        </div>
                        <button 
                            onClick={() => { setSelectedSubRequest(req); setSubAction(null); }}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-bold shadow-md"
                        >
                            عرض التفاصيل واتخاذ قرار
                        </button>
                    </div>
                ))}
            </div>

            {/* Substitute Action Modal */}
            {selectedSubRequest && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl animate-in zoom-in-95 overflow-hidden">
                        <div className="bg-purple-50 p-6 border-b border-purple-100">
                            <h3 className="text-xl font-bold text-purple-900">إقرار القيام بالعمل</h3>
                            <p className="text-purple-700 text-sm mt-1">طلب مقدم من د/ {selectedSubRequest.userName}</p>
                        </div>
                        
                        <div className="p-6 space-y-6">
                            <div className="bg-gray-100 p-4 rounded-lg text-sm text-gray-700 leading-relaxed border-r-4 border-gray-400">
                                "أقر أنا / <strong>{user.name}</strong>، بصفتي عضو هيئة تدريس بالقسم، بأنني اطلعت على الجدول أعلاه، وأوافق على القيام بالأعباء التدريسية الخاصة بالزميل/ <strong>{selectedSubRequest.userName}</strong> خلال فترة إجازته، وأتحمل مسؤولية تدريسها."
                            </div>

                            {!subAction ? (
                                <div className="flex gap-3 pt-2">
                                    <button onClick={() => setSubAction('DECLINE')} className="flex-1 py-3 border-2 border-red-100 text-red-600 rounded-xl font-bold hover:bg-red-50">اعتذار</button>
                                    <button onClick={() => setSubAction('ACCEPT')} className="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 shadow-md">قبول وتعهد</button>
                                </div>
                            ) : subAction === 'ACCEPT' ? (
                                <div className="text-center space-y-4 animate-in fade-in">
                                    <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto"/>
                                    <p className="font-bold text-lg text-green-800">شكراً لتعاونكم!</p>
                                    <button onClick={() => handleSubstituteResponse(true)} className="bg-green-600 text-white px-8 py-2 rounded-lg font-bold">تأكيد الموافقة النهائية</button>
                                </div>
                            ) : (
                                <div className="space-y-4 animate-in fade-in">
                                    <label className="block text-sm font-bold text-gray-700">سبب الاعتذار (اختياري)</label>
                                    <textarea className="w-full border p-3 rounded-lg" placeholder="مثال: تعارض في المواعيد..." value={declineReason} onChange={e => setDeclineReason(e.target.value)}></textarea>
                                    <div className="flex gap-3">
                                        <button onClick={() => setSubAction(null)} className="px-4 text-gray-500">تراجع</button>
                                        <button onClick={() => handleSubstituteResponse(false)} className="flex-1 bg-red-600 text-white py-2 rounded-lg font-bold">إرسال الاعتذار</button>
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        <div className="absolute top-4 left-4">
                            <button onClick={() => setSelectedSubRequest(null)}><X className="w-6 h-6 text-gray-400 hover:text-gray-600"/></button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    const renderHistory = () => (
        <div className="space-y-4 animate-in fade-in">
            <h3 className="font-bold text-gray-700 mb-4">سجل إجازاتي السابقة</h3>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-sm text-right">
                    <thead className="bg-gray-50 text-gray-600">
                        <tr>
                            <th className="p-4">نوع الإجازة</th>
                            <th className="p-4">من</th>
                            <th className="p-4">إلى</th>
                            <th className="p-4">البديل</th>
                            <th className="p-4">الحالة</th>
                            <th className="p-4">إجراءات</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {myLeaves.map(leave => (
                            <tr key={leave.id} className="hover:bg-gray-50">
                                <td className="p-4 font-bold text-gray-800">{getLeaveLabel(leave.type)}</td>
                                <td className="p-4">{leave.startDate}</td>
                                <td className="p-4">{leave.endDate}</td>
                                <td className="p-4 text-gray-600">{leave.substituteName || '-'}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                        leave.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                                        leave.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                        'bg-amber-100 text-amber-700'
                                    }`}>
                                        {leave.status === 'APPROVED' ? 'مقبولة' : 
                                         leave.status === 'PENDING_SUBSTITUTE' ? 'انتظار البديل' : 
                                         leave.status === 'PENDING_HEAD' ? 'انتظار المدير' : 'مرفوضة'}
                                    </span>
                                </td>
                                <td className="p-4 flex gap-2">
                                    {(leave.status === 'PENDING_SUBSTITUTE' || leave.status === 'PENDING_HEAD') && (
                                        <>
                                            <button onClick={() => handleEditRequest(leave)} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded"><Edit className="w-4 h-4"/></button>
                                            <button onClick={() => handleDeleteRequest(leave.id, leave.type)} className="text-red-600 hover:bg-red-50 p-1.5 rounded"><Trash2 className="w-4 h-4"/></button>
                                        </>
                                    )}
                                    {leave.status === 'APPROVED' && (
                                        <button onClick={() => window.print()} className="text-green-600 hover:underline flex items-center gap-1"><FileText className="w-3 h-3"/> طباعة</button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {myLeaves.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-gray-400">لا يوجد سجل إجازات</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    );

    // --- Admin: All Requests View ---
    const renderAllRequests = () => (
        <div className="space-y-4 animate-in fade-in">
            <h3 className="font-bold text-gray-700 mb-4">جميع طلبات الإجازات (للمدير)</h3>
            <div className="grid gap-4">
                {allLeaves.map(req => (
                    <div key={req.id} className="bg-white border border-gray-200 shadow-sm rounded-xl p-4 flex flex-col md:flex-row justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-bold text-lg">{req.userName}</h4>
                                <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs">{getLeaveLabel(req.type)}</span>
                            </div>
                            <p className="text-sm text-gray-500">
                                المدة: {req.daysCount} أيام ({req.startDate} - {req.endDate}) <br/>
                                البديل: {req.substituteName || 'لا يوجد'}
                            </p>
                            <div className="mt-2">
                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                    req.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                                    req.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                    req.status === 'PENDING_HEAD' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-gray-100 text-gray-600'
                                }`}>
                                    {req.status === 'PENDING_HEAD' ? 'بانتظار موافقتك' : 
                                     req.status === 'PENDING_SUBSTITUTE' ? 'بانتظار البديل' : req.status}
                                </span>
                            </div>
                        </div>
                        {req.status === 'PENDING_HEAD' && (
                            <div className="flex gap-2 items-center">
                                <button onClick={() => handleAdminAction(req.id, 'APPROVED')} className="bg-green-600 text-white px-4 py-2 rounded font-bold hover:bg-green-700">اعتماد</button>
                                <button onClick={() => handleAdminAction(req.id, 'REJECTED')} className="bg-red-600 text-white px-4 py-2 rounded font-bold hover:bg-red-700">رفض</button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <CalendarDays className="w-8 h-8 text-green-600"/> إدارة الإجازات
                </h1>
            </div>

            <div className="flex border-b border-gray-200 bg-white rounded-t-xl overflow-x-auto">
                <button onClick={() => setActiveTab('DASHBOARD')} className={`px-6 py-4 font-bold text-sm transition-colors ${activeTab === 'DASHBOARD' ? 'text-green-700 border-b-2 border-green-700' : 'text-gray-500'}`}>لوحة المعلومات</button>
                <button onClick={handleInitForm} className={`px-6 py-4 font-bold text-sm transition-colors ${activeTab === 'NEW' ? 'text-green-700 border-b-2 border-green-700' : 'text-gray-500'}`}>تقديم طلب</button>
                <button onClick={() => setActiveTab('SUBSTITUTE')} className={`px-6 py-4 font-bold text-sm transition-colors ${activeTab === 'SUBSTITUTE' ? 'text-purple-700 border-b-2 border-purple-700' : 'text-gray-500'}`}>طلبات البديل</button>
                <button onClick={() => setActiveTab('HISTORY')} className={`px-6 py-4 font-bold text-sm transition-colors ${activeTab === 'HISTORY' ? 'text-green-700 border-b-2 border-green-700' : 'text-gray-500'}`}>سجلي</button>
                {isAdmin && <button onClick={() => setActiveTab('ALL_REQUESTS')} className={`px-6 py-4 font-bold text-sm transition-colors ${activeTab === 'ALL_REQUESTS' ? 'text-green-700 border-b-2 border-green-700' : 'text-gray-500'}`}>كل الطلبات (مدير)</button>}
            </div>

            <div className="bg-white p-6 rounded-b-xl shadow-sm border border-t-0 border-gray-200 min-h-[400px]">
                {activeTab === 'DASHBOARD' && renderDashboard()}
                {activeTab === 'NEW' && renderNewRequestForm()}
                {activeTab === 'SUBSTITUTE' && renderSubstituteRequests()}
                {activeTab === 'HISTORY' && renderHistory()}
                {activeTab === 'ALL_REQUESTS' && isAdmin && renderAllRequests()}
            </div>
        </div>
    );
};