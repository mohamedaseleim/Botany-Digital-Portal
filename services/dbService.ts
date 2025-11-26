
import { ArchiveDocument, DocType, DashboardStats, StaffMember, PostgraduateStudent, CourseMaterial, JobOpportunity, UndergraduateStudent, AlumniMember, User, UserRole, Asset, Announcement, ScheduleItem, LabBooking, Lab, LabClass, GreenhousePlot, GreenhouseHistoryItem, DeptEvent, DeptEventType, ActivityLogItem } from '../types';

const ARCHIVE_KEY = 'botany_archive_data';
const STAFF_KEY = 'botany_staff_data';
const PG_STUDENT_KEY = 'botany_pg_student_data';
const UG_STUDENT_KEY = 'botany_ug_student_data';
const ALUMNI_KEY = 'botany_alumni_data';
const JOB_KEY = 'botany_job_data';
const ASSET_KEY = 'botany_asset_data';
const MATERIALS_KEY = 'botany_materials_data';
const ANNOUNCEMENTS_KEY = 'botany_announcements_data';
const SCHEDULES_KEY = 'botany_schedules_data';
const BOOKINGS_KEY = 'botany_lab_bookings_data';
const LABS_KEY = 'botany_labs_data';
const LAB_CLASSES_KEY = 'botany_lab_classes_data';
const GREENHOUSE_KEY = 'botany_greenhouse_data';
const GREENHOUSE_HISTORY_KEY = 'botany_greenhouse_history_data';
const EVENTS_KEY = 'botany_events_data';
const ACTIVITY_LOG_KEY = 'botany_activity_log_data';

// --- Helper for LocalStorage ---
const getLocalData = <T>(key: string, defaultData: T[] = []): T[] => {
  const data = localStorage.getItem(key);
  if (!data) return defaultData;
  return JSON.parse(data);
};

const saveLocalData = <T>(key: string, data: T[]) => {
  localStorage.setItem(key, JSON.stringify(data));
};

// --- LOGGING SYSTEM ---

export const logActivity = (action: string, performedBy: string, details: string = '') => {
    const logs = getLocalData<ActivityLogItem>(ACTIVITY_LOG_KEY, []);
    const newLog: ActivityLogItem = {
        id: Math.random().toString(36).substr(2, 9),
        action,
        performedBy,
        timestamp: new Date().toISOString(),
        details
    };
    // Add to beginning
    logs.unshift(newLog);
    // Limit to last 500 logs to save space
    if (logs.length > 500) logs.length = 500;
    saveLocalData(ACTIVITY_LOG_KEY, logs);
};

export const getActivityLogs = async (): Promise<ActivityLogItem[]> => {
    return getLocalData<ActivityLogItem>(ACTIVITY_LOG_KEY, []);
};

export const deleteActivityLog = async (id: string): Promise<void> => {
    const logs = getLocalData<ActivityLogItem>(ACTIVITY_LOG_KEY, []);
    const filtered = logs.filter(l => l.id !== id);
    saveLocalData(ACTIVITY_LOG_KEY, filtered);
};

// --- Mock Data Initialization ---

const INITIAL_STAFF: StaffMember[] = [
  { 
      id: '1', name: 'أ.د/ محمد علي', rank: 'أستاذ متفرغ', specialization: 'فطريات', email: 'mohamed@azhar.edu.eg', username: 'mohamed.ali', password: '123',
      subRole: 'FACULTY',
      documents: {
          appointmentDecision: '#',
          joiningReport: '#',
          promotionDecisions: [
             { id: '1', title: 'قرار ترقية أستاذ مساعد', url: '#', date: '2015' },
             { id: '2', title: 'قرار ترقية أستاذ', url: '#', date: '2020' }
          ],
          adminPositions: [],
          phdCert: '#',
          masterCert: '#',
          bachelorCert: '#',
          idCard: '#',
          financialDisclosure: '#',
          socialInsuranceNum: '#',
          statusStatement: '#',
          
          // Scientific Activity Mock Data
          googleScholarLink: 'https://scholar.google.com/',
          publicationsListFile: '#', // The full list
          supervisionRecord: '#', // The supervision status list
          
          conferenceCerts: [
             { id: '1', title: 'مؤتمر أمراض النبات 2023', url: '#', date: '2023' }
          ],
          arbitrationCerts: [],
          communityServiceDocs: [],

          publications: [{ title: 'Fungi in Wheat', date: '2023', url: '#' }], // Legacy/Individual papers
          coursePortfolios: [
              { courseName: 'فطريات عامة', specsUrl: '#', reportUrl: '#' }
          ]
      }
  },
  { 
      id: '2', name: 'أ.د/ إبراهيم حسن', rank: 'رئيس القسم', specialization: 'فيروسات نبات', email: 'ibrahim@azhar.edu.eg', username: 'admin', password: 'admin',
      subRole: 'FACULTY',
      documents: {
          appointmentDecision: '#',
          joiningReport: '#',
          promotionDecisions: [
             { id: '1', title: 'قرار ترقية أستاذ', url: '#', date: '2019' }
          ],
          adminPositions: [
             { id: '1', title: 'قرار تعيين رئيس مجلس القسم', url: '#', date: '2023' }
          ],
          googleScholarLink: '',
          publications: []
      }
  },
  { 
      id: '3', name: 'م. سارة أحمد', rank: 'مدرس مساعد', specialization: 'بكتيريا نبات', email: 'sarah@azhar.edu.eg', username: 'sarah', password: '123',
      subRole: 'ASSISTANT',
      documents: {
          appointmentDecision: '#',
          joiningReport: '#',
          bachelorCert: '#',
          masterCert: '#',
          enrollmentStatus: '#',
          progressReports: [
              { id: '1', title: 'تقرير صلاحية 2023 نصف سنوي', url: '#', date: '2023-06-01' },
              { id: '2', title: 'تقرير صلاحية 2023 سنوي', url: '#', date: '2023-12-01' }
          ],
          promotionDecisions: [
              { id: '1', title: 'قرار ترقية مدرس مساعد', url: '#', date: '2021' }
          ],
          extensionDecisions: [],
          efficiencyReports: [
               { id: '1', title: 'تقرير كفاءة 2023', url: '#', date: '2023' }
          ],
          penaltiesRecord: '#',
          adminPositions: [],
          socialInsuranceNum: '#'
      }
  },
  { 
      id: '4', name: 'م. خالد محمود', rank: 'معيد', specialization: 'نيماتودا', email: 'khaled@azhar.edu.eg', username: 'khaled', password: '123',
      subRole: 'ASSISTANT',
      documents: {
          appointmentDecision: '#',
          bachelorCert: '#',
          militaryStatus: '#',
          promotionDecisions: [],
          extensionDecisions: [],
          progressReports: [],
          efficiencyReports: [],
          adminPositions: [],
          socialInsuranceNum: '#'
      }
  },
];

