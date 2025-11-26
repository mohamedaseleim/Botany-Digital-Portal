
import React, { useState, useEffect } from 'react';
import { FlaskConical, Calendar, Clock, User, AlertTriangle, Plus, Trash2, CheckCircle2, X, Save, Loader2, Edit, Table, XCircle, PlayCircle } from 'lucide-react';
import { LabBooking, User as UserType, UserRole, Lab, LabClass, BookingStatus } from '../types';
import { getLabBookings, addLabBooking, deleteLabBooking, getLabs, addLab, updateLab, deleteLab, getLabClasses, addLabClass, updateLabClass, deleteLabClass, updateLabBooking, logActivity } from '../services/dbService';

interface LabsProps {
    user?: UserType;
}

export const Labs: React.FC<LabsProps> = ({ user }) => {
    // Labs Data State
    const [labs, setLabs] = useState<Lab[]>([]);
    const [bookings, setBookings] = useState<LabBooking[]>([]);
    const [labClasses, setLabClasses] = useState<LabClass[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Booking Form State
    const [bookForm, setBookForm] = useState({
        researcherName: user?.name || '',
        date: new Date().toISOString().split('T')[0],
        startTime: '09:00',
        endTime: '11:00',
        experimentType: '',
    });

    // Add/Edit Lab Form State
    const [isAddLabModalOpen, setIsAddLabModalOpen] = useState(false);
    const [editingLabId, setEditingLabId] = useState<string | null>(null);
    const [labForm, setLabForm] = useState({ name: '', supervisor: '', location: '' });

    // Schedule (Classes) Modal State
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
    const [selectedLabForSchedule, setSelectedLabForSchedule] = useState<Lab | null>(null);
    const [editingClassId, setEditingClassId] = useState<string | null>(null);
    const [classForm, setClassForm] = useState({ courseName: '', instructor: '', day: 'Saturday', startTime: '08:00', endTime: '10:00' });

    // Delete Modal States
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [bookingToDelete, setBookingToDelete] = useState<string | null>(null);

    const [isDeleteLabModalOpen, setIsDeleteLabModalOpen] = useState(false);
    const [labToDelete, setLabToDelete] = useState<string | null>(null);

    const [isDeleteClassModalOpen, setIsDeleteClassModalOpen] = useState(false);
    const [classToDelete, setClassToDelete] = useState<string | null>(null);

    const [submitting, setSubmitting] = useState(false);

    // Permissions
    const canManageLabs = user?.role === UserRole.ADMIN || user?.role === UserRole.STAFF;

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        const [bookingsData, labsData, classesData] = await Promise.all([
            getLabBookings(),
            getLabs(),
            getLabClasses()
        ]);
        
        // Sort bookings by date then time
        const sortedBookings = bookingsData.sort((a, b) => {
            if (a.date !== b.date) return a.date.localeCompare(b.date);
            return a.startTime.localeCompare(b.startTime);
        });
        
        setBookings(sortedBookings);
        setLabs(labsData);
        setLabClasses(classesData);
        setLoading(false);
    };

    // --- Labs Management Handlers ---

    const openLabModal = (lab?: Lab) => {
        if (lab) {
            setEditingLabId(lab.id);
            setLabForm({ name: lab.name, supervisor: lab.supervisor, location: lab.location });
        } else {
            setEditingLabId(null);
            setLabForm({ name: '', supervisor: '', location: '' });
        }
        setIsAddLabModalOpen(true);
    };

    const handleSaveLab = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        const userName = user?.name || 'Unknown';
        try {
            if (editingLabId) {
                await updateLab(editingLabId, labForm);
                logActivity('تعديل معمل', userName, `تم تعديل بيانات المعمل: ${labForm.name}`);
            } else {
                await addLab(labForm);
                logActivity('إضافة معمل', userName, `تم إضافة المعمل: ${labForm.name}`);
            }
            await fetchData();
            setIsAddLabModalOpen(false);
        } catch (error) {
            console.error(error);
            alert('حدث خطأ أثناء حفظ المعمل');
        } finally {
            setSubmitting(false);
        }
    };

    const confirmDeleteLab = async () => {
        if (!labToDelete) return;
        setSubmitting(true);
        try {
            const lab = labs.find(l => l.id === labToDelete);
            await deleteLab(labToDelete);
            logActivity('حذف معمل', user?.name || 'Unknown', `تم حذف المعمل: ${lab?.name}`);
            await fetchData();
            setIsDeleteLabModalOpen(false);
            setLabToDelete(null);
        } catch (error) {
            console.error(error);
            alert('فشل في حذف المعمل');
        } finally {
            setSubmitting(false);
        }
    };

    // --- Class/Schedule Handlers ---

    const openScheduleModal = (lab: Lab) => {
        setSelectedLabForSchedule(lab);
        setEditingClassId(null);
        setClassForm({ courseName: '', instructor: '', day: 'Saturday', startTime: '08:00', endTime: '10:00' });
        setIsScheduleModalOpen(true);
    };

    const initiateEditClass = (cls: LabClass) => {
        setEditingClassId(cls.id);
        setClassForm({
            courseName: cls.courseName,
            instructor: cls.instructor,
            day: cls.day,
            startTime: cls.startTime,
            endTime: cls.endTime
        });
    };

    const handleSaveClass = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedLabForSchedule) return;
        setSubmitting(true);
        const userName = user?.name || 'Unknown';
        try {
            if (editingClassId) {
                await updateLabClass(editingClassId, classForm);
                logActivity('تعديل حصة معمل', userName, `المادة: ${classForm.courseName}`);
                setEditingClassId(null);
            } else {
                await addLabClass({
                    ...classForm,
                    labId: selectedLabForSchedule.id
                });
                logActivity('إضافة حصة معمل', userName, `المادة: ${classForm.courseName} - معمل: ${selectedLabForSchedule.name}`);
            }
            await fetchData();
            // Reset form but keep mostly used fields or reset all? Let's reset main fields
            setClassForm(prev => ({ ...prev, courseName: '', instructor: '' })); 
        } catch (error) {
            console.error(error);
            alert('حدث خطأ أثناء حفظ الدرس');
        } finally {
            setSubmitting(false);
        }
    };

    const initiateDeleteClass = (id: string) => {
        setClassToDelete(id);
        setIsDeleteClassModalOpen(true);
    };

    const confirmDeleteClass = async () => {
        if (!classToDelete) return;
        setSubmitting(true);
        try {
            const cls = labClasses.find(c => c.id === classToDelete);
            await deleteLabClass(classToDelete);
            logActivity('حذف حصة معمل', user?.name || 'Unknown', `المادة المحذوفة: ${cls?.courseName}`);
            await fetchData();
            setIsDeleteClassModalOpen(false);
            setClassToDelete(null);
        } catch (error) {
            alert('فشل الحذف');
        } finally {
            setSubmitting(false);
        }
    };

    const translateDay = (day: string) => {
        const map: Record<string, string> = {
            'Saturday': 'السبت', 'Sunday': 'الأحد', 'Monday': 'الاثنين',
            'Tuesday': 'الثلاثاء', 'Wednesday': 'الأربعاء', 'Thursday': 'الخميس'
        };
        return map[day] || day;
    };

    // --- Booking Handlers ---

    const handleBooking = async (e: React.FormEvent) => {
        e.preventDefault();
        if (bookForm.endTime <= bookForm.startTime) {
            alert("يجب أن يكون وقت الانتهاء بعد وقت البدء");
            return;
        }

        // Normalize input for comparison
        const currentActivity = bookForm.experimentType.trim().toLowerCase();

        const hasConflict = bookings.some(b => {
            // 0. Ignore cancelled bookings
            if (b.status === 'CANCELLED') return false;

            // 1. Check Date
            if (b.date !== bookForm.date) return false;

            // 2. Check Activity/Device (Must be same to cause conflict)
            const bookedActivity = b.experimentType.trim().toLowerCase();
            if (bookedActivity !== currentActivity) return false;

            // 3. Check Time Overlap
            // Overlap occurs if (StartA < EndB) and (EndA > StartB)
            return (
                bookForm.startTime < b.endTime && bookForm.endTime > b.startTime
            );
        });

        if (hasConflict) {
            alert(`عذراً، يوجد حجز مسبق لنفس النشاط/الجهاز (${bookForm.experimentType}) في هذا التوقيت. يرجى اختيار موعد آخر.`);
            return;
        }

        setSubmitting(true);
        try {
            await addLabBooking({
                ...bookForm,
                labName: 'معمل الدراسات العليا المركزي',
                status: 'CONFIRMED'
            });
            logActivity('حجز معمل', user?.name || bookForm.researcherName, `حجز جديد: ${bookForm.date} - ${bookForm.experimentType}`);
            await fetchData();
            setBookForm(prev => ({...prev, experimentType: ''})); 
            alert('تم حجز الموعد بنجاح ✅');
        } catch (error) {
            console.error(error);
            alert('حدث خطأ أثناء الحجز');
        } finally {
            setSubmitting(false);
        }
    };

    const handleStatusChange = async (id: string, newStatus: BookingStatus) => {
        try {
            await updateLabBooking(id, { status: newStatus });
            // Optimistic Update
            setBookings(prev => prev.map(b => b.id === id ? { ...b, status: newStatus } : b));
            logActivity('تغيير حالة حجز', user?.name || 'Unknown', `تغيير الحالة إلى: ${newStatus}`);
        } catch (error) {
            console.error(error);
            alert('فشل تغيير الحالة');
        }
    };

    const confirmDeleteBooking = async () => {
        if (!bookingToDelete) return;
        setSubmitting(true);
        try {
            await deleteLabBooking(bookingToDelete);
            logActivity('إلغاء/حذف حجز', user?.name || 'Unknown', 'تم حذف سجل الحجز');
            await fetchData();
            setIsDeleteModalOpen(false);
            setBookingToDelete(null);
        } catch (error) {
            console.error(error);
            alert('فشل في حذف السجل');
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusBadge = (status: BookingStatus) => {
        switch(status) {
            case 'CONFIRMED': return <span className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold"><CheckCircle2 className="w-3 h-3"/> مؤكد</span>;
            case 'COMPLETED': return <span className="flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-bold"><PlayCircle className="w-3 h-3"/> تم التنفيذ</span>;
            case 'CANCELLED': return <span className="flex items-center gap-1 bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-bold"><XCircle className="w-3 h-3"/> ملغي</span>;
            default: return null;
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <FlaskConical className="w-6 h-6 text-purple-600" />
                        إدارة المعامل
                    </h1>
                    <p className="text-gray-500 text-sm">دليل المعامل، الجداول الدراسية، ونظام حجز الأجهزة</p>
                </div>
                {canManageLabs && (
                    <button 
                        onClick={() => openLabModal()}
                        className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-purple-700 flex items-center gap-2 shadow-sm"
                    >
                        <Plus className="w-4 h-4" /> إضافة معمل جديد
                    </button>
                )}
            </div>

            {/* Section 1: General Labs Directory (Dynamic) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {labs.map((lab) => (
                    <div key={lab.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:border-purple-200 transition-colors relative group">
                        <div className="bg-purple-50 w-10 h-10 rounded-full flex items-center justify-center mb-3 text-purple-600">
                            <FlaskConical className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold text-gray-800 text-sm mb-1">{lab.name}</h3>
                        <p className="text-xs text-gray-500 mb-2">{lab.location}</p>
                        <div className="text-xs bg-gray-50 p-2 rounded border border-gray-100 mb-3">
                            <span className="font-semibold text-gray-600">المشرف:</span> {lab.supervisor}
                        </div>
                        
                        <button 
                            onClick={() => openScheduleModal(lab)}
                            className="w-full mt-auto bg-green-50 text-green-700 py-1.5 rounded-lg text-xs font-semibold hover:bg-green-100 flex items-center justify-center gap-1 transition-colors"
                        >
                            <Table className="w-3 h-3" /> جدول الحصص
                        </button>

                        {canManageLabs && (
                            <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                    onClick={() => openLabModal(lab)}
                                    className="text-blue-400 hover:text-blue-600 bg-white p-1 rounded-full shadow-sm"
                                    title="تعديل"
                                >
                                    <Edit className="w-4 h-4" />
                                </button>
                                <button 
                                    onClick={() => { setLabToDelete(lab.id); setIsDeleteLabModalOpen(true); }}
                                    className="text-red-400 hover:text-red-600 bg-white p-1 rounded-full shadow-sm"
                                    title="حذف"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                ))}
                {labs.length === 0 && (
                    <div className="col-span-full text-center p-8 bg-gray-50 rounded-xl border border-dashed text-gray-400">
                        لا توجد معامل مسجلة حالياً
                    </div>
                )}
            </div>

            {/* Section 2: PG Lab Scheduler */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-purple-800 to-purple-900 p-6 text-white flex justify-between items-center">
                    <div>
                        <h2 className="text-lg font-bold flex items-center gap-2">
                            <Calendar className="w-5 h-5" />
                            تنسيق العمل - معمل الدراسات العليا
                        </h2>
                        <p className="text-purple-200 text-xs mt-1">
                            يرجى حجز المواعيد مسبقاً لضمان توفر الأجهزة ومنع التزاحم.
                        </p>
                    </div>
                </div>

                <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Booking Form */}
                    <div className="lg:col-span-1 bg-purple-50 p-5 rounded-xl h-fit">
                        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <Clock className="w-4 h-4" /> حجز موعد جديد
                        </h3>
                        <form onSubmit={handleBooking} className="space-y-3">
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">اسم الباحث</label>
                                <input 
                                    type="text" required
                                    className="w-full text-sm p-2 rounded border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    value={bookForm.researcherName}
                                    onChange={(e) => setBookForm({...bookForm, researcherName: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">التاريخ</label>
                                <input 
                                    type="date" required
                                    className="w-full text-sm p-2 rounded border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    value={bookForm.date}
                                    onChange={(e) => setBookForm({...bookForm, date: e.target.value})}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">من الساعة</label>
                                    <input 
                                        type="time" required
                                        className="w-full text-sm p-2 rounded border border-purple-200"
                                        value={bookForm.startTime}
                                        onChange={(e) => setBookForm({...bookForm, startTime: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">إلى الساعة</label>
                                    <input 
                                        type="time" required
                                        className="w-full text-sm p-2 rounded border border-purple-200"
                                        value={bookForm.endTime}
                                        onChange={(e) => setBookForm({...bookForm, endTime: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">نوع التجربة / الجهاز المطلوب</label>
                                <input 
                                    type="text" placeholder="مثال: PCR, Centrifuge" required
                                    className="w-full text-sm p-2 rounded border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    value={bookForm.experimentType}
                                    onChange={(e) => setBookForm({...bookForm, experimentType: e.target.value})}
                                />
                                <p className="text-[10px] text-gray-500 mt-1">
                                    * سيتم التحقق من التعارض فقط إذا كان الحجز لنفس الجهاز/النشاط.
                                </p>
                            </div>
                            <button 
                                type="submit" 
                                disabled={submitting}
                                className="w-full bg-purple-700 text-white py-2 rounded-lg text-sm font-bold hover:bg-purple-800 transition-colors flex justify-center items-center gap-2"
                            >
                                <Plus className="w-4 h-4" /> تأكيد الحجز
                            </button>
                        </form>
                    </div>

                    {/* Bookings List */}
                    <div className="lg:col-span-2">
                        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-600" /> الحجوزات القادمة
                        </h3>
                        <div className="overflow-hidden rounded-lg border border-gray-200">
                            <table className="w-full text-sm text-right">
                                <thead className="bg-gray-50 text-gray-600">
                                    <tr>
                                        <th className="p-3">التاريخ</th>
                                        <th className="p-3">الوقت</th>
                                        <th className="p-3">الباحث</th>
                                        <th className="p-3">النشاط</th>
                                        <th className="p-3">الحالة</th>
                                        <th className="p-3">إجراءات</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {loading ? (
                                        <tr><td colSpan={6} className="p-6 text-center text-gray-400">جاري التحميل...</td></tr>
                                    ) : (
                                        bookings.map(book => (
                                            <tr key={book.id} className={`hover:bg-gray-50 ${book.status === 'CANCELLED' ? 'bg-gray-50 opacity-60' : ''}`}>
                                                <td className="p-3 font-mono text-gray-600">{book.date}</td>
                                                <td className="p-3 font-mono text-purple-700 font-bold">
                                                    {book.startTime} - {book.endTime}
                                                </td>
                                                <td className="p-3 font-bold text-gray-800">{book.researcherName}</td>
                                                <td className="p-3 text-gray-600">{book.experimentType}</td>
                                                <td className="p-3">
                                                    {canManageLabs ? (
                                                        <select 
                                                            value={book.status} 
                                                            onChange={(e) => handleStatusChange(book.id, e.target.value as BookingStatus)}
                                                            className={`text-xs p-1 rounded border focus:outline-none cursor-pointer font-bold ${
                                                                book.status === 'CONFIRMED' ? 'text-green-700 bg-green-50 border-green-200' :
                                                                book.status === 'COMPLETED' ? 'text-blue-700 bg-blue-50 border-blue-200' :
                                                                'text-red-700 bg-red-50 border-red-200'
                                                            }`}
                                                        >
                                                            <option value="CONFIRMED">مؤكد</option>
                                                            <option value="COMPLETED">تم التنفيذ</option>
                                                            <option value="CANCELLED">ملغي</option>
                                                        </select>
                                                    ) : (
                                                        getStatusBadge(book.status)
                                                    )}
                                                </td>
                                                <td className="p-3">
                                                    {(canManageLabs || user?.name === book.researcherName) && (
                                                        <button 
                                                            onClick={() => { setBookingToDelete(book.id); setIsDeleteModalOpen(true); }}
                                                            className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50"
                                                            title="حذف السجل"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                    {!loading && bookings.length === 0 && (
                                        <tr><td colSpan={6} className="p-8 text-center text-gray-400 italic">لا توجد حجوزات قادمة</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Add/Edit Lab Modal */}
            {isAddLabModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl w-full max-w-sm shadow-2xl animate-in fade-in zoom-in-95 p-6">
                         <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-gray-800">{editingLabId ? 'تعديل بيانات المعمل' : 'إضافة معمل جديد'}</h3>
                            <button onClick={() => setIsAddLabModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSaveLab} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">اسم المعمل</label>
                                <input 
                                    type="text" required 
                                    className="w-full border p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    value={labForm.name} onChange={e => setLabForm({...labForm, name: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">المشرف</label>
                                <input 
                                    type="text" required placeholder="أ.د/ ..."
                                    className="w-full border p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    value={labForm.supervisor} onChange={e => setLabForm({...labForm, supervisor: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">المكان</label>
                                <input 
                                    type="text" required 
                                    className="w-full border p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    value={labForm.location} onChange={e => setLabForm({...labForm, location: e.target.value})}
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-4">
                                <button type="button" onClick={() => setIsAddLabModalOpen(false)} className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg">إلغاء</button>
                                <button 
                                    type="submit" disabled={submitting}
                                    className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2"
                                >
                                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    حفظ
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Lab Schedule Modal */}
            {isScheduleModalOpen && selectedLabForSchedule && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl w-full max-w-2xl shadow-2xl animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b flex justify-between items-center bg-purple-50 rounded-t-xl">
                            <div>
                                <h3 className="text-xl font-bold text-gray-800">جدول الحصص الأسبوعي</h3>
                                <p className="text-sm text-purple-700">{selectedLabForSchedule.name}</p>
                            </div>
                            <button onClick={() => setIsScheduleModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6">
                            {/* Add/Edit Class Form (Admin/Staff) */}
                            {canManageLabs && (
                                <form onSubmit={handleSaveClass} className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-200">
                                    <h4 className="font-bold text-sm text-gray-700 mb-3 flex items-center gap-2">
                                        <Plus className="w-4 h-4" /> {editingClassId ? 'تعديل درس عملي' : 'إضافة درس عملي'}
                                    </h4>
                                    <div className="grid grid-cols-2 gap-3 mb-3">
                                        <input 
                                            type="text" placeholder="اسم المادة (مثال: فطريات)" required
                                            className="w-full text-sm p-2 rounded border focus:outline-none focus:ring-1 focus:ring-purple-500"
                                            value={classForm.courseName} onChange={e => setClassForm({...classForm, courseName: e.target.value})}
                                        />
                                        <input 
                                            type="text" placeholder="القائم بالتدريس" required
                                            className="w-full text-sm p-2 rounded border focus:outline-none focus:ring-1 focus:ring-purple-500"
                                            value={classForm.instructor} onChange={e => setClassForm({...classForm, instructor: e.target.value})}
                                        />
                                    </div>
                                    <div className="grid grid-cols-3 gap-3">
                                        <select 
                                            className="text-sm p-2 rounded border focus:outline-none bg-white"
                                            value={classForm.day} onChange={e => setClassForm({...classForm, day: e.target.value})}
                                        >
                                            <option value="Saturday">السبت</option>
                                            <option value="Sunday">الأحد</option>
                                            <option value="Monday">الاثنين</option>
                                            <option value="Tuesday">الثلاثاء</option>
                                            <option value="Wednesday">الأربعاء</option>
                                            <option value="Thursday">الخميس</option>
                                        </select>
                                        <input 
                                            type="time" required title="من"
                                            className="text-sm p-2 rounded border focus:outline-none"
                                            value={classForm.startTime} onChange={e => setClassForm({...classForm, startTime: e.target.value})}
                                        />
                                        <input 
                                            type="time" required title="إلى"
                                            className="text-sm p-2 rounded border focus:outline-none"
                                            value={classForm.endTime} onChange={e => setClassForm({...classForm, endTime: e.target.value})}
                                        />
                                    </div>
                                    <div className="flex gap-2 mt-3">
                                        {editingClassId && (
                                            <button 
                                                type="button" 
                                                onClick={() => {
                                                    setEditingClassId(null);
                                                    setClassForm(prev => ({ ...prev, courseName: '', instructor: '' }));
                                                }}
                                                className="bg-gray-200 text-gray-600 px-3 py-2 rounded-lg text-sm font-bold hover:bg-gray-300"
                                            >
                                                إلغاء التعديل
                                            </button>
                                        )}
                                        <button 
                                            type="submit" disabled={submitting}
                                            className="flex-1 bg-purple-600 text-white py-2 rounded-lg text-sm font-bold hover:bg-purple-700"
                                        >
                                            {editingClassId ? 'حفظ التعديلات' : 'إضافة للجدول'}
                                        </button>
                                    </div>
                                </form>
                            )}

                            {/* Schedule List */}
                            <div className="space-y-4">
                                {['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'].map(day => {
                                    const dayClasses = labClasses.filter(c => c.labId === selectedLabForSchedule.id && c.day === day)
                                                                 .sort((a,b) => a.startTime.localeCompare(b.startTime));
                                    
                                    if (dayClasses.length === 0) return null;

                                    return (
                                        <div key={day}>
                                            <h5 className="font-bold text-gray-700 text-sm mb-2 border-b pb-1">{translateDay(day)}</h5>
                                            <ul className="space-y-2">
                                                {dayClasses.map(cls => (
                                                    <li key={cls.id} className="flex justify-between items-center bg-white p-2 rounded border border-gray-200 shadow-sm text-sm">
                                                        <div className="flex gap-4">
                                                            <span className="font-mono text-purple-700 font-bold w-24">{cls.startTime} - {cls.endTime}</span>
                                                            <span className="font-semibold text-gray-800">{cls.courseName}</span>
                                                            <span className="text-gray-500 text-xs flex items-center">({cls.instructor})</span>
                                                        </div>
                                                        {canManageLabs && (
                                                            <div className="flex items-center gap-1">
                                                                <button 
                                                                    onClick={() => initiateEditClass(cls)}
                                                                    className="text-blue-400 hover:text-blue-600 p-1 rounded hover:bg-blue-50"
                                                                    title="تعديل"
                                                                >
                                                                    <Edit className="w-3 h-3" />
                                                                </button>
                                                                <button 
                                                                    onClick={() => initiateDeleteClass(cls.id)}
                                                                    className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50"
                                                                    title="حذف"
                                                                >
                                                                    <Trash2 className="w-3 h-3" />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    );
                                })}
                                {labClasses.filter(c => c.labId === selectedLabForSchedule.id).length === 0 && (
                                    <p className="text-center text-gray-400 py-4 italic">لا توجد دروس مسجلة في هذا المعمل.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Lab Confirmation Modal */}
            {isDeleteLabModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl w-full max-w-sm shadow-2xl animate-in fade-in zoom-in-95 p-6">
                        <div className="flex flex-col items-center text-center">
                            <div className="bg-red-100 p-3 rounded-full text-red-600 mb-4">
                                <AlertTriangle className="w-8 h-8" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-800 mb-2">حذف المعمل</h3>
                            <p className="text-gray-500 text-sm mb-6">
                                هل أنت متأكد من حذف هذا المعمل؟ سيؤدي ذلك لحذف جدول الحصص المرتبط به أيضاً.
                            </p>
                            
                            <div className="flex gap-3 w-full">
                                <button 
                                    onClick={() => setIsDeleteLabModalOpen(false)}
                                    className="flex-1 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium"
                                >
                                    إلغاء
                                </button>
                                <button 
                                    onClick={confirmDeleteLab}
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
            
            {/* Delete CLASS Confirmation Modal */}
            {isDeleteClassModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl w-full max-w-sm shadow-2xl animate-in fade-in zoom-in-95 p-6">
                        <div className="flex flex-col items-center text-center">
                            <div className="bg-red-100 p-3 rounded-full text-red-600 mb-4">
                                <AlertTriangle className="w-8 h-8" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-800 mb-2">حذف الحصة</h3>
                            <p className="text-gray-500 text-sm mb-6">
                                هل أنت متأكد من حذف هذا الدرس من الجدول؟
                            </p>
                            
                            <div className="flex gap-3 w-full">
                                <button 
                                    onClick={() => setIsDeleteClassModalOpen(false)}
                                    className="flex-1 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium"
                                >
                                    إلغاء
                                </button>
                                <button 
                                    onClick={confirmDeleteClass}
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

            {/* Delete Booking Confirmation Modal */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl w-full max-w-sm shadow-2xl animate-in fade-in zoom-in-95 p-6">
                        <div className="flex flex-col items-center text-center">
                            <div className="bg-red-100 p-3 rounded-full text-red-600 mb-4">
                                <AlertTriangle className="w-8 h-8" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-800 mb-2">إلغاء الحجز</h3>
                            <p className="text-gray-500 text-sm mb-6">
                                هل أنت متأكد من إلغاء هذا الموعد؟ سيتم إتاحته لباحثين آخرين.
                            </p>
                            
                            <div className="flex gap-3 w-full">
                                <button 
                                    onClick={() => setIsDeleteModalOpen(false)}
                                    className="flex-1 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium"
                                >
                                    تراجع
                                </button>
                                <button 
                                    onClick={confirmDeleteBooking}
                                    disabled={submitting}
                                    className="flex-1 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium"
                                >
                                    نعم، إلغاء (حذف نهائي)
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
