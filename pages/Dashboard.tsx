import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { FileInput, FileOutput, Calendar, AlertTriangle, RefreshCcw, CheckCircle2, Clock, Users, ClipboardList, GraduationCap, Briefcase, BadgeCheck } from 'lucide-react';
import { StatCard } from '../components/StatCard';
import { getStats, getDocuments } from '../services/dbService';
import { DashboardStats, ArchiveDocument, DocType } from '../types';

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentDocs, setRecentDocs] = useState<ArchiveDocument[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    const s = await getStats();
    const docs = await getDocuments();
    setStats(s);
    setRecentDocs(docs.slice(0, 5));
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center h-full text-green-600">
        <RefreshCcw className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const chartData = [
    { name: 'الوارد', count: stats.totalIncoming },
    { name: 'الصادر', count: stats.totalOutgoing },
    { name: 'المجالس', count: stats.totalCouncils },
    { name: 'اللجان', count: stats.totalCommittees },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">لوحة القيادة المركزية</h1>
        <button onClick={fetchData} className="text-sm text-green-600 hover:underline flex items-center gap-1">
          <RefreshCcw className="w-4 h-4" /> تحديث
        </button>
      </div>

      {/* الإحصائيات الإدارية */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="إجمالي الوارد" value={stats.totalIncoming} icon={FileInput} color="blue" />
        <StatCard title="إجمالي الصادر" value={stats.totalOutgoing} icon={FileOutput} color="green" />
        <StatCard title="مجالس القسم" value={stats.totalCouncils} icon={Users} color="purple" />
        <StatCard title="اجتماعات اللجان" value={stats.totalCommittees} icon={ClipboardList} color="amber" />
      </div>
      
      {/* إحصائيات مجتمع القسم (تم تحديثها لتشمل الموظفين) */}
      <h3 className="font-bold text-gray-700 mt-4">إحصائيات مجتمع القسم</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
         <StatCard title="أعضاء هيئة التدريس" value={stats.totalStaff} icon={Users} color="green" />
         <StatCard title="الموظفين والإداريين" value={stats.totalEmployees} icon={BadgeCheck} color="amber" />
         <StatCard title="طلاب الدراسات العليا" value={stats.totalStudentsPG} icon={GraduationCap} color="blue" />
         <StatCard title="شبكة الخريجين" value={stats.totalAlumni} icon={Briefcase} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Recent Activity Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-bold text-gray-800 mb-4">أحدث المكاتبات الإدارية</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead>
                <tr className="border-b text-gray-500">
                  <th className="pb-2">النوع</th>
                  <th className="pb-2">الرقم</th>
                  <th className="pb-2">الموضوع</th>
                  <th className="pb-2">التاريخ</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {recentDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50">
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          doc.type === DocType.INCOMING ? 'bg-blue-100 text-blue-700' : 
                          doc.type === DocType.OUTGOING ? 'bg-green-100 text-green-700' :
                          doc.type === DocType.DEPARTMENT_COUNCIL ? 'bg-purple-100 text-purple-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {doc.type === DocType.INCOMING ? 'وارد' : 
                           doc.type === DocType.OUTGOING ? 'صادر' : 
                           doc.type === DocType.DEPARTMENT_COUNCIL ? 'مجلس' : 'لجنة'}
                        </span>
                        {doc.type === DocType.INCOMING && doc.actionRequired && (
                          doc.isFollowedUp 
                            ? <CheckCircle2 className="w-4 h-4 text-green-500" title="تمت المتابعة" />
                            : <Clock className="w-4 h-4 text-amber-500" title="قيد المتابعة" />
                        )}
                      </div>
                    </td>
                    <td className="py-3 font-medium text-gray-700">{doc.serialNumber}</td>
                    <td className="py-3 text-gray-600 truncate max-w-[150px]">{doc.subject}</td>
                    <td className="py-3 text-gray-500">{doc.date}</td>
                  </tr>
                ))}
                {recentDocs.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-gray-400">لا توجد مكاتبات حديثة</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 min-h-[300px]">
          <h3 className="font-bold text-gray-800 mb-4">نشاط القسم</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{fontFamily: 'Cairo'}} />
              <YAxis allowDecimals={false} />
              <Tooltip 
                contentStyle={{ fontFamily: 'Cairo', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                cursor={{fill: '#f3f4f6'}}
              />
              <Bar dataKey="count" fill="#15803d" barSize={50} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};