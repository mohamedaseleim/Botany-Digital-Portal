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
  action: string;
  performedBy: string;
  timestamp: string;
  details: string;
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

// --- Staff & Portal Interfaces ---

export type StaffSubRole = 'FACULTY' | 'ASSISTANT';

export interface CoursePortfolio {
    courseName: string;
    specsUrl?: string;
    reportUrl?: string;
    examsUrl?: string;
    samplesUrl?: string;
}

export interface StaffDocItem {
    id: string;
    title: string;
    url: string;
    date?: string;
}

export interface StaffDocuments {
    appointmentDecision?: string; 
    joiningReport?: string; 
    promotionDecisions?: StaffDocItem[]; 
    adminPositions?: StaffDocItem[]; 
    phdCert?: string; 
    phdEquivalence?: string; 
    masterCert?: string; 
    bachelorCert?: string; 
    idCard?: string; 
    birthCert?: string; 
    militaryStatus?: string; 
    criminalRecord?: string; 
    cv?: string;
    financialDisclosure?: string; 
    socialInsuranceNum?: string; 
    statusStatement?: string; 
    vacationDecisions?: string; 
    enrollmentStatus?: string; 
    progressReports?: StaffDocItem[]; 
    extensionDecisions?: StaffDocItem[]; 
    efficiencyReports?: StaffDocItem[]; 
    penaltiesRecord?: string; 
    studyLeaveDecision?: string; 
    returnFromScholarship?: string; 
    fldcCerts?: string; 
    googleScholarLink?: string; 
    publicationsListFile?: string; 
    supervisionRecord?: string; 
    conferenceCerts?: StaffDocItem[]; 
    arbitrationCerts?: StaffDocItem[]; 
    communityServiceDocs?: StaffDocItem[]; 
    publications?: { title: string, url: string, date: string }[]; 
    coursePortfolios?: CoursePortfolio[];
}

export interface ContactInfo {
    email?: string;
    phone?: string;
    whatsapp?: string;
    address?: string;
}

export interface StaffMember extends ContactInfo {
  id: string;
  name: string;
  rank: string; 
  specialization: string; 
  imageUrl?: string;
  username?: string; 
  password?: string; 
  subRole?: StaffSubRole;
  documents?: StaffDocuments;
}

export interface PGDates {
  enrollment?: string; 
  registration?: string; 
  lastReport?: string; 
  nextReportDue?: string; 
  expectedDefense?: string; 
  defenseDate?: string; 
  grantingDate?: string; 
}

export interface PGOtherDoc {
    id: string;
    title: string;
    date: string;
    type: 'UPLOAD' | 'ARCHIVE_LINK';
    url?: string; 
    archiveId?: string; 
    archiveSerial?: string; 
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
  degree: 'MSc' | 'PhD'; 
  researchTopic: string;
  supervisor: string; 
  coSupervisors?: string; 
  status: 'Recording' | 'Researching' | 'Writing' | 'Defense' | 'Granted'; 
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
  section?: string; 
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

export interface Employee extends ContactInfo {
  id: string;
  name: string;
  jobTitle: string; 
  department: string; 
  username?: string;
  password?: string;
}

export interface CourseMaterial {
  id: string;
  title: string;
  year: 'Third' | 'Fourth' | 'Pre-Master' | 'Pre-PhD';
  description?: string;
  fileUrl: string;
  uploadedBy: string;
  date: string;
}

export type ScheduleType = 'LECTURE' | 'EXAM';

export interface ScheduleItem {
    id: string;
    title: string;
    type: ScheduleType;
    year: 'Third' | 'Fourth' | 'Pre-Master' | 'Pre-PhD';
    fileUrl: string; 
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
  status?: JobStatus; 
}

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
    labName: string; 
    status: BookingStatus; 
    createdAt: number;
}

export interface LabClass {
    id: string;
    labId: string;
    courseName: string;
    instructor: string;
    day: string; 
    startTime: string;
    endTime: string;
}

export type PlotStatus = 'FREE' | 'OCCUPIED';

