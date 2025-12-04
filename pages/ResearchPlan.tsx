import React, { useState, useEffect } from 'react';
import { 
    Target, ChevronDown, ChevronUp, Search, Filter, Plus, 
    User, CheckCircle2, Clock, AlertCircle, 
    BarChart3, FileText, Send, X, Edit, Trash2, Save 
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { User as UserType, UserRole, ResearchPlan, ResearchProposal, TopicStatus } from '../types';
import { getActiveResearchPlan, getProposals, addProposal, updateProposalStatus, logActivity } from '../services/dbService';
import { db } from '../firebaseConfig';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';

interface ResearchPlanPageProps {
    user: UserType;
}

export const ResearchPlanPage: React.FC<ResearchPlanPageProps> = ({ user }) => {
    const [activeTab, setActiveTab] = useState<'BROWSE' | 'PROPOSALS' | 'ANALYTICS'>('BROWSE');
    const [plan, setPlan] = useState<ResearchPlan | null>(null);
    const [proposals, setProposals] = useState<ResearchProposal[]>([]);
    const [expandedAxis, setExpandedAxis] = useState<string | null>(null);
    
    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'ALL' | TopicStatus>('ALL');

    // Modal State
    const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
    const [editingProposalId, setEditingProposalId] = useState<string | null>(null);
    const [proposalForm, setProposalForm] = useState({
        title: '', axisId: '', type: 'MSc', justification: '', appliedGoal: '', studentName: '', hasStudent: false
    });
    const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

    const isAdmin = user.role === UserRole.ADMIN;

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const planData = await getActiveResearchPlan();
        setPlan(planData);
        if (isAdmin || activeTab === 'PROPOSALS') {
            const props = await getProposals();
            setProposals(props);
        }
    };

    // --- Logic: Duplicate Checker ---
    const checkDuplicate = (title: string) => {
        if (!plan || title.length < 5) {
            setDuplicateWarning(null);
            return;
        }
        
        let found = false;
        plan.axes.forEach(axis => {
            axis.topics.forEach(topic => {
                if (topic.title.includes(title) || title.includes(topic.title)) {
                    setDuplicateWarning(`⚠️ تنبيه: يوجد موضوع مشابه بعنوان "${topic.title}" (${topic.status === 'COMPLETED' ? 'تمت مناقشته' : 'مسجل حالياً'}).`);
                    found = true;
                }
            });
        });
        if (!found) setDuplicateWarning(null);
    };

    // --- Logic: Proposals Management ---
    const handleInitProposal = () => {
        setEditingProposalId(null);
        setProposalForm({ title: '', axisId: '', type: 'MSc', justification: '', appliedGoal: '', studentName: '', hasStudent: false });
        setIsProposalModalOpen(true);
    };

    const handleEditProposal = (prop: ResearchProposal) => {
        setEditingProposalId(prop.id);
        setProposalForm({
            title: prop.title,
            axisId: prop.axisId,
            type: prop.type,
            justification: prop.justification,
            appliedGoal: prop.appliedGoal,
            studentName: prop.studentName || '',
            hasStudent: !!prop.studentName
        });
        setIsProposalModalOpen(true);
    };

    const handleDeleteProposal = async (id: string, title: string) => {
        if (!window.confirm('هل أنت متأكد من حذف هذا المقترح؟')) return;
        try {
            await deleteDoc(doc(db, 'research_proposals', id));
            await logActivity('حذف مقترح بحثي', user.name, `تم حذف مقترح: ${title}`);
            fetchData();
        } catch (error) {
            alert('فشل الحذف');
        }
    };

    const handleProposalSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const proposalData = {
                title: proposalForm.title,
                axisId: proposalForm.axisId,
                type: proposalForm.type as any,
                justification: proposalForm.justification,
                appliedGoal: proposalForm.appliedGoal,
                studentName: proposalForm.hasStudent ? proposalForm.studentName : undefined,
                proposedBy: user.name,
                proposedById: user.id,
                status: 'PENDING' as const,
            };

            if (editingProposalId) {
                await updateDoc(doc(db, 'research_proposals', editingProposalId), proposalData);
                await logActivity('تعديل مقترح بحثي', user.name, `تم تعديل مقترح: ${proposalForm.title}`);
            } else {
                await addProposal(proposalData);
                await logActivity('تقديم مقترح بحثي', user.name, `تم تقديم مقترح جديد: ${proposalForm.title}`);
            }
            
            setIsProposalModalOpen(false);
            alert(editingProposalId ? 'تم التعديل بنجاح ✅' : 'تم إرسال المقترح للمراجعة بنجاح ✅');
            fetchData();
        } catch (error) {
            alert('حدث خطأ أثناء الإرسال');
        }
    };

    const handleProposalAction = async (id: string, title: string, action: 'APPROVED' | 'REJECTED' | 'MODIFICATION_REQUESTED') => {
        const notes = prompt("ملاحظات الإدارة (اختياري):");
        if (notes === null) return; // Cancelled
        await updateProposalStatus(id, action, notes || '');
        await logActivity('قرار مقترح بحثي', user.name, `تم ${action === 'APPROVED' ? 'اعتماد' : action === 'REJECTED' ? 'رفض' : 'طلب تعديل'} مقترح: ${title}`);
        fetchData();
    };

    // --- Logic: Plan Topics Management (Admin Only) ---
    const handleDeleteTopic = async (axisId: string, topicId: string, topicTitle: string) => {
        if (!plan || !isAdmin) return;
        if (!window.confirm('هل أنت متأكد من حذف هذه النقطة البحثية من الخطة؟')) return;

        try {
            const updatedAxes = plan.axes.map(axis => {
                if (axis.id === axisId) {
                    return { ...axis, topics: axis.topics.filter(t => t.id !== topicId) };
                }
                return axis;
            });

            await updateDoc(doc(db, 'research_plans', plan.id), { axes: updatedAxes });
            await logActivity('حذف نقطة من الخطة', user.name, `تم حذف النقطة: ${topicTitle}`);
            fetchData();
        } catch (error) {
            console.error(error);
            alert('فشل حذف النقطة');
        }
    };

    const handleChangeTopicStatus = async (axisId: string, topicId: string, newStatus: TopicStatus, topicTitle: string) => {
        if (!plan || !isAdmin) return;
        try {
            const updatedAxes = plan.axes.map(axis => {
                if (axis.id === axisId) {
                    const updatedTopics = axis.topics.map(topic => {
                        if (topic.id === topicId) return { ...topic, status: newStatus };
                        return topic;
                    });
                    return { ...axis, topics: updatedTopics };
                }
                return axis;
            });

            await updateDoc(doc(db, 'research_plans', plan.id), { axes: updatedAxes });
            await logActivity('تحديث حالة نقطة بحثية', user.name, `تغيير حالة "${topicTitle}" إلى ${newStatus}`);
            fetchData();
        } catch (error) {
            alert('فشل تحديث الحالة');
        }
    };

    if (!plan) return <div className="p-8 text-center">جاري تحميل الخطة...</div>;

    // --- Render Components ---

    const renderHeader = () => (
        <div className="bg-gradient-to-r from-green-800 to-green-600 text-white p-6 rounded-2xl mb-6 shadow-lg relative overflow-hidden">
            <div className="relative z-10">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">{plan.title}</h1>
                        <p className="text-green-100 text-lg max-w-3xl leading-relaxed opacity-90">{plan.vision}</p>
                    </div>
                    <span className={`bg-white/20 text-white px-3 py-1 rounded-full text-sm font-bold backdrop-blur-sm border border-white/30 ${plan.status === 'ACTIVE' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                        {plan.status === 'ACTIVE' ? '🟢 خطة سارية' : '🔴 أرشيف'}
                    </span>
                </div>
                <div className="mt-6 flex flex-wrap gap-3">
                    {plan.strategicGoals.map((goal, idx) => (
                        <span key={idx} className="bg-green-900/40 px-3 py-1 rounded-full text-sm flex items-center gap-1 border border-green-700/50">
                            <Target className="w-3 h-3 text-green-300"/> {goal}
                        </span>
                    ))}
                </div>
            </div>
             <Target className="absolute -bottom-10 -left-10 w-64 h-64 text-white/5 rotate-12" />
        </div>
    );

    const renderBrowseTab = () => (
        <div className="space-y-6 animate-in fade-in">
            {/* Search & Filter */}
            <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100 sticky top-0 z-10">
                <div className="flex-1 relative">
                    <Search className="w-5 h-5 text-gray-400 absolute right-3 top-2.5"/>
                    <input 
                        type="text" 
                        placeholder="ابحث عن موضوع بحثي..." 
                        className="w-full border p-2 pr-10 rounded-lg outline-none focus:ring-2 focus:ring-green-500"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <select 
                    className="border p-2 rounded-lg outline-none bg-gray-50"
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value as any)}
                >
                    <option value="ALL">كل الحالات</option>
                    <option value="AVAILABLE">🟢 متاحة</option>
                    <option value="IN_PROGRESS">🟡 جاري العمل</option>
                    <option value="COMPLETED">🔵 منجزة</option>
                </select>
            </div>

            {/* Axes Accordion */}
            <div className="space-y-4">
                {plan.axes.map(axis => {
                    const filteredTopics = axis.topics.filter(t => 
                        (statusFilter === 'ALL' || t.status === statusFilter) &&
                        (t.title.toLowerCase().includes(searchTerm.toLowerCase()))
                    );

                    if (filteredTopics.length === 0 && searchTerm) return null;

                    const progress = Math.round((axis.topics.filter(t => t.status === 'COMPLETED').length / axis.topics.length) * 100) || 0;

                    return (
                        <div key={axis.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <div 
                                className="p-4 bg-gray-50 flex justify-between items-center cursor-pointer hover:bg-gray-100 transition-colors"
                                onClick={() => setExpandedAxis(expandedAxis === axis.id ? null : axis.id)}
                            >
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                        {expandedAxis === axis.id ? <ChevronUp className="w-5 h-5"/> : <ChevronDown className="w-5 h-5"/>}
                                        {axis.title}
                                    </h3>
                                    <p className="text-sm text-gray-500 mr-7">منسق المحور: {axis.coordinator}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-center hidden md:block">
                                        <div className="text-xs text-gray-500">نسبة الإنجاز</div>
                                        <div className="w-24 h-2 bg-gray-200 rounded-full mt-1 overflow-hidden">
                                            <div className="h-full bg-green-500" style={{width: `${progress}%`}}></div>
                                        </div>
                                    </div>
                                    <span className="bg-white border px-2 py-1 rounded text-sm font-mono">{filteredTopics.length} نقاط</span>
                                </div>
                            </div>

                            {expandedAxis === axis.id && (
                                <div className="p-4 border-t border-gray-100">
                                    <p className="text-gray-600 mb-4 bg-blue-50 p-3 rounded border-r-4 border-blue-400 text-sm">
                                        💡 {axis.description}
                                    </p>
                                    <div className="grid gap-3">
                                        {filteredTopics.map(topic => (
                                            <div key={topic.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h4 className="font-bold text-gray-800">{topic.title}</h4>
                                                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                                                            topic.status === 'AVAILABLE' ? 'bg-green-100 text-green-700' :
                                                            topic.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-700' :
                                                            'bg-blue-100 text-blue-700'
                                                        }`}>
                                                            {topic.status === 'AVAILABLE' ? 'متاحة للتسجيل' :
                                                             topic.status === 'IN_PROGRESS' ? 'جاري العمل' : 'تمت المناقشة'}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-600 flex items-center gap-1">
                                                        <Target className="w-3 h-3"/> الهدف: {topic.goal}
                                                    </p>
                                                    {topic.studentName && (
                                                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                                            <User className="w-3 h-3"/> مسجلة للطالب: {topic.studentName}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {isAdmin ? (
                                                        <>
                                                            <select 
                                                                className="text-xs border rounded p-1 bg-white"
                                                                value={topic.status}
                                                                onChange={(e) => handleChangeTopicStatus(axis.id, topic.id, e.target.value as TopicStatus, topic.title)}
                                                            >
                                                                <option value="AVAILABLE">متاحة</option>
                                                                <option value="IN_PROGRESS">جاري العمل</option>
                                                                <option value="COMPLETED">منجزة</option>
                                                            </select>
                                                            <button 
                                                                onClick={() => handleDeleteTopic(axis.id, topic.id, topic.title)}
                                                                className="text-red-500 hover:bg-red-50 p-2 rounded"
                                                                title="حذف النقطة"
                                                            >
                                                                <Trash2 className="w-4 h-4"/>
                                                            </button>
                                                        </>
                                                    ) : (
                                                        topic.status === 'AVAILABLE' && (
                                                            <button className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 shadow-sm">
                                                                🙋‍♂️ طلب تسجيل
                                                            </button>
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );

    const renderProposalsTab = () => (
        <div className="space-y-6 animate-in fade-in">
            <div className="bg-purple-50 p-6 rounded-xl border border-purple-100 flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h3 className="text-xl font-bold text-purple-900 mb-2">لديك فكرة بحثية جديدة؟</h3>
                    <p className="text-purple-700 text-sm">تضمن حيوية الخطة البحثية من خلال إضافة نقاط مستجدة تواكب التطورات.</p>
                </div>
                <button 
                    onClick={handleInitProposal}
                    className="bg-purple-700 hover:bg-purple-800 text-white px-6 py-3 rounded-xl shadow-md flex items-center gap-2 font-bold transition-transform hover:scale-105"
                >
                    <Plus className="w-5 h-5"/> اقتراح نقطة بحثية جديدة
                </button>
            </div>

            {/* Proposals List */}
            <h3 className="font-bold text-gray-700 border-b pb-2 flex justify-between">
                حالة المقترحات المقدمة
                {isAdmin && <span className="text-xs bg-gray-100 px-2 py-1 rounded">{proposals.filter(p => p.status === 'PENDING').length} قيد الانتظار</span>}
            </h3>
            <div className="space-y-3">
                {proposals.length === 0 && <p className="text-center text-gray-400 py-8">لا توجد مقترحات حالياً</p>}
                {proposals.map(prop => (
                    <div key={prop.id} className="bg-white border p-4 rounded-lg shadow-sm flex flex-col md:flex-row justify-between gap-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-bold text-lg">{prop.title}</h4>
                                <span className={`text-xs px-2 py-1 rounded font-bold ${
                                    prop.status === 'PENDING' ? 'bg-amber-100 text-amber-800' :
                                    prop.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                                    prop.status === 'REJECTED' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                                }`}>
                                    {prop.status === 'PENDING' ? 'قيد المراجعة' :
                                     prop.status === 'APPROVED' ? 'تم الاعتماد' :
                                     prop.status === 'REJECTED' ? 'مرفوض' : 'مطلوب تعديل'}
                                </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-1"><strong>مقدم المقترح:</strong> {prop.proposedBy} | <strong>المحور:</strong> {plan.axes.find(a=>a.id===prop.axisId)?.title || 'محور جديد'}</p>
                            <p className="text-sm text-gray-500"><strong>المبرر:</strong> {prop.justification}</p>
                            {prop.adminNotes && <p className="text-sm text-red-600 mt-2 bg-red-50 p-2 rounded">📝 ملاحظات الإدارة: {prop.adminNotes}</p>}
                        </div>
                        
                        <div className="flex flex-col gap-2 min-w-[120px] justify-center">
                            {isAdmin && prop.status === 'PENDING' ? (
                                <>
                                    <button onClick={() => handleProposalAction(prop.id, prop.title, 'APPROVED')} className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700">اعتماد ✅</button>
                                    <button onClick={() => handleProposalAction(prop.id, prop.title, 'MODIFICATION_REQUESTED')} className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">طلب تعديل ↩️</button>
                                    <button onClick={() => handleProposalAction(prop.id, prop.title, 'REJECTED')} className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700">رفض ❌</button>
                                </>
                            ) : (
                                // للمستخدم العادي: إمكانية التعديل/الحذف إذا كان هو صاحب المقترح ولا يزال قيد الانتظار
                                (prop.proposedById === user.id && prop.status === 'PENDING') && (
                                    <div className="flex gap-2">
                                        <button onClick={() => handleEditProposal(prop)} className="text-blue-500 hover:bg-blue-50 p-2 rounded"><Edit className="w-4 h-4"/></button>
                                        <button onClick={() => handleDeleteProposal(prop.id, prop.title)} className="text-red-500 hover:bg-red-50 p-2 rounded"><Trash2 className="w-4 h-4"/></button>
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderAnalyticsTab = () => {
        const totalTopics = plan.axes.reduce((acc, ax) => acc + ax.topics.length, 0);
        const completed = plan.axes.reduce((acc, ax) => acc + ax.topics.filter(t => t.status === 'COMPLETED').length, 0);
        
        const pieData = plan.axes.map(axis => ({
            name: axis.title.split(' ').slice(0, 3).join(' ') + '...', 
            value: axis.topics.length
        }));
        const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

        return (
            <div className="space-y-6 animate-in fade-in">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-4 rounded-xl text-center border border-blue-100">
                        <h3 className="text-2xl font-bold text-blue-700">{totalTopics}</h3>
                        <p className="text-sm text-blue-500">إجمالي النقاط البحثية</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-xl text-center border border-green-100">
                        <h3 className="text-2xl font-bold text-green-700">{completed}</h3>
                        <p className="text-sm text-green-500">تمت مناقشتها (منجزة)</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-xl text-center border border-purple-100">
                        <h3 className="text-2xl font-bold text-purple-700">{totalTopics > 0 ? Math.round((completed/totalTopics)*100) : 0}%</h3>
                        <p className="text-sm text-purple-500">نسبة إنجاز الخطة</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-4 rounded-xl shadow-sm border h-80">
                        <h3 className="font-bold text-gray-700 mb-4">توزيع النقاط على المحاور</h3>
                        <ResponsiveContainer width="100%" height="90%">
                            <PieChart>
                                <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} fill="#8884d8" dataKey="value" label>
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <RechartsTooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border">
                        <h3 className="font-bold text-gray-700 mb-4">الارتباط بالأهداف القومية</h3>
                        <div className="space-y-3">
                            {plan.strategicGoals.map((goal, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <span className="flex items-center gap-2 font-bold text-gray-700"><Target className="w-4 h-4 text-red-500"/> {goal}</span>
                                    <span className="text-xs bg-white border px-2 py-1 rounded text-gray-500">نشط</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {renderHeader()}

            {/* Main Navigation */}
            <div className="flex border-b border-gray-200 bg-white rounded-t-xl overflow-x-auto">
                <button onClick={() => setActiveTab('BROWSE')} className={`px-6 py-4 font-bold text-sm flex items-center gap-2 transition-colors ${activeTab === 'BROWSE' ? 'text-green-700 border-b-2 border-green-700 bg-green-50' : 'text-gray-500 hover:text-green-600'}`}>
                    <Search className="w-4 h-4"/> تصفح الخطة
                </button>
                <button onClick={() => setActiveTab('PROPOSALS')} className={`px-6 py-4 font-bold text-sm flex items-center gap-2 transition-colors ${activeTab === 'PROPOSALS' ? 'text-green-700 border-b-2 border-green-700 bg-green-50' : 'text-gray-500 hover:text-green-600'}`}>
                    <FileText className="w-4 h-4"/> المقترحات الجديدة
                </button>
                <button onClick={() => setActiveTab('ANALYTICS')} className={`px-6 py-4 font-bold text-sm flex items-center gap-2 transition-colors ${activeTab === 'ANALYTICS' ? 'text-green-700 border-b-2 border-green-700 bg-green-50' : 'text-gray-500 hover:text-green-600'}`}>
                    <BarChart3 className="w-4 h-4"/> التحليلات والجودة
                </button>
            </div>

            <div className="bg-white p-6 rounded-b-xl shadow-sm border border-t-0 border-gray-200 min-h-[400px]">
                {activeTab === 'BROWSE' && renderBrowseTab()}
                {activeTab === 'PROPOSALS' && renderProposalsTab()}
                {activeTab === 'ANALYTICS' && renderAnalyticsTab()}
            </div>

            {/* Proposal Modal */}
            {isProposalModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in-95">
                        <div className="p-6 border-b flex justify-between items-center bg-gray-50 rounded-t-2xl">
                            <h3 className="text-xl font-bold text-gray-800">
                                {editingProposalId ? 'تعديل المقترح البحثي' : 'تقديم مقترح بحثي جديد'}
                            </h3>
                            <button onClick={() => setIsProposalModalOpen(false)}><X className="w-6 h-6 text-gray-400 hover:text-red-500"/></button>
                        </div>
                        
                        <form onSubmit={handleProposalSubmit} className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">عنوان النقطة البحثية <span className="text-red-500">*</span></label>
                                <input 
                                    type="text" required 
                                    className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                    placeholder="اكتب عنواناً علمياً دقيقاً..."
                                    value={proposalForm.title}
                                    onChange={e => {
                                        setProposalForm({...proposalForm, title: e.target.value});
                                        checkDuplicate(e.target.value);
                                    }}
                                />
                                {duplicateWarning && (
                                    <div className="mt-2 bg-amber-50 text-amber-800 p-3 rounded-lg text-sm border border-amber-200 flex items-start gap-2">
                                        <AlertCircle className="w-5 h-5 shrink-0"/>
                                        <span>{duplicateWarning}</span>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">المحور التابع له</label>
                                    <select 
                                        className="w-full border p-3 rounded-lg bg-white"
                                        value={proposalForm.axisId}
                                        onChange={e => setProposalForm({...proposalForm, axisId: e.target.value})}
                                    >
                                        <option value="">-- اختر المحور --</option>
                                        {plan.axes.map(ax => <option key={ax.id} value={ax.id}>{ax.title}</option>)}
                                        <option value="NEW">محور جديد / مستجد</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">نوع البحث</label>
                                    <select 
                                        className="w-full border p-3 rounded-lg bg-white"
                                        value={proposalForm.type}
                                        onChange={e => setProposalForm({...proposalForm, type: e.target.value})}
                                    >
                                        <option value="MSc">ماجستير</option>
                                        <option value="PhD">دكتوراه</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">المبررات والأهمية العلمية</label>
                                <textarea 
                                    required rows={3}
                                    className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                    placeholder="لماذا يجب إضافة هذه النقطة للخطة؟ (مشكلة طارئة، تقنية حديثة...)"
                                    value={proposalForm.justification}
                                    onChange={e => setProposalForm({...proposalForm, justification: e.target.value})}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">الهدف التطبيقي</label>
                                <input 
                                    type="text" required 
                                    className="w-full border p-3 rounded-lg"
                                    placeholder="ما المشكلة التي سيحلها هذا البحث؟"
                                    value={proposalForm.appliedGoal}
                                    onChange={e => setProposalForm({...proposalForm, appliedGoal: e.target.value})}
                                />
                            </div>

                            <div className="bg-gray-50 p-4 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                    <input 
                                        type="checkbox" id="hasStudent" 
                                        className="w-5 h-5 accent-purple-600"
                                        checked={proposalForm.hasStudent}
                                        onChange={e => setProposalForm({...proposalForm, hasStudent: e.target.checked})}
                                    />
                                    <label htmlFor="hasStudent" className="font-bold text-gray-700">هل يوجد طالب مرشح؟</label>
                                </div>
                                {proposalForm.hasStudent && (
                                    <input 
                                        type="text" 
                                        className="w-full border p-2 rounded bg-white"
                                        placeholder="اسم الطالب الثلاثي..."
                                        value={proposalForm.studentName}
                                        onChange={e => setProposalForm({...proposalForm, studentName: e.target.value})}
                                    />
                                )}
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <button type="button" onClick={() => setIsProposalModalOpen(false)} className="px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-bold">إلغاء</button>
                                <button type="submit" className="bg-purple-700 text-white px-8 py-2 rounded-lg hover:bg-purple-800 font-bold shadow-md flex items-center gap-2">
                                    <Send className="w-4 h-4"/> {editingProposalId ? 'حفظ التعديلات' : 'إرسال المقترح'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};