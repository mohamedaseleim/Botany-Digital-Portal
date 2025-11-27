import React, { useState, useEffect } from 'react';
import { Activity, Trash2, RefreshCcw, ShieldAlert, Search, AlertTriangle, Loader2, PlusCircle } from 'lucide-react';
import { ActivityLogItem } from '@/types';
import { getActivityLogs, deleteActivityLog, logActivity } from '@/services/dbService';

export const ActivityLogs: React.FC = () => {
    const [logs, setLogs] = useState<ActivityLogItem[]>([]);
    const [filteredLogs, setFilteredLogs] = useState<ActivityLogItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Delete Modal State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [logToDelete, setLogToDelete] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchLogs();
    }, []);

    useEffect(() => {
        if (!searchTerm) {
            setFilteredLogs(logs);
        } else {
            const term = searchTerm.toLowerCase();
            setFilteredLogs(logs.filter(l => 
                l.action.toLowerCase().includes(term) ||
                l.performedBy.toLowerCase().includes(term) ||
                l.details.toLowerCase().includes(term)
            ));
        }
    }, [searchTerm, logs]);

    const fetchLogs = async () => {
        setLoading(true);
        const data = await getActivityLogs();
        setLogs(data);
        setFilteredLogs(data);
        setLoading(false);
    };

    const initiateDelete = (id: string) => {
        setLogToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!logToDelete) return;
        setSubmitting(true);
        try {
            await deleteActivityLog(logToDelete);
            await fetchLogs();
            setIsDeleteModalOpen(false);
            setLogToDelete(null);
        } catch (error) {
            console.error(error);
            alert('فشل حذف السجل');
        } finally {
            setSubmitting(false);
        }
    };

    // زر الاختبار
    const handleTestLog = async () => {
        setLoading(true);
        await logActivity("اختبار يدوي", "Admin", "تجربة إضافة سجل للتأكد من الاتصال");
        await fetchLogs();
        setLoading(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Activity className="w-6 h-6 text-red-600" />
                        سجل النشاطات والتدقيق
                    </h1>
                    <p className="text-gray-500 text-sm">متابعة الإجراءات التي تمت على النظام (خاص بالمدير فقط)</p>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={handleTestLog} 
                        className="text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-2 rounded-lg flex items-center gap-1"
                    >
                        <PlusCircle className="w-4 h-4" /> سجل تجريبي
                    </button>
                    <button 
                        onClick={fetchLogs} 
                        className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg flex items-center gap-1"
                    >
                        <RefreshCcw className="w-4 h-4" /> تحديث
                    </button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div className="relative">
                    <Search className="w-5 h-5 text-gray-400 absolute right-3 top-2.5" />
                    <input 
                        type="text" 
                        placeholder="بحث باسم المستخدم أو نوع الإجراء..."
                        className="w-full border p-2 pr-10 rounded-lg outline-none focus:border-red-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Logs Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right">
                        <thead className="bg-gray-50 text-gray-600 font-medium">
                            <tr>
                                <th className="p-4">الإجراء</th>
                                <th className="p-4">قام به</th>
                                <th className="p-4">التفاصيل</th>
                                <th className="p-4">التوقيت</th>
                                <th className="p-4">تحكم</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {loading ? (
                                <tr><td colSpan={5} className="p-8 text-center text-gray-500">جاري التحميل...</td></tr>
                            ) : filteredLogs.length > 0 ? (
                                filteredLogs.map(log => (
                                    <tr key={log.id} className="hover:bg-gray-50">
                                        <td className="p-4 font-bold text-gray-800">{log.action}</td>
                                        <td className="p-4">
                                            <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-bold">
                                                {log.performedBy}
                                            </span>
                                        </td>
                                        <td className="p-4 text-gray-600">{log.details}</td>
                                        <td className="p-4 font-mono text-xs text-gray-500" dir="ltr">{new Date(log.timestamp).toLocaleString('ar-EG')}</td>
                                        <td className="p-4">
                                            <button 
                                                onClick={() => initiateDelete(log.id)}
                                                className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50"
                                                title="حذف من السجل"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-gray-400 flex flex-col items-center justify-center">
                                        <ShieldAlert className="w-10 h-10 mb-2 opacity-20" />
                                        <p>لا توجد نشاطات مسجلة حتى الآن</p>
                                        <p className="text-xs mt-2 text-blue-500 cursor-pointer" onClick={handleTestLog}>اضغط هنا لإضافة سجل تجريبي</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl w-full max-w-sm shadow-2xl animate-in fade-in zoom-in-95 p-6 text-center">
                        <div className="bg-red-100 p-3 rounded-full inline-block mb-4">
                            <AlertTriangle className="w-8 h-8 text-red-600" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800 mb-2">حذف السجل</h3>
                        <p className="text-gray-500 text-sm mb-6">
                            هل أنت متأكد من حذف هذا النشاط من السجل؟
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