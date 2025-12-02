import React, { useState, useEffect } from 'react';
import { Plus, UploadCloud, Save, Loader2, FileText, CheckCircle2, Clock, Edit, Trash2, X } from 'lucide-react';
import { ArchiveDocument, DocType, User } from '../types';
import { 
  addDocument, 
  generateSerial, 
  getDocuments, 
  uploadFileToDrive, 
  updateDocument, 
  deleteDocument,
  logActivity 
} from '../services/dbService';

interface IncomingProps {
  user: User;
}

export const Incoming: React.FC<IncomingProps> = ({ user }) => {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [documents, setDocuments] = useState<ArchiveDocument[]>([]);
  const [formVisible, setFormVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    serialNumber: '',
    date: new Date().toISOString().split('T')[0],
    sender: '',
    senderRefNumber: '',
    subject: '',
    actionRequired: '',
    assignedTo: '',
    notes: '',
  });
  const [file, setFile] = useState<File | null>(null);

  // قائمة أعضاء هيئة التدريس للتوجيه (يمكن جلبها من قاعدة البيانات لاحقاً)
  const professors = ["أ.د/ رئيس القسم", "د. محمد أحمد", "د. علي محمود", "لجنة المشتريات", "شئون الطلاب"];

  useEffect(() => {
    fetchDocs();
  }, []);

  const fetchDocs = async () => {
    setLoading(true);
    const docs = await getDocuments(DocType.INCOMING);
    setDocuments(docs);
    setLoading(false);
  };

  const handleInitForm = async () => {
    const serial = await generateSerial(DocType.INCOMING);
    setFormData({
      ...formData,
      serialNumber: serial,
      date: new Date().toISOString().split('T')[0],
      sender: '',
      senderRefNumber: '',
      subject: '',
      actionRequired: '',
      assignedTo: '',
      notes: ''
    });
    setFile(null);
    setEditingId(null);
    setFormVisible(true);
  };

  const handleEdit = (doc: ArchiveDocument) => {
    setFormData({
      serialNumber: doc.serialNumber,
      date: doc.date,
      sender: doc.sender || '',
      senderRefNumber: doc.senderRefNumber || '',
      subject: doc.subject,
      actionRequired: doc.actionRequired || '',
      assignedTo: doc.assignedTo || '',
      notes: doc.notes || '',
    });
    setEditingId(doc.id);
    setFile(null);
    setFormVisible(true);
  };

  const handleDelete = async (doc: ArchiveDocument) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الخطاب الوارد؟')) {
      try {
        await deleteDocument(doc.id);
        await logActivity('حذف وارد', user.name, `تم حذف خطاب وارد رقم: ${doc.serialNumber}`);
        fetchDocs();
      } catch (error) {
        console.error(error);
        alert('فشل الحذف');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      let fileUrl = '';
      if (file) {
        try {
            // استخدام خدمة الرفع الجديدة
            fileUrl = await uploadFileToDrive(file);
        } catch (uploadError) {
            console.error("Upload failed:", uploadError);
            throw new Error("فشل رفع الملف. تأكد من إعدادات Google Drive Script.");
        }
      }

      if (editingId) {
        const updates: any = {
          date: formData.date,
          sender: formData.sender,
          senderRefNumber: formData.senderRefNumber,
          subject: formData.subject,
          actionRequired: formData.actionRequired,
          assignedTo: formData.assignedTo,
          notes: formData.notes,
        };
        if (fileUrl) updates.fileUrl = fileUrl;

        await updateDocument(editingId, updates);
        await logActivity('تعديل وارد', user.name, `تم تعديل بيانات وارد رقم: ${formData.serialNumber}`);
        alert("تم التعديل بنجاح ✅");
      } else {
        await addDocument({
          type: DocType.INCOMING,
          serialNumber: formData.serialNumber,
          date: formData.date,
          sender: formData.sender,
          senderRefNumber: formData.senderRefNumber,
          subject: formData.subject,
          actionRequired: formData.actionRequired,
          assignedTo: formData.assignedTo,
          notes: formData.notes,
          fileUrl: fileUrl || "",
          isFollowedUp: false,
        });
        await logActivity('إضافة وارد', user.name, `تم تسجيل وارد جديد رقم: ${formData.serialNumber}`);
        alert("تم الحفظ بنجاح ✅");
      }

      setFormVisible(false);
      fetchDocs();
    } catch (error) {
      console.error(error);
      alert('حدث خطأ أثناء الحفظ: ' + (error as any).message);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleFollowUp = async (doc: ArchiveDocument) => {
    if (!doc.actionRequired) return;
    const newStatus = !doc.isFollowedUp;
    
    // تحديث الواجهة فوراً (Optimistic UI)
    setDocuments(docs => docs.map(d => d.id === doc.id ? { ...d, isFollowedUp: newStatus } : d));
    
    try {
      await updateDocument(doc.id, { isFollowedUp: newStatus });
      await logActivity('تحديث متابعة', user.name, `تغيير حالة متابعة وارد رقم ${doc.serialNumber} إلى ${newStatus ? 'تمت' : 'قيد الانتظار'}`);
    } catch (error) {
      // تراجع في حالة الخطأ
      setDocuments(docs => docs.map(d => d.id === doc.id ? { ...d, isFollowedUp: !newStatus } : d));
      alert('فشل تحديث الحالة');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">الأرشيف الوارد</h1>
          <p className="text-gray-500 text-sm">تسجيل المكاتبات الواردة من الكلية والجامعة</p>
        </div>
        {!formVisible && (
          <button 
            onClick={handleInitForm}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>تسجيل وارد جديد</span>
          </button>
        )}
      </div>

      {formVisible && (
        <div className="bg-white rounded-xl shadow-md border border-blue-100 p-6 animate-in fade-in slide-in-from-top-4">
          <div className="flex justify-between items-center mb-4 border-b pb-2">
            <h3 className="font-bold text-lg text-blue-800">
                {editingId ? 'تعديل خطاب وارد' : 'بيانات الخطاب الوارد'}
            </h3>
            <button onClick={() => setFormVisible(false)} className="text-gray-400 hover:text-red-500">
                <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">رقم الوارد (القسم)</label>
                <input 
                  type="text" 
                  required
                  value={formData.serialNumber}
                  onChange={(e) => setFormData({...formData, serialNumber: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ الورود</label>
                <input 
                  type="date" 
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div></div>
              
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">الجهة المرسلة</label>
                <input 
                  type="text" 
                  required
                  placeholder="مثال: مكتب عميد الكلية"
                  value={formData.sender}
                  onChange={(e) => setFormData({...formData, sender: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">رقم خطاب الجهة</label>
                <input 
                  type="text" 
                  placeholder="الرقم المكتوب على الخطاب"
                  value={formData.senderRefNumber}
                  onChange={(e) => setFormData({...formData, senderRefNumber: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">الموضوع</label>
                <input 
                  type="text" 
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({...formData, subject: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">الإجراء المطلوب</label>
                    <input 
                    type="text" 
                    placeholder="مثال: للعرض، للرد، للحفظ"
                    value={formData.actionRequired}
                    onChange={(e) => setFormData({...formData, actionRequired: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    />
                </div>
                <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">توجيه إلى (Assign To)</label>
                    <select 
                        value={formData.assignedTo}
                        onChange={(e) => setFormData({...formData, assignedTo: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    >
                        <option value="">-- اختر عضو هيئة التدريس --</option>
                        {professors.map((prof, idx) => (
                            <option key={idx} value={prof}>{prof}</option>
                        ))}
                    </select>
                </div>
              </div>

              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {editingId ? 'تحديث المرفق (اختياري)' : 'صورة الخطاب (PDF/Image)'}
                </label>
                <div className={`border-2 border-dashed border-gray-300 rounded-lg p-6 text-center transition-colors ${submitting ? 'bg-gray-50 opacity-75' : 'hover:bg-gray-50'}`}>
                  <input 
                    type="file" 
                    id="fileUploadIn"
                    className="hidden" 
                    disabled={submitting}
                    onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                  />
                  <label htmlFor="fileUploadIn" className={`cursor-pointer flex flex-col items-center gap-2 ${submitting ? 'cursor-wait' : ''}`}>
                    {submitting ? (
                        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                    ) : (
                        <UploadCloud className="w-8 h-8 text-gray-400" />
                    )}
                    <span className="text-gray-600 text-sm">
                      {file ? file.name : 'اضغط لاختيار ملف أو اسحبه هنا'}
                    </span>
                    <span className={`text-xs ${submitting ? 'text-blue-600 font-bold animate-pulse' : 'text-gray-400'}`}>
                        {submitting ? 'جاري الرفع إلى Google Drive...' : 'يتم التخزين في Google Drive'}
                    </span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <button 
                type="button" 
                onClick={() => setFormVisible(false)}
                disabled={submitting}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50"
              >
                إلغاء
              </button>
              <button 
                type="submit" 
                disabled={submitting}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                <span>{submitting ? 'جاري الحفظ...' : (editingId ? 'حفظ التعديلات' : 'حفظ وأرشفة')}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">جاري التحميل...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="bg-gray-50 text-gray-600 font-medium">
                <tr>
                  <th className="p-4">الحالة</th>
                  <th className="p-4">رقم الوارد</th>
                  <th className="p-4">التاريخ</th>
                  <th className="p-4">الجهة المرسلة</th>
                  <th className="p-4">الموضوع</th>
                  <th className="p-4">المكلف بالمتابعة</th>
                  <th className="p-4">الملفات</th>
                  <th className="p-4">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      {doc.actionRequired ? (
                         <button 
                           onClick={() => toggleFollowUp(doc)}
                           className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold border transition-colors ${
                             doc.isFollowedUp 
                               ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' 
                               : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                           }`}
                           title={doc.isFollowedUp ? "اضغط لإلغاء المتابعة" : "اضغط لإنهاء المتابعة"}
                         >
                           {doc.isFollowedUp ? (
                             <>
                               <CheckCircle2 className="w-3 h-3" />
                               <span>تمت</span>
                             </>
                           ) : (
                             <>
                               <Clock className="w-3 h-3" />
                               <span>مطلوب</span>
                             </>
                           )}
                         </button>
                      ) : (
                        <span className="text-gray-300 text-xs">-</span>
                      )}
                    </td>
                    <td className="p-4 font-bold text-gray-700">{doc.serialNumber}</td>
                    <td className="p-4">{doc.date}</td>
                    <td className="p-4">{doc.sender}</td>
                    <td className="p-4 max-w-xs truncate" title={doc.subject}>{doc.subject}</td>
                    <td className="p-4">
                        {doc.assignedTo ? (
                            <span className="bg-purple-50 text-purple-700 px-2 py-1 rounded-md text-xs border border-purple-100">
                                {doc.assignedTo}
                            </span>
                        ) : '-'}
                    </td>
                    <td className="p-4">
                      {doc.fileUrl ? (
                        <a 
                          href={doc.fileUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                          <FileText className="w-4 h-4" /> عرض
                        </a>
                      ) : (
                        <span className="text-gray-400 text-xs">لا يوجد</span>
                      )}
                    </td>
                    <td className="p-4 flex gap-2">
                        <button 
                            onClick={() => handleEdit(doc)}
                            className="text-blue-500 hover:bg-blue-50 p-1.5 rounded-lg transition-colors"
                            title="تعديل"
                        >
                            <Edit className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => handleDelete(doc)}
                            className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                            title="حذف"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </td>
                  </tr>
                ))}
                {documents.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-gray-400">لا توجد سجلات محفوظة</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};