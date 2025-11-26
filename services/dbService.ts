import { 
  db, 
  storage 
} from '../firebaseConfig';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  orderBy, 
  limit,
  writeBatch,
  Timestamp
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL 
} from 'firebase/storage';

import { 
  ArchiveDocument, DocType, DashboardStats, StaffMember, PostgraduateStudent, 
  CourseMaterial, JobOpportunity, UndergraduateStudent, AlumniMember, User, 
  UserRole, Asset, Announcement, ScheduleItem, LabBooking, Lab, LabClass, 
  GreenhousePlot, GreenhouseHistoryItem, DeptEvent, ActivityLogItem 
} from '../types';

// --- FILE UPLOAD SERVICE (Firebase Storage) ---

export const uploadFileToDrive = async (file: File): Promise<string> => {
  try {
    // إنشاء مسار فريد للملف: uploads/timestamp_filename
    const storageRef = ref(storage, `uploads/${Date.now()}_${file.name}`);
    
    // رفع الملف
    const snapshot = await uploadBytes(storageRef, file);
    
    // الحصول على الرابط
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error("Error uploading file:", error);
    throw new Error("فشل رفع الملف");
  }
};

// --- LOGGING SYSTEM ---

export const logActivity = async (action: string, performedBy: string, details: string = '') => {
  try {
    await addDoc(collection(db, 'activity_logs'), {
      action,
      performedBy,
      details,
      timestamp: new Date().toISOString(),
      createdAt: Date.now() // للترتيب
    });
  } catch (error) {
    console.error("Error logging activity:", error);
  }
};

export const getActivityLogs = async (): Promise<ActivityLogItem[]> => {
  try {
    const q = query(collection(db, 'activity_logs'), orderBy('createdAt', 'desc'), limit(100));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ActivityLogItem));
  } catch (error) {
    console.error("Error fetching logs:", error);
    return [];
  }
};

export const deleteActivityLog = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'activity_logs', id));
};

// --- AUTH Operations ---

export const loginUser = async (username: string, password: string): Promise<User | null> => {
  try {
    // 1. Search in Staff Collection
    const staffQ = query(collection(db, 'staff'), where('username', '==', username), where('password', '==', password));
    const staffSnap = await getDocs(staffQ);
    
    if (!staffSnap.empty) {
      const userDoc = staffSnap.docs[0].data() as StaffMember;
      let role = UserRole.STAFF;
      if (username === 'admin') role = UserRole.ADMIN; // Override for admin user
      
      logActivity('تسجيل دخول', userDoc.name, `دخل بصلاحية ${role}`);
      return {
        id: staffSnap.docs[0].id,
        name: userDoc.name,
        role: role,
        details: userDoc.rank
      };
    }

    // 2. Search in PG Students
    const pgQ = query(collection(db, 'pg_students'), where('username', '==', username), where('password', '==', password));
    const pgSnap = await getDocs(pgQ);
    if (!pgSnap.empty) {
      const userDoc = pgSnap.docs[0].data() as PostgraduateStudent;
      logActivity('تسجيل دخول', userDoc.name, 'طالب دراسات عليا');
      return { id: pgSnap.docs[0].id, name: userDoc.name, role: UserRole.STUDENT_PG, details: 'دراسات عليا' };
    }

    // 3. Search in UG Students
    const ugQ = query(collection(db, 'ug_students'), where('username', '==', username), where('password', '==', password));
    const ugSnap = await getDocs(ugQ);
    if (!ugSnap.empty) {
      const userDoc = ugSnap.docs[0].data() as UndergraduateStudent;
      logActivity('تسجيل دخول', userDoc.name, 'طالب جامعي');
      return { id: ugSnap.docs[0].id, name: userDoc.name, role: UserRole.STUDENT_UG, details: 'طالب جامعي' };
    }

    // 4. Search in Alumni
    const alumniQ = query(collection(db, 'alumni'), where('username', '==', username), where('password', '==', password));
    const alumniSnap = await getDocs(alumniQ);
    if (!alumniSnap.empty) {
      const userDoc = alumniSnap.docs[0].data() as AlumniMember;
      logActivity('تسجيل دخول', userDoc.name, 'خريج');
      return { id: alumniSnap.docs[0].id, name: userDoc.name, role: UserRole.ALUMNI, details: 'خريج' };
    }

    return null;
  } catch (error) {
    console.error("Login error:", error);
    return null;
  }
};

// --- Archive Operations ---

