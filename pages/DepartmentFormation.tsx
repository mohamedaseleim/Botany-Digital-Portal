import React, { useState, useEffect } from 'react';
import { Network, Plus, Users, Edit, Trash2, Save, X, ChevronDown, ChevronUp } from 'lucide-react';
import { User, UserRole, DeptCouncilFormation, DeptCommitteeFormation, OrgMember } from '../types';
import { 
    getDeptCouncils, addDeptCouncil, updateDeptCouncil, deleteDeptCouncil,
    getDeptCommittees, addDeptCommittee, updateDeptCommittee, deleteDeptCommittee,
    logActivity 
} from '../services/dbService';

interface DepartmentFormationProps {
    user: User;
}

export const DepartmentFormation: React.FC<DepartmentFormationProps> = ({ user }) => {
    const [activeTab, setActiveTab] = useState<'COUNCIL' | 'COMMITTEES'>('COUNCIL');
    const [loading, setLoading] = useState(true);
    const [councils, setCouncils] = useState<DeptCouncilFormation[]>([]);
    const [committees, setCommittees] = useState<DeptCommitteeFormation[]>([]);
    
    // الفلاتر
    const currentYear = new Date().getFullYear();
    const [selectedYear, setSelectedYear] = useState<string>(`${currentYear}-${currentYear + 1}`);

    // المودال (النوافذ المنبثقة)
    const [isCouncilModalOpen, setIsCouncilModalOpen] = useState(false);
    const [isCommitteeModalOpen, setIsCommitteeModalOpen] = useState(false);
    
    const [editingCouncilId, setEditingCouncilId] = useState<string | null>(null);
    const [editingCommitteeId, setEditingCommitteeId] = useState<string | null>(null);

    // بيانات النماذج
    const [councilForm, setCouncilForm] = useState<{ academicYear: string, members: OrgMember[] }>({
        academicYear: '',
        members: []
    });

    const [committeeForm, setCommitteeForm] = useState<{ name: string, academicYear: string, members: OrgMember[] }>({
        name: '',
        academicYear: '',
        members: []
    });

    const [expandedCommittee, setExpandedCommittee] = useState<string | null>(null);

    // صلاحية التعديل (للمدير فقط)
    const canEdit = user.role === UserRole.ADMIN;

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        const [councilsData, committeesData] = await Promise.all([
            getDeptCouncils(),
            getDeptCommittees()
        ]);
        setCouncils(councilsData);
        setCommittees(committeesData);
        setLoading(false);
    };

    // استخراج السنوات الفريدة للفلتر
    const getUniqueYears = () => {
        const years = new Set([...councils.map(c => c.academicYear), ...committees.map(c => c.academicYear)]);
        // إضافة العام الحالي دائماً للقائمة لضمان وجوده
        years.add(`${currentYear}-${currentYear + 1}`);
        return Array.from(years).sort().reverse();
    };

    // --- منطق مجلس القسم ---
    const openCouncilModal = (council?: DeptCouncilFormation) => {
        if (council) {
            setEditingCouncilId(council.id);
            setCouncilForm({ academicYear: council.academicYear, members: [...council.members] });
        } else {
            setEditingCouncilId(null);
            setCouncilForm({ academicYear: selectedYear, members: [] });
        }
        setIsCouncilModalOpen(true);
    };

    const handleSaveCouncil = async () => {
        if (!councilForm.academicYear) { alert('يرجى إدخال العام الجامعي'); return; }
        try {
            if (editingCouncilId) {
                await updateDeptCouncil(editingCouncilId, councilForm);
                await logActivity('تعديل تشكيل مجلس القسم', user.name, `تم تعديل تشكيل مجلس القسم للعام: ${councilForm.academicYear}`);
            } else {
                await addDeptCouncil(councilForm);
                await logActivity('إضافة تشكيل مجلس القسم', user.name, `تم إضافة تشكيل جديد لمجلس القسم للعام: ${councilForm.academicYear}`);
            }
            setIsCouncilModalOpen(false);
            fetchData();
            alert("تم الحفظ بنجاح ✅");
        } catch (e) { 
            console.error(e);
            alert('حدث خطأ أثناء الحفظ'); 
        }
    };

    const handleDeleteCouncil = async (id: string) => {
        if (!window.confirm('هل أنت متأكد من حذف هذا التشكيل بالكامل؟')) return;
        try {
            await deleteDeptCouncil(id);
            await logActivity('حذف تشكيل مجلس القسم', user.name, `تم حذف تشكيل مجلس القسم للعام المحدد`);
            fetchData();
        } catch (e) {
            console.error(e);
            alert("فشل الحذف");
        }
    };

    // --- منطق اللجان ---
    const openCommitteeModal = (committee?: DeptCommitteeFormation) => {
        if (committee) {
            setEditingCommitteeId(committee.id);
            setCommitteeForm({ name: committee.name, academicYear: committee.academicYear, members: [...committee.members] });
        } else {
            setEditingCommitteeId(null);
            setCommitteeForm({ name: '', academicYear: selectedYear, members: [] });
        }
        setIsCommitteeModalOpen(true);
    };

    const handleSaveCommittee = async () => {
        if (!committeeForm.name || !committeeForm.academicYear) { alert('البيانات ناقصة'); return; }
        try {
            if (editingCommitteeId) {
                await updateDeptCommittee(editingCommitteeId, committeeForm);
                await logActivity('تعديل لجنة', user.name, `تم تعديل ${committeeForm.name} للعام ${committeeForm.academicYear}`);
            } else {
                await addDeptCommittee(committeeForm);
                await logActivity('إضافة لجنة', user.name, `تم إضافة لجنة جديدة: ${committeeForm.name} للعام ${committeeForm.academicYear}`);
            }
            setIsCommitteeModalOpen(false);
            fetchData();
            alert("تم الحفظ بنجاح ✅");
        } catch (e) { 
            console.error(e);
            alert('حدث خطأ أثناء الحفظ'); 
        }
    };

    const handleDeleteCommittee = async (id: string, name: string) => {
        if (!window.confirm(`هل أنت متأكد من حذف لجنة ${name}؟`)) return;
        try {
            await deleteDeptCommittee(id);
            await logActivity('حذف لجنة', user.name, `تم حذف لجنة: ${name}`);
            fetchData();
        } catch (e) {
            console.error(e);
            alert("فشل الحذف");
        }
    };

    // --- إدارة الأعضاء داخل النموذج ---
    const addMemberToForm = (setForm: React.Dispatch<React.SetStateAction<any>>) => {
        setForm((prev: any) => ({
            ...prev,
            members: [...prev.members, { name: '', role: 'عضو', title: '' }]
        }));
    };

    const updateMemberInForm = (setForm: React.Dispatch<React.SetStateAction<any>>, index: number, field: keyof OrgMember, value: string) => {
        setForm((prev: any) => {
            const newMembers = [...prev.members];
            newMembers[index] = { ...newMembers[index], [field]: value };
            return { ...prev, members: newMembers };
        });
    };

    const removeMemberFromForm = (setForm: React.Dispatch<React.SetStateAction<any>>, index: number) => {
        setForm((prev: any) => ({
            ...prev,
            members: prev.members.filter((_: any, i: number) => i !== index)
        }));
    };

    // تصفية البيانات للعرض
    const currentCouncil = councils.find(c => c.academicYear === selectedYear);
    const currentCommittees = committees.filter(c => c.academicYear === selectedYear);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Network className="w-6 h-6 text-indigo-600" />
                        الهيكل الإداري واللجان
                    </h1>
                    <p className="text-gray-500 text-sm">تشكيل مجلس القسم واللجان المنبثقة لكل عام جامعي</p>
                </div>
                
                {/* فلتر السنة */}
                <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
                    <span className="text-sm font-bold text-gray-600">العام الجامعي:</span>
                    <select 
                        value={selectedYear} 
                        onChange={(e) => setSelectedYear(e.target.value)}
                        className="bg-gray-50 border border-gray-300 rounded px-3 py-1 text-sm outline-none focus:ring-2 focus:ring-indigo-500 font-mono font-bold text-indigo-700"
                    >
                        {getUniqueYears().map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
            </div>

            {/* التبويبات */}
            <div className="flex border-b border-gray-200">
                <button 
                    onClick={() => setActiveTab('COUNCIL')}
                    className={`px-6 py-3 font-bold text-sm transition-colors flex items-center gap-2 ${activeTab === 'COUNCIL' ? 'text-indigo-700 border-b-2 border-indigo-700 bg-indigo-50' : 'text-gray-500 hover:text-indigo-600'}`}
                >
                    <Users className="w-4 h-4" /> مجلس القسم
                </button>
                <button 
                    onClick={() => setActiveTab('COMMITTEES')}
                    className={`px-6 py-3 font-bold text-sm transition-colors flex items-center gap-2 ${activeTab === 'COMMITTEES' ? 'text-indigo-700 border-b-2 border-indigo-700 bg-indigo-50' : 'text-gray-500 hover:text-indigo-600'}`}
                >
                    <Network className="w-4 h-4" /> اللجان المنبثقة
                </button>
            </div>

            {/* محتوى: مجلس القسم */}
            {activeTab === 'COUNCIL' && (
                <div className="space-y-4 animate-in fade-in">
                    <div className="flex justify-between items-center">
                        <h3 className="font-bold text-gray-700 flex items-center gap-2">
                            <span className="w-2 h-6 bg-indigo-600 rounded-full"></span>
                            تشكيل مجلس القسم للعام {selectedYear}
                        </h3>
                        {canEdit && (
                            <button onClick={() => openCouncilModal(currentCouncil)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-indigo-700 shadow-sm">
                                {currentCouncil ? <Edit className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                {currentCouncil ? 'تعديل التشكيل' : 'إضافة تشكيل جديد'}
                            </button>
                        )}
                    </div>

                    {currentCouncil ? (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-right">
                                    <thead className="bg-gray-50 text-gray-600">
                                        <tr>
                                            <th className="p-4">اللقب العلمي</th>
                                            <th className="p-4">الاسم</th>
                                            <th className="p-4">الصفة (Role)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {currentCouncil.members.map((m, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50">
                                                <td className="p-4 text-gray-500">{m.title}</td>
                                                <td className="p-4 font-bold text-gray-800">{m.name}</td>
                                                <td className="p-4">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold 
                                                        ${m.role.includes('رئيس') ? 'bg-indigo-100 text-indigo-700' : 
                                                          m.role.includes('أمين') ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-700'}`}>
                                                        {m.role}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {canEdit && (
                                <div className="p-4 bg-gray-50 border-t flex justify-end">
                                    <button onClick={() => handleDeleteCouncil(currentCouncil.id)} className="text-red-500 text-xs flex items-center gap-1 hover:underline">
                                        <Trash2 className="w-3 h-3" /> حذف التشكيل بالكامل
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center p-12 bg-gray-50 rounded-xl border border-dashed border-gray-300 text-gray-400">
                            <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p>لا يوجد تشكيل مسجل لمجلس القسم لهذا العام.</p>
                            {canEdit && <p className="text-xs mt-2">اضغط على "إضافة تشكيل جديد" للبدء</p>}
                        </div>
                    )}
                </div>
            )}

            {/* محتوى: اللجان */}
            {activeTab === 'COMMITTEES' && (
                <div className="space-y-4 animate-in fade-in">
                    <div className="flex justify-between items-center">
                        <h3 className="font-bold text-gray-700 flex items-center gap-2">
                             <span className="w-2 h-6 bg-indigo-600 rounded-full"></span>
                            لجان القسم للعام {selectedYear}
                        </h3>
                        {canEdit && (
                            <button onClick={() => openCommitteeModal()} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-indigo-700 shadow-sm">
                                <Plus className="w-4 h-4" /> إضافة لجنة جديدة
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {currentCommittees.map(committee => (
                            <div key={committee.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                                <div 
                                    className="p-4 flex justify-between items-center cursor-pointer bg-white"
                                    onClick={() => setExpandedCommittee(expandedCommittee === committee.id ? null : committee.id)}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="bg-indigo-50 p-2.5 rounded-full text-indigo-600"><Network className="w-5 h-5"/></div>
                                        <div>
                                            <h4 className="font-bold text-gray-800 text-lg">{committee.name}</h4>
                                            <p className="text-xs text-gray-500">{committee.members.length} أعضاء</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {canEdit && (
                                            <div className="flex gap-1 ml-2 border-l pl-2">
                                                <button onClick={(e) => { e.stopPropagation(); openCommitteeModal(committee); }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg" title="تعديل"><Edit className="w-4 h-4" /></button>
                                                <button onClick={(e) => { e.stopPropagation(); handleDeleteCommittee(committee.id, committee.name); }} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg" title="حذف"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        )}
                                        {expandedCommittee === committee.id ? <ChevronUp className="w-5 h-5 text-gray-400"/> : <ChevronDown className="w-5 h-5 text-gray-400"/>}
                                    </div>
                                </div>
                                
                                {expandedCommittee === committee.id && (
                                    <div className="border-t border-gray-100 p-4 bg-gray-50 animate-in slide-in-from-top-1">
                                        <table className="w-full text-sm text-right">
                                            <thead>
                                                <tr className="text-gray-500 border-b border-gray-200">
                                                    <th className="pb-2">اللقب</th>
                                                    <th className="pb-2">الاسم</th>
                                                    <th className="pb-2">الدور</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {committee.members.map((m, i) => (
                                                    <tr key={i}>
                                                        <td className="py-2 text-gray-500 w-20">{m.title}</td>
                                                        <td className="py-2 font-medium">{m.name}</td>
                                                        <td className="py-2 text-indigo-700 font-bold">{m.role}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        ))}
                        {currentCommittees.length === 0 && (
                            <div className="text-center p-12 bg-gray-50 rounded-xl border border-dashed border-gray-300 text-gray-400">
                                <Network className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                <p>لا توجد لجان مسجلة لهذا العام.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* --- MODAL: COUNCIL --- */}
            {isCouncilModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl animate-in fade-in zoom-in-95">
                        <div className="flex justify-between items-center mb-6 border-b pb-4">
                            <h3 className="text-xl font-bold text-gray-800">
                                {editingCouncilId ? 'تعديل تشكيل مجلس القسم' : 'إضافة تشكيل جديد'}
                            </h3>
                            <button onClick={() => setIsCouncilModalOpen(false)}><X className="w-6 h-6 text-gray-400 hover:text-red-500"/></button>
                        </div>
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">العام الجامعي</label>
                                <input 
                                    type="text" 
                                    value={councilForm.academicYear} 
                                    onChange={e => setCouncilForm({...councilForm, academicYear: e.target.value})} 
                                    className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono" 
                                    placeholder="YYYY-YYYY" 
                                />
                            </div>
                            
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="font-bold text-sm text-indigo-800">أعضاء المجلس</h4>
                                    <button onClick={() => addMemberToForm(setCouncilForm)} className="text-xs bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg hover:bg-indigo-200 font-bold flex items-center gap-1">
                                        <Plus className="w-3 h-3" /> إضافة عضو
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {councilForm.members.map((m, i) => (
                                        <div key={i} className="flex gap-2 items-center bg-white p-2 rounded border border-gray-200 shadow-sm">
                                            <input type="text" placeholder="اللقب (أ.د)" value={m.title} onChange={e => updateMemberInForm(setCouncilForm, i, 'title', e.target.value)} className="w-20 border p-1.5 rounded text-sm outline-none focus:border-indigo-500"/>
                                            <input type="text" placeholder="اسم العضو" value={m.name} onChange={e => updateMemberInForm(setCouncilForm, i, 'name', e.target.value)} className="flex-1 border p-1.5 rounded text-sm outline-none focus:border-indigo-500 font-bold"/>
                                            <input type="text" placeholder="الدور (رئيس/عضو)" value={m.role} onChange={e => updateMemberInForm(setCouncilForm, i, 'role', e.target.value)} className="w-32 border p-1.5 rounded text-sm outline-none focus:border-indigo-500"/>
                                            <button onClick={() => removeMemberFromForm(setCouncilForm, i)} className="text-red-400 hover:text-red-600 p-1"><Trash2 className="w-4 h-4"/></button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button onClick={() => setIsCouncilModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">إلغاء</button>
                                <button onClick={handleSaveCouncil} className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 font-bold flex items-center gap-2">
                                    <Save className="w-4 h-4" /> حفظ التشكيل
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL: COMMITTEE --- */}
            {isCommitteeModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl animate-in fade-in zoom-in-95">
                        <div className="flex justify-between items-center mb-6 border-b pb-4">
                            <h3 className="text-xl font-bold text-gray-800">
                                {editingCommitteeId ? 'تعديل اللجنة' : 'إضافة لجنة جديدة'}
                            </h3>
                            <button onClick={() => setIsCommitteeModalOpen(false)}><X className="w-6 h-6 text-gray-400 hover:text-red-500"/></button>
                        </div>
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">اسم اللجنة</label>
                                    <input type="text" value={committeeForm.name} onChange={e => setCommitteeForm({...committeeForm, name: e.target.value})} className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="مثال: لجنة المختبرات" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">العام الجامعي</label>
                                    <input type="text" value={committeeForm.academicYear} onChange={e => setCommitteeForm({...committeeForm, academicYear: e.target.value})} className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono" placeholder="YYYY-YYYY" />
                                </div>
                            </div>
                            
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="font-bold text-sm text-indigo-800">أعضاء اللجنة</h4>
                                    <button onClick={() => addMemberToForm(setCommitteeForm)} className="text-xs bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg hover:bg-indigo-200 font-bold flex items-center gap-1">
                                        <Plus className="w-3 h-3" /> إضافة عضو
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {committeeForm.members.map((m, i) => (
                                        <div key={i} className="flex gap-2 items-center bg-white p-2 rounded border border-gray-200 shadow-sm">
                                            <input type="text" placeholder="اللقب" value={m.title} onChange={e => updateMemberInForm(setCommitteeForm, i, 'title', e.target.value)} className="w-20 border p-1.5 rounded text-sm outline-none focus:border-indigo-500"/>
                                            <input type="text" placeholder="اسم العضو" value={m.name} onChange={e => updateMemberInForm(setCommitteeForm, i, 'name', e.target.value)} className="flex-1 border p-1.5 rounded text-sm outline-none focus:border-indigo-500 font-bold"/>
                                            <input type="text" placeholder="الدور" value={m.role} onChange={e => updateMemberInForm(setCommitteeForm, i, 'role', e.target.value)} className="w-32 border p-1.5 rounded text-sm outline-none focus:border-indigo-500"/>
                                            <button onClick={() => removeMemberFromForm(setCommitteeForm, i)} className="text-red-400 hover:text-red-600 p-1"><Trash2 className="w-4 h-4"/></button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button onClick={() => setIsCommitteeModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">إلغاء</button>
                                <button onClick={handleSaveCommittee} className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 font-bold flex items-center gap-2">
                                    <Save className="w-4 h-4" /> حفظ اللجنة
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};