const INITIAL_PG_STUDENTS: PostgraduateStudent[] = [
  { 
    id: '1', 
    name: 'علي محمود', 
    degree: 'MSc', 
    researchTopic: 'المكافحة الحيوية لأمراض القمح', 
    supervisor: 'أ.د/ محمد علي', 
    status: 'Researching', 
    username: 'ali.m', 
    password: '123',
    dates: {
        enrollment: '2023-01-15',
        registration: '2023-03-01',
        lastReport: '2023-09-01',
        nextReportDue: '2024-03-01', // Overdue!
        expectedDefense: '2025-03-01'
    },
    documents: {
        publishedPapers: [],
        otherDocuments: []
    },
    alerts: {
        reportOverdue: true,
        extensionNeeded: false
    }
  },
  { 
    id: '2', 
    name: 'هدى مصطفى', 
    degree: 'PhD', 
    researchTopic: 'التوصيف الجزيئي لفيروس الموز', 
    supervisor: 'أ.د/ إبراهيم حسن', 
    status: 'Writing', 
    username: 'hoda', 
    password: '123',
    dates: {
        enrollment: '2020-11-20',
        registration: '2021-01-01',
        lastReport: '2024-01-01',
        nextReportDue: '2024-07-01',
        expectedDefense: '2024-01-01' // Extension Needed!
    },
    documents: {
        publishedPapers: [{ title: 'Molecular Characterization of BBTV', url: '#', date: '2023-05-10' }],
        otherDocuments: []
    },
    alerts: {
        reportOverdue: false,
        extensionNeeded: true
    }
  },
];

const INITIAL_UG_STUDENTS: UndergraduateStudent[] = [
    { id: '1', name: 'أحمد حسن', year: 'Third', section: 'أمراض نبات', username: 'ahmed.ug', password: '123' },
    { id: '2', name: 'منى السيد', year: 'Fourth', section: 'عامة', username: 'mona.ug', password: '123' },
];

const INITIAL_ALUMNI: AlumniMember[] = [
    { id: '1', name: 'م. خالد جمال', graduationYear: '2020', currentJob: 'مهندس جودة', email: 'khaled@gmail.com', username: 'khaled.alumni', password: '123' },
    { id: '2', name: 'د. ياسمين عادل', graduationYear: '2018', currentJob: 'باحث بمركز البحوث', email: 'yasmine@gmail.com', username: 'yasmine.alumni', password: '123' },
];

const INITIAL_JOBS: JobOpportunity[] = [
  { id: '1', title: 'مهندس مكافحة آفات', company: 'شركة الدلتا للأسمدة', description: 'مطلوب مهندس خبرة سنتين في تشخيص الأمراض الفطرية.', datePosted: '2024-03-10', contactInfo: 'hr@delta-agro.com', status: 'OPEN' },
  { id: '2', title: 'أخصائي معمل أنسجة', company: 'معامل تكنو جرين', description: 'حديث التخرج يفضل تقدير جيد جداً.', datePosted: '2024-03-12', contactInfo: 'jobs@technogreen.com', status: 'OPEN' },
];

