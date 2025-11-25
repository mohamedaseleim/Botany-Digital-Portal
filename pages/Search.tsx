import React, { useState, useEffect } from 'react';
import { Search as SearchIcon, Filter, X, FileText } from 'lucide-react';
import { ArchiveDocument, DocType, User } from '../types';
import { getDocuments, deleteDocument } from '../services/dbService';

interface SearchProps {
    user: User; // To check permissions for delete
}

export const Search: React.FC<SearchProps> = ({ user }) => {
  const [documents, setDocuments] = useState<ArchiveDocument[]>([]);
  const [filteredDocs, setFilteredDocs] = useState<ArchiveDocument[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [keyword, setKeyword] = useState('');
  const [docType, setDocType] = useState<'ALL' | DocType>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const docs = await getDocuments(); // Get all
    setDocuments(docs);
    setFilteredDocs(docs);
    setLoading(false);
  };

  const handleSearch = () => {
    let result = documents;

    // Filter by Type
    if (docType !== 'ALL') {
      result = result.filter(d => d.type === docType);
    }

    // Filter by Keyword (Subject, Notes, Serial, Parties)
    if (keyword.trim()) {
      const k = keyword.toLowerCase();
      result = result.filter(d => 
        d.subject.toLowerCase().includes(k) ||
        d.serialNumber.toLowerCase().includes(k) ||
        (d.notes && d.notes.toLowerCase().includes(k)) ||
        (d.recipient && d.recipient.toLowerCase().includes(k)) ||
        (d.sender && d.sender.toLowerCase().includes(k))
      );
    }

    // Filter by Date Range
    if (startDate) {
      result = result.filter(d => d.date >= startDate);
    }
    if (endDate) {
      result = result.filter(d => d.date <= endDate);
    }

    setFilteredDocs(result);
  };

  const clearFilters = () => {
    setKeyword('');
    setDocType('ALL');
    setStartDate('');
    setEndDate('');
    setFilteredDocs(documents);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا المستند؟')) {
        await deleteDocument(id);
        fetchData(); // Refresh
    }
  };

  const getTypeLabel = (type: DocType) => {
      switch(type) {
          case DocType.INCOMING: return 'وارد';
          case DocType.OUTGOING: return 'صادر';
          case DocType.DEPARTMENT_COUNCIL: return 'مجلس قسم';
          case DocType.COMMITTEE_MEETING: return 'لجنة قسم';
          default: return type;
      }
  };

  const getTypeColor = (type: DocType) => {
    switch(type) {
        case DocType.INCOMING: return 'bg-blue-100 text-blue-700';
        case DocType.OUTGOING: return 'bg-green-100 text-green-700';
        case DocType.DEPARTMENT_COUNCIL: return 'bg-purple-100 text-purple-700';
        case DocType.COMMITTEE_MEETING: return 'bg-amber-100 text-amber-700';
        default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <SearchIcon className="w-5 h-5 text-green-600" />
                بحث واستعلام
            </h1>
            <button onClick={clearFilters} className="text-sm text-gray-500 hover:text-red-600 flex items-center gap-1">
                <X className="w-4 h-4" /> مسح الفلاتر
            </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-1">
             <label className="block text-xs font-semibold text-gray-500 mb-1">كلمة البحث</label>
             <input 
                type="text"
                placeholder="الموضوع، الرقم، الجهة..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:border-green-500 outline-none"
             />
          </div>
          <div className="md:col-span-1">
             <label className="block text-xs font-semibold text-gray-500 mb-1">نوع المكاتبة</label>
             <select 
                value={docType}
                onChange={(e) => setDocType(e.target.value as any)}
                className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:border-green-500 outline-none bg-white"
             >
                <option value="ALL">الكل</option>
                <option value={DocType.INCOMING}>وارد</option>
                <option value={DocType.OUTGOING}>صادر</option>
                <option value={DocType.DEPARTMENT_COUNCIL}>مجالس القسم</option>
                <option value={DocType.COMMITTEE_MEETING}>لجان القسم</option>
             </select>
          </div>
          <div className="md:col-span-1">
             <label className="block text-xs font-semibold text-gray-500 mb-1">من تاريخ</label>
             <input 
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:border-green-500 outline-none"
             />
          </div>
          <div className="md:col-span-1">
             <label className="block text-xs font-semibold text-gray-500 mb-1">إلى تاريخ</label>
             <input 
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:border-green-500 outline-none"
             />
          </div>
          
          <div className="md:col-span-4 flex justify-end mt-2">
            <button 
                onClick={handleSearch}
                className="bg-green-700 text-white px-6 py-2 rounded-lg hover:bg-green-800 flex items-center gap-2"
            >
                <Filter className="w-4 h-4" />
                تطبيق البحث
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-bold text-gray-700">نتائج البحث ({filteredDocs.length})</h3>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
                <thead className="bg-gray-50 text-gray-600 font-medium">
                    <tr>
                        <th className="p-3">النوع</th>
                        <th className="p-3">الرقم</th>
                        <th className="p-3">التاريخ</th>
                        <th className="p-3">الموضوع</th>
                        <th className="p-3">الجهة / اللجنة</th>
                        <th className="p-3">إجراءات</th>
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {loading ? (
                         <tr><td colSpan={6} className="p-8 text-center">جاري البحث...</td></tr>
                    ) : (
                        filteredDocs.map((doc) => (
                            <tr key={doc.id} className="hover:bg-gray-50">
                                <td className="p-3">
                                    <span className={`px-2 py-1 rounded text-xs ${getTypeColor(doc.type)}`}>
                                        {getTypeLabel(doc.type)}
                                    </span>
                                </td>
                                <td className="p-3 font-semibold">{doc.serialNumber}</td>
                                <td className="p-3">{doc.date}</td>
                                <td className="p-3 max-w-xs truncate" title={doc.subject}>{doc.subject}</td>
                                <td className="p-3">
                                    {doc.type === DocType.OUTGOING && doc.recipient}
                                    {doc.type === DocType.INCOMING && doc.sender}
                                    {doc.type === DocType.DEPARTMENT_COUNCIL && 'مجلس القسم'}
                                    {doc.type === DocType.COMMITTEE_MEETING && doc.sender}
                                </td>
                                <td className="p-3 flex items-center gap-2">
                                    {doc.fileUrl && (
                                        <a 
                                            href={doc.fileUrl} 
                                            target="_blank" 
                                            rel="noreferrer"
                                            className="p-1 text-green-600 hover:bg-green-50 rounded"
                                            title="معاينة الملف"
                                        >
                                            <FileText className="w-4 h-4" />
                                        </a>
                                    )}
                                    {/* Only Admin can delete */}
                                    {user.role === 'ADMIN' && (
                                        <button 
                                            onClick={() => handleDelete(doc.id)}
                                            className="p-1 text-red-500 hover:bg-red-50 rounded"
                                            title="حذف السجل"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};