
import React, { useState, useEffect } from 'react';
import { 
    Megaphone, 
    Plus, 
    Calendar, 
    MapPin, 
    ExternalLink, 
    Trash2, 
    Loader2,
    X,
    Bus, // Trip
    Mic2, // Seminar
    Presentation, // Workshop
    Users, // Conference
    BookOpen, // Course
    Edit,
    CheckCircle2,
    Clock,
    XCircle,
    Save
} from 'lucide-react';
import { DeptEvent, DeptEventType, EventStatus, User } from '../types';
import { getEvents, addEvent, deleteEvent, updateEvent, logActivity } from '../services/dbService';

interface EventsProps {
    user?: User;
}

export const Events: React.FC<EventsProps> = ({ user }) => {
    const [events, setEvents] = useState<DeptEvent[]>([]);
    const [filteredEvents, setFilteredEvents] = useState<DeptEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    
    const [filterType, setFilterType] = useState<'ALL' | DeptEventType>('ALL');
    
    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEventId, setEditingEventId] = useState<string | null>(null);
    
    // Delete Modal State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [eventToDelete, setEventToDelete] = useState<string | null>(null);

    const [form, setForm] = useState({
        title: '',
        type: 'WORKSHOP' as DeptEventType,
        date: new Date().toISOString().split('T')[0],
        location: '',
        description: '',
        regLink: '',
        status: 'UPCOMING' as EventStatus
    });

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (filterType === 'ALL') {
            setFilteredEvents(events);
        } else {
            setFilteredEvents(events.filter(e => e.type === filterType));
        }
    }, [events, filterType]);

    const fetchData = async () => {
        setLoading(true);
        const data = await getEvents();
        // Sort by date descending
        const sorted = data.sort((a, b) => b.date.localeCompare(a.date));
        setEvents(sorted);
        setLoading(false);
    };

    const openModal = (event?: DeptEvent) => {
        if (event) {
            setEditingEventId(event.id);
            setForm({
                title: event.title,
                type: event.type,
                date: event.date,
                location: event.location,
                description: event.description,
                regLink: event.regLink || '',
                status: event.status || 'UPCOMING'
            });
        } else {
            setEditingEventId(null);
            setForm({
                title: '',
                type: 'WORKSHOP',
                date: new Date().toISOString().split('T')[0],
                location: '',
                description: '',
                regLink: '',
                status: 'UPCOMING'
            });
        }
        setIsModalOpen(true);
    };

    const handleSaveEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        const userName = user?.name || 'Unknown';
        try {
            if (editingEventId) {
                await updateEvent(editingEventId, form);
                logActivity('تعديل فعالية', userName, `تم تعديل: ${form.title}`);
            } else {
                await addEvent(form);
                logActivity('نشر فعالية جديدة', userName, `العنوان: ${form.title}`);
            }
            await fetchData();
            setIsModalOpen(false);
            alert(editingEventId ? 'تم تعديل الفعالية بنجاح' : 'تم نشر الفعالية بنجاح');
        } catch (error) {
            console.error(error);
            alert('حدث خطأ أثناء الحفظ');
        } finally {
            setSubmitting(false);
        }
    };

    const confirmDelete = async () => {
        if (!eventToDelete) return;
        setSubmitting(true);
        try {
            const evt = events.find(e => e.id === eventToDelete);
            await deleteEvent(eventToDelete);
            logActivity('حذف فعالية', user?.name || 'Unknown', `تم حذف: ${evt?.title}`);
            await fetchData();
            setIsDeleteModalOpen(false);
            setEventToDelete(null);
        } catch (error) {
            alert('فشل في الحذف');
        } finally {
            setSubmitting(false);
        }
    };

    // Helper to get styles based on type
    const getTypeStyle = (type: DeptEventType) => {
        switch(type) {
            case 'WORKSHOP': return { color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-r-4 border-r-orange-500', label: 'ورشة عمل', icon: Presentation };
            case 'SEMINAR': return { color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-r-4 border-r-blue-500', label: 'سيمينار', icon: Mic2 };
            case 'TRIP': return { color: 'text-green-600', bg: 'bg-green-50', border: 'border-r-4 border-r-green-500', label: 'رحلة / قافلة', icon: Bus };
            case 'CONFERENCE': return { color: 'text-red-600', bg: 'bg-red-50', border: 'border-r-4 border-r-red-500', label: 'مؤتمر', icon: Users };
            case 'COURSE': return { color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-r-4 border-r-purple-500', label: 'دورة تدريبية', icon: BookOpen };
            default: return { color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-300', label: 'عام', icon: Megaphone };
        }
    };

    const getStatusBadge = (status: EventStatus) => {
        switch(status) {
            case 'UPCOMING': return <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 border border-green-200"><Clock className="w-3 h-3" /> قادم</span>;
            case 'COMPLETED': return <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 border border-gray-200"><CheckCircle2 className="w-3 h-3" /> مكتمل</span>;
            case 'CANCELLED': return <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 border border-red-200"><XCircle className="w-3 h-3" /> ملغي</span>;
            default: return null;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Megaphone className="w-6 h-6 text-purple-600" />
                        أنشطة وفعاليات القسم
                    </h1>
                    <p className="text-gray-500 text-sm">ورش العمل، السيمينارات، الرحلات والمؤتمرات العلمية</p>
                </div>
                <button 
                    onClick={() => openModal()}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    <span>إضافة فعالية جديدة</span>
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2 pb-2 border-b border-gray-200">
                <FilterButton active={filterType === 'ALL'} onClick={() => setFilterType('ALL')} label="الكل" />
                <FilterButton active={filterType === 'WORKSHOP'} onClick={() => setFilterType('WORKSHOP')} label="ورش عمل" />
                <FilterButton active={filterType === 'SEMINAR'} onClick={() => setFilterType('SEMINAR')} label="سيمينارات" />
                <FilterButton active={filterType === 'TRIP'} onClick={() => setFilterType('TRIP')} label="رحلات وقوافل" />
                <FilterButton active={filterType === 'CONFERENCE'} onClick={() => setFilterType('CONFERENCE')} label="مؤتمرات" />
                <FilterButton active={filterType === 'COURSE'} onClick={() => setFilterType('COURSE')} label="دورات تدريبية" />
            </div>

            {/* Events Grid */}
            {loading ? (
                <div className="p-12 text-center text-gray-500 flex flex-col items-center gap-2">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                    <span>جاري تحميل الفعاليات...</span>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredEvents.map(event => {
                        const style = getTypeStyle(event.type);
                        const Icon = style.icon;
                        return (
                            <div key={event.id} className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow relative flex flex-col ${style.border}`}>
                                <div className="p-5 flex-1">
                                    <div className="flex justify-between items-start mb-3">
                                        <span className={`px-2 py-1 rounded text-xs font-bold flex items-center gap-1 ${style.bg} ${style.color}`}>
                                            <Icon className="w-3 h-3" /> {style.label}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            {getStatusBadge(event.status)}
                                            <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-mono flex items-center gap-1">
                                                <Calendar className="w-3 h-3" /> {event.date}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <h3 className="font-bold text-lg text-gray-800 mb-2">{event.title}</h3>
                                    
                                    <div className="flex items-center gap-1 text-sm text-gray-500 mb-3">
                                        <MapPin className="w-4 h-4" />
                                        <span>{event.location}</span>
                                    </div>
                                    
                                    <p className="text-gray-600 text-sm leading-relaxed mb-4">
                                        {event.description}
                                    </p>
                                </div>

                                <div className="px-5 pb-5 mt-auto flex items-center justify-between">
                                    {event.regLink && event.status === 'UPCOMING' ? (
                                        <a 
                                            href={event.regLink} 
                                            target="_blank" 
                                            rel="noreferrer"
                                            className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-purple-700 flex items-center gap-2 shadow-sm w-fit"
                                        >
                                            سجل الآن <ExternalLink className="w-3 h-3" />
                                        </a>
                                    ) : (
                                        <span className="text-xs text-gray-400 italic">
                                            {event.status === 'UPCOMING' ? 'لا يوجد رابط تسجيل' : 'انتهى التسجيل'}
                                        </span>
                                    )}

                                    <div className="flex items-center gap-1">
                                        <button 
                                            onClick={() => openModal(event)}
                                            className="text-blue-400 hover:text-blue-600 p-2 rounded-full hover:bg-blue-50 transition-colors"
                                            title="تعديل"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button 
                                            onClick={() => { setEventToDelete(event.id); setIsDeleteModalOpen(true); }}
                                            className="text-red-400 hover:text-red-600 p-2 rounded-full hover:bg-red-50 transition-colors"
                                            title="حذف"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    {filteredEvents.length === 0 && (
                        <div className="col-span-full py-12 text-center text-gray-400 bg-gray-50 rounded-xl border border-dashed">
                            لا توجد فعاليات مسجلة في هذا التصنيف حالياً.
                        </div>
                    )}
                </div>
            )}

            {/* Add/Edit Event Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in-95">
                        <div className="p-6 border-b flex justify-between items-center">
                            <h3 className="text-xl font-bold text-gray-800">
                                {editingEventId ? 'تعديل الفعالية' : 'إضافة نشاط جديد'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleSaveEvent} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">عنوان الفعالية</label>
                                <input 
                                    type="text" required 
                                    className="w-full border p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    value={form.title} onChange={e => setForm({...form, title: e.target.value})}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">النوع</label>
                                    <select 
                                        className="w-full border p-2 rounded-lg focus:outline-none bg-white"
                                        value={form.type} onChange={e => setForm({...form, type: e.target.value as DeptEventType})}
                                    >
                                        <option value="WORKSHOP">ورشة عمل</option>
                                        <option value="SEMINAR">سيمينار</option>
                                        <option value="TRIP">رحلة / قافلة</option>
                                        <option value="CONFERENCE">مؤتمر</option>
                                        <option value="COURSE">دورة تدريبية</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">الحالة</label>
                                    <select 
                                        className="w-full border p-2 rounded-lg focus:outline-none bg-white font-semibold"
                                        value={form.status} onChange={e => setForm({...form, status: e.target.value as EventStatus})}
                                    >
                                        <option value="UPCOMING" className="text-green-600">قادمة (مجدولة)</option>
                                        <option value="COMPLETED" className="text-gray-600">مكتملة (أرشيف)</option>
                                        <option value="CANCELLED" className="text-red-600">ملغية</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">التاريخ</label>
                                    <input 
                                        type="date" required 
                                        className="w-full border p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        value={form.date} onChange={e => setForm({...form, date: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">المكان</label>
                                <input 
                                    type="text" required placeholder="مثال: قاعة السيمنار"
                                    className="w-full border p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    value={form.location} onChange={e => setForm({...form, location: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">التفاصيل</label>
                                <textarea 
                                    rows={3} placeholder="وصف مختصر للفعالية..."
                                    className="w-full border p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">رابط التسجيل (اختياري)</label>
                                <input 
                                    type="text" placeholder="Google Form Link..."
                                    className="w-full border p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ltr-text"
                                    value={form.regLink} onChange={e => setForm({...form, regLink: e.target.value})}
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-4 border-t mt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">إلغاء</button>
                                <button 
                                    type="submit" disabled={submitting}
                                    className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2"
                                >
                                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingEventId ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />)}
                                    {editingEventId ? 'حفظ التعديلات' : 'نشر الفعالية'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl w-full max-w-sm shadow-2xl animate-in fade-in zoom-in-95 p-6 text-center">
                        <div className="bg-red-100 p-3 rounded-full inline-block mb-4">
                            <Trash2 className="w-8 h-8 text-red-600" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800 mb-2">حذف الفعالية</h3>
                        <p className="text-gray-500 text-sm mb-6">
                            هل أنت متأكد من حذف هذا النشاط؟
                        </p>
                        <div className="flex gap-3">
                            <button 
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-200"
                            >
                                تراجع
                            </button>
                            <button 
                                onClick={confirmDelete}
                                disabled={submitting}
                                className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 flex items-center justify-center gap-2"
                            >
                                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                حذف
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const FilterButton = ({ active, onClick, label }: { active: boolean, onClick: () => void, label: string }) => (
    <button 
        onClick={onClick}
        className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
            active 
            ? 'bg-purple-600 text-white shadow-md' 
            : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
        }`}
    >
        {label}
    </button>
);