const INITIAL_ASSETS: Asset[] = [
    { id: '1', name: 'ميكروسكوب ضوئي مركب', model: 'Olympus CX23', serialNumber: 'SN-998210', status: 'WORKING', location: 'معمل الفطريات', assignedTo: 'م. سارة أحمد', dateAcquired: '2022-05-10', createdAt: Date.now() },
    { id: '2', name: 'جهاز تقطير مياه', model: 'Bibby Scientific', serialNumber: 'W4000', status: 'MAINTENANCE', location: 'المعمل المركزي', assignedTo: 'أ.د/ رئيس القسم', dateAcquired: '2019-01-15', createdAt: Date.now() },
    { id: '3', name: 'جهاز طرد مركزي (Centrifuge)', model: 'Eppendorf 5424', serialNumber: 'EP-5544', status: 'WORKING', location: 'معمل الفيروسات', assignedTo: 'م. خالد محمود', dateAcquired: '2023-02-20', createdAt: Date.now() }
];

const INITIAL_MATERIALS: CourseMaterial[] = [
  { id: '1', title: 'محاضرة 1: مقدمة في أمراض النبات', year: 'Third', uploadedBy: 'أ.د/ إبراهيم حسن', date: '2024-10-01', fileUrl: '#' },
  { id: '2', title: 'سكشن عملي: التعرف على الفطريات', year: 'Third', uploadedBy: 'م. علي', date: '2024-10-05', fileUrl: '#' },
  { id: '3', title: 'مقرر إحصاء حيوي متقدم', year: 'Pre-Master', uploadedBy: 'أ.د/ محمد علي', date: '2024-10-10', fileUrl: '#', description: 'خاص بتمهيدي الماجستير' },
  { id: '4', title: 'مقرر تقنيات جزيئية حديثة', year: 'Pre-PhD', uploadedBy: 'أ.د/ إبراهيم حسن', date: '2024-11-01', fileUrl: '#', description: 'خاص بتمهيدي الدكتوراه' },
];

const INITIAL_ANNOUNCEMENTS: Announcement[] = [
    { id: '1', content: 'تم تعديل موعد محاضرة "أمراض محاصيل حقلية" للفرقة الرابعة ليكون يوم الثلاثاء الساعة 10.', date: '2024-05-01', isImportant: true },
    { id: '2', content: 'موعد امتحان العملي النهائي لمادة الفطريات يوم 20/5/2024.', date: '2024-05-05', isImportant: false },
];

const INITIAL_SCHEDULES: ScheduleItem[] = [
    { id: '1', title: 'جدول محاضرات الفرقة الثالثة (ترم أول)', type: 'LECTURE', year: 'Third', fileUrl: '#', uploadedBy: 'شئون الطلاب', date: '2024-09-01' },
    { id: '2', title: 'جدول امتحانات العملي (الفرقة الرابعة)', type: 'EXAM', year: 'Fourth', fileUrl: '#', uploadedBy: 'لجنة الجداول', date: '2024-12-15' }
];

const INITIAL_LABS: Lab[] = [
    { id: '1', name: 'معمل أمراض النبات والفطريات', supervisor: 'أ.د/ محمد علي', location: 'الدور الثاني - مبنى أ' },
    { id: '2', name: 'معمل الفيروسات وتكنولوجيا الأنسجة', supervisor: 'أ.د/ إبراهيم حسن', location: 'الدور الثالث - مبنى ب' },
    { id: '3', name: 'معمل فسيولوجيا النبات', supervisor: 'د. علي محمود', location: 'الدور الأرضي - المعمل المركزي' },
    { id: '4', name: 'معمل البكتيريا والنيماتودا', supervisor: 'د. سارة أحمد', location: 'الدور الثاني - جناح ج' },
];

const INITIAL_LAB_CLASSES: LabClass[] = [
    { id: '1', labId: '1', courseName: 'فطريات عامة (عملي)', instructor: 'م. خالد محمود', day: 'Monday', startTime: '10:00', endTime: '12:00' },
    { id: '2', labId: '2', courseName: 'فيروسات (عملي)', instructor: 'م. سارة أحمد', day: 'Wednesday', startTime: '12:00', endTime: '14:00' },
];

const INITIAL_BOOKINGS: LabBooking[] = [
    { id: '1', researcherName: 'علي محمود', date: '2024-05-20', startTime: '10:00', endTime: '12:00', experimentType: 'PCR Analysis', labName: 'PG Lab', status: 'CONFIRMED', createdAt: Date.now() },
    { id: '2', researcherName: 'هدى مصطفى', date: '2024-05-21', startTime: '09:00', endTime: '11:00', experimentType: 'Microscopy', labName: 'PG Lab', status: 'COMPLETED', createdAt: Date.now() }
];

