import React, { useState, useEffect } from 'react';
import { Plus, UploadCloud, Save, Loader2, FileText } from 'lucide-react';
import { ArchiveDocument, DocType, User } from '../types';
import { addDocument, generateSerial, getDocuments, uploadFileToDrive } from '../services/dbService';
import { addDocument, generateSerial, getDocuments, uploadFileToDrive, logActivity } from '../services/dbService';

interface OutgoingProps {
  user: User;
}

export const Outgoing: React.FC<OutgoingProps> = ({ user }) => {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [documents, setDocuments] = useState<ArchiveDocument[]>([]);
  const [formVisible, setFormVisible] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    serialNumber: '',
    date: new Date().toISOString().split('T')[0],
    recipient: '',
    subject: '',
    notes: '',
  });
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    fetchDocs();
  }, []);

  const fetchDocs = async () => {
    setLoading(true);
    const docs = await getDocuments(DocType.OUTGOING);
    setDocuments(docs);
    setLoading(false);
  };

  const handleInitForm = async () => {
    const serial = await generateSerial(DocType.OUTGOING);
    setFormData({
      ...formData,
      serialNumber: serial,
      date: new Date().toISOString().split('T')[0],
      recipient: '',
      subject: '',
      notes: ''
    });
    setFile(null);
    setFormVisible(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      let fileUrl = '';
      if (file) {
        try {
            // محاولة رفع الملف
            fileUrl = await uploadFileToDrive(file);
        } catch (uploadError) {
            console.error("Upload failed:", uploadError);
            throw new Error("فشل رفع الملف. تأكد من إعدادات Google Drive Script.");
        }
      }

      await addDocument({
        type: DocType.OUTGOING,
        serialNumber: formData.serialNumber,
        date: formData.date,
        recipient: formData.recipient,
        subject: formData.subject,
        notes: formData.notes,
        fileUrl: fileUrl || "", 
      });
      
      await logActivity('إضافة صادر', user.name, `موضوع: ${formData.subject} - رقم: ${formData.serialNumber}`);
      
      setFormVisible(false);
      fetchDocs();
      alert("تم الحفظ بنجاح ✅");
    } catch (error) {
      console.error(error);
      alert('حدث خطأ: ' + (error as any).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">الأرشيف الصادر</h1>
          <p className="text-gray-500 text-sm">إدارة المكاتبات الصادرة من القسم</p>
        </div>
        {!formVisible && (
          <button 
            onClick={handleInitForm}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>تسجيل صادر جديد</span>
          </button>
        )}
      </div>

      {formVisible && (
        <div className="bg-white rounded-xl shadow-md border border-green-100 p-6 animate-in fade-in slide-in-from-top-4">
          <h3 className="font-bold text-lg mb-4 text-green-800 border-b pb-2">بيانات الخطاب الصادر</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">رقم الصادر</label>
                <input 
                  type="text" 
                  required
                  value={formData.serialNumber}
                  onChange={(e) => setFormData({...formData, serialNumber: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-green-500 outline-none bg-gray-50"
                  readOnly 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ الصادر</label>
                <input 
                  type="date" 
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-green-500 outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">الجهة المرسل إليها</label>
                <input 
                  type="text" 
                  required
                  placeholder="مثال: السيد أ.د/ عميد الكلية"
                  value={formData.recipient}
                  onChange={(e) => setFormData({...formData, recipient: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-green-500 outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">الموضوع</label>
                <input 
                  type="text" 
                  required
                  placeholder="موضوع الخطاب باختصار..."
                  value={formData.subject}
                  onChange={(e) => setFormData({...formData, subject: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-green-500 outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات</label>
                <textarea 
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-green-500 outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">صورة الخطاب (PDF/Image)</label>
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
                        <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
                    ) : (
                        <UploadCloud className="w-8 h-8 text-gray-400" />
                    )}
                    <span className="text-gray-600 text-sm">
                      {file ? file.name : 'اضغط لاختيار ملف أو اسحبه هنا'}
                    </span>
                    {/* تم تحديث النص هنا */}
                    <span className={`text-xs ${submitting ? 'text-green-600 font-bold animate-pulse' : 'text-gray-400'}`}>
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
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                <span>{submitting ? 'جاري الحفظ...' : 'حفظ وأرشفة'}</span>
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
                  <th className="p-4">رقم الصادر</th>
                  <th className="p-4">التاريخ</th>
                  <th className="p-4">المرسل إليه</th>
                  <th className="p-4">الموضوع</th>
                  <th className="p-4">الملفات</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-bold text-gray-700">{doc.serialNumber}</td>
                    <td className="p-4">{doc.date}</td>
                    <td className="p-4">{doc.recipient}</td>
                    <td className="p-4 max-w-xs truncate" title={doc.subject}>{doc.subject}</td>
                    <td className="p-4">
                      {doc.fileUrl ? (
                        <a 
                          href={doc.fileUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-green-600 hover:text-green-800 flex items-center gap-1"
                        >
                          <FileText className="w-4 h-4" /> عرض
                        </a>
                      ) : (
                        <span className="text-gray-400 text-xs">لا يوجد مرفق</span>
                      )}
                    </td>
                  </tr>
                ))}
                {documents.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-400">لا توجد سجلات محفوظة</td>
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
