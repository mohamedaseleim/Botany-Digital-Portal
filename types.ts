export enum UserRole {
  ADMIN = 'ADMIN', // رئيس القسم - صلاحية كاملة
  DATA_ENTRY = 'DATA_ENTRY', // سكرتارية - أرشيف فقط
  STAFF = 'STAFF', // عضو هيئة تدريس
  STUDENT_PG = 'STUDENT_PG', // دراسات عليا
  STUDENT_UG = 'STUDENT_UG', // طالب جامعي
  ALUMNI = 'ALUMNI', // خريج
  EMPLOYEE = 'EMPLOYEE' // موظف/إداري
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

export interface ActivityLogItem {
  id: string;
  action: string; // e.g., "تسجيل دخول", "حذف مستخدم"
  performedBy: string; // User Name
  timestamp: string; // ISO Date Time
  details: string; // "Deleted user Ahmed"
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

// --- Leave Management Types (أنواع الإجازات) ---

export type LeaveType = 
  | 'CASUAL'       // عارضة
  | 'ANNUAL'       // اعتيادية
  | 'SICK'         // مرضية
  | 'SCIENTIFIC'   // علمية/مؤتمر
  | 'SPOUSE'       // مرافقة الزوج/ة
  | 'CHILD_CARE'   // رعاية طفل
  | 'HAJJ';        // حج/عمرة

export type LeaveStatus = 
  | 'PENDING_SUBSTITUTE' // بانتظار موافقة البديل
  | 'PENDING_HEAD'       // بانتظار رئيس القسم
  | 'APPROVED'           // مقبولة
  | 'REJECTED'           // مرفوضة
  | 'CANCELED';          // ملغاة

export interface LeaveRequest {
  id: string;
  userId: string;
  userName: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  daysCount: number;
  
  // بيانات القائم بالعمل (Substitute Info)
  substituteId?: string;
  substituteName?: string;
  substituteStatus?: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  substituteRejectionReason?: string;

  // حقول خاصة حسب نوع الإجازة
  address?: string;        // Casual/Annual
  phone?: string;          // Casual/Annual
  hospital?: string;       // Sick
  medicalReportUrl?: string; // Sick
  conferenceName?: string; // Scientific
  conferenceLocation?: string; // Scientific
  participationType?: string; // Scientific
  invitationUrl?: string; // Scientific
  
  // Spouse / Long Term
  spouseName?: string;
  spouseJob?: string;
  foreignEntity?: string;
  country?: string;
  documentsUrls?: string[]; // Marriage, Contract, Visa, Insurance
  
  createdAt: number;
  status: LeaveStatus;
  adminNotes?: string;
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

// --- بيانات الاتصال المشتركة ---
export interface ContactInfo {
    email?: string;
    phone?: string;
    whatsapp?: string;
    address?: string;
}

export interface StaffMember extends ContactInfo {
  id: string;
  name: string;
  rank: string; // أستاذ، أستاذ مساعد...
  specialization: string; // التخصص الدقيق
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

export interface PostgraduateStudent extends ContactInfo {
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

export interface UndergraduateStudent extends ContactInfo {
  id: string;
  name: string;
  year: 'Third' | 'Fourth';
  section?: string; // شعبة (أمراض نبات، عامة...)
  username?: string;
  password?: string;
}

export interface AlumniMember extends ContactInfo {
  id: string;
  name: string;
  graduationYear: string;
  currentJob?: string;
  username?: string;
  password?: string;
}

// واجهة الموظف الجديد
export interface Employee extends ContactInfo {
  id: string;
  name: string;
  jobTitle: string; // المسمى الوظيفي
  department: string; // القسم/الإدارة (مثل: المعمل، السكرتارية، العمال)
  username?: string;
  password?: string;
}

export interface CourseMaterial {
  id: string;
  title: string;
  // Updated year type to include PG levels
  year: 'Third' | 'Fourth' | 'Pre-Master' | 'Pre-PhD';
  description?: string;
  fileUrl: string;
  uploadedBy: string;
  date: string;
}

// --- Schedules (Lectures & Exams) ---
export type ScheduleType = 'LECTURE' | 'EXAM';

export interface ScheduleItem {
    id: string;
    title: string;
    type: ScheduleType;
    year: 'Third' | 'Fourth' | 'Pre-Master' | 'Pre-PhD';
    fileUrl: string; // Often an image
    uploadedBy: string;
    date: string;
}

export interface Announcement {
    id: string;
    content: string;
    date: string;
    isImportant?: boolean;
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

// --- Inventory System Interfaces ---

export type AssetStatus = 'WORKING' | 'MAINTENANCE' | 'BROKEN';

export interface Asset {
  id: string;
  name: string;
  model: string;
  serialNumber: string;
  status: AssetStatus;
  location: string;
  assignedTo: string;
  dateAcquired: string;
  createdAt: number;
}

// --- Lab Management & Scheduling ---
export interface Lab {
    id: string;
    name: string;
    supervisor: string;
    location: string;
}

export type BookingStatus = 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';

export interface LabBooking {
    id: string;
    researcherName: string;
    date: string;
    startTime: string;
    endTime: string;
    experimentType: string;
    labName: string; // Default 'PG Lab'
    status: BookingStatus; // Added Status
    createdAt: number;
}

export interface LabClass {
    id: string;
    labId: string;
    courseName: string;
    instructor: string;
    day: string; // e.g. "Sunday"
    startTime: string;
    endTime: string;
}

// --- Greenhouse Management ---
export type PlotStatus = 'FREE' | 'OCCUPIED';

export interface GreenhousePlot {
    id: string; // "1", "2", etc.
    number: number;
    status: PlotStatus;
    researcher?: string;
    plantType?: string;
    startDate?: string;
    notes?: string; // Worker instructions
}

export interface GreenhouseHistoryItem {
    id: string;
    plotNumber: number;
    researcher: string;
    plantType: string;
    startDate: string;
    endDate: string;
    notes?: string;
}

// --- Department Events ---
export type DeptEventType = 'WORKSHOP' | 'SEMINAR' | 'TRIP' | 'CONFERENCE' | 'COURSE';
export type EventStatus = 'UPCOMING' | 'COMPLETED' | 'CANCELLED';

export interface DeptEvent {
    id: string;
    title: string;
    type: DeptEventType;
    date: string;
    location: string;
    description: string;
    regLink?: string; // Registration link (Google Form)
    status: EventStatus; // Added status
    createdAt: number;
}

// --- أنواع جديدة للهيكل الإداري (Department Formation) ---

export interface OrgMember {
    name: string;
    role: string; // e.g. "رئيس اللجنة", "عضو", "أمين المجلس"
    title?: string; // e.g. "أ.د", "د"
}

export interface DeptCouncilFormation {
    id: string;
    academicYear: string; // e.g. "2024-2025"
    members: OrgMember[];
}

export interface DeptCommitteeFormation {
    id: string;
    name: string; // e.g. "لجنة المختبرات"
    academicYear: string;
    members: OrgMember[];
}

// --- Annual Report Interfaces ---

export interface PublishedResearch {
    id: string;
    title: string;
    journal: string;
    date: string;
    type: 'International' | 'Regional' | 'Local';
    link?: string;
    fileUrl?: string;
}

export interface OngoingResearch {
    id: string;
    topic: string;
    stage: 'Data Collection' | 'Lab Experiments' | 'Writing' | 'Under Review';
    progress: number; // 0-100
    participants?: string;
}

export interface ScientificActivity {
    conferences: { name: string; role: string; date: string; location: string }[];
    thesesJudged: number; // تحكيم الرسائل
    supervisionCount: number; // الإشراف الحالي
    trainingCourses: string; // الدورات التدريبية
}

export interface CommunityActivity {
    books: string; // المؤلفات والكتب
    convoys: string; // القوافل
    media: string; // الإعلام
    memberships: string; // الجمعيات
}

export type ReportStatus = 'DRAFT' | 'SUBMITTED';

export interface AnnualReport {
    id: string;
    userId: string; // ربط التقرير بالعضو
    userName: string;
    academicYear: string; // "2024-2025"
    status: ReportStatus;
    submissionDate?: string;
    
    // Data Tabs
    publishedResearch: PublishedResearch[];
    ongoingResearch: OngoingResearch[];
    scientificActivity: ScientificActivity;
    communityActivity: CommunityActivity;
}

// --- Research Plan Interfaces ---

export type TopicStatus = 'AVAILABLE' | 'IN_PROGRESS' | 'COMPLETED';
export type ProposalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'MODIFICATION_REQUESTED';

export interface ResearchTopic {
    id: string;
    title: string;
    goal: string; // الهدف التطبيقي
    status: TopicStatus;
    studentName?: string; // اسم الطالب (اختياري)
    completionDate?: string; // تاريخ المناقشة
}

export interface ResearchAxis {
    id: string;
    title: string;
    description: string;
    coordinator: string; // منسق المحور
    topics: ResearchTopic[];
}

export interface ResearchPlan {
    id: string;
    title: string; // الخطة الخمسية 2025-2030
    vision: string;
    strategicGoals: string[]; // e.g. Egypt 2030, Climate Change
    startDate: string;
    endDate: string;
    status: 'ACTIVE' | 'ARCHIVED';
    axes: ResearchAxis[];
}

export interface ResearchProposal {
    id: string;
    title: string;
    axisId: string; // المحور التابع له
    type: 'MSc' | 'PhD';
    justification: string; // المبررات
    appliedGoal: string; // الهدف التطبيقي
    proposedBy: string; // اسم العضو
    proposedById: string;
    studentName?: string; // الطالب المرشح
    status: ProposalStatus;
    adminNotes?: string;
    createdAt: number;
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
  totalEmployees: number; // إحصائية جديدة للموظفين
}