const INITIAL_EVENTS: DeptEvent[] = [
    { id: '1', title: 'ورشة عمل: زراعة الأنسجة النباتية', type: 'WORKSHOP', date: '2024-06-15', location: 'معمل الفيروسات', description: 'ورشة عمل تطبيقية لمدة يومين لتدريب الطلاب على تقنيات زراعة الأنسجة.', regLink: 'https://forms.google.com/example', status: 'UPCOMING', createdAt: Date.now() },
    { id: '2', title: 'سيمينار علمي: التغيرات المناخية', type: 'SEMINAR', date: '2024-05-25', location: 'قاعة السيمنار بالقسم', description: 'عرض تقديمي حول تأثير التغيرات المناخية على انتشار الأمراض النباتية.', status: 'COMPLETED', createdAt: Date.now() },
    { id: '3', title: 'رحلة علمية: مركز البحوث الزراعية', type: 'TRIP', date: '2024-07-01', location: 'الجيزة', description: 'زيارة ميدانية لمعهد أمراض النبات بمركز البحوث.', regLink: 'https://forms.google.com/trip', status: 'UPCOMING', createdAt: Date.now() }
];

// Helper to generate 12 plots
const generateInitialPlots = (): GreenhousePlot[] => {
    const plots: GreenhousePlot[] = [];
    for (let i = 1; i <= 12; i++) {
        plots.push({
            id: i.toString(),
            number: i,
            status: 'FREE',
        });
    }
    // Mark some as occupied for demo
    plots[0] = { ...plots[0], status: 'OCCUPIED', researcher: 'علي محمود', plantType: 'قمح (سخا 95)', startDate: '2024-03-01', notes: 'الري كل يومين' };
    plots[4] = { ...plots[4], status: 'OCCUPIED', researcher: 'هدى مصطفى', plantType: 'نباتات موز (أنسجة)', startDate: '2024-04-10', notes: 'ممنوع الرش بالمبيدات' };
    return plots;
};

// --- AUTH Operations ---

export const loginUser = async (username: string, password: string): Promise<User | null> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 600));

    const staff = getLocalData(STAFF_KEY, INITIAL_STAFF);
    const pg = getLocalData(PG_STUDENT_KEY, INITIAL_PG_STUDENTS);
    const ug = getLocalData(UG_STUDENT_KEY, INITIAL_UG_STUDENTS);
    const alumni = getLocalData(ALUMNI_KEY, INITIAL_ALUMNI);

    // 1. Check Staff (Admin is inside Staff)
    const staffUser = staff.find(u => u.username === username && u.password === password);
    if (staffUser) {
        let role = UserRole.STAFF;
        if (staffUser.username === 'admin') role = UserRole.ADMIN;
        
        // Log Login
        logActivity('تسجيل دخول', staffUser.name, `دخل بصلاحية ${role}`);

        return {
            id: staffUser.id,
            name: staffUser.name,
            role: role,
            details: staffUser.rank
        };
    }

    // 2. Check PG Students
    const pgUser = pg.find(u => u.username === username && u.password === password);
    if (pgUser) {
        logActivity('تسجيل دخول', pgUser.name, 'طالب دراسات عليا');
        return { id: pgUser.id, name: pgUser.name, role: UserRole.STUDENT_PG, details: 'دراسات عليا' };
    }

    // 3. Check UG Students
    const ugUser = ug.find(u => u.username === username && u.password === password);
    if (ugUser) {
        logActivity('تسجيل دخول', ugUser.name, 'طالب جامعي');
        return { id: ugUser.id, name: ugUser.name, role: UserRole.STUDENT_UG, details: 'طالب جامعي' };
    }

    // 4. Check Alumni
    const alumniUser = alumni.find(u => u.username === username && u.password === password);
    if (alumniUser) {
        logActivity('تسجيل دخول', alumniUser.name, 'خريج');
        return { id: alumniUser.id, name: alumniUser.name, role: UserRole.ALUMNI, details: 'خريج' };
    }

    return null;
};

// --- Archive Operations ---

export const getDocuments = async (type?: DocType): Promise<ArchiveDocument[]> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  const docs = getLocalData<ArchiveDocument>(ARCHIVE_KEY, []);
  if (type) {
    return docs.filter(d => d.type === type).sort((a, b) => b.createdAt - a.createdAt);
  }
  return docs.sort((a, b) => b.createdAt - a.createdAt);
};

export const addDocument = async (doc: Omit<ArchiveDocument, 'id' | 'createdAt'>): Promise<ArchiveDocument> => {
  await new Promise(resolve => setTimeout(resolve, 800));
  const docs = getLocalData<ArchiveDocument>(ARCHIVE_KEY, []);
  
  const newDoc: ArchiveDocument = {
    ...doc,
    id: Math.random().toString(36).substr(2, 9),
    createdAt: Date.now(),
    isFollowedUp: false,
  };

  docs.push(newDoc);
  saveLocalData(ARCHIVE_KEY, docs);
  return newDoc;
};

export const updateDocument = async (id: string, updates: Partial<ArchiveDocument>): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, 400));
  const docs = getLocalData<ArchiveDocument>(ARCHIVE_KEY, []);
  const index = docs.findIndex(d => d.id === id);
  if (index !== -1) {
    docs[index] = { ...docs[index], ...updates };
    saveLocalData(ARCHIVE_KEY, docs);
  }
};

