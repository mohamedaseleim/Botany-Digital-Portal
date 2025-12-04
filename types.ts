// ... (Keep existing enums and interfaces)
export enum UserRole {
  ADMIN = 'ADMIN',
  DATA_ENTRY = 'DATA_ENTRY',
  STAFF = 'STAFF',
  STUDENT_PG = 'STUDENT_PG',
  STUDENT_UG = 'STUDENT_UG',
  ALUMNI = 'ALUMNI',
  EMPLOYEE = 'EMPLOYEE'
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
  details?: string;
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

// --- New Interfaces for the Portal ---

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
  totalStaff: number;
  totalStudentsPG: number;
  totalAlumni: number;
  totalEmployees: number;
}