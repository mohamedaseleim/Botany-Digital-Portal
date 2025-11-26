
export enum UserRole {
  ADMIN = 'ADMIN', // رئيس القسم - صلاحية كاملة
  DATA_ENTRY = 'DATA_ENTRY', // سكرتارية - أرشيف فقط
  STAFF = 'STAFF', // عضو هيئة تدريس
  STUDENT_PG = 'STUDENT_PG', // دراسات عليا
  STUDENT_UG = 'STUDENT_UG', // طالب جامعي
  ALUMNI = 'ALUMNI' // خريج
}

export enum DocType {
  OUTGOING = 'OUTGOING',
  INCOMING = 'INCOMING',
  DEPARTMENT_COUNCIL = 'DEPARTMENT_COUNCIL',
  COMMITTEE_MEETING = 'COMMITTEE_MEETING'
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar?: string;
  details?: string; // e.g., "أستاذ أمراض النبات"
}

export interface ArchiveDocument {
  id: string;
  type: DocType;
  serialNumber: string;
  date: string;
  subject: string;
  notes?: string;
  fileUrl?: string;
  recipient?: string;
  sender?: string;
  senderRefNumber?: string;
  actionRequired?: string;
  assignedTo?: string;
  isFollowedUp?: boolean;
  createdAt: number;
}

// --- New Interfaces for the Portal ---

export type StaffSubRole = 'FACULTY' | 'ASSISTANT'; // هيئة تدريس vs هيئة معاونة

export interface CoursePortfolio {
    courseName: string;
    specsUrl?: string; // توصيف المقرر
    reportUrl?: string; // تقرير المقرر
    examsUrl?: string; // الامتحانات
    samplesUrl?: string; // عينات
}

export interface StaffDocItem {
    id: string;
    title: string;
    url: string;
    date?: string;
}

export interface StaffDocuments {
    // 1. Employment & Promotions (التعيين والترقيات)
    appointmentDecision?: string; // قرار التعيين الأول
    joiningReport?: string; // محضر استلام العمل
    
    // Changed to arrays for Multi-upload
    promotionDecisions?: StaffDocItem[]; // قرارات الترقية
    adminPositions?: StaffDocItem[]; // قرارات المناصب الإدارية

    // 2. Qualifications (المؤهلات)
    phdCert?: string; // الدكتوراه
    phdEquivalence?: string; // معادلة الدكتوراه
    masterCert?: string; // شهادة الماجستير
    bachelorCert?: string; // شهادة البكالوريوس

    // 3. Personal & Legal (شخصية وقانونية)
    idCard?: string; // صورة البطاقة
    birthCert?: string; // شهادة الميلاد
    militaryStatus?: string; // الموقف من التجنيد
    criminalRecord?: string; // صحيفة الحالة الجنائية
    cv?: string;

    // 4. Financial & Status (مالية وإجازات)
    financialDisclosure?: string; // إقرار الذمة المالية
    socialInsuranceNum?: string; // الرقم التأميني (New)
    statusStatement?: string; // بيان حالة وظيفية
    vacationDecisions?: string; // قرارات الإجازات/الإعارات
    
    // 5. Academic Specific (Assistant) - RESTRUCTURED
    enrollmentStatus?: string; // إفادة القيد (حديثة)
    progressReports?: StaffDocItem[]; // تقارير الصلاحية (Multi)
    extensionDecisions?: StaffDocItem[]; // قرارات مد فترة التسجيل (Multi)
    
    // 6. Performance & Penalties (Assistant) - NEW
    efficiencyReports?: StaffDocItem[]; // تقارير الكفاءة السنوية (Multi)
    penaltiesRecord?: string; // سجل الجزاءات
    
    // 7. Scholarships (Assistant) - NEW
    studyLeaveDecision?: string; // قرار البعثة/الإجازة الدراسية
    returnFromScholarship?: string; // إقرار العودة

    fldcCerts?: string; // دورات القدرات

