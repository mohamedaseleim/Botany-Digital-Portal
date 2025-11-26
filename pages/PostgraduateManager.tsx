
import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  AlertTriangle, 
  Clock, 
  FileText, 
  Calendar, 
  ChevronDown, 
  ChevronUp, 
  ExternalLink,
  Save,
  Loader2,
  Plus,
  Trash2,
  UploadCloud,
  X,
  Link as LinkIcon,
  Search
} from 'lucide-react';
import { PostgraduateStudent, ArchiveDocument, DocType, PGOtherDoc } from '../types';
import { getPGStudents, updatePGStudent, getDocuments } from '../services/dbService';

export const PostgraduateManager: React.FC = () => {
  const [students, setStudents] = useState<PostgraduateStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);

  // Stats
  const [overdueCount, setOverdueCount] = useState(0);
  const [extensionCount, setExtensionCount] = useState(0);

  // Docs Modal State
  const [isDocsModalOpen, setIsDocsModalOpen] = useState(false);
  const [editingDocsId, setEditingDocsId] = useState<string | null>(null);
  
  // Available Archive Docs for Linking
  const [archiveDocs, setArchiveDocs] = useState<ArchiveDocument[]>([]);

  const [docsForm, setDocsForm] = useState({
      protocolUrl: '',
      toeflUrl: '',
      publishedPapers: [] as { title: string, url: string, date: string }[],
      otherDocuments: [] as PGOtherDoc[]
  });
  
  // State for new paper entry
  const [newPaper, setNewPaper] = useState({ title: '', url: '', date: '' });
  
  // State for new Other Doc entry
  const [otherDocType, setOtherDocType] = useState<'UPLOAD' | 'ARCHIVE_LINK'>('UPLOAD');
  const [newOtherDoc, setNewOtherDoc] = useState<{ title: string, url: string, archiveId: string }>({ title: '', url: '', archiveId: '' });

  const [submittingDocs, setSubmittingDocs] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const data = await getPGStudents();
    setStudents(data);
    
    // Calculate dashboard stats
    setOverdueCount(data.filter(s => s.alerts.reportOverdue).length);
    setExtensionCount(data.filter(s => s.alerts.extensionNeeded).length);
    
    setLoading(false);
  };

  const toggleExpand = (id: string) => {
    setExpandedStudentId(expandedStudentId === id ? null : id);
  };

  const handleDateUpdate = async (id: string, field: string, value: string) => {
    const student = students.find(s => s.id === id);
    if (!student) return;

    const newDates = { ...student.dates, [field]: value };
    
    // Auto calculate next report due (6 months after last report or registration)
    if (field === 'lastReport') {
        const d = new Date(value);
        d.setMonth(d.getMonth() + 6);
        newDates.nextReportDue = d.toISOString().split('T')[0];
    }

    try {
        await updatePGStudent(id, { dates: newDates });
        fetchData(); // Refresh to recalculate alerts
    } catch (e) {
        console.error(e);
        alert('حدث خطأ أثناء التحديث');
    }
  };

  // --- Documents Management Logic ---

  const openDocsModal = async (student: PostgraduateStudent) => {
      setEditingDocsId(student.id);
      
      // Load student docs
      setDocsForm({
          protocolUrl: student.documents.protocolUrl || '',
          toeflUrl: student.documents.toeflUrl || '',
          publishedPapers: student.documents.publishedPapers ? [...student.documents.publishedPapers] : [],
          otherDocuments: student.documents.otherDocuments ? [...student.documents.otherDocuments] : []
      });
      
      // Reset input fields
      setNewPaper({ title: '', url: '', date: '' });
      setNewOtherDoc({ title: '', url: '', archiveId: '' });
      setOtherDocType('UPLOAD');

      // Fetch archive documents for dropdown
      const docs = await getDocuments();
      // Filter only incoming/outgoing for relevance, can be expanded
      const filtered = docs.filter(d => d.type === DocType.INCOMING || d.type === DocType.OUTGOING || d.type === DocType.DEPARTMENT_COUNCIL);
      setArchiveDocs(filtered);

      setIsDocsModalOpen(true);
  };

  const handleSimulateUpload = (field: 'protocol' | 'toefl' | 'other') => {
      const mockLink = `https://drive.google.com/file/d/mock-id-${Math.floor(Math.random() * 10000)}`;
      if (field === 'protocol') setDocsForm(prev => ({ ...prev, protocolUrl: mockLink }));
      else if (field === 'toefl') setDocsForm(prev => ({ ...prev, toeflUrl: mockLink }));
      else if (field === 'other') setNewOtherDoc(prev => ({ ...prev, url: mockLink }));
  };

  const handleAddPaper = () => {
      if (!newPaper.title || !newPaper.date) return;
      setDocsForm(prev => ({
          ...prev,
          publishedPapers: [...prev.publishedPapers, { ...newPaper }]
      }));
      setNewPaper({ title: '', url: '', date: '' });
  };

  const handleRemovePaper = (index: number) => {
      setDocsForm(prev => ({
          ...prev,
          publishedPapers: prev.publishedPapers.filter((_, i) => i !== index)
      }));
  };

  const handleAddOtherDoc = () => {
      if (!newOtherDoc.title) return;
      
      const newDoc: PGOtherDoc = {
          id: Math.random().toString(36).substr(2, 9),
          title: newOtherDoc.title,
          date: new Date().toISOString().split('T')[0],
          type: otherDocType,
      };

      if (otherDocType === 'UPLOAD') {
          if (!newOtherDoc.url) return;
          newDoc.url = newOtherDoc.url;
      } else {
          if (!newOtherDoc.archiveId) return;
          const archiveItem = archiveDocs.find(d => d.id === newOtherDoc.archiveId);
          newDoc.archiveId = newOtherDoc.archiveId;
          newDoc.archiveSerial = archiveItem?.serialNumber || '???';
      }

      setDocsForm(prev => ({
          ...prev,
          otherDocuments: [...prev.otherDocuments, newDoc]
      }));
      
      // Reset
      setNewOtherDoc({ title: '', url: '', archiveId: '' });
  };

  const handleRemoveOtherDoc = (index: number) => {
    setDocsForm(prev => ({
        ...prev,
        otherDocuments: prev.otherDocuments.filter((_, i) => i !== index)
    }));
  };

  const handleSaveDocs = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDocsId) return;
    setSubmittingDocs(true);
    
    try {
        const student = students.find(s => s.id === editingDocsId);
        if (student) {
            const updatedDocs = {
                ...student.documents,
                protocolUrl: docsForm.protocolUrl,
                toeflUrl: docsForm.toeflUrl,
                publishedPapers: docsForm.publishedPapers,
                otherDocuments: docsForm.otherDocuments
            };
            await updatePGStudent(editingDocsId, { documents: updatedDocs });
            await fetchData();
        }
        setIsDocsModalOpen(false);
    } catch (e) {
        console.error(e);
        alert('حدث خطأ أثناء حفظ الملفات');
    } finally {
        setSubmittingDocs(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">جاري تحميل بيانات الدراسات العليا...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">نظام متابعة الدراسات العليا</h1>
          <p className="text-gray-500 text-sm">إدارة المسار الزمني، التقارير الدورية، والملفات الأكاديمية</p>
        </div>
      </div>

      {/* Lagging Indicators Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
                <p className="text-gray-500 text-sm">إجمالي الباحثين</p>
                <h3 className="text-2xl font-bold text-gray-800">{students.length}</h3>
            </div>
            <div className="bg-blue-50 p-3 rounded-full text-blue-600"><GraduationCap /></div>
        </div>

        <div className={`p-4 rounded-xl shadow-sm border flex items-center justify-between transition-colors ${overdueCount > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-gray-100'}`}>
            <div>
                <p className={`${overdueCount > 0 ? 'text-red-700' : 'text-gray-500'} text-sm font-semibold`}>تقارير متأخرة</p>
                <h3 className={`text-2xl font-bold ${overdueCount > 0 ? 'text-red-800' : 'text-gray-800'}`}>{overdueCount}</h3>
                {overdueCount > 0 && <p className="text-xs text-red-600 mt-1">يجب التنبيه فوراً</p>}
            </div>
            <div className={`${overdueCount > 0 ? 'bg-red-200 text-red-700' : 'bg-gray-50 text-gray-400'} p-3 rounded-full`}><Clock /></div>
        </div>

        <div className={`p-4 rounded-xl shadow-sm border flex items-center justify-between transition-colors ${extensionCount > 0 ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-100'}`}>
            <div>
                <p className={`${extensionCount > 0 ? 'text-amber-700' : 'text-gray-500'} text-sm font-semibold`}>تجاوز المدة القانونية</p>
                <h3 className={`text-2xl font-bold ${extensionCount > 0 ? 'text-amber-800' : 'text-gray-800'}`}>{extensionCount}</h3>
                {extensionCount > 0 && <p className="text-xs text-amber-600 mt-1">مطلوب مد قيد</p>}
            </div>
            <div className={`${extensionCount > 0 ? 'bg-amber-200 text-amber-700' : 'bg-gray-50 text-gray-400'} p-3 rounded-full`}><AlertTriangle /></div>
        </div>
      </div>

      {/* Students List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
            <h3 className="font-bold text-gray-700">سجل الطلاب والمتابعة</h3>
        </div>
        
        <div className="divide-y">
            {students.map(student => (
                <div key={student.id} className="group transition-colors hover:bg-gray-50">
                    {/* Header Row */}
                    <div 
                        className="p-4 flex flex-col md:flex-row md:items-center justify-between cursor-pointer gap-4"
                        onClick={() => toggleExpand(student.id)}
                    >
                        <div className="flex items-start gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white
                                ${student.degree === 'PhD' ? 'bg-purple-600' : 'bg-blue-600'}
                            `}>
                                {student.degree === 'PhD' ? 'D' : 'M'}
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-800">{student.name}</h4>
                                <p className="text-sm text-gray-500">{student.researchTopic}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 text-sm">
                            <div className="text-left md:text-right">
                                <p className="text-gray-500 text-xs">المشرف الرئيسي</p>
                                <p className="font-medium">{student.supervisor}</p>
                            </div>
                            
                            {/* Alert Badges */}
                            <div className="flex gap-2">
                                {student.alerts.reportOverdue && (
                                    <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
                                        <Clock className="w-3 h-3" /> تأخير تقرير
                                    </span>
                                )}
                                {student.alerts.extensionNeeded && (
                                    <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
                                        <AlertTriangle className="w-3 h-3" /> انتهاء مدة
                                    </span>
                                )}
                            </div>

                            <button className="text-gray-400 hover:text-green-600">
                                {expandedStudentId === student.id ? <ChevronUp /> : <ChevronDown />}
                            </button>
                        </div>
                    </div>

                    {/* Expanded Details */}
                    {expandedStudentId === student.id && (
                        <div className="bg-gray-50 p-6 border-t border-gray-100 animate-in slide-in-from-top-2">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                
                                {/* 1. Timeline & Dates */}
                                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                    <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
                                        <Calendar className="w-4 h-4 text-blue-600" />
                                        المسار الزمني (Timeline)
                                    </h4>
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-500 mb-1">تاريخ القيد</label>
                                                <input type="date" className="w-full border rounded p-1 text-sm bg-gray-50" 
                                                    value={student.dates.enrollment || ''} 
                                                    onChange={(e) => handleDateUpdate(student.id, 'enrollment', e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-500 mb-1">تاريخ التسجيل (بدء المدة)</label>
                                                <input type="date" className="w-full border rounded p-1 text-sm bg-gray-50"
                                                    value={student.dates.registration || ''}
                                                    onChange={(e) => handleDateUpdate(student.id, 'registration', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        
                                        <div className="border-t border-dashed pt-2 mt-2">
                                            <div className="flex justify-between items-center mb-1">
                                                <label className="block text-xs font-bold text-gray-700">آخر تقرير صلاحية تم رفعه</label>
                                                {student.alerts.reportOverdue && <span className="text-xs text-red-600 font-bold animate-pulse">مطلوب تقرير جديد!</span>}
                                            </div>
                                            <input type="date" className="w-full border rounded p-1 text-sm focus:ring-2 focus:ring-blue-500"
                                                value={student.dates.lastReport || ''}
                                                onChange={(e) => handleDateUpdate(student.id, 'lastReport', e.target.value)}
                                            />
                                            <p className="text-xs text-gray-400 mt-1">
                                                الموعد القادم المتوقع: <span className="font-mono text-gray-600">{student.dates.nextReportDue || '-'}</span>
                                            </p>
                                        </div>

                                        <div className="border-t border-dashed pt-2 mt-2">
                                            <label className="block text-xs font-semibold text-gray-500 mb-1">نهاية المدة القانونية</label>
                                            <input type="date" className="w-full border rounded p-1 text-sm bg-gray-50"
                                                value={student.dates.expectedDefense || ''}
                                                onChange={(e) => handleDateUpdate(student.id, 'expectedDefense', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* 2. Digital Portfolio */}
                                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                    <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
                                        <FileText className="w-4 h-4 text-green-600" />
                                        الملف الرقمي (Digital Portfolio)
                                    </h4>
                                    
                                    <ul className="space-y-3">
                                        <li className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                            <span className="text-sm text-gray-700">الخطة البحثية (Protocol)</span>
                                            {student.documents.protocolUrl ? (
                                                <a href={student.documents.protocolUrl} target="_blank" className="text-blue-600 text-xs flex items-center gap-1 hover:underline">
                                                    <ExternalLink className="w-3 h-3" /> عرض
                                                </a>
                                            ) : (
                                                <span className="text-xs text-gray-400">لم يتم الرفع</span>
                                            )}
                                        </li>
                                        <li className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                            <span className="text-sm text-gray-700">شهادة اللغة (TOEFL)</span>
                                            {student.documents.toeflUrl ? (
                                                <a href={student.documents.toeflUrl} target="_blank" className="text-blue-600 text-xs flex items-center gap-1 hover:underline">
                                                    <ExternalLink className="w-3 h-3" /> عرض
                                                </a>
                                            ) : (
                                                <span className="text-xs text-gray-400">لم يتم الرفع</span>
                                            )}
                                        </li>
                                    </ul>

                                    {/* Other Docs Preview */}
                                    {student.documents.otherDocuments && student.documents.otherDocuments.length > 0 && (
                                        <div className="mt-3 pt-3 border-t border-dashed">
                                            <h5 className="font-semibold text-xs text-gray-600 mb-2">ملفات إضافية وربط بالأرشيف</h5>
                                            <ul className="space-y-1">
                                                {student.documents.otherDocuments.map((doc, idx) => (
                                                    <li key={idx} className="flex items-center gap-2 text-xs text-gray-600">
                                                        {doc.type === 'ARCHIVE_LINK' ? <LinkIcon className="w-3 h-3 text-amber-500"/> : <FileText className="w-3 h-3 text-gray-400"/>}
                                                        <span className="truncate">{doc.title}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    <div className="mt-4 pt-4 border-t">
                                        <button 
                                            onClick={() => openDocsModal(student)}
                                            className="mt-3 w-full text-xs bg-green-50 hover:bg-green-100 text-green-700 py-2 rounded-lg border border-green-200 font-semibold transition-colors flex items-center justify-center gap-1"
                                        >
                                            <Plus className="w-3 h-3" /> إدارة الملفات والأرشيف
                                        </button>
                                    </div>
                                </div>

                            </div>
                            
                            <div className="mt-4 flex justify-end">
                                <button 
                                    onClick={() => toggleExpand(student.id)}
                                    className="bg-green-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-green-700 flex items-center gap-2"
                                >
                                    <Save className="w-4 h-4" /> حفظ وإغلاق
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
      </div>

      {/* Document Management Modal */}
      {isDocsModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl w-full max-w-2xl shadow-2xl animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
                  <div className="p-6 border-b flex justify-between items-center">
                      <h3 className="text-xl font-bold text-gray-800">إدارة الملفات والأبحاث</h3>
                      <button onClick={() => setIsDocsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                          <X className="w-6 h-6" />
                      </button>
                  </div>
                  
                  <form onSubmit={handleSaveDocs} className="p-6 space-y-6">
                      
                      {/* Section 1: Basic Documents */}
                      <div className="space-y-3">
                          <h4 className="font-bold text-sm text-gray-700 border-b pb-1">المستندات الأساسية</h4>
                          
                          <div className="flex items-center gap-3">
                             <div className="flex-1">
                                <label className="block text-xs font-semibold text-gray-500 mb-1">الخطة البحثية (Protocol)</label>
                                <input 
                                    type="text" readOnly value={docsForm.protocolUrl} 
                                    placeholder="رابط الملف"
                                    className="w-full bg-gray-50 border p-2 rounded text-xs text-gray-500"
                                />
                             </div>
                             <button 
                                type="button" 
                                onClick={() => handleSimulateUpload('protocol')}
                                className="mt-5 p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 border border-blue-200"
                                title="رفع ملف"
                             >
                                 <UploadCloud className="w-5 h-5" />
                             </button>
                          </div>

                          <div className="flex items-center gap-3">
                             <div className="flex-1">
                                <label className="block text-xs font-semibold text-gray-500 mb-1">شهادة اللغة (TOEFL)</label>
                                <input 
                                    type="text" readOnly value={docsForm.toeflUrl} 
                                    placeholder="رابط الملف"
                                    className="w-full bg-gray-50 border p-2 rounded text-xs text-gray-500"
                                />
                             </div>
                             <button 
                                type="button" 
                                onClick={() => handleSimulateUpload('toefl')}
                                className="mt-5 p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 border border-blue-200"
                                title="رفع ملف"
                             >
                                 <UploadCloud className="w-5 h-5" />
                             </button>
                          </div>
                      </div>

                      {/* Section 2: Other Files & Archive Linking */}
                      <div className="space-y-3">
                        <h4 className="font-bold text-sm text-gray-700 border-b pb-1">ملفات أخرى / ربط بالأرشيف</h4>
                        
                        {/* List Existing Other Docs */}
                        {docsForm.otherDocuments && docsForm.otherDocuments.length > 0 ? (
                            <ul className="space-y-2">
                                {docsForm.otherDocuments.map((doc, idx) => (
                                    <li key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200">
                                        <div className="flex items-center gap-3">
                                            {doc.type === 'ARCHIVE_LINK' ? (
                                                <div className="p-2 bg-amber-100 text-amber-600 rounded">
                                                    <LinkIcon className="w-4 h-4" />
                                                </div>
                                            ) : (
                                                <div className="p-2 bg-blue-100 text-blue-600 rounded">
                                                    <FileText className="w-4 h-4" />
                                                </div>
                                            )}
                                            <div className="text-xs">
                                                <p className="font-bold text-gray-800">{doc.title}</p>
                                                {doc.type === 'ARCHIVE_LINK' ? (
                                                    <p className="text-amber-600">مرتبط بأرشيف رقم: {doc.archiveSerial}</p>
                                                ) : (
                                                    <p className="text-blue-500 underline cursor-pointer">عرض الملف المرفق</p>
                                                )}
                                            </div>
                                        </div>
                                        <button 
                                            type="button" 
                                            onClick={() => handleRemoveOtherDoc(idx)}
                                            className="text-red-500 hover:bg-red-50 p-1 rounded"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        ) : <p className="text-xs text-gray-400">لا توجد ملفات إضافية.</p>}

                        {/* Add New Other Doc Form */}
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 mt-2">
                            <div className="flex gap-4 mb-3 border-b border-gray-200 pb-2">
                                <button 
                                    type="button" 
                                    onClick={() => setOtherDocType('UPLOAD')}
                                    className={`text-xs font-bold pb-1 ${otherDocType === 'UPLOAD' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
                                >
                                    رفع ملف خارجي
                                </button>
                                <button 
                                    type="button" 
                                    onClick={() => setOtherDocType('ARCHIVE_LINK')}
                                    className={`text-xs font-bold pb-1 ${otherDocType === 'ARCHIVE_LINK' ? 'text-amber-600 border-b-2 border-amber-600' : 'text-gray-500'}`}
                                >
                                    ربط بمكاتبة (صادر/وارد)
                                </button>
                            </div>

                            <div className="space-y-2">
                                <input 
                                    type="text" placeholder="عنوان المستند (مثال: قرار تشكيل لجنة)" 
                                    className="w-full text-xs p-2 rounded border border-gray-300 focus:outline-none focus:border-green-500"
                                    value={newOtherDoc.title} onChange={e => setNewOtherDoc({...newOtherDoc, title: e.target.value})}
                                />
                                
                                {otherDocType === 'UPLOAD' ? (
                                    <div className="flex gap-2">
                                         <input 
                                            type="text" readOnly value={newOtherDoc.url}
                                            placeholder="رابط الملف سيظهر هنا..."
                                            className="w-full text-xs p-2 rounded border border-gray-300 bg-white text-gray-500"
                                        />
                                        <button 
                                            type="button" 
                                            onClick={() => handleSimulateUpload('other')}
                                            className="whitespace-nowrap px-3 bg-blue-50 text-blue-600 border border-blue-200 rounded text-xs hover:bg-blue-100"
                                        >
                                            <UploadCloud className="w-4 h-4 inline-block mr-1" /> رفع
                                        </button>
                                    </div>
                                ) : (
                                    <select 
                                        className="w-full text-xs p-2 rounded border border-gray-300 bg-white"
                                        value={newOtherDoc.archiveId}
                                        onChange={e => setNewOtherDoc({...newOtherDoc, archiveId: e.target.value})}
                                    >
                                        <option value="">-- اختر مكاتبة من الأرشيف --</option>
                                        {archiveDocs.map(doc => (
                                            <option key={doc.id} value={doc.id}>
                                                [{doc.type === DocType.INCOMING ? 'وارد' : 'صادر'}] {doc.serialNumber} - {doc.subject}
                                            </option>
                                        ))}
                                    </select>
                                )}

                                <button 
                                    type="button" 
                                    onClick={handleAddOtherDoc}
                                    className="w-full mt-2 bg-gray-600 text-white text-xs py-2 rounded hover:bg-gray-700 flex items-center justify-center gap-1"
                                >
                                    <Plus className="w-3 h-3" /> إضافة
                                </button>
                            </div>
                        </div>
                      </div>

                      {/* Section 3: Published Papers */}
                      <div className="space-y-3">
                          <h4 className="font-bold text-sm text-gray-700 border-b pb-1">النشر العلمي</h4>
                          
                          {/* List Existing */}
                          {docsForm.publishedPapers.length > 0 ? (
                              <ul className="space-y-2">
                                  {docsForm.publishedPapers.map((paper, idx) => (
                                      <li key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200">
                                          <div className="text-xs">
                                              <p className="font-bold text-gray-800">{paper.title}</p>
                                              <p className="text-gray-500">{paper.date}</p>
                                          </div>
                                          <button 
                                            type="button" 
                                            onClick={() => handleRemovePaper(idx)}
                                            className="text-red-500 hover:bg-red-50 p-1 rounded"
                                          >
                                              <Trash2 className="w-4 h-4" />
                                          </button>
                                      </li>
                                  ))}
                              </ul>
                          ) : <p className="text-xs text-gray-400">لا توجد أبحاث مضافة.</p>}

                          {/* Add New */}
                          <div className="bg-green-50 p-3 rounded-lg border border-green-100 space-y-2 mt-2">
                              <p className="text-xs font-bold text-green-800">إضافة بحث جديد</p>
                              <input 
                                type="text" placeholder="عنوان البحث" 
                                className="w-full text-xs p-2 rounded border border-green-200 focus:outline-none focus:border-green-500"
                                value={newPaper.title} onChange={e => setNewPaper({...newPaper, title: e.target.value})}
                              />
                              <div className="flex gap-2">
                                  <input 
                                    type="date" 
                                    className="w-1/3 text-xs p-2 rounded border border-green-200"
                                    value={newPaper.date} onChange={e => setNewPaper({...newPaper, date: e.target.value})}
                                  />
                                  <input 
                                    type="text" placeholder="رابط البحث (DOI/URL)" 
                                    className="w-2/3 text-xs p-2 rounded border border-green-200"
                                    value={newPaper.url} onChange={e => setNewPaper({...newPaper, url: e.target.value})}
                                  />
                              </div>
                              <button 
                                type="button" 
                                onClick={handleAddPaper}
                                className="w-full bg-green-600 text-white text-xs py-2 rounded hover:bg-green-700 flex items-center justify-center gap-1"
                              >
                                  <Plus className="w-3 h-3" /> إضافة للقائمة
                              </button>
                          </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-4 border-t">
                          <button 
                            type="button" 
                            onClick={() => setIsDocsModalOpen(false)}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                          >
                              إلغاء
                          </button>
                          <button 
                            type="submit"
                            disabled={submittingDocs}
                            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2 disabled:opacity-50"
                          >
                              {submittingDocs ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                              حفظ التغييرات
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};