export const getDocuments = async (type?: DocType): Promise<ArchiveDocument[]> => {
  try {
    const archiveRef = collection(db, 'archive');
    let q = query(archiveRef, orderBy('createdAt', 'desc'));
    
    if (type) {
      q = query(archiveRef, where('type', '==', type)); 
      // Note: Compound queries (where + orderBy) might require an index in Firebase Console.
      // If it fails, check the console link provided in the error.
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ArchiveDocument));
  } catch (error) {
    // Fallback for index errors: fetch all then sort/filter in memory if needed (temporary)
    console.warn("Index might be missing, falling back to client-side filtering", error);
    const snapshot = await getDocs(collection(db, 'archive'));
    let docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ArchiveDocument));
    if (type) docs = docs.filter(d => d.type === type);
    return docs.sort((a, b) => b.createdAt - a.createdAt);
  }
};

export const addDocument = async (docData: Omit<ArchiveDocument, 'id' | 'createdAt'>): Promise<ArchiveDocument> => {
  const newDoc = {
    ...docData,
    createdAt: Date.now(),
    isFollowedUp: false,
  };
  const docRef = await addDoc(collection(db, 'archive'), newDoc);
  return { ...newDoc, id: docRef.id };
};

export const updateDocument = async (id: string, updates: Partial<ArchiveDocument>): Promise<void> => {
  await updateDoc(doc(db, 'archive', id), updates);
};

export const deleteDocument = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'archive', id));
};

export const generateSerial = async (type: DocType): Promise<string> => {
  // This is a simple client-side count. For high volume, use a distributed counter or transaction.
  const docs = await getDocuments(type);
  const currentYear = new Date().getFullYear();
  const count = docs.length + 1;
  return `${currentYear}/${count.toString().padStart(4, '0')}`;
};

export const getStats = async (): Promise<DashboardStats> => {
  // Note: In production, use 'count()' aggregation queries for efficiency.
  // For now, we'll fetch collections.
  const archiveSnap = await getDocs(collection(db, 'archive'));
  const staffSnap = await getDocs(collection(db, 'staff'));
  const pgSnap = await getDocs(collection(db, 'pg_students'));
  const alumniSnap = await getDocs(collection(db, 'alumni'));

  const docs = archiveSnap.docs.map(d => d.data() as ArchiveDocument);
  const today = new Date().toISOString().split('T')[0];

  return {
    totalIncoming: docs.filter(d => d.type === DocType.INCOMING).length,
    totalOutgoing: docs.filter(d => d.type === DocType.OUTGOING).length,
    totalCouncils: docs.filter(d => d.type === DocType.DEPARTMENT_COUNCIL).length,
    totalCommittees: docs.filter(d => d.type === DocType.COMMITTEE_MEETING).length,
    todayCount: docs.filter(d => d.date === today).length,
    unansweredCount: docs.filter(d => 
      d.type === DocType.INCOMING && d.actionRequired && !d.isFollowedUp
    ).length,
    totalStaff: staffSnap.size,
    totalStudentsPG: pgSnap.size,
    totalAlumni: alumniSnap.size
  };
};

// --- STAFF Operations ---

export const getStaff = async (): Promise<StaffMember[]> => {
  const snapshot = await getDocs(collection(db, 'staff'));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StaffMember));
};

export const addStaff = async (member: Omit<StaffMember, 'id'>): Promise<void> => {
  await addDoc(collection(db, 'staff'), member);
};

export const updateStaff = async (id: string, updates: Partial<StaffMember>): Promise<void> => {
  await updateDoc(doc(db, 'staff', id), updates);
};

export const deleteStaff = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'staff', id));
};

// --- PG STUDENT Operations ---

const calculatePGAlerts = (dates: any) => {
    if (!dates) return { reportOverdue: false, extensionNeeded: false };
    const today = new Date().toISOString().split('T')[0];
    let reportOverdue = false;
    let extensionNeeded = false;

    if (dates.nextReportDue && dates.nextReportDue < today) reportOverdue = true;
    if (dates.expectedDefense && dates.expectedDefense < today) extensionNeeded = true;
    return { reportOverdue, extensionNeeded };
};

export const getPGStudents = async (): Promise<PostgraduateStudent[]> => {
  const snapshot = await getDocs(collection(db, 'pg_students'));
  return snapshot.docs.map(doc => {
    const data = doc.data() as PostgraduateStudent;
    return {
      ...data,
      id: doc.id,
      alerts: calculatePGAlerts(data.dates)
    };
  });
};

export const addPGStudent = async (student: Omit<PostgraduateStudent, 'id'>): Promise<void> => {
  await addDoc(collection(db, 'pg_students'), student);
};

export const updatePGStudent = async (id: string, updates: Partial<PostgraduateStudent>): Promise<void> => {
  await updateDoc(doc(db, 'pg_students', id), updates);
};

