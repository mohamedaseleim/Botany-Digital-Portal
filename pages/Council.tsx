import React, { useState, useEffect } from 'react';
import { Plus, UploadCloud, Save, Loader2, FileText, Edit, Trash2, X } from 'lucide-react';
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

interface CouncilProps {
  user: User;
}

export const Council: React.FC<CouncilProps> = ({ user }) => {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [documents, setDocuments] = useState<ArchiveDocument[]>([]);
  const [formVisible, setFormVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    serialNumber: '',
    date: new Date().toISOString().split('T')[0],
    subject: '', 
    notes: '',
  });
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    fetchDocs();
  }, []);

  const fetchDocs = async () => {
    setLoading(true);
    const docs = await getDocuments(DocType.DEPARTMENT_COUNCIL);
    setDocuments(docs);
    setLoading(false);
  };

  const handleInitForm = async () => {
    const serial = await generateSerial(DocType.DEPARTMENT_COUNCIL);
    setFormData({
      ...formData,
      serialNumber: serial,
      date: new Date().toISOString().split('T')[0],
      subject: '',
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
        subject: doc.subject,
        notes: doc.notes || '',
    });
    setEditingId(doc.id);
    setFile(null);
    setFormVisible(true);
  };

  const handleDelete = async (doc: ArchiveDocument) => {
    if (window.confirm('هل أنت متأكد من حذف هذه الجلسة؟')) {
        try {
            await deleteDocument(doc.id);
            await logActivity('حذف جلسة مجلس', user.name, `تم حذف محضر جلسة رقم: ${doc.serialNumber}`);
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
            // استخدام خدمة الرفع الجديدة (Google Drive)
            fileUrl = await uploadFileToDrive(file);
        } catch (uploadError) {
            console.error("Upload failed:", uploadError);
            throw new Error("فشل رفع الملف. تأكد من إعدادات Google Drive Script.");
        }
      }

      if (editingId) {
        // تحديث
        const updates: any = {
            date: formData.date,
            subject: formData.subject,
            notes: formData.notes,
        };
        if (fileUrl) updates.fileUrl = fileUrl;
        
        await updateDocument(editingId, updates);
        await logActivity('تعديل جلسة مجلس', user.name, `تم تعديل بيانات جلسة رقم: ${formData.serialNumber}`);
        alert("تم التعديل بنجاح ✅");
      } else {
        // إضافة جديد
        await addDocument({
            type: DocType.DEPARTMENT_COUNCIL,
            serialNumber: formData.serialNumber,
            date: formData.date,
            subject: formData.subject,
            notes: formData.notes,
            fileUrl: fileUrl || "",
        });
        await logActivity('إضافة جلسة مجلس', user.name, `تم تسجيل جلسة جديدة رقم: ${formData.serialNumber}`);
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">مجالس القسم</h1>
          <p className="text-gray-500 text-sm">أرشفة محاضر وجلسات مجلس القسم</p>
        </div>
        {!formVisible && (
          <button 
            onClick={handleInitForm}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>تسجيل جلسة جديدة</span>
          </button>
        )}
      </div>

      {formVisible && (
        <div className="bg-white rounded-xl shadow-md border border-purple-100 p-6 animate-in fade-in slide-in-from-top-4">
          <div className="flex justify-between items-center mb-4 border-b pb-2">
            <h3 className="font-bold text-lg text-purple-800">
                {editingId ? 'تعديل بيانات الجلسة' : 'بيانات الجلسة الجديدة'}
            </h3>
            <button onClick={() => setFormVisible(false)} className="text-gray-400 hover:text-red-500">
                <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">رقم الجلسة</label>
                <input 
                  type="text" 
                  required
                  placeholder="مثال: 5/2024"
                  value={formData.serialNumber}
                  onChange={(e) => setFormData({...formData, serialNumber: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-500 outline-none bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ الانعقاد</label>
                <input 
                  type="date" 
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">جدول الأعمال / الموضوعات</label>
                <input 
                  type="text" 
                  required
                  placeholder="ملخص للمواضيع التي تمت مناقشتها"
                  value={formData.subject}
                  onChange={(e) => setFormData({...formData, subject: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">أهم القرارات / ملاحظات</label>
                <textarea 
                  rows={4}
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {editingId ? 'تحديث المحضر (اختياري)' : 'نسخة المحضر (PDF/Image)'}
                </label>
                <div className={`border-2 border-dashed border-gray-300 rounded-lg p-6 text-center transition-colors ${submitting ? 'bg-gray-50 opacity-75' : 'hover:bg-gray-50'}`}>
                  <input 
                    type="file" 
                    id="fileUpload"
                    className="hidden" 
                    disabled={submitting}
                    onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                  />
                  <label htmlFor="fileUpload" className={`cursor-pointer flex flex-col items-center gap-2 ${submitting ? 'cursor-wait' : ''}`}>
                    {submitting ? (
                        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
                    ) : (
                        <UploadCloud className="w-8 h-8 text-gray-400" />
                    )}
                    <span className="text-gray-600 text-sm">
                      {file ? file.name : 'اضغط لاختيار ملف أو اسحبه هنا'}
                    </span>
                    <span className={`text-xs ${submitting ? 'text-purple-600 font-bold animate-pulse' : 'text-gray-400'}`}>
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
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                <span>{submitting ? 'جاري الحفظ...' : (editingId ? 'حفظ التعديلات' : 'حفظ الجلسة')}</span>
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
                  <th className="p-4">رقم الجلسة</th>
                  <th className="p-4">تاريخ الانعقاد</th>
                  <th className="p-4">جدول الأعمال</th>
                  <th className="p-4">المحضر</th>
                  <th className="p-4">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-bold text-gray-700">{doc.serialNumber}</td>
                    <td className="p-4">{doc.date}</td>
                    <td className="p-4 max-w-lg truncate" title={doc.subject}>{doc.subject}</td>
                    <td className="p-4">
                      {doc.fileUrl ? (
                        <a 
                          href={doc.fileUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-purple-600 hover:text-purple-800 flex items-center gap-1"
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
                    <td colSpan={5} className="p-8 text-center text-gray-400">لا توجد جلسات مسجلة</td>
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