export interface GreenhousePlot {
    id: string; 
    number: number;
    status: PlotStatus;
    researcher?: string;
    plantType?: string;
    startDate?: string;
    notes?: string; 
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

export type DeptEventType = 'WORKSHOP' | 'SEMINAR' | 'TRIP' | 'CONFERENCE' | 'COURSE';
export type EventStatus = 'UPCOMING' | 'COMPLETED' | 'CANCELLED';

export interface DeptEvent {
    id: string;
    title: string;
    type: DeptEventType;
    date: string;
    location: string;
    description: string;
    regLink?: string; 
    status: EventStatus; 
    createdAt: number;
}

// --- Department Formation ---

export interface OrgMember {
    name: string;
    role: string; 
    title?: string; 
}

export interface DeptCouncilFormation {
    id: string;
    academicYear: string; 
    members: OrgMember[];
}

export interface DeptCommitteeFormation {
    id: string;
    name: string; 
    academicYear: string;
    members: OrgMember[];
}

// --- Annual Report ---

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
    progress: number; 
    participants?: string;
}

export interface ScientificActivity {
    conferences: { name: string; role: string; date: string; location: string }[];
    thesesJudged: number; 
    supervisionCount: number; 
    trainingCourses: string; 
}

export interface CommunityActivity {
    books: string; 
    convoys: string; 
    media: string; 
    memberships: string; 
}

export type ReportStatus = 'DRAFT' | 'SUBMITTED';

export interface AnnualReport {
    id: string;
    userId: string; 
    userName: string;
    academicYear: string; 
    status: ReportStatus;
    submissionDate?: string;
    publishedResearch: PublishedResearch[];
    ongoingResearch: OngoingResearch[];
    scientificActivity: ScientificActivity;
    communityActivity: CommunityActivity;
}

// --- Research Plan ---

export type TopicStatus = 'AVAILABLE' | 'IN_PROGRESS' | 'COMPLETED';
export type ProposalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'MODIFICATION_REQUESTED';

export interface ResearchTopic {
    id: string;
    title: string;
    goal: string; 
    status: TopicStatus;
    studentName?: string; 
    completionDate?: string; 
}

export interface ResearchAxis {
    id: string;
    title: string;
    description: string;
    coordinator: string; 
    topics: ResearchTopic[];
}

export interface ResearchPlan {
    id: string;
    title: string; 
    vision: string;
    strategicGoals: string[]; 
    startDate: string;
    endDate: string;
    status: 'ACTIVE' | 'ARCHIVED';
    axes: ResearchAxis[];
}

export interface ResearchProposal {
    id: string;
    title: string;
    axisId: string; 
    newAxisName?: string; // اسم المحور الجديد المقترح
    type: 'MSc' | 'PhD';
    justification: string; 
    appliedGoal: string; 
    proposedBy: string; 
    proposedById: string;
    studentName?: string; 
    status: ProposalStatus;
    adminNotes?: string;
    createdAt: number;
}

// --- Leave Management ---

export type LeaveType = 
  | 'CASUAL' | 'ANNUAL' | 'SICK' | 'SCIENTIFIC' | 'SPOUSE' | 'CHILD_CARE' | 'HAJJ';

export type LeaveStatus = 
  | 'PENDING_SUBSTITUTE' | 'PENDING_HEAD' | 'APPROVED' | 'REJECTED' | 'CANCELED';

export interface LeaveRequest {
  id: string;
  userId: string;
  userName: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  daysCount: number;
  substituteId?: string;
  substituteName?: string;
  substituteStatus?: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  substituteRejectionReason?: string;
  address?: string;
  phone?: string;
  hospital?: string;
  medicalReportUrl?: string;
  conferenceName?: string;
  conferenceLocation?: string;
  participationType?: string;
  invitationUrl?: string;
  spouseName?: string;
  spouseJob?: string;
  foreignEntity?: string;
  country?: string;
  documentsUrls?: string[]; 
  createdAt: number;
  status: LeaveStatus;
  adminNotes?: string;
}

// --- Career Movements (النقل والندب والإعارة) ---

export type CareerMovementType = 'LOAN' | 'SECONDMENT' | 'TRANSFER';

export type CareerRequestStatus = 
  | 'PENDING_DEPT'     
  | 'PENDING_COLLEGE'  
  | 'PENDING_UNIV'     
  | 'APPROVED'         
  | 'REJECTED';        

export interface LoanRequest {
    id: string;
    userId: string;
    userName: string;
    type: 'LOAN';
    loanType: 'INTERNAL' | 'EXTERNAL'; 
    country: string;
    institution: string; 
    college: string; 
    startDate: string;
    endDate: string;
    requestType: 'NEW' | 'RENEWAL'; 
    insurancePaymentDocUrl?: string; 
    salaryCurrency: string;
    nominationLetterUrl?: string; 
    prevYearReportUrl?: string; 
    status: CareerRequestStatus;
    createdAt: number;
    notes?: string;
}