export const deletePGStudent = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'pg_students', id));
};

// --- UG STUDENT Operations ---

export const getUGStudents = async (): Promise<UndergraduateStudent[]> => {
  const snapshot = await getDocs(collection(db, 'ug_students'));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UndergraduateStudent));
};

export const addUGStudent = async (student: Omit<UndergraduateStudent, 'id'>): Promise<void> => {
  await addDoc(collection(db, 'ug_students'), student);
};

export const updateUGStudent = async (id: string, updates: Partial<UndergraduateStudent>): Promise<void> => {
  await updateDoc(doc(db, 'ug_students', id), updates);
};

export const deleteUGStudent = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'ug_students', id));
};

// --- ALUMNI Operations ---

export const getAlumni = async (): Promise<AlumniMember[]> => {
  const snapshot = await getDocs(collection(db, 'alumni'));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AlumniMember));
};

export const addAlumni = async (member: Omit<AlumniMember, 'id'>): Promise<void> => {
  await addDoc(collection(db, 'alumni'), member);
};

export const updateAlumni = async (id: string, updates: Partial<AlumniMember>): Promise<void> => {
  await updateDoc(doc(db, 'alumni', id), updates);
};

export const deleteAlumni = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'alumni', id));
};

// --- JOBS Operations ---

export const getJobs = async (): Promise<JobOpportunity[]> => {
  const snapshot = await getDocs(collection(db, 'jobs'));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as JobOpportunity));
};

export const addJob = async (job: Omit<JobOpportunity, 'id'>): Promise<void> => {
  await addDoc(collection(db, 'jobs'), { ...job, status: job.status || 'OPEN' });
};

export const updateJob = async (id: string, updates: Partial<JobOpportunity>): Promise<void> => {
  await updateDoc(doc(db, 'jobs', id), updates);
};

export const deleteJob = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'jobs', id));
};

// --- ASSETS Operations ---

export const getAssets = async (): Promise<Asset[]> => {
  const snapshot = await getDocs(collection(db, 'assets'));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Asset));
};

export const addAsset = async (asset: Omit<Asset, 'id' | 'createdAt'>): Promise<void> => {
  await addDoc(collection(db, 'assets'), { ...asset, createdAt: Date.now() });
};

export const updateAsset = async (id: string, updates: Partial<Asset>): Promise<void> => {
  await updateDoc(doc(db, 'assets', id), updates);
};

export const deleteAsset = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'assets', id));
};

// --- LABS Operations ---

export const getLabs = async (): Promise<Lab[]> => {
  const snapshot = await getDocs(collection(db, 'labs'));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lab));
};

export const addLab = async (lab: Omit<Lab, 'id'>): Promise<void> => {
  await addDoc(collection(db, 'labs'), lab);
};

export const updateLab = async (id: string, updates: Partial<Lab>): Promise<void> => {
  await updateDoc(doc(db, 'labs', id), updates);
};

export const deleteLab = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'labs', id));
};

// --- LAB CLASSES Operations ---

export const getLabClasses = async (): Promise<LabClass[]> => {
  const snapshot = await getDocs(collection(db, 'lab_classes'));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LabClass));
};

export const addLabClass = async (labClass: Omit<LabClass, 'id'>): Promise<void> => {
  await addDoc(collection(db, 'lab_classes'), labClass);
};

export const updateLabClass = async (id: string, updates: Partial<LabClass>): Promise<void> => {
  await updateDoc(doc(db, 'lab_classes', id), updates);
};

export const deleteLabClass = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'lab_classes', id));
};

// --- LAB BOOKINGS Operations ---

export const getLabBookings = async (): Promise<LabBooking[]> => {
  const snapshot = await getDocs(collection(db, 'lab_bookings'));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LabBooking));
};

export const addLabBooking = async (booking: Omit<LabBooking, 'id' | 'createdAt'>): Promise<void> => {
  await addDoc(collection(db, 'lab_bookings'), { 
    ...booking, 
    status: booking.status || 'CONFIRMED',
    createdAt: Date.now() 
  });
};

export const updateLabBooking = async (id: string, updates: Partial<LabBooking>): Promise<void> => {
  await updateDoc(doc(db, 'lab_bookings', id), updates);
};

export const deleteLabBooking = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'lab_bookings', id));
};

// --- GREENHOUSE Operations ---

