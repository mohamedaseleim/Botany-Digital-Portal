export enum UserRole {
  ADMIN = 'ADMIN', // رئيس القسم
  DATA_ENTRY = 'DATA_ENTRY' // السكرتارية
}

export enum DocType {
  OUTGOING = 'OUTGOING',
  INCOMING = 'INCOMING',
  DEPARTMENT_COUNCIL = 'DEPARTMENT_COUNCIL', // مجالس القسم
  COMMITTEE_MEETING = 'COMMITTEE_MEETING'    // لجان القسم
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar?: string;
}

export interface ArchiveDocument {
  id: string;
  type: DocType;
  serialNumber: string; // رقم الصادر أو الوارد أو رقم الجلسة
  date: string; // تاريخ التسجيل أو الانعقاد
  
  // حقول مشتركة
  subject: string; // الموضوع أو جدول الأعمال
  notes?: string; // ملاحظات أو القرارات
  fileUrl?: string; // رابط الملف في Google Drive
  
  // حقول الصادر
  recipient?: string; // الجهة المرسل إليها
  
  // حقول الوارد / اللجان
  sender?: string; // الجهة المرسلة أو اسم اللجنة
  senderRefNumber?: string; // رقم خطاب الجهة المرسلة
  actionRequired?: string; // الإجراء المطلوب
  assignedTo?: string; // توجيه للدكتور المختص
  isFollowedUp?: boolean; // حالة المتابعة (تمت أم لا)

  createdAt: number;
}

export interface DashboardStats {
  totalIncoming: number;
  totalOutgoing: number;
  totalCouncils: number;
  totalCommittees: number;
  todayCount: number;
  unansweredCount: number;
}