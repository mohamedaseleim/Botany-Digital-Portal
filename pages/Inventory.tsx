import React, { useState, useEffect } from 'react';
import { 
    Microscope, 
    Plus, 
    Trash2, 
    QrCode, 
    AlertTriangle, 
    CheckCircle2, 
    XCircle,
    Save,
    Loader2,
    X,
    Edit // استيراد أيقونة التعديل
} from 'lucide-react';
import { Asset, AssetStatus, User } from '../types';
import { getAssets, addAsset, deleteAsset, updateAsset, logActivity } from '../services/dbService'; // إضافة updateAsset

interface InventoryProps {
    user?: User;
}

export const Inventory: React.FC<InventoryProps> = ({ user }) => {
    const [assets, setAssets] = useState<Asset[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    
    // Modal States
    const [isModalOpen, setIsModalOpen] = useState(false); // تم توحيد اسم المودال للإضافة والتعديل
    const [editingId, setEditingId] = useState<string | null>(null); // لتخزين معرف العنصر المراد تعديله
    const [qrModalAsset, setQrModalAsset] = useState<Asset | null>(null);

    // Delete Modal State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [assetToDelete, setAssetToDelete] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        model: '',
        serialNumber: '',
        status: 'WORKING' as AssetStatus,
        location: '',
        assignedTo: '',
        dateAcquired: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        const data = await getAssets();
        setAssets(data);
        setLoading(false);
    };

    // فتح المودال (للإضافة أو التعديل)
    const handleOpenModal = (asset?: Asset) => {
        if (asset) {
            setEditingId(asset.id);
            setFormData({
                name: asset.name,
                model: asset.model,
                serialNumber: asset.serialNumber,
                status: asset.status,
                location: asset.location,
                assignedTo: asset.assignedTo,
                dateAcquired: asset.dateAcquired
            });
        } else {
            setEditingId(null);
            setFormData({
                name: '',
                model: '',
                serialNumber: '',
                status: 'WORKING',
                location: '',
                assignedTo: '',
                dateAcquired: new Date().toISOString().split('T')[0]
            });
        }
        setIsModalOpen(true);
    };

    const handleSaveAsset = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        const userName = user?.name || 'Unknown';
        
        try {
            if (editingId) {
                // حالة التعديل
                await updateAsset(editingId, formData);
                logActivity('تعديل عهدة', userName, `تم تعديل الجهاز: ${formData.name}`);
                alert('تم تعديل بيانات الجهاز بنجاح');
            } else {
                // حالة الإضافة
                await addAsset(formData);
                logActivity('إضافة عهدة', userName, `جهاز: ${formData.name} - ${formData.serialNumber}`);
                alert('تمت إضافة الجهاز بنجاح');
            }
            
            await fetchData();
            setIsModalOpen(false);
        } catch (error) {
            console.error(error);
            alert('حدث خطأ أثناء الحفظ');
        } finally {
            setSubmitting(false);
        }
    };

    const initiateDelete = (id: string) => {
        setAssetToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!assetToDelete) return;
        setSubmitting(true);
        try {
            const asset = assets.find(a => a.id === assetToDelete);
            await deleteAsset(assetToDelete);
            logActivity('حذف عهدة', user?.name || 'Unknown', `تم حذف: ${asset?.name}`);
            // Optimistic update
            setAssets(prev => prev.filter(a => a.id !== assetToDelete));
            setIsDeleteModalOpen(false);
            setAssetToDelete(null);
        } catch (error) {
            console.error(error);
            alert('فشل في حذف العنصر');
            fetchData(); // Revert on error
        } finally {
            setSubmitting(false);
        }
    };

    // Helper for Status Badge
    const getStatusBadge = (status: AssetStatus) => {
        switch (status) {
            case 'WORKING': 
                return <span className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold"><CheckCircle2 className="w-3 h-3"/> يعمل</span>;
            case 'MAINTENANCE':
                return <span className="flex items-center gap-1 bg-amber-100 text-amber-700 px-2 py-1 rounded-full text-xs font-bold"><AlertTriangle className="w-3 h-3"/> صيانة</span>;
            case 'BROKEN':
                return <span className="flex items-center gap-1 bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-bold"><XCircle className="w-3 h-3"/> كهنة</span>;
        }
    };

    const stats = {
        total: assets.length,
        working: assets.filter(a => a.status === 'WORKING').length,
        maintenance: assets.filter(a => a.status === 'MAINTENANCE').length,
        broken: assets.filter(a => a.status === 'BROKEN').length,
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Microscope className="w-6 h-6 text-blue-600" />
                        سجل عهدة القسم
                    </h1>
                    <p className="text-gray-500 text-sm">إدارة الأجهزة المعملية ومتابعة حالتها</p>
                </div>
                <button 
                    onClick={() => handleOpenModal()}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    <span>إضافة جهاز جديد</span>
                </button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
                    <p className="text-xs text-gray-500 font-bold">إجمالي العهدة</p>
                    <h3 className="text-2xl font-bold text-gray-800">{stats.total}</h3>
                </div>
                <div className="bg-green-50 p-4 rounded-xl shadow-sm border border-green-100 text-center">
                    <p className="text-xs text-green-600 font-bold">تعمل بكفاءة</p>
                    <h3 className="text-2xl font-bold text-green-800">{stats.working}</h3>
                </div>
                <div className="bg-amber-50 p-4 rounded-xl shadow-sm border border-amber-100 text-center">
                    <p className="text-xs text-amber-600 font-bold">تحت الصيانة</p>
                    <h3 className="text-2xl font-bold text-amber-800">{stats.maintenance}</h3>
                </div>
                <div className="bg-red-50 p-4 rounded-xl shadow-sm border border-red-100 text-center">
                    <p className="text-xs text-red-600 font-bold">تالف / كهنة</p>
                    <h3 className="text-2xl font-bold text-red-800">{stats.broken}</h3>
                </div>
            </div>

            {/* Assets Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right">
                        <thead className="bg-gray-50 text-gray-600 font-medium">
                            <tr>
                                <th className="p-4">اسم الجهاز</th>
                                <th className="p-4">الموديل</th>
                                <th className="p-4">الرقم التسلسلي (SN)</th>
                                <th className="p-4">المكان</th>
                                <th className="p-4">المسؤول</th>
                                <th className="p-4">الحالة</th>
                                <th className="p-4">الكود</th> {/* عمود الكود الجديد */}
                                <th className="p-4">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {loading ? (
                                <tr><td colSpan={8} className="p-8 text-center text-gray-500">جاري التحميل...</td></tr>
                            ) : (
                                assets.map(asset => (
                                    <tr key={asset.id} className="hover:bg-gray-50">
                                        <td className="p-4 font-bold text-gray-800">{asset.name}</td>
                                        <td className="p-4 text-gray-600">{asset.model}</td>
                                        <td className="p-4 font-mono text-gray-500">{asset.serialNumber || '-'}</td>
                                        <td className="p-4">{asset.location}</td>
                                        <td className="p-4">{asset.assignedTo}</td>
                                        <td className="p-4">{getStatusBadge(asset.status)}</td>
                                        
                                        {/* عمود الكود (QR) */}
                                        <td className="p-4">
                                            <button 
                                                onClick={() => setQrModalAsset(asset)}
                                                className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg flex items-center gap-1 text-xs"
                                                title="عرض QR Code"
                                            >
                                                <QrCode className="w-4 h-4" />
                                                QR
                                            </button>
                                        </td>

                                        {/* عمود الإجراءات (تعديل + حذف) */}
                                        <td className="p-4 flex gap-2">
                                            <button 
                                                onClick={() => handleOpenModal(asset)}
                                                className="p-2 text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                                                title="تعديل"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button 
                                                type="button"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    initiateDelete(asset.id);
                                                }}
                                                className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg cursor-pointer transition-colors"
                                                title="حذف"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                            {!loading && assets.length === 0 && (
                                <tr><td colSpan={8} className="p-8 text-center text-gray-400">لا توجد أجهزة مسجلة</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add/Edit Asset Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in-95">
                        <div className="p-6 border-b flex justify-between items-center">
                            <h3 className="text-xl font-bold text-gray-800">
                                {editingId ? 'تعديل بيانات الجهاز' : 'إضافة جهاز جديد'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleSaveAsset} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">اسم الجهاز</label>
                                <input 
                                    type="text" required 
                                    className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">الموديل</label>
                                    <input 
                                        type="text" required 
                                        className="w-full border p-2 rounded-lg outline-none"
                                        value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">الرقم التسلسلي</label>
                                    <input 
                                        type="text" placeholder="Serial Number"
                                        className="w-full border p-2 rounded-lg outline-none"
                                        value={formData.serialNumber} onChange={e => setFormData({...formData, serialNumber: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">الحالة</label>
                                    <select 
                                        className="w-full border p-2 rounded-lg outline-none bg-white"
                                        value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as AssetStatus})}
                                    >
                                        <option value="WORKING">يعمل بحالة جيدة</option>
                                        <option value="MAINTENANCE">يحتاج صيانة</option>
                                        <option value="BROKEN">تالف / كهنة</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ الإضافة</label>
                                    <input 
                                        type="date"
                                        className="w-full border p-2 rounded-lg outline-none"
                                        value={formData.dateAcquired} onChange={e => setFormData({...formData, dateAcquired: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">مكان التواجد</label>
                                    <input 
                                        type="text" placeholder="مثال: المعمل المركزي" required
                                        className="w-full border p-2 rounded-lg outline-none"
                                        value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">المسؤول عن العهدة</label>
                                    <input 
                                        type="text" placeholder="اسم الموظف/العضو"
                                        className="w-full border p-2 rounded-lg outline-none"
                                        value={formData.assignedTo} onChange={e => setFormData({...formData, assignedTo: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-4 border-t mt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">إلغاء</button>
                                <button 
                                    type="submit" disabled={submitting}
                                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                                >
                                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    حفظ
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* QR Code Modal */}
            {qrModalAsset && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl w-full max-w-sm shadow-2xl animate-in fade-in zoom-in-95 p-6 text-center">
                         <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-gray-800">QR Code للجهاز</h3>
                            <button onClick={() => setQrModalAsset(null)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="bg-white p-4 border rounded-lg inline-block shadow-inner mb-4">
                            <img 
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`ID:${qrModalAsset.id}|Name:${qrModalAsset.name}|SN:${qrModalAsset.serialNumber}`)}`} 
                                alt="QR Code" 
                                className="w-40 h-40"
                            />
                        </div>
                        
                        <h4 className="font-bold text-gray-800">{qrModalAsset.name}</h4>
                        <p className="text-sm text-gray-500 font-mono mb-4">{qrModalAsset.serialNumber}</p>
                        
                        <button 
                            onClick={() => window.print()} 
                            className="w-full bg-gray-800 text-white py-2 rounded-lg hover:bg-gray-900"
                        >
                            طباعة الملصق
                        </button>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl w-full max-w-sm shadow-2xl animate-in fade-in zoom-in-95 p-6">
                        <div className="flex flex-col items-center text-center">
                            <div className="bg-red-100 p-3 rounded-full text-red-600 mb-4">
                                <AlertTriangle className="w-8 h-8" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-800 mb-2">حذف الجهاز</h3>
                            <p className="text-gray-500 text-sm mb-6">
                                هل أنت متأكد من حذف هذا الجهاز من سجلات العهدة؟
                            </p>
                            
                            <div className="flex gap-3 w-full">
                                <button 
                                    onClick={() => setIsDeleteModalOpen(false)}
                                    className="flex-1 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium"
                                >
                                    إلغاء
                                </button>
                                <button 
                                    onClick={confirmDelete}
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
        </div>
    );
};