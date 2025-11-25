import { ArchiveDocument, DocType, DashboardStats } from '../types';

// This service mimics the Firebase Firestore interactions.
// In production, replace `localStorage` calls with `addDoc`, `getDocs`, `query`, etc., from 'firebase/firestore'.

const STORAGE_KEY = 'botany_archive_data';

const getLocalData = (): ArchiveDocument[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

const saveLocalData = (data: ArchiveDocument[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

// --- Mock Database Operations ---

export const getDocuments = async (type?: DocType): Promise<ArchiveDocument[]> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  const docs = getLocalData();
  if (type) {
    return docs.filter(d => d.type === type).sort((a, b) => b.createdAt - a.createdAt);
  }
  return docs.sort((a, b) => b.createdAt - a.createdAt);
};

export const addDocument = async (doc: Omit<ArchiveDocument, 'id' | 'createdAt'>): Promise<ArchiveDocument> => {
  await new Promise(resolve => setTimeout(resolve, 800));
  const docs = getLocalData();
  
  const newDoc: ArchiveDocument = {
    ...doc,
    id: Math.random().toString(36).substr(2, 9),
    createdAt: Date.now(),
    isFollowedUp: false, // Default
  };

  docs.push(newDoc);
  saveLocalData(docs);
  return newDoc;
};

export const updateDocument = async (id: string, updates: Partial<ArchiveDocument>): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, 400));
  const docs = getLocalData();
  const index = docs.findIndex(d => d.id === id);
  if (index !== -1) {
    docs[index] = { ...docs[index], ...updates };
    saveLocalData(docs);
  }
};

export const deleteDocument = async (id: string): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  const docs = getLocalData();
  const filtered = docs.filter(d => d.id !== id);
  saveLocalData(filtered);
};

export const getStats = async (): Promise<DashboardStats> => {
  const docs = await getDocuments();
  const today = new Date().toISOString().split('T')[0];
  
  return {
    totalIncoming: docs.filter(d => d.type === DocType.INCOMING).length,
    totalOutgoing: docs.filter(d => d.type === DocType.OUTGOING).length,
    totalCouncils: docs.filter(d => d.type === DocType.DEPARTMENT_COUNCIL).length,
    totalCommittees: docs.filter(d => d.type === DocType.COMMITTEE_MEETING).length,
    todayCount: docs.filter(d => d.date === today).length,
    // Unanswered: Incoming docs that have an Action Required AND are NOT followed up yet
    unansweredCount: docs.filter(d => 
      d.type === DocType.INCOMING && 
      d.actionRequired && 
      d.actionRequired.trim() !== '' && 
      !d.isFollowedUp
    ).length
  };
};

export const generateSerial = async (type: DocType): Promise<string> => {
  const docs = await getDocuments(type);
  const currentYear = new Date().getFullYear();
  const count = docs.length + 1;
  return `${currentYear}/${count.toString().padStart(4, '0')}`;
};

export const uploadFileToDrive = async (file: File): Promise<string> => {
  // --- REAL IMPLEMENTATION NOTE ---
  // In the real app, you would use fetch() to send the file to your Google Apps Script Web App URL.
  // Example:
  /*
     const formData = new FormData();
     formData.append('file', file);
     formData.append('filename', file.name);
     const response = await fetch('YOUR_APPS_SCRIPT_WEB_APP_URL', { method: 'POST', body: formData });
     const json = await response.json();
     return json.fileUrl;
  */

  // --- MOCK IMPLEMENTATION ---
  await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate upload
  console.log(`File ${file.name} uploaded to Mock Drive`);
  // Return a placeholder image or PDF link
  return `https://picsum.photos/seed/${file.name}/800/600`;
};