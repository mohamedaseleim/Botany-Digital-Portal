import React, { useState, useEffect } from 'react';
import { 
    FileText, Save, Send, Download, Import, Users, 
    BookOpen, Microscope, Award, Globe, Plus, Trash2, 
    CheckCircle2, Clock, AlertCircle, UploadCloud, Loader2, X 
} from 'lucide-react';
import { User, UserRole, AnnualReport, PublishedResearch, OngoingResearch } from '../types';
import { 
    getMyAnnualReport, saveAnnualReport, getAllAnnualReports, 
    getStaff, logActivity, uploadFileToDrive 
} from '../services/dbService';
import { StatCard } from '../components/StatCard';

interface AnnualReportPageProps {
    user: User;
}

export const AnnualReportPage: React.FC<AnnualReportPageProps> = ({ user }) => {
    const currentYear = "2024-2025";
    const [isAdminMode, setIsAdminMode] = useState(user.role === UserRole.ADMIN);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    
    // Member State
    const [reportData, setReportData] = useState<AnnualReport>({
        id: '', userId: user.id, userName: user.name, academicYear: currentYear, status: 'DRAFT',
        publishedResearch: [],
        ongoingResearch: [],
        scientificActivity: { conferences: [], thesesJudged: 0, supervisionCount: 0, trainingCourses: '' },
        communityActivity: { books: '', convoys: '', media: '', memberships: '' }
    });
    const [activeTab, setActiveTab] = useState(1);

    // HoD State
    const [deptReports, setDeptReports] = useState<AnnualReport[]>([]);
    const [allStaffNames, setAllStaffNames] = useState<string[]>([]);

    useEffect(() => {
        if (isAdminMode && user.role === UserRole.ADMIN) {
            fetchDeptData();
        } else {
            fetchMyReport();
        }
    }, [isAdminMode, user.id, user.role]);

    const fetchMyReport = async () => {
        setLoading(true);
        try {
            const existing = await getMyAnnualReport(user.id, currentYear);
            if (existing) {
                setReportData(existing);
            } else {
                // Initialize new report
                setReportData(prev => ({ ...prev, userId: user.id, userName: user.name }));
            }
        } catch (error) {
            console.error("Error fetching report:", error);
        }
        setLoading(false);
    };

    const fetchDeptData = async () => {
        setLoading(true);
        try {
            const reports = await getAllAnnualReports(currentYear);
            const staff = await getStaff();
            setDeptReports(reports);
            setAllStaffNames(staff.map(s => s.name));
        } catch (error) {
            console.error("Error fetching dept data:", error);
        }
        setLoading(false);
    };

    // --- Handlers ---

    const handleSave = async (submit: boolean = false) => {
        setSubmitting(true);
        try {
            const dataToSave = { 
                ...reportData, 
                status: submit ? 'SUBMITTED' : 'DRAFT' as any, 
                submissionDate: submit ? new Date().toISOString() : reportData.submissionDate 
            };
            
            // @ts-ignore
            await saveAnnualReport(dataToSave, reportData.id || undefined);
            
            if (submit) {
                await logActivity('تسليم تقرير سنوي', user.name, `تم تسليم واعتماد تقرير العام ${currentYear}`);
                alert("تم تسليم التقرير بنجاح ✅");
            } else {
                await logActivity('حفظ مسودة تقرير', user.name, `تم تحديث مسودة تقرير العام ${currentYear}`);
                alert("تم حفظ المسودة بنجاح");
            }
            
            fetchMyReport(); // Refresh to get ID if created
        } catch (e) { 
            console.error(e); 
            alert("حدث خطأ أثناء الحفظ"); 
        } finally {
            setSubmitting(false);
        }
    };

    const handleImportProfile = async () => {
        if (!window.confirm("سيتم استيراد الأبحاث من ملفك الشخصي. هل تريد المتابعة؟")) return;
        
        // محاكاة استيراد البيانات (يمكن ربطها ببيانات الموظف الحقيقية لاحقاً)
        const mockResearch: PublishedResearch = {
            id: Date.now().toString(),
            title: "Research imported from profile",
            journal: "Journal of Botany",
            date: "2024-01",
            type: "International"
        };
        
        setReportData(prev => ({
            ...prev,
            publishedResearch: [...prev.publishedResearch, mockResearch]
        }));
        
        await logActivity('استيراد بيانات', user.name, 'تم استيراد بيانات الأبحاث من الملف الشخصي للتقرير السنوي');
        alert("تم استيراد البيانات (محاكاة)");
    };

    const handleFileUpload = async (file: File, paperIndex: number) => {
        try {
            const url = await uploadFileToDrive(file);
            const newArr = [...reportData.publishedResearch];
            newArr[paperIndex].fileUrl = url;
            setReportData({ ...reportData, publishedResearch: newArr });
            alert("تم رفع الملف بنجاح");
        } catch (error) {
            alert("فشل رفع الملف: " + (error as Error).message);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    // --- Render Tabs ---

    // 1. Published Research Tab
    const renderPublishedTab = () => (
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-700 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-blue-600"/> الأبحاث المنشورة (Published Research)
                </h3>
                <button onClick={handleImportProfile} className="text-sm bg-blue-50 text-blue-600 px-3 py-1 rounded hover:bg-blue-100 flex items-center gap-1 border border-blue-200">
                    <Import className="w-4 h-4"/> استيراد من الملف الشخصي
                </button>
            </div>
            {reportData.publishedResearch.map((paper, idx) => (
                <div key={idx} className="bg-gray-50 p-4 rounded-lg border border-gray-200 relative animate-in fade-in">
                    <button onClick={() => {
                        const newArr = reportData.publishedResearch.filter((_, i) => i !== idx);
                        setReportData({...reportData, publishedResearch: newArr});
                    }} className="absolute top-2 left-2 text-red-400 hover:text-red-600 p-1" title="حذف البحث"><Trash2 className="w-4 h-4"/></button>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-6">
                        <div className="md:col-span-2">
                            <label className="text-xs text-gray-500 font-bold">عنوان البحث</label>
                            <input type="text" className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" value={paper.title} 
                                onChange={e => {
                                    const newArr = [...reportData.publishedResearch]; newArr[idx].title = e.target.value;
                                    setReportData({...reportData, publishedResearch: newArr});
                                }}
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 font-bold">المجلة / الدورية</label>
                            <input type="text" className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" value={paper.journal} 
                                onChange={e => {
                                    const newArr = [...reportData.publishedResearch]; newArr[idx].journal = e.target.value;
                                    setReportData({...reportData, publishedResearch: newArr});
                                }}
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 font-bold">نوع النشر</label>
                            <select className="w-full border p-2 rounded bg-white outline-none" value={paper.type}
                                onChange={e => {
                                    const newArr = [...reportData.publishedResearch]; newArr[idx].type = e.target.value as any;
                                    setReportData({...reportData, publishedResearch: newArr});
                                }}
                            >
                                <option value="International">دولي (International)</option>
                                <option value="Regional">إقليمي (Regional)</option>
                                <option value="Local">محلي (Local)</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 font-bold">تاريخ النشر</label>
                            <input type="month" className="w-full border p-2 rounded outline-none" value={paper.date} 
                                onChange={e => {
                                    const newArr = [...reportData.publishedResearch]; newArr[idx].date = e.target.value;
                                    setReportData({...reportData, publishedResearch: newArr});
                                }}
                            />
                        </div>
                        <div>
                             <label className="text-xs text-gray-500 font-bold">المرفق (PDF)</label>
                             <div className="flex items-center gap-2">
                                {paper.fileUrl ? (
                                    <a href={paper.fileUrl} target="_blank" rel="noreferrer" className="text-blue-600 text-sm underline flex items-center gap-1">
                                        <FileText className="w-4 h-4"/> عرض الملف
                                    </a>
                                ) : (
                                    <div className="relative w-full">
                                        <input type="file" id={`file-${idx}`} className="hidden" onChange={(e) => e.target.files && handleFileUpload(e.target.files[0], idx)} />
                                        <label htmlFor={`file-${idx}`} className="cursor-pointer bg-white border border-gray-300 text-gray-600 px-3 py-1.5 rounded text-sm flex items-center justify-center gap-2 hover:bg-gray-50">
                                            <UploadCloud className="w-4 h-4"/> رفع نسخة
                                        </label>
                                    </div>
                                )}
                             </div>
                        </div>
                    </div>
                </div>
            ))}
            <button onClick={() => setReportData({
                ...reportData, 
                publishedResearch: [...reportData.publishedResearch, { id: Date.now().toString(), title: '', journal: '', date: '', type: 'International' }]
            })} className="w-full border-2 border-dashed border-gray-300 p-3 rounded-lg text-gray-500 hover:bg-gray-50 hover:text-blue-600 hover:border-blue-300 flex items-center justify-center gap-2 transition-colors">
                <Plus className="w-5 h-5"/> إضافة بحث جديد
            </button>
        </div>
    );

    // 2. Ongoing Research Tab
    const renderOngoingTab = () => (
        <div className="space-y-4">
            <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                <Microscope className="w-5 h-5 text-green-600"/> الأبحاث الجارية (Ongoing Research)
            </h3>
            {reportData.ongoingResearch.map((item, idx) => (
                <div key={idx} className="bg-gray-50 p-4 rounded-lg border border-gray-200 relative animate-in fade-in">
                     <button onClick={() => {
                        const newArr = reportData.ongoingResearch.filter((_, i) => i !== idx);
                        setReportData({...reportData, ongoingResearch: newArr});
                    }} className="absolute top-2 left-2 text-red-400 hover:text-red-600 p-1" title="حذف"><Trash2 className="w-4 h-4"/></button>

                    <div className="space-y-3 pl-6">
                        <div>
                            <label className="text-xs text-gray-500 font-bold">موضوع البحث المقترح</label>
                            <input type="text" className="w-full border p-2 rounded focus:ring-2 focus:ring-green-500 outline-none" value={item.topic} 
                                onChange={e => {
                                    const newArr = [...reportData.ongoingResearch]; newArr[idx].topic = e.target.value;
                                    setReportData({...reportData, ongoingResearch: newArr});
                                }}
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs text-gray-500 font-bold">المرحلة الحالية</label>
                                <select className="w-full border p-2 rounded bg-white outline-none" value={item.stage}
                                    onChange={e => {
                                        const newArr = [...reportData.ongoingResearch]; newArr[idx].stage = e.target.value as any;
                                        setReportData({...reportData, ongoingResearch: newArr});
                                    }}
                                >
                                    <option value="Data Collection">جمع المادة العلمية</option>
                                    <option value="Lab Experiments">التجارب المعملية</option>
                                    <option value="Writing">كتابة النتائج</option>
                                    <option value="Under Review">تحت التحكيم</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 font-bold">نسبة الإنجاز ({item.progress}%)</label>
                                <input type="range" min="0" max="100" className="w-full accent-green-600 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer mt-2" value={item.progress} 
                                     onChange={e => {
                                        const newArr = [...reportData.ongoingResearch]; newArr[idx].progress = parseInt(e.target.value);
                                        setReportData({...reportData, ongoingResearch: newArr});
                                    }}
                                />
                            </div>
                        </div>
                        <div>
                             <label className="text-xs text-gray-500 font-bold">المشاركون (اختياري)</label>
                             <input type="text" placeholder="أسماء الزملاء..." className="w-full border p-2 rounded focus:ring-2 focus:ring-green-500 outline-none" value={item.participants || ''} 
                                onChange={e => {
                                    const newArr = [...reportData.ongoingResearch]; newArr[idx].participants = e.target.value;
                                    setReportData({...reportData, ongoingResearch: newArr});
                                }}
                            />
                        </div>
                    </div>
                </div>
            ))}
             <button onClick={() => setReportData({
                ...reportData, 
                ongoingResearch: [...reportData.ongoingResearch, { id: Date.now().toString(), topic: '', stage: 'Data Collection', progress: 0 }]
            })} className="w-full border-2 border-dashed border-gray-300 p-3 rounded-lg text-gray-500 hover:bg-gray-50 hover:text-green-600 hover:border-green-300 flex items-center justify-center gap-2 transition-colors">
                <Plus className="w-5 h-5"/> إضافة بحث جاري
            </button>
        </div>
    );

    // 3. Scientific Activity Tab
    const renderScientificTab = () => (
        <div className="space-y-4">
             <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-purple-600"/> النشاط العلمي (Scientific Activity)
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-bold text-gray-600 mb-1">عدد الرسائل التي تم تحكيمها</label>
                    <input type="number" className="w-full border p-2 rounded focus:ring-2 focus:ring-purple-500 outline-none" value={reportData.scientificActivity.thesesJudged}
                        onChange={e => setReportData({...reportData, scientificActivity: {...reportData.scientificActivity, thesesJudged: parseInt(e.target.value)}})}
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-600 mb-1">عدد طلاب الإشراف (ماجستير/دكتوراة)</label>
                    <input type="number" className="w-full border p-2 rounded focus:ring-2 focus:ring-purple-500 outline-none" value={reportData.scientificActivity.supervisionCount}
                         onChange={e => setReportData({...reportData, scientificActivity: {...reportData.scientificActivity, supervisionCount: parseInt(e.target.value)}})}
                    />
                </div>
                <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-bold text-gray-600 mb-1">الدورات التدريبية (حضور/تدريس)</label>
                    <textarea className="w-full border p-2 rounded focus:ring-2 focus:ring-purple-500 outline-none" rows={3} placeholder="اذكر اسم الدورة والمكان..." value={reportData.scientificActivity.trainingCourses}
                         onChange={e => setReportData({...reportData, scientificActivity: {...reportData.scientificActivity, trainingCourses: e.target.value}})}
                    />
                </div>
             </div>
             
             {/* Conferences - Simplified List */}
             <div className="mt-4 border-t pt-4">
                <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-bold text-gray-600">المؤتمرات والندوات</label>
                    <button onClick={() => setReportData({
                        ...reportData,
                        scientificActivity: {
                            ...reportData.scientificActivity,
                            conferences: [...reportData.scientificActivity.conferences, { name: '', role: 'Attendance', date: '', location: '' }]
                        }
                    })} className="text-xs bg-purple-50 text-purple-600 px-2 py-1 rounded hover:bg-purple-100">+ إضافة</button>
                </div>
                {reportData.scientificActivity.conferences.map((conf, idx) => (
                    <div key={idx} className="flex gap-2 mb-2 items-center bg-gray-50 p-2 rounded">
                        <input type="text" placeholder="اسم المؤتمر" className="flex-1 border p-1 rounded text-sm" value={conf.name}
                             onChange={e => {
                                 const newArr = [...reportData.scientificActivity.conferences]; newArr[idx].name = e.target.value;
                                 setReportData({...reportData, scientificActivity: {...reportData.scientificActivity, conferences: newArr}});
                             }}
                        />
                        <select className="w-24 border p-1 rounded text-sm" value={conf.role}
                            onChange={e => {
                                 const newArr = [...reportData.scientificActivity.conferences]; newArr[idx].role = e.target.value;
                                 setReportData({...reportData, scientificActivity: {...reportData.scientificActivity, conferences: newArr}});
                            }}
                        >
                            <option value="Attendance">حضور</option>
                            <option value="Speaker">متحدث</option>
                            <option value="Organizer">منظم</option>
                        </select>
                        <button onClick={() => {
                            const newArr = reportData.scientificActivity.conferences.filter((_, i) => i !== idx);
                            setReportData({...reportData, scientificActivity: {...reportData.scientificActivity, conferences: newArr}});
                        }} className="text-red-500" title="حذف"><X className="w-4 h-4"/></button>
                    </div>
                ))}
             </div>
        </div>
    );

    // 4. Community Tab
    const renderCommunityTab = () => (
        <div className="space-y-4">
            <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-600"/> النشاط الثقافي والمجتمعي
            </h3>
            <div>
                <label className="block text-sm font-bold text-gray-600 mb-1">المؤلفات والكتب</label>
                <textarea className="w-full border p-2 rounded focus:ring-2 focus:ring-amber-500 outline-none" rows={2} value={reportData.communityActivity.books}
                    onChange={e => setReportData({...reportData, communityActivity: {...reportData.communityActivity, books: e.target.value}})}
                />
            </div>
            <div>
                <label className="block text-sm font-bold text-gray-600 mb-1">القوافل والخدمات الزراعية</label>
                <textarea className="w-full border p-2 rounded focus:ring-2 focus:ring-amber-500 outline-none" rows={2} value={reportData.communityActivity.convoys}
                    onChange={e => setReportData({...reportData, communityActivity: {...reportData.communityActivity, convoys: e.target.value}})}
                />
            </div>
            <div>
                <label className="block text-sm font-bold text-gray-600 mb-1">الإعلام ونشر الثقافة العلمية</label>
                <textarea className="w-full border p-2 rounded focus:ring-2 focus:ring-amber-500 outline-none" rows={2} value={reportData.communityActivity.media}
                    onChange={e => setReportData({...reportData, communityActivity: {...reportData.communityActivity, media: e.target.value}})}
                />
            </div>
             <div>
                <label className="block text-sm font-bold text-gray-600 mb-1">عضوية الجمعيات العلمية والأهلية</label>
                <textarea className="w-full border p-2 rounded focus:ring-2 focus:ring-amber-500 outline-none" rows={2} value={reportData.communityActivity.memberships}
                    onChange={e => setReportData({...reportData, communityActivity: {...reportData.communityActivity, memberships: e.target.value}})}
                />
            </div>
        </div>
    );

    // --- HoD Dashboard View ---
    if (isAdminMode && user.role === UserRole.ADMIN) {
        if (loading) return <div className="p-10 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400"/></div>;

        const totalPapers = deptReports.reduce((acc, curr) => acc + (curr.publishedResearch?.length || 0), 0);
        const intPapers = deptReports.reduce((acc, curr) => acc + (curr.publishedResearch?.filter(p => p.type === 'International').length || 0), 0);
        const submittedCount = deptReports.filter(r => r.status === 'SUBMITTED').length;

        // Sort Staff by Papers count to find most active
        const mostActive = [...deptReports].sort((a, b) => (b.publishedResearch?.length || 0) - (a.publishedResearch?.length || 0))[0];

        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center no-print bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                             <CheckCircle2 className="w-6 h-6 text-green-600"/>
                             متابعة التقارير السنوية
                        </h1>
                        <p className="text-gray-500 text-sm mt-1">العام الجامعي {currentYear}</p>
                    </div>
                    <button onClick={() => setIsAdminMode(false)} className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-4 py-2 rounded-lg text-sm font-bold transition-colors">
                        الذهاب لتقريري الشخصي
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 no-print">
                    <StatCard title="نسبة التسليم" value={`${submittedCount} / ${allStaffNames.length}`} icon={CheckCircle2} color="green" />
                    <StatCard title="إجمالي الأبحاث" value={totalPapers} icon={BookOpen} color="blue" />
                    <StatCard title="نشر دولي" value={intPapers} icon={Globe} color="purple" />
                    <StatCard title="الأكثر نشاطاً" value={mostActive ? mostActive.userName.split(' ')[0] : '-'} icon={Award} color="amber" />
                </div>

                {/* Summary Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden no-print">
                    <div className="p-4 border-b border-gray-100">
                        <h3 className="font-bold text-gray-700">حالة التقارير لجميع الأعضاء</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-right">
                            <thead className="bg-gray-50 text-gray-600">
                                <tr>
                                    <th className="p-4">اسم العضو</th>
                                    <th className="p-4">حالة التقرير</th>
                                    <th className="p-4">أبحاث منشورة</th>
                                    <th className="p-4">أبحاث جارية</th>
                                    <th className="p-4">تاريخ التسليم</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {allStaffNames.map((name, idx) => {
                                    const report = deptReports.find(r => r.userName === name);
                                    return (
                                        <tr key={idx} className="hover:bg-gray-50">
                                            <td className="p-4 font-bold text-gray-800">{name}</td>
                                            <td className="p-4">
                                                {report?.status === 'SUBMITTED' ? (
                                                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><CheckCircle2 className="w-3 h-3"/> تم التسليم</span>
                                                ) : report ? (
                                                    <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><Clock className="w-3 h-3"/> قيد الإعداد</span>
                                                ) : (
                                                    <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><AlertCircle className="w-3 h-3"/> لم يبدأ</span>
                                                )}
                                            </td>
                                            <td className="p-4 font-mono">{report?.publishedResearch?.length || 0}</td>
                                            <td className="p-4 font-mono">{report?.ongoingResearch?.length || 0}</td>
                                            <td className="p-4 font-mono text-xs text-gray-500">{report?.submissionDate ? new Date(report.submissionDate).toLocaleDateString('ar-EG') : '-'}</td>
                                        </tr>
                                    );
                                })}
                                {allStaffNames.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-gray-400">لا توجد بيانات أعضاء</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    }

    // --- Member View (Report Form) ---
    if (loading) return <div className="p-10 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400"/></div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 no-print bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <FileText className="w-6 h-6 text-blue-600"/> التقرير السنوي للعضو
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">العام الجامعي {currentYear}</p>
                </div>
                {user.role === UserRole.ADMIN && (
                    <button onClick={() => setIsAdminMode(true)} className="bg-purple-50 hover:bg-purple-100 text-purple-700 px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2">
                        <Users className="w-4 h-4"/> لوحة متابعة القسم
                    </button>
                )}
            </div>

            {/* Report Status Bar */}
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex flex-col md:flex-row justify-between items-center gap-4 no-print">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${reportData.status === 'SUBMITTED' ? 'bg-green-200 text-green-800' : 'bg-amber-200 text-amber-800'}`}>
                         {reportData.status === 'SUBMITTED' ? <CheckCircle2 className="w-5 h-5"/> : <Clock className="w-5 h-5"/>}
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 font-bold">حالة التقرير</p>
                        <p className={`font-bold ${reportData.status === 'SUBMITTED' ? 'text-green-700' : 'text-amber-700'}`}>
                            {reportData.status === 'SUBMITTED' ? 'تم التسليم والاعتماد ✅' : 'مسودة قيد التعديل 📝'}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <button onClick={handlePrint} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-900 transition-colors shadow-sm">
                        <Download className="w-4 h-4" /> توليد PDF
                    </button>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="bg-white rounded-t-xl border-b flex overflow-x-auto no-print custom-scrollbar">
                {[
                    { id: 1, label: 'البحوث المنشورة', icon: BookOpen },
                    { id: 2, label: 'البحوث الجارية', icon: Microscope },
                    { id: 3, label: 'النشاط العلمي', icon: Award },
                    { id: 4, label: 'خدمة المجتمع', icon: Users },
                ].map(tab => (
                    <button 
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 py-4 px-6 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-all whitespace-nowrap ${activeTab === tab.id ? 'border-blue-600 text-blue-700 bg-blue-50' : 'border-transparent text-gray-500 hover:bg-gray-50 hover:text-gray-700'}`}
                    >
                        <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-blue-600' : 'text-gray-400'}`} /> {tab.label}
                    </button>
                ))}
            </div>

            {/* Form Content */}
            <div className="bg-white p-6 rounded-b-xl shadow-sm border border-t-0 border-gray-200 no-print min-h-[400px]">
                {activeTab === 1 && renderPublishedTab()}
                {activeTab === 2 && renderOngoingTab()}
                {activeTab === 3 && renderScientificTab()}
                {activeTab === 4 && renderCommunityTab()}

                <div className="mt-8 pt-6 border-t flex justify-end gap-3">
                    <button onClick={() => handleSave(false)} disabled={submitting} className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2 font-medium transition-colors disabled:opacity-50">
                        <Save className="w-4 h-4" /> حفظ كمسودة
                    </button>
                    <button onClick={() => handleSave(true)} disabled={submitting} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50">
                        {submitting ? <Loader2 className="w-4 h-4 animate-spin"/> : <Send className="w-4 h-4" />} اعتماد وتسليم نهائي
                    </button>
                </div>
            </div>

            {/* --- PRINTABLE VERSION (Hidden on screen, visible on print) --- */}
            <div className="hidden print:block p-8 bg-white text-black">
                <div className="text-center border-b-2 border-black pb-6 mb-8">
                    <h2 className="text-xl font-bold mb-1">جامعة الأزهر - كلية الزراعة بأسيوط</h2>
                    <h3 className="text-lg font-bold mb-1">قسم النبات الزراعي</h3>
                    <h1 className="text-3xl font-extrabold mt-4 border-2 border-black inline-block px-6 py-2">التقرير السنوي ({currentYear})</h1>
                </div>

                <div className="mb-8 flex justify-between text-lg">
                    <p><strong>اسم العضو:</strong> {user.name}</p>
                    <p><strong>تاريخ التقرير:</strong> {new Date().toLocaleDateString('ar-EG')}</p>
                </div>

                <div className="mb-8">
                    <h4 className="text-xl font-bold bg-gray-200 p-2 mb-4 border border-black">أولاً: الأبحاث المنشورة</h4>
                    <ul className="list-decimal pr-6 space-y-3 text-lg">
                        {reportData.publishedResearch.length > 0 ? reportData.publishedResearch.map((p, i) => (
                            <li key={i} className="pl-2">
                                <span className="font-bold">{p.title}</span>
                                <br/>
                                <span className="text-gray-700 text-sm"> - {p.journal} ({p.date}) - [{p.type}]</span>
                            </li>
                        )) : <p className="italic text-gray-500">لا يوجد أبحاث منشورة لهذا العام.</p>}
                    </ul>
                </div>

                <div className="mb-8">
                    <h4 className="text-xl font-bold bg-gray-200 p-2 mb-4 border border-black">ثانياً: الأبحاث الجارية</h4>
                    <ul className="list-decimal pr-6 space-y-3 text-lg">
                        {reportData.ongoingResearch.length > 0 ? reportData.ongoingResearch.map((p, i) => (
                            <li key={i} className="pl-2">
                                <span className="font-bold">{p.topic}</span>
                                <br/>
                                <span className="text-gray-700 text-sm"> - المرحلة الحالية: {p.stage} (نسبة الإنجاز: {p.progress}%)</span>
                            </li>
                        )) : <p className="italic text-gray-500">لا يوجد أبحاث جارية حالياً.</p>}
                    </ul>
                </div>

                <div className="mb-8 page-break-inside-avoid">
                    <h4 className="text-xl font-bold bg-gray-200 p-2 mb-4 border border-black">ثالثاً: النشاط العلمي والمجتمعي</h4>
                    <div className="grid grid-cols-2 gap-6 text-lg">
                        <div className="border p-4">
                            <p className="mb-2"><strong>تحكيم الرسائل:</strong> {reportData.scientificActivity.thesesJudged}</p>
                            <p className="mb-2"><strong>الإشراف العلمي:</strong> {reportData.scientificActivity.supervisionCount}</p>
                            <p><strong>الدورات التدريبية:</strong></p>
                            <p className="text-sm mt-1">{reportData.scientificActivity.trainingCourses || 'لا يوجد'}</p>
                        </div>
                        <div className="border p-4">
                             <p><strong>المؤتمرات:</strong> {reportData.scientificActivity.conferences.length > 0 ? reportData.scientificActivity.conferences.map(c => c.name).join('، ') : 'لا يوجد'}</p>
                             <p className="mt-2"><strong>الكتب والمؤلفات:</strong> {reportData.communityActivity.books || 'لا يوجد'}</p>
                        </div>
                    </div>
                </div>

                <div className="mt-20 flex justify-between text-xl font-bold">
                    <div className="text-center">
                        <p>توقيع العضو</p>
                        <p className="mt-8">....................</p>
                    </div>
                    <div className="text-center">
                        <p>اعتماد رئيس القسم</p>
                        <p className="mt-8">أ.د/ إبراهيم حسن</p>
                    </div>
                </div>
            </div>
        </div>
    );
};