export const getGreenhousePlots = async (): Promise<GreenhousePlot[]> => {
  const snapshot = await getDocs(collection(db, 'greenhouse_plots'));
  const plots = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GreenhousePlot));
  
  if (plots.length === 0) {
    // Initial Seed for Plots (first time only)
    const batch = writeBatch(db);
    const newPlots: GreenhousePlot[] = [];
    for (let i = 1; i <= 12; i++) {
      const plotRef = doc(collection(db, 'greenhouse_plots'));
      const plotData = { number: i, status: 'FREE' as const };
      batch.set(plotRef, plotData);
      newPlots.push({ id: plotRef.id, ...plotData });
    }
    await batch.commit();
    return newPlots;
  }
  
  return plots;
};

export const updateGreenhousePlot = async (id: string, updates: Partial<GreenhousePlot>): Promise<void> => {
  await updateDoc(doc(db, 'greenhouse_plots', id), updates);
};

export const getGreenhouseHistory = async (): Promise<GreenhouseHistoryItem[]> => {
  const snapshot = await getDocs(collection(db, 'greenhouse_history'));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GreenhouseHistoryItem));
};

export const addGreenhouseHistory = async (item: Omit<GreenhouseHistoryItem, 'id'>): Promise<void> => {
  await addDoc(collection(db, 'greenhouse_history'), item);
};

export const deleteGreenhouseHistory = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'greenhouse_history', id));
};

// --- MATERIALS & ANNOUNCEMENTS Operations ---

export const getMaterials = async (): Promise<CourseMaterial[]> => {
  const snapshot = await getDocs(collection(db, 'materials'));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CourseMaterial));
};

export const addMaterial = async (material: Omit<CourseMaterial, 'id'>): Promise<void> => {
  await addDoc(collection(db, 'materials'), material);
};

export const deleteMaterial = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'materials', id));
};

export const getAnnouncements = async (): Promise<Announcement[]> => {
  const snapshot = await getDocs(collection(db, 'announcements'));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Announcement));
};

export const addAnnouncement = async (announcement: Omit<Announcement, 'id'>): Promise<void> => {
  await addDoc(collection(db, 'announcements'), announcement);
};

export const deleteAnnouncement = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'announcements', id));
};

export const getSchedules = async (): Promise<ScheduleItem[]> => {
  const snapshot = await getDocs(collection(db, 'schedules'));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ScheduleItem));
};

export const addSchedule = async (schedule: Omit<ScheduleItem, 'id'>): Promise<void> => {
  await addDoc(collection(db, 'schedules'), schedule);
};

export const deleteSchedule = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'schedules', id));
};

export const getEvents = async (): Promise<DeptEvent[]> => {
  const snapshot = await getDocs(collection(db, 'events'));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DeptEvent));
};

export const addEvent = async (event: Omit<DeptEvent, 'id' | 'createdAt'>): Promise<void> => {
  await addDoc(collection(db, 'events'), { ...event, createdAt: Date.now() });
};

export const updateEvent = async (id: string, updates: Partial<DeptEvent>): Promise<void> => {
  await updateDoc(doc(db, 'events', id), updates);
};

export const deleteEvent = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'events', id));
};

// --- HELPER: SEED INITIAL DATA (Run Once) ---
// Call this function temporarily from a component to populate the DB if empty
export const seedInitialData = async () => {
  const staffCheck = await getDocs(collection(db, 'staff'));
  if (!staffCheck.empty) return; // Already seeded

  console.log("Seeding initial data to Firestore...");
  
  const batch = writeBatch(db);

  // 1. Admin User
  const adminRef = doc(collection(db, 'staff'));
  batch.set(adminRef, {
    name: 'أ.د/ محمد الصادق', 
    rank: 'رئيس القسم', 
    specialization: 'أمراض بكتيرية', 
    email: 'mohamedseleim@azhar.edu.eg', 
    username: 'admin', 
    password: 'admin', // Change this after first login!
    subRole: 'FACULTY'
  });

  // 2. Sample Staff
  const staffRef = doc(collection(db, 'staff'));
  batch.set(staffRef, {
    name: 'أ.د/ محمد علي', 
    rank: 'أستاذ متفرغ', 
    specialization: 'فطريات', 
    email: 'mohamed@azhar.edu.eg', 
    username: 'mohamed.ali', 
    password: '123',
    subRole: 'FACULTY'
  });

  // 3. Sample PG Student
  const pgRef = doc(collection(db, 'pg_students'));
  batch.set(pgRef, {
    name: 'علي محمود', 
    degree: 'MSc', 
    researchTopic: 'المكافحة الحيوية', 
    supervisor: 'أ.د/ محمد علي', 
    status: 'Researching', 
    username: 'ali.m', 
    password: '123',
    dates: { enrollment: '2023-01-01' },
    documents: { publishedPapers: [] },
    alerts: { reportOverdue: false, extensionNeeded: false }
  });

  await batch.commit();
  console.log("Seeding complete. You can now login as 'admin' / 'admin'.");
};
