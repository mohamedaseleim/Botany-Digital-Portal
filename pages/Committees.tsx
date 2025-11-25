import React, { useState, useEffect } from 'react';
import { Plus, UploadCloud, Save, Loader2, FileText } from 'lucide-react';
import { ArchiveDocument, DocType, User } from '../types';
import { addDocument, generateSerial, getDocuments, uploadFileToDrive } from '../services/dbService';

interface CommitteesProps {
  user: User;
}

export const Committees: React.FC<CommitteesProps> = ({ user }) => {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [documents, setDocuments] = useState<ArchiveDocument[]>([]);
  const [formVisible, setFormVisible] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    serialNumber: '', // رقم الجلسة
    date: new Date().toISOString().split('T')[0],
    committeeName: '', // اسم اللجنة (stored in sender field)
    subject: '', // الموضوع
    notes: '', // التوصيات
  });
  const [file, setFile] = useState<File | null>(null);

  const committeeNames = [
    "لجنة شئون التعليم والطلاب",
    "لجنة الدراسات العليا",
    "لجنة المختبرات والأجهزة",
    "لجنة شئون البيئة",
    "لجنة الجداول الدراسية",
    "لجنة المشتريات"
  ];

  useEffect(() => {
    fetchDocs();
  }, []);

  const fetchDocs = async () => {
    setLoading(true);
    const docs = await getDocuments(DocType.COMMITTEE_MEETING);
    setDocuments(docs);
    setLoading(false);
  };

  const handleInitForm = async () => {
    // Generate a simple serial if needed, but manual entry might be better for committees
    // Let's assume manual or auto based on user preference. We'll leave it open.
    setFormData({
      ...formData,
      serialNumber: '', 
      date: new Date().toISOString().split('T')[0],
      committeeName: '',
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
        fileUrl = await uploadFileToDrive(file);
      }

      await addDocument({
        type: DocType.COMMITTEE_MEETING,
        serialNumber: formData.serialNumber,
        date: formData.date,
        sender: formData.committeeName, // Storing committee name in 'sender' field
        subject: formData.subject,
        notes: formData.notes,
        fileUrl: fileUrl || undefined,
      });

      setFormVisible(false);
      fetchDocs();
    } catch (error) {
      console.error(error);
      alert('حدث خطأ أثناء الحفظ');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">لجان القسم</h1>
          <p className="text-gray-500 text-sm">أرشفة اجتماعات اللجان الفرعية</p>
        </div>
        {!formVisible && (
          <button 
            onClick={handleInitForm}
            className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>تسجيل اجتماع لجنة</span>
          </button>
        )}
      </div>

      {formVisible && (
        <div className="bg-white rounded-xl shadow-md border border-amber-100 p-6 animate-in fade-in slide-in-from-top-4">
          <h3 className="font-bold text-lg mb-4 text-amber-800 border-b pb-2">بيانات الاجتماع</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">اسم اللجنة</label>
                <select
                  required
                  value={formData.committeeName}
                  onChange={(e) => setFormData({...formData, committeeName: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-amber-500 outline-none bg-white"
                >
                    <option value="">-- اختر اللجنة --</option>
                    {committeeNames.map(c => <option key={c} value={c}>{c}</option>)}
                    <option value="other">لجنة أخرى (تكتب يدوياً في الملاحظات)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">رقم الجلسة</label>
                <input 
                  type="text" 
                  required
                  placeholder="رقم مسلسل"
                  value={formData.serialNumber}
                  onChange={(e) => setFormData({...formData, serialNumber: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-amber-500 outline-none bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ الانعقاد</label>
                <input 
                  type="date" 
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">موضوع الاجتماع</label>
                <input 
                  type="text" 
                  required
                  placeholder="عنوان الاجتماع"
                  value={formData.subject}
                  onChange={(e) => setFormData({...formData, subject: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">التوصيات</label>
                <textarea 
                  rows={4}
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">نسخة المحضر (PDF/Image)</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition-colors">
                  <input 
                    type="file" 
                    id="fileUpload"
                    className="hidden" 
                    onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                  />
                  <label htmlFor="fileUpload" className="cursor-pointer flex flex-col items-center gap-2">
                    <UploadCloud className="w-8 h-8 text-gray-400" />
                    <span className="text-gray-600 text-sm">
                      {file ? file.name : 'اضغط لاختيار ملف أو اسحبه هنا'}
                    </span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <button 
                type="button" 
                onClick={() => setFormVisible(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                إلغاء
              </button>
              <button 
                type="submit" 
                disabled={submitting}
                className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50"
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                <span>حفظ الاجتماع</span>
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
                  <th className="p-4">اسم اللجنة</th>
                  <th className="p-4">رقم الجلسة</th>
                  <th className="p-4">تاريخ الانعقاد</th>
                  <th className="p-4">الموضوع</th>
                  <th className="p-4">المحضر</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-bold text-amber-800">{doc.sender}</td>
                    <td className="p-4 text-gray-700">{doc.serialNumber}</td>
                    <td className="p-4">{doc.date}</td>
                    <td className="p-4 max-w-lg truncate" title={doc.subject}>{doc.subject}</td>
                    <td className="p-4">
                      {doc.fileUrl ? (
                        <a 
                          href={doc.fileUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-amber-600 hover:text-amber-800 flex items-center gap-1"
                        >
                          <FileText className="w-4 h-4" /> عرض
                        </a>
                      ) : (
                        <span className="text-gray-400 text-xs">لا يوجد</span>
                      )}
                    </td>
                  </tr>
                ))}
                {documents.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-400">لا توجد اجتماعات مسجلة</td>
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