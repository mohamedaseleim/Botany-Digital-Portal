import React, { useState, useEffect } from 'react';
import { BookOpen, GraduationCap, Download, FileText, Search } from 'lucide-react';
import { User, UserRole, PostgraduateStudent, CourseMaterial } from '../types';
import { getPGStudents, getMaterials } from '../services/dbService';

interface StudentPortalProps {
  user: User;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'PG' | 'UG'>(
    user.role === UserRole.STUDENT_PG ? 'PG' : 'UG'
  );
  
  const [pgStudents, setPgStudents] = useState<PostgraduateStudent[]>([]);
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const [pgData, matData] = await Promise.all([getPGStudents(), getMaterials()]);
      setPgStudents(pgData);
      setMaterials(matData);
      setLoading(false);
    };
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">بوابة الطلاب</h1>
        <p className="text-gray-500 text-sm">متابعة الدراسات العليا والمقررات الدراسية</p>
        
        <div className="flex gap-4 mt-6 border-b border-gray-200">
          <button 
            onClick={() => setActiveTab('UG')}
            className={`pb-3 px-4 text-sm font-semibold transition-colors flex items-center gap-2 ${
              activeTab === 'UG' 
                ? 'border-b-2 border-green-600 text-green-700' 
                : 'text-gray-500 hover:text-green-600'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            طلاب القسم (الفرقة 3 و 4)
          </button>
          <button 
            onClick={() => setActiveTab('PG')}
            className={`pb-3 px-4 text-sm font-semibold transition-colors flex items-center gap-2 ${
              activeTab === 'PG' 
                ? 'border-b-2 border-green-600 text-green-700' 
                : 'text-gray-500 hover:text-green-600'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            الدراسات العليا
          </button>
        </div>
      </div>

      {activeTab === 'PG' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-in fade-in">
          <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-blue-600" />
            سجل الباحثين والرسائل العلمية
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="bg-blue-50 text-blue-800">
                <tr>
                  <th className="p-3 rounded-r-lg">الباحث</th>
                  <th className="p-3">الدرجة</th>
                  <th className="p-3">عنوان الرسالة</th>
                  <th className="p-3">المشرف الرئيسي</th>
                  <th className="p-3">الحالة</th>
                  <th className="p-3 rounded-l-lg">تاريخ التسجيل</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {pgStudents.map(student => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="p-3 font-medium">{student.name}</td>
                    <td className="p-3"><span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">{student.degree}</span></td>
                    <td className="p-3 text-gray-600">{student.researchTopic}</td>
                    <td className="p-3">{student.supervisor}</td>
                    <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold
                            ${student.status === 'Researching' ? 'bg-amber-100 text-amber-700' : 
                              student.status === 'Writing' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}
                        `}>
                            {student.status === 'Researching' ? 'مرحلة البحث' : 
                             student.status === 'Writing' ? 'مرحلة الكتابة' : student.status}
                        </span>
                    </td>
                    <td className="p-3 text-gray-500">{student.registrationDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'UG' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in">
          <div className="md:col-span-2 space-y-4">
             {/* Lectures Section */}
             {materials.map(mat => (
                <div key={mat.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex items-start justify-between">
                    <div className="flex items-start gap-3">
                        <div className="bg-green-50 p-3 rounded-lg">
                            <FileText className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-800">{mat.title}</h4>
                            <p className="text-sm text-gray-500 mt-1">
                                الفرقة: {mat.year === 'Third' ? 'الثالثة' : 'الرابعة'} | بواسطة: {mat.uploadedBy}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">{mat.date}</p>
                        </div>
                    </div>
                    <button className="text-green-600 hover:bg-green-50 p-2 rounded-lg flex items-center gap-1 text-sm font-medium">
                        <Download className="w-4 h-4" /> تحميل
                    </button>
                </div>
             ))}
          </div>

          <div className="bg-green-900 text-white p-6 rounded-xl h-fit">
            <h3 className="font-bold text-lg mb-4 border-b border-green-700 pb-2">لوحة الإعلانات</h3>
            <ul className="space-y-4 text-sm">
                <li className="flex gap-2">
                    <span className="w-2 h-2 bg-green-400 rounded-full mt-1.5 flex-shrink-0"></span>
                    <p>تم تعديل موعد محاضرة "أمراض محاصيل حقلية" للفرقة الرابعة ليكون يوم الثلاثاء الساعة 10.</p>
                </li>
                <li className="flex gap-2">
                    <span className="w-2 h-2 bg-green-400 rounded-full mt-1.5 flex-shrink-0"></span>
                    <p>موعد امتحان العملي النهائي لمادة الفطريات يوم 20/5/2024.</p>
                </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};