export const deleteDocument = async (id: string): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  const docs = getLocalData<ArchiveDocument>(ARCHIVE_KEY, []);
  const filtered = docs.filter(d => d.id !== id);
  saveLocalData(ARCHIVE_KEY, filtered);
};

export const getStats = async (): Promise<DashboardStats> => {
  const docs = await getDocuments();
  const staff = getLocalData(STAFF_KEY, INITIAL_STAFF);
  const pg = getLocalData(PG_STUDENT_KEY, INITIAL_PG_STUDENTS);
  const alumni = getLocalData(ALUMNI_KEY, INITIAL_ALUMNI);
  
  const today = new Date().toISOString().split('T')[0];
  
  return {
    totalIncoming: docs.filter(d => d.type === DocType.INCOMING).length,
    totalOutgoing: docs.filter(d => d.type === DocType.OUTGOING).length,
    totalCouncils: docs.filter(d => d.type === DocType.DEPARTMENT_COUNCIL).length,
    totalCommittees: docs.filter(d => d.type === DocType.COMMITTEE_MEETING).length,
    todayCount: docs.filter(d => d.date === today).length,
    unansweredCount: docs.filter(d => 
      d.type === DocType.INCOMING && 
      d.actionRequired && 
      d.actionRequired.trim() !== '' && 
      !d.isFollowedUp
    ).length,
    totalStaff: staff.length,
    totalStudentsPG: pg.length,
    totalAlumni: alumni.length
  };
};

export const generateSerial = async (type: DocType): Promise<string> => {
  const docs = await getDocuments(type);
  const currentYear = new Date().getFullYear();
  const count = docs.length + 1;
  return `${currentYear}/${count.toString().padStart(4, '0')}`;
};

export const uploadFileToDrive = async (file: File): Promise<string> => {
  await new Promise(resolve => setTimeout(resolve, 1500));
  return `https://picsum.photos/seed/${file.name}/800/600`;
};

// --- STAFF CRUD Operations ---

export const getStaff = async (): Promise<StaffMember[]> => {
  return getLocalData(STAFF_KEY, INITIAL_STAFF);
};

export const addStaff = async (member: Omit<StaffMember, 'id'>): Promise<void> => {
  const list = getLocalData(STAFF_KEY, INITIAL_STAFF);
  const newMember: StaffMember = { 
      ...member, 
      id: Math.random().toString(36).substr(2, 9),
      documents: member.documents || { 
          coursePortfolios: [], publications: [], 
          progressReports: [], promotionDecisions: [], 
          adminPositions: [], extensionDecisions: [],
          efficiencyReports: [], conferenceCerts: [],
          arbitrationCerts: [], communityServiceDocs: []
      }
  };
  list.push(newMember);
  saveLocalData(STAFF_KEY, list);
};

export const updateStaff = async (id: string, updates: Partial<StaffMember>): Promise<void> => {
  const list = getLocalData(STAFF_KEY, INITIAL_STAFF);
  const index = list.findIndex(i => i.id === id);
  if (index !== -1) {
    list[index] = { ...list[index], ...updates };
    saveLocalData(STAFF_KEY, list);
  }
};

export const deleteStaff = async (id: string): Promise<void> => {
    const list = getLocalData(STAFF_KEY, INITIAL_STAFF);
    const filtered = list.filter(i => i.id !== id);
    saveLocalData(STAFF_KEY, filtered);
};

// --- PG STUDENT CRUD Operations ---

// UPDATED: Added Safety Checks
const calculatePGAlerts = (dates: any) => {
    const today = new Date().toISOString().split('T')[0];
    let reportOverdue = false;
    let extensionNeeded = false;

    // Safety check: if dates is undefined or null, return false
    if (!dates) return { reportOverdue, extensionNeeded };

    if (dates.nextReportDue && dates.nextReportDue < today) {
        reportOverdue = true;
    }
    if (dates.expectedDefense && dates.expectedDefense < today) {
        extensionNeeded = true;
    }
    return { reportOverdue, extensionNeeded };
};

export const getPGStudents = async (): Promise<PostgraduateStudent[]> => {
  const students = getLocalData(PG_STUDENT_KEY, INITIAL_PG_STUDENTS);
  return students.map(s => ({
      ...s,
      alerts: calculatePGAlerts(s.dates)
  }));
};

export const addPGStudent = async (student: Omit<PostgraduateStudent, 'id'>): Promise<void> => {
  const list = getLocalData(PG_STUDENT_KEY, INITIAL_PG_STUDENTS);
  // Ensure complex objects exist
  const studentData = {
      ...student,
      dates: student.dates || {},
      documents: student.documents || {}
  };
  const alerts = calculatePGAlerts(studentData.dates);
  
  list.push({ ...studentData, id: Math.random().toString(36).substr(2, 9), alerts });
  saveLocalData(PG_STUDENT_KEY, list);
};

