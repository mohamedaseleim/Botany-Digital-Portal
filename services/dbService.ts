
import { ArchiveDocument, DocType, DashboardStats, StaffMember, PostgraduateStudent, CourseMaterial, JobOpportunity, UndergraduateStudent, AlumniMember, User, UserRole } from '../types';

const ARCHIVE_KEY = 'botany_archive_data';
const STAFF_KEY = 'botany_staff_data';
const PG_STUDENT_KEY = 'botany_pg_student_data';
const UG_STUDENT_KEY = 'botany_ug_student_data';
const ALUMNI_KEY = 'botany_alumni_data';
const JOB_KEY = 'botany_job_data';

// --- Helper for LocalStorage ---
const getLocalData = <T>(key: string, defaultData: T[] = []): T[] => {
  const data = localStorage.getItem(key);
  if (!data) return defaultData;
  return JSON.parse(data);
};

const saveLocalData = <T>(key: string, data: T[]) => {
  localStorage.setItem(key, JSON.stringify(data));
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

          publications: [{ title: 'Fungi in Wheat', date: '2023', url: '#' }], // Legacy/Individual
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

const MOCK_MATERIALS: CourseMaterial[] = [
  { id: '1', title: 'محاضرة 1: مقدمة في أمراض النبات', year: 'Third', uploadedBy: 'أ.د/ إبراهيم حسن', date: '2024-10-01', fileUrl: '#' },
  { id: '2', title: 'سكشن عملي: التعرف على الفطريات', year: 'Third', uploadedBy: 'م. علي', date: '2024-10-05', fileUrl: '#' },
];

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
        // Determine role based on ID or specific logic. 
        // For simplicity, we check if ID is '2' (Admin) or use a property.
        // In our mock data, Admin has id '2'.
        // Or we can rely on the data logic (In real app, Role is stored in DB)
        
        let role = UserRole.STAFF;
        if (staffUser.username === 'admin') role = UserRole.ADMIN;
        
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
        return { id: pgUser.id, name: pgUser.name, role: UserRole.STUDENT_PG, details: 'دراسات عليا' };
    }

    // 3. Check UG Students
    const ugUser = ug.find(u => u.username === username && u.password === password);
    if (ugUser) {
        return { id: ugUser.id, name: ugUser.name, role: UserRole.STUDENT_UG, details: 'طالب جامعي' };
    }

    // 4. Check Alumni
    const alumniUser = alumni.find(u => u.username === username && u.password === password);
    if (alumniUser) {
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
      // Ensure documents object is initialized
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

// Helper to recalculate alerts based on dates
const calculatePGAlerts = (dates: any) => {
    const today = new Date().toISOString().split('T')[0];
    let reportOverdue = false;
    let extensionNeeded = false;

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
  // Recalculate alerts on fetch
  return students.map(s => ({
      ...s,
      alerts: calculatePGAlerts(s.dates)
  }));
};

export const addPGStudent = async (student: Omit<PostgraduateStudent, 'id'>): Promise<void> => {
  const list = getLocalData(PG_STUDENT_KEY, INITIAL_PG_STUDENTS);
  const alerts = calculatePGAlerts(student.dates);
  list.push({ ...student, id: Math.random().toString(36).substr(2, 9), alerts });
  saveLocalData(PG_STUDENT_KEY, list);
};

export const updatePGStudent = async (id: string, updates: Partial<PostgraduateStudent>): Promise<void> => {
  const list = getLocalData(PG_STUDENT_KEY, INITIAL_PG_STUDENTS);
  const index = list.findIndex(i => i.id === id);
  if (index !== -1) {
    const updatedStudent = { ...list[index], ...updates };
    // Recalculate alerts if dates changed
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

// --- Other Data Getters ---

export const getMaterials = async (): Promise<CourseMaterial[]> => {
  return MOCK_MATERIALS;
};
