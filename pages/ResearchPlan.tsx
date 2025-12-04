import React, { useState, useEffect } from 'react';
import { 
    Target, ChevronDown, ChevronUp, Search, Filter, Plus, 
    User, CheckCircle2, Clock, AlertCircle, 
    BarChart3, FileText, Send, X, Edit, Trash2, Save, Archive, Settings, RotateCcw, PenTool
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { User as UserType, UserRole, ResearchPlan, ResearchProposal, TopicStatus, ResearchTopic, ResearchAxis } from '../types';
import { 
    getActiveResearchPlan, getProposals, addProposal, updateProposalStatus, 
    logActivity, getAllResearchPlans, addResearchPlan, updateResearchPlan, 
    deleteResearchPlan, archiveResearchPlan 
} from '../services/dbService';
import { db } from '../firebaseConfig';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';

interface ResearchPlanPageProps {
    user: UserType;
}

export const ResearchPlanPage: React.FC<ResearchPlanPageProps> = ({ user }) => {
    const [activeTab, setActiveTab] = useState<'BROWSE' | 'PROPOSALS' | 'ANALYTICS' | 'ARCHIVE'>('BROWSE');
    const [activePlan, setActivePlan] = useState<ResearchPlan | null>(null);
    const [archivedPlans, setArchivedPlans] = useState<ResearchPlan[]>([]);
    const [proposals, setProposals] = useState<ResearchProposal[]>([]);
    const [expandedAxis, setExpandedAxis] = useState<string | null>(null);
    
    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'ALL' | TopicStatus>('ALL');

    // Modal States
    const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
    const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
    
    // Editing States
    const [editingProposalId, setEditingProposalId] = useState<string | null>(null);
    const [editingPlanId, setEditingPlanId] = useState<string | null>(null);

    // Topic Editing State
    const [editingTopicData, setEditingTopicData] = useState<{axisId: string, topic: ResearchTopic} | null>(null);

    // Forms
    const [proposalForm, setProposalForm] = useState({
        title: '', axisId: '', newAxisName: '', type: 'MSc', justification: '', appliedGoal: '', studentName: '', hasStudent: false
    });
    
    const [planForm, setPlanForm] = useState({
        title: '', vision: '', startDate: '', endDate: '', strategicGoals: ''
    });

    const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

    const isAdmin = user.role === UserRole.ADMIN;

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const currentPlan = await getActiveResearchPlan();
        setActivePlan(currentPlan);
        const allPlans = await getAllResearchPlans();
        setArchivedPlans(allPlans.filter(p => p.status === 'ARCHIVED'));

        // Fetch proposals for admin or everyone (depending on requirements, usually admin sees all, user sees theirs)
        const props = await getProposals();
        if (isAdmin) {
            setProposals(props);
        } else {
            // User sees their own proposals
            setProposals(props.filter(p => p.proposedById === user.id));
        }
    };

    // --- Logic: Plan Content Management ---
    const handleUpdateTopic = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activePlan || !editingTopicData) return;

        const updatedAxes = activePlan.axes.map(axis => {
            if (axis.id === editingTopicData.axisId) {
                return {
                    ...axis,
                    topics: axis.topics.map(t => t.id === editingTopicData.topic.id ? editingTopicData.topic : t)
                };
            }
            return axis;
        });

        try {
            await updateResearchPlan(activePlan.id, { axes: updatedAxes });
            await logActivity('تعديل نقطة بحثية', user.name, `تعديل النقطة: ${editingTopicData.topic.title}`);
            setEditingTopicData(null);
            fetchData();
            alert('تم التعديل بنجاح');
        } catch (error) {
            alert('فشل التعديل');
        }
    };

    const handleDeleteTopic = async (axisId: string, topicId: string, topicTitle: string) => {
        if (!activePlan || !isAdmin) return;
        if (!window.confirm('هل أنت متأكد من حذف هذه النقطة البحثية من الخطة؟')) return;

        try {
            const updatedAxes = activePlan.axes.map(axis => {
                if (axis.id === axisId) {
                    return { ...axis, topics: axis.topics.filter(t => t.id !== topicId) };
                }
                return axis;
            });

            await updateResearchPlan(activePlan.id, { axes: updatedAxes });
            await logActivity('حذف نقطة من الخطة', user.name, `تم حذف النقطة: ${topicTitle}`);
            fetchData();
        } catch (error) {
            alert('فشل حذف النقطة');
        }
    };

    const handleRequestRegistration = async (axisId: string, topicId: string, topicTitle: string) => {
        if (!activePlan) return;
        if (user.role !== UserRole.STUDENT_PG && user.role !== UserRole.STAFF && !isAdmin) {
            alert('هذه الميزة متاحة للطلاب وأعضاء الهيئة فقط.');
            return;
        }

        if (!window.confirm(`هل تود إرسال طلب لتسجيل النقطة البحثية: "${topicTitle}"؟`)) return;
        
        try {
            const updatedAxes = activePlan.axes.map(axis => {
                if (axis.id === axisId) {
                    return {
                        ...axis,
                        topics: axis.topics.map(t => {
                            if (t.id === topicId) {
                                return { 
                                    ...t, 
                                    status: 'IN_PROGRESS' as TopicStatus, 
                                    studentName: `${user.name} (قيد الاعتماد)` 
                                };
                            }
                            return t;
                        })
                    };
                }
                return axis;
            });

            await updateResearchPlan(activePlan.id, { axes: updatedAxes });
            await logActivity('طلب تسجيل نقطة بحثية', user.name, `طلب تسجيل النقطة: ${topicTitle}`);
            fetchData();
            alert('تم إرسال طلب التسجيل بنجاح.');
        } catch (error) {
            alert('فشل إرسال الطلب');
        }
    };

    // --- Logic: Proposal Approval & Integration ---
    const handleProposalAction = async (id: string, title: string, action: 'APPROVED' | 'REJECTED' | 'MODIFICATION_REQUESTED', proposal?: ResearchProposal) => {
        const notes = prompt("ملاحظات الإدارة (اختياري):");
        if (notes === null) return; 

        try {
            // 1. Update proposal status
            await updateProposalStatus(id, action, notes || '');
            
            // 2. If Approved, add to plan
            if (action === 'APPROVED' && proposal && activePlan) {
                const newTopic: ResearchTopic = {
                    id: `topic-${Date.now()}`,
                    title: proposal.title,
                    goal: proposal.appliedGoal,
                    status: 'AVAILABLE',
                    studentName: proposal.studentName || undefined,
                };

                if (proposal.studentName) {
                    newTopic.status = 'IN_PROGRESS';
                }

                let updatedAxes = [...activePlan.axes];

                if (proposal.axisId === 'NEW') {
                    // Create new axis
                    const newAxis: ResearchAxis = {
                        id: `axis-${Date.now()}`,
                        title: proposal.newAxisName || 'محور مستجد',
                        description: proposal.justification,
                        coordinator: proposal.proposedBy,
                        topics: [newTopic]
                    };
                    updatedAxes.push(newAxis);
                } else {
                    // Add to existing axis
                    updatedAxes = updatedAxes.map(ax => {
                        if (ax.id === proposal.axisId) {
                            return { ...ax, topics: [...ax.topics, newTopic] };
                        }
                        return ax;
                    });
                }

                await updateResearchPlan(activePlan.id, { axes: updatedAxes });
                await logActivity('إضافة للخطة البحثية', user.name, `تمت إضافة نقطة من المقترح: ${title}`);
            }

            await logActivity('قرار مقترح بحثي', user.name, `تم ${action} مقترح: ${title}`);
            fetchData();
            alert(`تم تنفيذ الإجراء بنجاح.`);

        } catch (error) {
            console.error(error);
            alert('حدث خطأ أثناء تنفيذ الإجراء');
        }
    };

    // --- Logic: Proposal CRUD ---
    const handleInitProposal = () => {
        setEditingProposalId(null);
        setProposalForm({ title: '', axisId: '', newAxisName: '', type: 'MSc', justification: '', appliedGoal: '', studentName: '', hasStudent: false });
        setIsProposalModalOpen(true);
    };

    const handleEditProposal = (prop: ResearchProposal) => {
        setEditingProposalId(prop.id);
        setProposalForm({
            title: prop.title,
            axisId: prop.axisId,
            newAxisName: prop.newAxisName || '',
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
            // Using direct firestore delete for simplicity here, better to have a service function
            await deleteDoc(doc(db, 'research_proposals', id));
            await logActivity('حذف مقترح بحثي', user.name, `تم حذف مقترح: ${title}`);
            fetchData();
            alert('تم الحذف بنجاح');
        } catch (error) {
            console.error(error);
            alert('فشل الحذف');
        }
    };

    const handleProposalSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const proposalData = {
                title: proposalForm.title,
                axisId: proposalForm.axisId,
                newAxisName: proposalForm.axisId === 'NEW' ? proposalForm.newAxisName : undefined,
                type: proposalForm.type as any,
                justification: proposalForm.justification,
                appliedGoal: proposalForm.appliedGoal,
                studentName: proposalForm.hasStudent ? proposalForm.studentName : "",
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
            fetchData();
            alert(editingProposalId ? 'تم التعديل بنجاح ✅' : 'تم إرسال المقترح للمراجعة بنجاح ✅');
        } catch (error) {
            console.error(error);
            alert('حدث خطأ أثناء الإرسال');
        }
    };

    // --- Standard Handlers ---
    const checkDuplicate = (title: string) => {
        if (!activePlan || title.length < 5) {
            setDuplicateWarning(null);
            return;
        }
        let found = false;
        activePlan.axes.forEach(axis => {
            axis.topics.forEach(topic => {
                if (topic.title.includes(title) || title.includes(topic.title)) {
                    setDuplicateWarning(`⚠️ تنبيه: يوجد موضوع مشابه بعنوان "${topic.title}"`);
                    found = true;
                }
            });
        });
        if (!found) setDuplicateWarning(null);
    };

    const handleOpenPlanModal = (plan?: ResearchPlan) => {
        if (plan) {
            setEditingPlanId(plan.id);
            setPlanForm({
                title: plan.title,
                vision: plan.vision,
                startDate: plan.startDate,
                endDate: plan.endDate,
                strategicGoals: plan.strategicGoals.join(', ')
            });
        } else {
            setEditingPlanId(null);
            const nextYear = new Date().getFullYear();
            setPlanForm({
                title: `الخطة البحثية الخمسية ${nextYear}-${nextYear + 5}`,
                vision: '',
                startDate: `${nextYear}-01-01`,
                endDate: `${nextYear + 5}-12-31`,
                strategicGoals: 'رؤية مصر 2030, الأمن الغذائي'
            });
        }
        setIsPlanModalOpen(true);
    };

    const handleSavePlan = async (e: React.FormEvent) => {
        e.preventDefault();
        const planData = {
            title: planForm.title,
            vision: planForm.vision,
            startDate: planForm.startDate,
            endDate: planForm.endDate,
            strategicGoals: planForm.strategicGoals.split(',').map(s => s.trim()),
            status: 'ACTIVE' as const,
            axes: editingPlanId && activePlan ? activePlan.axes : [] 
        };

        try {
            if (editingPlanId) {
                await updateResearchPlan(editingPlanId, planData);
            } else {
                await addResearchPlan(planData); 
            }
            setIsPlanModalOpen(false);
            fetchData();
        } catch (error) { alert('خطأ'); }
    };

    const handleDeletePlan = async () => {
        if (!activePlan) return;
        if (!window.confirm('تحذير: هل أنت متأكد؟')) return;
        await deleteResearchPlan(activePlan.id);
        fetchData();
    };

    // --- Render Components ---

    const renderHeader = () => (
        <div className="bg-gradient-to-r from-green-800 to-green-600 text-white p-6 rounded-2xl mb-6 shadow-lg relative overflow-hidden">
            <div className="relative z-10">
                {activePlan ? (
                    <>
                        <div className="flex justify-between items-start">
                            <div>
                                <h1 className="text-3xl font-bold mb-2">{activePlan.title}</h1>
                                <p className="text-green-100 text-lg max-w-3xl leading-relaxed opacity-90">{activePlan.vision}</p>
                            </div>
                            <div className="flex flex-col gap-2 items-end">
                                <span className="bg-white/20 text-white px-3 py-1 rounded-full text-sm font-bold backdrop-blur-sm border border-white/30">
                                    🟢 خطة سارية ({activePlan.startDate.split('-')[0]} - {activePlan.endDate.split('-')[0]})
                                </span>
                                {isAdmin && (
                                    <div className="flex gap-2 mt-2">
                                        <button onClick={() => handleOpenPlanModal(activePlan)} className="bg-white/10 hover:bg-white/20 p-2 rounded-lg text-white text-xs flex items-center gap-1 backdrop-blur-md transition">
                                            <Settings className="w-4 h-4"/> تعديل
                                        </button>
                                        <button onClick={() => handleOpenPlanModal()} className="bg-white/10 hover:bg-white/20 p-2 rounded-lg text-white text-xs flex items-center gap-1 backdrop-blur-md transition">
                                            <Plus className="w-4 h-4"/> خطة جديدة
                                        </button>
                                        <button onClick={handleDeletePlan} className="bg-red-500/30 hover:bg-red-500/50 p-2 rounded-lg text-white text-xs flex items-center gap-1 backdrop-blur-md transition">
                                            <Trash2 className="w-4 h-4"/> حذف
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="mt-6 flex flex-wrap gap-3">
                            {activePlan.strategicGoals.map((goal, idx) => (
                                <span key={idx} className="bg-green-900/40 px-3 py-1 rounded-full text-sm flex items-center gap-1 border border-green-700/50">
                                    <Target className="w-3 h-3 text-green-300"/> {goal}
                                </span>
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="text-center py-8">
                        <h2 className="text-2xl font-bold mb-4">لا توجد خطة بحثية سارية حالياً</h2>
                        {isAdmin && <button onClick={() => handleOpenPlanModal()} className="bg-white text-green-800 px-6 py-3 rounded-xl font-bold hover:bg-green-50 transition shadow-lg flex items-center gap-2 mx-auto"><Plus className="w-5 h-5"/> إنشاء الخطة الخمسية للقسم</button>}
                    </div>
                )}
            </div>
             <Target className="absolute -bottom-10 -left-10 w-64 h-64 text-white/5 rotate-12" />
        </div>
    );

    const renderBrowseTab = () => (
        <div className="space-y-6 animate-in fade-in">
            <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100 sticky top-0 z-10">
                <div className="flex-1 relative">
                    <Search className="w-5 h-5 text-gray-400 absolute right-3 top-2.5"/>
                    <input type="text" placeholder="ابحث عن موضوع بحثي..." className="w-full border p-2 pr-10 rounded-lg outline-none focus:ring-2 focus:ring-green-500" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/>
                </div>
                <select className="border p-2 rounded-lg outline-none bg-gray-50" value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)}>
                    <option value="ALL">كل الحالات</option>
                    <option value="AVAILABLE">🟢 متاحة</option>
                    <option value="IN_PROGRESS">🟡 جاري العمل</option>
                    <option value="COMPLETED">🔵 منجزة</option>
                </select>
            </div>

            <div className="space-y-4">
                {activePlan?.axes.map(axis => {
                    const filteredTopics = axis.topics.filter(t => 
                        (statusFilter === 'ALL' || t.status === statusFilter) &&
                        (t.title.toLowerCase().includes(searchTerm.toLowerCase()))
                    );

                    if (filteredTopics.length === 0 && searchTerm) return null;

                    const progress = Math.round((axis.topics.filter(t => t.status === 'COMPLETED').length / axis.topics.length) * 100) || 0;

                    return (
                        <div key={axis.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="p-4 bg-gray-50 flex justify-between items-center cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => setExpandedAxis(expandedAxis === axis.id ? null : axis.id)}>
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
                                        <div className="w-24 h-2 bg-gray-200 rounded-full mt-1 overflow-hidden"><div className="h-full bg-green-500" style={{width: `${progress}%`}}></div></div>
                                    </div>
                                    <span className="bg-white border px-2 py-1 rounded text-sm font-mono">{filteredTopics.length} نقاط</span>
                                </div>
                            </div>

                            {expandedAxis === axis.id && (
                                <div className="p-4 border-t border-gray-100">
                                    <p className="text-gray-600 mb-4 bg-blue-50 p-3 rounded border-r-4 border-blue-400 text-sm">💡 {axis.description}</p>
                                    <div className="grid gap-3">
                                        {filteredTopics.map(topic => (
                                            <div key={topic.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h4 className="font-bold text-gray-800">{topic.title}</h4>
                                                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${topic.status === 'AVAILABLE' ? 'bg-green-100 text-green-700' : topic.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                                                            {topic.status === 'AVAILABLE' ? 'متاحة للتسجيل' : topic.status === 'IN_PROGRESS' ? 'جاري العمل' : 'تمت المناقشة'}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-600 flex items-center gap-1"><Target className="w-3 h-3"/> الهدف: {topic.goal}</p>
                                                    {topic.studentName && <p className="text-xs text-gray-500 mt-1 flex items-center gap-1"><User className="w-3 h-3"/> مسجلة للطالب: {topic.studentName}</p>}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {isAdmin ? (
                                                        <>
                                                            <button onClick={() => setEditingTopicData({axisId: axis.id, topic: topic})} className="text-blue-500 hover:bg-blue-50 p-2 rounded" title="تعديل"><Edit className="w-4 h-4"/></button>
                                                            <button onClick={() => handleDeleteTopic(axis.id, topic.id, topic.title)} className="text-red-500 hover:bg-red-50 p-2 rounded" title="حذف"><Trash2 className="w-4 h-4"/></button>
                                                        </>
                                                    ) : (
                                                        topic.status === 'AVAILABLE' && (
                                                            <button onClick={() => handleRequestRegistration(axis.id, topic.id, topic.title)} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 shadow-sm">
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
            
            {/* Topic Edit Modal */}
            {editingTopicData && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl">
                         <div className="flex justify-between items-center mb-4 border-b pb-2">
                            <h3 className="font-bold text-lg">تعديل النقطة البحثية</h3>
                            <button onClick={() => setEditingTopicData(null)}><X className="w-5 h-5"/></button>
                        </div>
                        <form onSubmit={handleUpdateTopic}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold mb-1">عنوان النقطة</label>
                                    <input type="text" className="w-full border p-2 rounded" value={editingTopicData.topic.title} onChange={e => setEditingTopicData({...editingTopicData, topic: {...editingTopicData.topic, title: e.target.value}})} />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold mb-1">الهدف التطبيقي</label>
                                    <input type="text" className="w-full border p-2 rounded" value={editingTopicData.topic.goal} onChange={e => setEditingTopicData({...editingTopicData, topic: {...editingTopicData.topic, goal: e.target.value}})} />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold mb-1">الحالة</label>
                                    <select className="w-full border p-2 rounded" value={editingTopicData.topic.status} onChange={e => setEditingTopicData({...editingTopicData, topic: {...editingTopicData.topic, status: e.target.value as any}})}>
                                        <option value="AVAILABLE">متاحة</option>
                                        <option value="IN_PROGRESS">جاري العمل</option>
                                        <option value="COMPLETED">منجزة</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 mt-4">
                                <button type="button" onClick={() => setEditingTopicData(null)} className="px-4 py-2 bg-gray-100 rounded text-sm">إلغاء</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded text-sm">حفظ التعديلات</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );

    const renderProposalsTab = () => (
        <div className="space-y-6 animate-in fade-in">
            {activePlan && (
                <div className="bg-purple-50 p-6 rounded-xl border border-purple-100 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h3 className="text-xl font-bold text-purple-900 mb-2">لديك فكرة بحثية جديدة؟</h3>
                        <p className="text-purple-700 text-sm">تضمن حيوية الخطة البحثية من خلال إضافة نقاط مستجدة تواكب التطورات.</p>
                    </div>
                    <button onClick={handleInitProposal} className="bg-purple-700 hover:bg-purple-800 text-white px-6 py-3 rounded-xl shadow-md flex items-center gap-2 font-bold transition-transform hover:scale-105">
                        <Plus className="w-5 h-5"/> اقتراح نقطة بحثية جديدة
                    </button>
                </div>
            )}

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
                            <p className="text-sm text-gray-600 mb-1">
                                <strong>مقدم المقترح:</strong> {prop.proposedBy} | 
                                <strong> المحور:</strong> {prop.axisId === 'NEW' ? `محور جديد (${prop.newAxisName})` : (activePlan?.axes.find(a=>a.id===prop.axisId)?.title || 'غير محدد')}
                            </p>
                            <p className="text-sm text-gray-500"><strong>المبرر:</strong> {prop.justification}</p>
                            {prop.adminNotes && <p className="text-sm text-red-600 mt-2 bg-red-50 p-2 rounded">📝 ملاحظات الإدارة: {prop.adminNotes}</p>}
                        </div>
                        
                        <div className="flex flex-col gap-2 min-w-[120px] justify-center">
                            {isAdmin && prop.status === 'PENDING' ? (
                                <>
                                    <button onClick={() => handleProposalAction(prop.id, prop.title, 'APPROVED', prop)} className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700">اعتماد ✅</button>
                                    <button onClick={() => handleProposalAction(prop.id, prop.title, 'MODIFICATION_REQUESTED', prop)} className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">طلب تعديل ↩️</button>
                                    <button onClick={() => handleProposalAction(prop.id, prop.title, 'REJECTED', prop)} className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700">رفض ❌</button>
                                </>
                            ) : (
                                (prop.proposedById === user.id && (prop.status === 'PENDING' || prop.status === 'MODIFICATION_REQUESTED')) && (
                                    <div className="flex gap-2">
                                        <button onClick={() => handleEditProposal(prop)} className="text-blue-500 hover:bg-blue-50 p-2 rounded flex items-center gap-1 text-sm font-bold border border-blue-200"><Edit className="w-4 h-4"/> تعديل وإعادة إرسال</button>
                                        <button onClick={() => handleDeleteProposal(prop.id, prop.title)} className="text-red-500 hover:bg-red-50 p-2 rounded"><Trash2 className="w-4 h-4"/></button>
                                    </div>
                                )
                            )}
                            {/* زر حذف إضافي للمسؤولين لتنظيف المقترحات القديمة أو المرفوضة */}
                            {isAdmin && prop.status !== 'PENDING' && (
                                <button onClick={() => handleDeleteProposal(prop.id, prop.title)} className="text-gray-400 hover:text-red-500 p-1 text-xs flex items-center justify-end gap-1 mt-2">
                                    <Trash2 className="w-3 h-3"/> حذف من السجل
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderArchiveTab = () => (
        <div className="space-y-4 animate-in fade-in">
            <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                <Archive className="w-5 h-5"/> سجل الخطط البحثية السابقة
            </h3>
            {archivedPlans.length === 0 ? (
                <p className="text-center text-gray-400 py-12 border-2 border-dashed rounded-xl">لا توجد خطط مؤرشفة</p>
            ) : (
                archivedPlans.map(plan => (
                    <div key={plan.id} className="bg-gray-50 border border-gray-200 p-6 rounded-xl">
                        <div className="flex justify-between items-start">
                            <div>
                                <h4 className="text-xl font-bold text-gray-800">{plan.title}</h4>
                                <p className="text-gray-500 text-sm">{plan.startDate} - {plan.endDate}</p>
                            </div>
                            <span className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-xs font-bold">مؤرشفة</span>
                        </div>
                        <div className="mt-4 text-sm text-gray-600">
                            <p><strong>الرؤية:</strong> {plan.vision}</p>
                            <p className="mt-2"><strong>عدد المحاور:</strong> {plan.axes.length}</p>
                        </div>
                    </div>
                ))
            )}
        </div>
    );

    const renderAnalyticsTab = () => {
        if (!activePlan) return <p className="text-center p-8">لا توجد خطة نشطة لعرض إحصائياتها.</p>;

        const totalTopics = activePlan.axes.reduce((acc, ax) => acc + ax.topics.length, 0);
        const completed = activePlan.axes.reduce((acc, ax) => acc + ax.topics.filter(t => t.status === 'COMPLETED').length, 0);
        
        const pieData = activePlan.axes.map(axis => ({
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
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {renderHeader()}
            <div className="flex border-b border-gray-200 bg-white rounded-t-xl overflow-x-auto">
                <button onClick={() => setActiveTab('BROWSE')} className={`px-6 py-4 font-bold text-sm flex items-center gap-2 transition-colors ${activeTab === 'BROWSE' ? 'text-green-700 border-b-2 border-green-700 bg-green-50' : 'text-gray-500 hover:text-green-600'}`}><Search className="w-4 h-4"/> تصفح الخطة</button>
                <button onClick={() => setActiveTab('PROPOSALS')} className={`px-6 py-4 font-bold text-sm flex items-center gap-2 transition-colors ${activeTab === 'PROPOSALS' ? 'text-green-700 border-b-2 border-green-700 bg-green-50' : 'text-gray-500 hover:text-green-600'}`}><FileText className="w-4 h-4"/> المقترحات الجديدة</button>
                <button onClick={() => setActiveTab('ANALYTICS')} className={`px-6 py-4 font-bold text-sm flex items-center gap-2 transition-colors ${activeTab === 'ANALYTICS' ? 'text-green-700 border-b-2 border-green-700 bg-green-50' : 'text-gray-500 hover:text-green-600'}`}><BarChart3 className="w-4 h-4"/> التحليلات والجودة</button>
                <button onClick={() => setActiveTab('ARCHIVE')} className={`px-6 py-4 font-bold text-sm flex items-center gap-2 transition-colors ${activeTab === 'ARCHIVE' ? 'text-green-700 border-b-2 border-green-700 bg-green-50' : 'text-gray-500 hover:text-green-600'}`}><Archive className="w-4 h-4"/> الأرشيف</button>
            </div>

            <div className="bg-white p-6 rounded-b-xl shadow-sm border border-t-0 border-gray-200 min-h-[400px]">
                {activeTab === 'BROWSE' && renderBrowseTab()}
                {activeTab === 'PROPOSALS' && renderProposalsTab()}
                {activeTab === 'ANALYTICS' && renderAnalyticsTab()}
                {activeTab === 'ARCHIVE' && renderArchiveTab()}
            </div>

            {/* --- Plan Modal --- */}
            {isPlanModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm"><div className="bg-white rounded-2xl w-full max-w-2xl p-6 shadow-2xl animate-in fade-in"><div className="flex justify-between items-center mb-6 border-b pb-4"><h3 className="text-xl font-bold text-gray-800">{editingPlanId ? 'تعديل الخطة الحالية' : 'إنشاء خطة بحثية جديدة'}</h3><button onClick={() => setIsPlanModalOpen(false)}><X className="w-6 h-6 text-gray-400 hover:text-red-500"/></button></div><form onSubmit={handleSavePlan} className="space-y-4">{editingPlanId === null && <div className="bg-yellow-50 p-3 rounded border border-yellow-200 text-sm text-yellow-800 mb-4">⚠️ تنبيه: إنشاء خطة جديدة سيؤدي تلقائياً إلى أرشفة الخطة الحالية.</div>}<div><label className="block text-sm font-bold mb-1">عنوان الخطة</label><input type="text" required className="w-full border p-2 rounded" value={planForm.title} onChange={e => setPlanForm({...planForm, title: e.target.value})} /></div><div><label className="block text-sm font-bold mb-1">الرؤية البحثية</label><textarea required className="w-full border p-2 rounded" rows={3} value={planForm.vision} onChange={e => setPlanForm({...planForm, vision: e.target.value})} /></div><div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-bold mb-1">من تاريخ</label><input type="date" required className="w-full border p-2 rounded" value={planForm.startDate} onChange={e => setPlanForm({...planForm, startDate: e.target.value})} /></div><div><label className="block text-sm font-bold mb-1">إلى تاريخ</label><input type="date" required className="w-full border p-2 rounded" value={planForm.endDate} onChange={e => setPlanForm({...planForm, endDate: e.target.value})} /></div></div><div><label className="block text-sm font-bold mb-1">الأهداف الاستراتيجية (افصل بينها بفاصلة)</label><input type="text" className="w-full border p-2 rounded" value={planForm.strategicGoals} onChange={e => setPlanForm({...planForm, strategicGoals: e.target.value})} /></div><div className="flex justify-end gap-3 pt-4"><button type="button" onClick={() => setIsPlanModalOpen(false)} className="px-4 py-2 text-gray-600">إلغاء</button><button type="submit" className="bg-green-600 text-white px-6 py-2 rounded font-bold hover:bg-green-700">حفظ الخطة</button></div></form></div></div>
            )}

            {/* --- Proposal Modal --- */}
            {isProposalModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm"><div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in-95"><div className="p-6 border-b flex justify-between items-center bg-gray-50 rounded-t-2xl"><h3 className="text-xl font-bold text-gray-800">{editingProposalId ? 'تعديل المقترح البحثي' : 'تقديم مقترح بحثي جديد'}</h3><button onClick={() => setIsProposalModalOpen(false)}><X className="w-6 h-6 text-gray-400 hover:text-red-500"/></button></div><form onSubmit={handleProposalSubmit} className="p-6 space-y-5"><div><label className="block text-sm font-bold text-gray-700 mb-1">عنوان النقطة البحثية <span className="text-red-500">*</span></label><input type="text" required className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" placeholder="اكتب عنواناً علمياً دقيقاً..." value={proposalForm.title} onChange={e => { setProposalForm({...proposalForm, title: e.target.value}); checkDuplicate(e.target.value); }} />{duplicateWarning && <div className="mt-2 bg-amber-50 text-amber-800 p-3 rounded-lg text-sm border border-amber-200 flex items-start gap-2"><AlertCircle className="w-5 h-5 shrink-0"/><span>{duplicateWarning}</span></div>}</div><div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-bold text-gray-700 mb-1">المحور التابع له</label><select className="w-full border p-3 rounded-lg bg-white" value={proposalForm.axisId} onChange={e => setProposalForm({...proposalForm, axisId: e.target.value})}><option value="">-- اختر المحور --</option>{activePlan && activePlan.axes.map(ax => <option key={ax.id} value={ax.id}>{ax.title}</option>)}<option value="NEW">✨ محور جديد / مستجد</option></select></div><div><label className="block text-sm font-bold text-gray-700 mb-1">نوع البحث</label><select className="w-full border p-3 rounded-lg bg-white" value={proposalForm.type} onChange={e => setProposalForm({...proposalForm, type: e.target.value})}><option value="MSc">ماجستير</option><option value="PhD">دكتوراه</option></select></div>{proposalForm.axisId === 'NEW' && <div className="col-span-2 animate-in fade-in"><label className="block text-sm font-bold text-purple-700 mb-1">اسم المحور الجديد المقترح</label><input type="text" required className="w-full border p-3 rounded-lg border-purple-300 focus:ring-2 focus:ring-purple-500 outline-none bg-purple-50" placeholder="اكتب اسم المحور الجديد..." value={proposalForm.newAxisName} onChange={e => setProposalForm({...proposalForm, newAxisName: e.target.value})} /></div>}</div><div><label className="block text-sm font-bold text-gray-700 mb-1">المبررات والأهمية العلمية</label><textarea required rows={3} className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" placeholder="لماذا يجب إضافة هذه النقطة للخطة؟" value={proposalForm.justification} onChange={e => setProposalForm({...proposalForm, justification: e.target.value})} /></div><div><label className="block text-sm font-bold text-gray-700 mb-1">الهدف التطبيقي</label><input type="text" required className="w-full border p-3 rounded-lg" placeholder="ما المشكلة التي سيحلها هذا البحث؟" value={proposalForm.appliedGoal} onChange={e => setProposalForm({...proposalForm, appliedGoal: e.target.value})} /></div><div className="bg-gray-50 p-4 rounded-lg"><div className="flex items-center gap-2 mb-2"><input type="checkbox" id="hasStudent" className="w-5 h-5 accent-purple-600" checked={proposalForm.hasStudent} onChange={e => setProposalForm({...proposalForm, hasStudent: e.target.checked})} /><label htmlFor="hasStudent" className="font-bold text-gray-700">هل يوجد طالب مرشح؟</label></div>{proposalForm.hasStudent && <input type="text" className="w-full border p-2 rounded bg-white" placeholder="اسم الطالب الثلاثي..." value={proposalForm.studentName} onChange={e => setProposalForm({...proposalForm, studentName: e.target.value})} />}</div><div className="flex justify-end gap-3 pt-4 border-t"><button type="button" onClick={() => setIsProposalModalOpen(false)} className="px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-bold">إلغاء</button><button type="submit" className="bg-purple-700 text-white px-8 py-2 rounded-lg hover:bg-purple-800 font-bold shadow-md flex items-center gap-2"><Send className="w-4 h-4"/> {editingProposalId ? 'حفظ التعديلات' : 'إرسال المقترح'}</button></div></form></div></div>
            )}
        </div>
    );
};