export const updatePGStudent = async (id: string, updates: Partial<PostgraduateStudent>): Promise<void> => {
  const list = getLocalData(PG_STUDENT_KEY, INITIAL_PG_STUDENTS);
  const index = list.findIndex(i => i.id === id);
  if (index !== -1) {
    const updatedStudent = { ...list[index], ...updates };
    if (updates.dates) {
        updatedStudent.alerts = calculatePGAlerts(updatedStudent.dates);
    }
    list[index] = updatedStudent;
    saveLocalData(PG_STUDENT_KEY, list);
  }
};

export const deletePGStudent = async (id: string): Promise<void> => {
    const list = getLocalData(PG_STUDENT_KEY, INITIAL_PG_STUDENTS);
    const filtered = list.filter(i => i.id !== id);
    saveLocalData(PG_STUDENT_KEY, filtered);
};

// --- UNDERGRADUATE STUDENT CRUD Operations ---

export const getUGStudents = async (): Promise<UndergraduateStudent[]> => {
  return getLocalData(UG_STUDENT_KEY, INITIAL_UG_STUDENTS);
};

export const addUGStudent = async (student: Omit<UndergraduateStudent, 'id'>): Promise<void> => {
  const list = getLocalData(UG_STUDENT_KEY, INITIAL_UG_STUDENTS);
  list.push({ ...student, id: Math.random().toString(36).substr(2, 9) });
  saveLocalData(UG_STUDENT_KEY, list);
};

export const updateUGStudent = async (id: string, updates: Partial<UndergraduateStudent>): Promise<void> => {
  const list = getLocalData(UG_STUDENT_KEY, INITIAL_UG_STUDENTS);
  const index = list.findIndex(i => i.id === id);
  if (index !== -1) {
    list[index] = { ...list[index], ...updates };
    saveLocalData(UG_STUDENT_KEY, list);
  }
};

export const deleteUGStudent = async (id: string): Promise<void> => {
  const list = getLocalData(UG_STUDENT_KEY, INITIAL_UG_STUDENTS);
  const filtered = list.filter(i => i.id !== id);
  saveLocalData(UG_STUDENT_KEY, filtered);
};

// --- ALUMNI CRUD Operations ---

export const getAlumni = async (): Promise<AlumniMember[]> => {
  return getLocalData(ALUMNI_KEY, INITIAL_ALUMNI);
};

export const addAlumni = async (member: Omit<AlumniMember, 'id'>): Promise<void> => {
  const list = getLocalData(ALUMNI_KEY, INITIAL_ALUMNI);
  list.push({ ...member, id: Math.random().toString(36).substr(2, 9) });
  saveLocalData(ALUMNI_KEY, list);
};

export const updateAlumni = async (id: string, updates: Partial<AlumniMember>): Promise<void> => {
  const list = getLocalData(ALUMNI_KEY, INITIAL_ALUMNI);
  const index = list.findIndex(i => i.id === id);
  if (index !== -1) {
    list[index] = { ...list[index], ...updates };
    saveLocalData(ALUMNI_KEY, list);
  }
};

export const deleteAlumni = async (id: string): Promise<void> => {
  const list = getLocalData(ALUMNI_KEY, INITIAL_ALUMNI);
  const filtered = list.filter(i => i.id !== id);
  saveLocalData(ALUMNI_KEY, filtered);
};

// --- JOBS CRUD Operations ---

export const getJobs = async (): Promise<JobOpportunity[]> => {
  return getLocalData(JOB_KEY, INITIAL_JOBS);
};

export const addJob = async (job: Omit<JobOpportunity, 'id'>): Promise<void> => {
  const list = getLocalData(JOB_KEY, INITIAL_JOBS);
  list.push({ ...job, id: Math.random().toString(36).substr(2, 9), status: job.status || 'OPEN' });
  saveLocalData(JOB_KEY, list);
};

export const updateJob = async (id: string, updates: Partial<JobOpportunity>): Promise<void> => {
  const list = getLocalData(JOB_KEY, INITIAL_JOBS);
  const index = list.findIndex(i => i.id === id);
  if (index !== -1) {
    list[index] = { ...list[index], ...updates };
    saveLocalData(JOB_KEY, list);
  }
};

export const deleteJob = async (id: string): Promise<void> => {
  const list = getLocalData(JOB_KEY, INITIAL_JOBS);
  const filtered = list.filter(i => i.id !== id);
  saveLocalData(JOB_KEY, filtered);
};

// --- ASSET/INVENTORY Operations ---

export const getAssets = async (): Promise<Asset[]> => {
    return getLocalData(ASSET_KEY, INITIAL_ASSETS);
};

export const addAsset = async (asset: Omit<Asset, 'id' | 'createdAt'>): Promise<void> => {
    const list = getLocalData(ASSET_KEY, INITIAL_ASSETS);
    const newAsset = { 
        ...asset, 
        id: Math.random().toString(36).substr(2, 9),
        createdAt: Date.now()
    };
    list.push(newAsset);
    saveLocalData(ASSET_KEY, list);
};