    // 8. Scientific Activity & Supervision (Faculty) - UPDATED
    googleScholarLink?: string; // رابط جوجل سكولار
    publicationsListFile?: string; // ملف قائمة الأبحاث (Updated List)
    supervisionRecord?: string; // سجل الإشراف (Updated Record)
    
    conferenceCerts?: StaffDocItem[]; // شهادات المؤتمرات (Multi)
    arbitrationCerts?: StaffDocItem[]; // إفادات التحكيم (Multi)
    communityServiceDocs?: StaffDocItem[]; // توثيق خدمة المجتمع (Multi)

    publications?: { title: string, url: string, date: string }[]; // Legacy/Individual papers
    coursePortfolios?: CoursePortfolio[];
}

export interface StaffMember {
  id: string;
  name: string;
  rank: string; // أستاذ، أستاذ مساعد...
  specialization: string; // التخصص الدقيق
  email: string;
  phone?: string;
  imageUrl?: string;
  username?: string; // Login Data
  password?: string; // Login Data
  
  // New Fields
  subRole?: StaffSubRole;
  documents?: StaffDocuments;
}

export interface PGDates {
  enrollment?: string; // تاريخ القيد
  registration?: string; // تاريخ التسجيل (بدء العد)
  lastReport?: string; // آخر تقرير صلاحية
  nextReportDue?: string; // موعد التقرير القادم
  expectedDefense?: string; // تاريخ انتهاء المدة القانونية
  defenseDate?: string; // تاريخ المناقشة الفعلي
  grantingDate?: string; // تاريخ المنح
}

export interface PGOtherDoc {
    id: string;
    title: string;
    date: string;
    type: 'UPLOAD' | 'ARCHIVE_LINK';
    url?: string; // If UPLOAD
    archiveId?: string; // If ARCHIVE_LINK
    archiveSerial?: string; // For display
}

export interface PGDocuments {
  protocolUrl?: string;
  toeflUrl?: string;
  coursesCertUrl?: string;
  publishedPapers?: { title: string, url: string, date: string }[];
  otherDocuments?: PGOtherDoc[];
}

export interface PGAlerts {
  reportOverdue: boolean;
  extensionNeeded: boolean;
}

export interface PostgraduateStudent {
  id: string;
  name: string;
  degree: 'MSc' | 'PhD'; // ماجستير أو دكتوراة
  researchTopic: string;
  supervisor: string; // المشرف الرئيسي
  coSupervisors?: string; // المشرفين المشاركين
  status: 'Recording' | 'Researching' | 'Writing' | 'Defense' | 'Granted'; // التسجيل، البحث، الكتابة، المناقشة
  
  // Detailed Tracking
  dates: PGDates;
  documents: PGDocuments;
  alerts: PGAlerts;

  username?: string;
  password?: string;
}

export interface UndergraduateStudent {
  id: string;
  name: string;
  year: 'Third' | 'Fourth';
  section?: string; // شعبة (أمراض نبات، عامة...)
  username?: string;
  password?: string;
}

export interface AlumniMember {
  id: string;
  name: string;
  graduationYear: string;
  email?: string;
  phone?: string;
  currentJob?: string;
  username?: string;
  password?: string;
}

export interface CourseMaterial {
  id: string;
  title: string;
  year: 'Third' | 'Fourth';
  description?: string;
  fileUrl: string;
  uploadedBy: string;
  date: string;
}

export type JobStatus = 'OPEN' | 'CLOSED';

export interface JobOpportunity {
  id: string;
  title: string;
  company: string;
  description: string;
  datePosted: string;
  contactInfo: string;
  status?: JobStatus; // Added status field
}

export interface DashboardStats {
  totalIncoming: number;
  totalOutgoing: number;
  totalCouncils: number;
  totalCommittees: number;
  todayCount: number;
  unansweredCount: number;
  // Portal Stats
  totalStaff: number;
  totalStudentsPG: number;
  totalAlumni: number;
}