export interface SecondmentRequest {
    id: string;
    userId: string;
    userName: string;
    type: 'SECONDMENT';
    secondmentType: 'FULL_TIME' | 'PART_TIME' | 'OFF_HOURS'; 
    secondmentDays?: string[]; 
    targetInstitution: string; 
    targetCollege?: string;
    startDate: string;
    endDate: string;
    status: CareerRequestStatus;
    createdAt: number;
    notes?: string;
}

export interface TransferRequest {
    id: string;
    userId: string;
    userName: string;
    type: 'TRANSFER';
    targetUniversity: string;
    targetCollege: string;
    targetDepartment: string;
    transferType: 'VACANT_DEGREE' | 'WITH_DEGREE'; 
    targetApprovalUrl?: string; 
    currentApprovalUrl?: string; 
    status: CareerRequestStatus;
    createdAt: number;
    notes?: string;
}

export type CareerMovementRequest = LoanRequest | SecondmentRequest | TransferRequest;

// --- Scientific Repository Types (المستودع الرقمي) ---

export type RepositoryItemType = 'THESIS_MASTER' | 'THESIS_PHD' | 'JOURNAL_PAPER' | 'CONF_PAPER' | 'BOOK';

export interface RepositoryItem {
    id: string;
    type: RepositoryItemType;
    titleAr: string;
    titleEn?: string;
    abstract?: string;
    keywords?: string[];
    publicationYear: string;
    specialization?: string;
    authorIds?: string[];
    authorNames?: string;
    supervisors?: string;
    journalName?: string;
    conferenceName?: string;
    volume?: string;
    issue?: string;
    pages?: string;
    doi?: string;
    isbn?: string;
    publisher?: string;
    degree?: string;
    grantDate?: string;
    shelfLocation?: string;
    coverUrl?: string;
    fileUrl?: string;
    privateFileUrl?: string;
    fileVisibility: 'PUBLIC' | 'PRIVATE' | 'AUTHOR_ONLY';
    createdAt: number;
    addedBy: string;
}

export type RequestReason = 'RESEARCH' | 'CITATION' | 'OTHER';
export type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface RepositoryRequest {
    id: string;
    itemId: string;
    itemTitle: string;
    itemAuthorId: string; 
    requesterName: string;
    requesterEmail: string;
    reason: RequestReason;
    message?: string;
    status: RequestStatus;
    responseDate?: string;
    createdAt: number;
}

// --- Course Catalog Types (دليل المقررات) ---

export type CourseLevel = 'Level 1' | 'Level 2' | 'Level 3' | 'Level 4' | 'Diploma' | 'MSc' | 'PhD';
export type CourseSemester = 'First' | 'Second' | 'Summer';
export type CourseType = 'Compulsory' | 'Elective' | 'Special';

export interface Course {
    id: string;
    code: string; // e.g. PP301
    nameAr: string;
    nameEn: string;
    level: CourseLevel;
    semester?: CourseSemester; // For Undergrad
    division?: string; // الشعبة (أمراض، عامة، إلخ) - هام للفرقة 3 و 4
    creditHours: number; // إجمالي الوحدات
    lectureHours?: number;
    labHours?: number;
    prerequisiteId?: string; // كود المقرر السابق
    prerequisiteName?: string; // للتسهيل
    coordinator?: string; // اسم الدكتور المسؤول
    description?: string; // نبذة (للدراسات العليا)
    type?: CourseType;
    
    // Files (URLs)
    specsUrl?: string; // توصيف المقرر
    ilosUrl?: string; // مصفوفة المعارف
    materialsUrl?: string; // المحتوى العلمي (جديد)

    createdAt: number;
}

// --- Forms & Templates Center (New) ---

export type FormCategory = 'ADMIN_FINANCE' | 'STUDENT_AFFAIRS' | 'POSTGRAD_RESEARCH' | 'QUALITY';

export interface DeptForm {
    id: string;
    title: string;
    category: FormCategory;
    description?: string;
    sourceFileUrl?: string; // Word (.docx)
    previewFileUrl?: string; // PDF
    updatedAt: string;
    isActive: boolean;
    isFillableOnline?: boolean; // If true, redirects to a web form
    fillableLink?: string; // e.g., '/leaves'
}

export interface DashboardStats {
  totalIncoming: number;
  totalOutgoing: number;
  totalCouncils: number;
  totalCommittees: number;
  todayCount: number;
  unansweredCount: number;
  totalStaff: number;
  totalStudentsPG: number;
  totalAlumni: number;
  totalEmployees: number;
}