export const updateAsset = async (id: string, updates: Partial<Asset>): Promise<void> => {
    const list = getLocalData(ASSET_KEY, INITIAL_ASSETS);
    const index = list.findIndex(i => i.id === id);
    if (index !== -1) {
        list[index] = { ...list[index], ...updates };
        saveLocalData(ASSET_KEY, list);
    }
};

export const deleteAsset = async (id: string): Promise<void> => {
    const list = getLocalData(ASSET_KEY, INITIAL_ASSETS);
    const filtered = list.filter(i => i.id !== id);
    saveLocalData(ASSET_KEY, filtered);
};

// --- LABS Operations (Dynamic) ---

export const getLabs = async (): Promise<Lab[]> => {
    return getLocalData(LABS_KEY, INITIAL_LABS);
};

export const addLab = async (lab: Omit<Lab, 'id'>): Promise<void> => {
    const list = getLocalData(LABS_KEY, INITIAL_LABS);
    const newLab = {
        ...lab,
        id: Math.random().toString(36).substr(2, 9)
    };
    list.push(newLab);
    saveLocalData(LABS_KEY, list);
};

export const updateLab = async (id: string, updates: Partial<Lab>): Promise<void> => {
    const list = getLocalData(LABS_KEY, INITIAL_LABS);
    const index = list.findIndex(i => i.id === id);
    if (index !== -1) {
        list[index] = { ...list[index], ...updates };
        saveLocalData(LABS_KEY, list);
    }
};

export const deleteLab = async (id: string): Promise<void> => {
    const list = getLocalData(LABS_KEY, INITIAL_LABS);
    const filtered = list.filter(l => l.id !== id);
    saveLocalData(LABS_KEY, filtered);
};

// --- LAB CLASSES Operations (Dynamic) ---

export const getLabClasses = async (): Promise<LabClass[]> => {
    return getLocalData(LAB_CLASSES_KEY, INITIAL_LAB_CLASSES);
};

export const addLabClass = async (labClass: Omit<LabClass, 'id'>): Promise<void> => {
    const list = getLocalData(LAB_CLASSES_KEY, INITIAL_LAB_CLASSES);
    const newItem = {
        ...labClass,
        id: Math.random().toString(36).substr(2, 9)
    };
    list.push(newItem);
    saveLocalData(LAB_CLASSES_KEY, list);
};

export const updateLabClass = async (id: string, updates: Partial<LabClass>): Promise<void> => {
    const list = getLocalData(LAB_CLASSES_KEY, INITIAL_LAB_CLASSES);
    const index = list.findIndex(i => i.id === id);
    if (index !== -1) {
        list[index] = { ...list[index], ...updates };
        saveLocalData(LAB_CLASSES_KEY, list);
    }
};

export const deleteLabClass = async (id: string): Promise<void> => {
    const list = getLocalData(LAB_CLASSES_KEY, INITIAL_LAB_CLASSES);
    const filtered = list.filter(l => l.id !== id);
    saveLocalData(LAB_CLASSES_KEY, filtered);
};

// --- LAB BOOKINGS Operations ---

export const getLabBookings = async (): Promise<LabBooking[]> => {
    return getLocalData(BOOKINGS_KEY, INITIAL_BOOKINGS);
};

export const addLabBooking = async (booking: Omit<LabBooking, 'id' | 'createdAt'>): Promise<void> => {
    const list = getLocalData(BOOKINGS_KEY, INITIAL_BOOKINGS);
    const newBooking = {
        ...booking,
        id: Math.random().toString(36).substr(2, 9),
        status: booking.status || 'CONFIRMED', // Default Status
        createdAt: Date.now()
    };
    list.push(newBooking);
    saveLocalData(BOOKINGS_KEY, list);
};

export const updateLabBooking = async (id: string, updates: Partial<LabBooking>): Promise<void> => {
    const list = getLocalData(BOOKINGS_KEY, INITIAL_BOOKINGS);
    const index = list.findIndex(i => i.id === id);
    if (index !== -1) {
        list[index] = { ...list[index], ...updates };
        saveLocalData(BOOKINGS_KEY, list);
    }
};

export const deleteLabBooking = async (id: string): Promise<void> => {
    const list = getLocalData(BOOKINGS_KEY, INITIAL_BOOKINGS);
    const filtered = list.filter(b => b.id !== id);
    saveLocalData(BOOKINGS_KEY, filtered);
};

// --- GREENHOUSE Operations ---

export const getGreenhousePlots = async (): Promise<GreenhousePlot[]> => {
    const existing = getLocalData<GreenhousePlot>(GREENHOUSE_KEY, []);
    // Ensure 12 plots always exist
    if (existing.length === 0) {
        const initial = generateInitialPlots();
        saveLocalData(GREENHOUSE_KEY, initial);
        return initial;
    }
    return existing;
};

export const updateGreenhousePlot = async (id: string, updates: Partial<GreenhousePlot>): Promise<void> => {
    const plots = getLocalData<GreenhousePlot>(GREENHOUSE_KEY, generateInitialPlots());
    const index = plots.findIndex(p => p.id === id);
    if (index !== -1) {
        plots[index] = { ...plots[index], ...updates };
        saveLocalData(GREENHOUSE_KEY, plots);
    }
};

