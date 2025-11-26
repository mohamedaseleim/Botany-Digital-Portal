
import React, { useState, useEffect } from 'react';
import { 
    Sprout, 
    AlertTriangle, 
    CheckCircle2, 
    XCircle, 
    Loader2, 
    X, 
    Calendar, 
    User, 
    FileText, 
    Trash2,
    Leaf,
    History
} from 'lucide-react';
import { GreenhousePlot, GreenhouseHistoryItem, User as UserType } from '../types';
import { getGreenhousePlots, updateGreenhousePlot, getGreenhouseHistory, addGreenhouseHistory, deleteGreenhouseHistory, logActivity } from '../services/dbService';

interface GreenhouseProps {
    user?: UserType;
}

export const Greenhouse: React.FC<GreenhouseProps> = ({ user }) => {
    const [plots, setPlots] = useState<GreenhousePlot[]>([]);
    const [historyList, setHistoryList] = useState<GreenhouseHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Modal States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPlot, setSelectedPlot] = useState<GreenhousePlot | null>(null);
    
    // Vacate Confirmation Modal
    const [isVacateModalOpen, setIsVacateModalOpen] = useState(false);

    // Delete History Modal
    const [isDeleteHistoryModalOpen, setIsDeleteHistoryModalOpen] = useState(false);
    const [historyToDelete, setHistoryToDelete] = useState<string | null>(null);

    // Booking Form
    const [bookForm, setBookForm] = useState({
        researcher: '',
        plantType: '',
        notes: '',
        startDate: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        const [dataPlots, dataHistory] = await Promise.all([
            getGreenhousePlots(),
            getGreenhouseHistory()
        ]);
        // Ensure sorting by number for plots
        setPlots(dataPlots.sort((a, b) => a.number - b.number));
        // Sort history by end date descending
        setHistoryList(dataHistory.sort((a, b) => b.endDate.localeCompare(a.endDate)));
        setLoading(false);
    };

    const openPlotModal = (plot: GreenhousePlot) => {
        setSelectedPlot(plot);
        // If occupied, fill form for viewing (read-only)
        if (plot.status === 'OCCUPIED') {
            setBookForm({
                researcher: plot.researcher || '',
                plantType: plot.plantType || '',
                notes: plot.notes || '',
                startDate: plot.startDate || ''
            });
        } else {
            // If free, reset form for booking
            setBookForm({
                researcher: '',
                plantType: '',
                notes: '',
                startDate: new Date().toISOString().split('T')[0]
            });
        }
        setIsModalOpen(true);
    };

    const handleBooking = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPlot) return;
        
        setSubmitting(true);
        try {
            await updateGreenhousePlot(selectedPlot.id, {
                status: 'OCCUPIED',
                ...bookForm
            });
            logActivity('حجز حوض صوبة', user?.name || bookForm.researcher, `تم حجز الحوض رقم ${selectedPlot.number}`);
            await fetchData();
            setIsModalOpen(false);
            alert('تم حجز الحوض بنجاح 🌱');
        } catch (error) {
            console.error(error);
            alert('حدث خطأ أثناء الحجز');
        } finally {
            setSubmitting(false);
        }
    };

    const handleVacate = async () => {
        if (!selectedPlot) return;
        setSubmitting(true);
        try {
            // 1. Archive to History first (if data exists)
            if (selectedPlot.researcher && selectedPlot.plantType) {
                await addGreenhouseHistory({
                    plotNumber: selectedPlot.number,
                    researcher: selectedPlot.researcher,
                    plantType: selectedPlot.plantType,
                    startDate: selectedPlot.startDate || 'Unknown',
                    endDate: new Date().toISOString().split('T')[0], // Today
                    notes: selectedPlot.notes
                });
            }

            // 2. Clear the plot
            await updateGreenhousePlot(selectedPlot.id, {
                status: 'FREE',
                researcher: undefined,
                plantType: undefined,
                notes: undefined,
                startDate: undefined
            });
            logActivity('إخلاء حوض صوبة', user?.name || 'Unknown', `تم إخلاء الحوض رقم ${selectedPlot.number} وأرشفته`);
            await fetchData();
            setIsVacateModalOpen(false);
            setIsModalOpen(false);
            alert('تم إخلاء الحوض وأرشفة التجربة في السجل');
        } catch (error) {
            console.error(error);
            alert('فشل في إخلاء الحوض');
        } finally {
            setSubmitting(false);
        }
    };

    const confirmDeleteHistory = async () => {
        if (!historyToDelete) return;
        setSubmitting(true);
        try {
            await deleteGreenhouseHistory(historyToDelete);
            logActivity('حذف من سجل الصوبة', user?.name || 'Unknown', 'تم حذف سجل قديم');
            await fetchData();
            setIsDeleteHistoryModalOpen(false);
            setHistoryToDelete(null);
        } catch (error) {
            alert('فشل في الحذف');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Leaf className="w-6 h-6 text-green-600" />
                        إدارة صوبة القسم
                    </h1>
                    <p className="text-gray-500 text-sm">توزيع الأحواض الزراعية (Plots Allocation) ومتابعة التجارب</p>
                </div>
                
                {/* Legend */}
                <div className="flex gap-4 text-xs font-bold bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-100 border border-green-300"></div>
                        <span className="text-green-700">متاح للزراعة</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-100 border border-red-300"></div>
                        <span className="text-red-700">مشغول (تجربة قائمة)</span>
                    </div>
                </div>
            </div>

            {/* Plots Grid */}
            {loading ? (
                <div className="p-12 text-center text-gray-500 flex flex-col items-center gap-2">
                    <Loader2 className="w-8 h-8 animate-spin text-green-600" />
                    <span>جاري تحميل خريطة الصوبة...</span>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {plots.map(plot => {
                        const isOccupied = plot.status === 'OCCUPIED';
                        return (
                            <div 
                                key={plot.id}
                                onClick={() => openPlotModal(plot)}
                                className={`
                                    relative h-48 rounded-2xl border-2 cursor-pointer transition-all duration-200 transform hover:-translate-y-1 hover:shadow-lg p-4 flex flex-col justify-between text-center group
                                    ${isOccupied 
                                        ? 'bg-red-50 border-red-200 hover:border-red-300' 
                                        : 'bg-green-50 border-green-200 hover:border-green-400 border-dashed'}
                                `}
                            >
                                <div className="absolute top-3 right-3 font-mono font-bold text-lg opacity-30">
                                    #{plot.number}
                                </div>

                                {isOccupied ? (
                                    <>
                                        <div className="flex justify-center">
                                            <div className="bg-red-100 p-3 rounded-full">
                                                <Sprout className="w-8 h-8 text-red-500" />
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-800 truncate">{plot.plantType}</h3>
                                            <p className="text-xs text-red-600 font-semibold mt-1 truncate">{plot.researcher}</p>
                                        </div>
                                        <span className="text-[10px] text-gray-400 bg-white/50 py-1 rounded-lg">
                                            منذ: {plot.startDate}
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <div className="flex-1 flex flex-col items-center justify-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                            <Sprout className="w-8 h-8 text-green-400" />
                                            <span className="text-sm font-bold text-green-600">متاح للزراعة</span>
                                        </div>
                                        <button className="w-full py-1 bg-green-200 text-green-800 rounded text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                                            حجز الحوض
                                        </button>
                                    </>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* History / Archives Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mt-8">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <History className="w-5 h-5 text-gray-600" />
                        <h3 className="font-bold text-gray-800">سجل التجارب السابقة (الأرشيف)</h3>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right">
                        <thead className="bg-gray-50 text-gray-600 font-medium">
                            <tr>
                                <th className="p-4">رقم الحوض</th>
                                <th className="p-4">اسم الباحث</th>
                                <th className="p-4">النبات</th>
                                <th className="p-4">تاريخ الزراعة</th>
                                <th className="p-4">تاريخ الانتهاء</th>
                                <th className="p-4">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {historyList.map(item => (
                                <tr key={item.id} className="hover:bg-gray-50">
                                    <td className="p-4 font-mono font-bold text-green-700">#{item.plotNumber}</td>
                                    <td className="p-4">{item.researcher}</td>
                                    <td className="p-4">{item.plantType}</td>
                                    <td className="p-4 text-gray-500">{item.startDate}</td>
                                    <td className="p-4 text-gray-500">{item.endDate}</td>
                                    <td className="p-4">
                                        <button 
                                            onClick={() => { setHistoryToDelete(item.id); setIsDeleteHistoryModalOpen(true); }}
                                            className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg"
                                            title="حذف من السجل"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {historyList.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-gray-400">لا توجد تجارب سابقة مسجلة</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Management Modal */}
            {isModalOpen && selectedPlot && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95">
                        <div className={`p-6 border-b rounded-t-xl flex justify-between items-center ${selectedPlot.status === 'OCCUPIED' ? 'bg-red-50' : 'bg-green-50'}`}>
                            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                <Sprout className={`w-6 h-6 ${selectedPlot.status === 'OCCUPIED' ? 'text-red-600' : 'text-green-600'}`} />
                                حوض رقم {selectedPlot.number}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 bg-white/50 p-1 rounded-full">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleBooking} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">اسم الباحث</label>
                                <div className="relative">
                                    <User className="w-4 h-4 absolute right-3 top-2.5 text-gray-400" />
                                    <input 
                                        type="text" required
                                        disabled={selectedPlot.status === 'OCCUPIED'}
                                        className="w-full p-2 pr-9 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-50 disabled:text-gray-500"
                                        value={bookForm.researcher}
                                        onChange={e => setBookForm({...bookForm, researcher: e.target.value})}
                                        placeholder="اسم القائم بالتجربة"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">نوع النبات / الصنف</label>
                                <div className="relative">
                                    <Sprout className="w-4 h-4 absolute right-3 top-2.5 text-gray-400" />
                                    <input 
                                        type="text" required
                                        disabled={selectedPlot.status === 'OCCUPIED'}
                                        className="w-full p-2 pr-9 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-50 disabled:text-gray-500"
                                        value={bookForm.plantType}
                                        onChange={e => setBookForm({...bookForm, plantType: e.target.value})}
                                        placeholder="مثال: قمح (سخا 95)"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">تاريخ الزراعة</label>
                                <div className="relative">
                                    <Calendar className="w-4 h-4 absolute right-3 top-2.5 text-gray-400" />
                                    <input 
                                        type="date" required
                                        disabled={selectedPlot.status === 'OCCUPIED'}
                                        className="w-full p-2 pr-9 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-50 disabled:text-gray-500"
                                        value={bookForm.startDate}
                                        onChange={e => setBookForm({...bookForm, startDate: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">تعليمات العمال (ملاحظات الري والتسميد)</label>
                                <textarea 
                                    rows={3}
                                    disabled={selectedPlot.status === 'OCCUPIED'}
                                    className="w-full p-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-50 disabled:text-gray-500"
                                    value={bookForm.notes}
                                    onChange={e => setBookForm({...bookForm, notes: e.target.value})}
                                    placeholder="اكتب أي تعليمات خاصة للعامل هنا..."
                                />
                            </div>

                            <div className="pt-4 border-t flex justify-end gap-2">
                                {selectedPlot.status === 'FREE' ? (
                                    <>
                                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm">إلغاء</button>
                                        <button 
                                            type="submit"
                                            disabled={submitting}
                                            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2 text-sm font-bold shadow-md"
                                        >
                                            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                            تأكيد الزراعة
                                        </button>
                                    </>
                                ) : (
                                    <button 
                                        type="button"
                                        onClick={() => setIsVacateModalOpen(true)}
                                        className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center justify-center gap-2 text-sm font-bold shadow-md"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        إنهاء التجربة وإخلاء الحوض
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Vacate Confirmation Modal */}
            {isVacateModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl w-full max-w-sm shadow-2xl animate-in fade-in zoom-in-95 p-6 text-center">
                        <div className="bg-red-100 p-3 rounded-full inline-block mb-4">
                            <AlertTriangle className="w-8 h-8 text-red-600" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800 mb-2">تأكيد الإخلاء</h3>
                        <p className="text-gray-600 text-sm mb-6">
                            هل أنت متأكد من انتهاء التجربة؟ سيتم أرشفة البيانات في السجل التاريخي ومسح الحوض لبدء زراعة جديدة.
                        </p>
                        <div className="flex gap-3">
                            <button 
                                onClick={() => setIsVacateModalOpen(false)}
                                className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-200"
                            >
                                تراجع
                            </button>
                            <button 
                                onClick={handleVacate}
                                disabled={submitting}
                                className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 flex items-center justify-center gap-2"
                            >
                                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                نعم، إخلاء وأرشفة
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete History Confirmation Modal */}
            {isDeleteHistoryModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl w-full max-w-sm shadow-2xl animate-in fade-in zoom-in-95 p-6 text-center">
                        <div className="bg-red-100 p-3 rounded-full inline-block mb-4">
                            <Trash2 className="w-8 h-8 text-red-600" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800 mb-2">حذف من السجل</h3>
                        <p className="text-gray-500 text-sm mb-6">
                            هل أنت متأكد من حذف هذا السجل التاريخي نهائياً؟
                        </p>
                        <div className="flex gap-3">
                            <button 
                                onClick={() => setIsDeleteHistoryModalOpen(false)}
                                className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-200"
                            >
                                تراجع
                            </button>
                            <button 
                                onClick={confirmDeleteHistory}
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
