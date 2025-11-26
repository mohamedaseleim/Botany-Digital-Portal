import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

// إعدادات مشروعك الخاصة
const firebaseConfig = {
  apiKey: "AIzaSyBqcfkwEvapmZNqPyR6b6bvIZ8MqhxfpcY",
  authDomain: "botany-db.firebaseapp.com",
  projectId: "botany-db",
  storageBucket: "botany-db.firebasestorage.app",
  messagingSenderId: "479719860860",
  appId: "1:479719860860:web:7e7276143b1ebe0ec6b7f9",
  measurementId: "G-R5JLK6WW00"
};

// تهيئة التطبيق
const app = initializeApp(firebaseConfig);

// تهيئة وتصدير الخدمات لاستخدامها في باقي الملفات
export const analytics = getAnalytics(app); // التحليلات
export const db = getFirestore(app);        // قاعدة البيانات
export const storage = getStorage(app);     // تخزين الملفات (بديل Drive)
export const auth = getAuth(app);           // نظام تسجيل الدخول

export default app;