// --- GREENHOUSE HISTORY Operations ---

export const getGreenhouseHistory = async (): Promise<GreenhouseHistoryItem[]> => {
    return getLocalData(GREENHOUSE_HISTORY_KEY, []);
};

export const addGreenhouseHistory = async (item: Omit<GreenhouseHistoryItem, 'id'>): Promise<void> => {
    const list = getLocalData(GREENHOUSE_HISTORY_KEY, []);
    const newItem = {
        ...item,
        id: Math.random().toString(36).substr(2, 9)
    };
    list.push(newItem);
    saveLocalData(GREENHOUSE_HISTORY_KEY, list);
};

export const deleteGreenhouseHistory = async (id: string): Promise<void> => {
    const list = getLocalData(GREENHOUSE_HISTORY_KEY, []);
    const filtered = list.filter(i => i.id !== id);
    saveLocalData(GREENHOUSE_HISTORY_KEY, filtered);
};

// --- COURSE MATERIALS Operations (Dynamic) ---

export const getMaterials = async (): Promise<CourseMaterial[]> => {
  return getLocalData(MATERIALS_KEY, INITIAL_MATERIALS);
};

export const addMaterial = async (material: Omit<CourseMaterial, 'id'>): Promise<void> => {
    const list = getLocalData(MATERIALS_KEY, INITIAL_MATERIALS);
    const newMat = { 
        ...material, 
        id: Math.random().toString(36).substr(2, 9) 
    };
    list.push(newMat);
    saveLocalData(MATERIALS_KEY, list);
};

export const deleteMaterial = async (id: string): Promise<void> => {
    const list = getLocalData(MATERIALS_KEY, INITIAL_MATERIALS);
    const filtered = list.filter(m => m.id !== id);
    saveLocalData(MATERIALS_KEY, filtered);
};

// --- ANNOUNCEMENTS Operations ---

export const getAnnouncements = async (): Promise<Announcement[]> => {
    return getLocalData(ANNOUNCEMENTS_KEY, INITIAL_ANNOUNCEMENTS);
};

export const addAnnouncement = async (announcement: Omit<Announcement, 'id'>): Promise<void> => {
    const list = getLocalData(ANNOUNCEMENTS_KEY, INITIAL_ANNOUNCEMENTS);
    const newAnn = {
        ...announcement,
        id: Math.random().toString(36).substr(2, 9)
    };
    list.push(newAnn);
    saveLocalData(ANNOUNCEMENTS_KEY, list);
};

export const deleteAnnouncement = async (id: string): Promise<void> => {
    const list = getLocalData(ANNOUNCEMENTS_KEY, INITIAL_ANNOUNCEMENTS);
    const filtered = list.filter(a => a.id !== id);
    saveLocalData(ANNOUNCEMENTS_KEY, filtered);
};

// --- SCHEDULES Operations (Lectures & Exams) ---

export const getSchedules = async (): Promise<ScheduleItem[]> => {
    return getLocalData(SCHEDULES_KEY, INITIAL_SCHEDULES);
};

export const addSchedule = async (schedule: Omit<ScheduleItem, 'id'>): Promise<void> => {
    const list = getLocalData(SCHEDULES_KEY, INITIAL_SCHEDULES);
    const newItem = {
        ...schedule,
        id: Math.random().toString(36).substr(2, 9)
    };
    list.push(newItem);
    saveLocalData(SCHEDULES_KEY, list);
};

export const deleteSchedule = async (id: string): Promise<void> => {
    const list = getLocalData(SCHEDULES_KEY, INITIAL_SCHEDULES);
    const filtered = list.filter(s => s.id !== id);
    saveLocalData(SCHEDULES_KEY, filtered);
};

// --- DEPARTMENT EVENTS Operations ---

export const getEvents = async (): Promise<DeptEvent[]> => {
    return getLocalData(EVENTS_KEY, INITIAL_EVENTS);
};

export const addEvent = async (event: Omit<DeptEvent, 'id' | 'createdAt'>): Promise<void> => {
    const list = getLocalData(EVENTS_KEY, INITIAL_EVENTS);
    const newEvent = {
        ...event,
        id: Math.random().toString(36).substr(2, 9),
        status: event.status || 'UPCOMING',
        createdAt: Date.now()
    };
    list.push(newEvent);
    saveLocalData(EVENTS_KEY, list);
};

export const updateEvent = async (id: string, updates: Partial<DeptEvent>): Promise<void> => {
    const list = getLocalData(EVENTS_KEY, INITIAL_EVENTS);
    const index = list.findIndex(e => e.id === id);
    if (index !== -1) {
        list[index] = { ...list[index], ...updates };
        saveLocalData(EVENTS_KEY, list);
    }
};

export const deleteEvent = async (id: string): Promise<void> => {
    const list = getLocalData(EVENTS_KEY, INITIAL_EVENTS);
    const filtered = list.filter(e => e.id !== id);
    saveLocalData(EVENTS_KEY, filtered);
};
