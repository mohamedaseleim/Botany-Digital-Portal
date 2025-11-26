# دليل نشر وتشغيل بوابة قسم النبات الزراعي (Deployment Guide)

هذا المستند يشرح الخطوات التقنية لرفع تطبيق "بوابة قسم النبات" (Botany Digital Portal) على استضافة **GitHub Pages** المجانية، وكيفية إعداد بيئة العمل للإنتاج.

---

## 1. المتطلبات الأساسية (Prerequisites)

قبل البدء، تأكد من تثبيت الأدوات التالية على جهاز الكمبيوتر:
*   **Node.js** (الإصدار 16 أو أحدث).
*   **Git** (لإدارة النسخ ورفع الكود).
*   حساب على منصة **GitHub**.

---

## 2. إعداد المشروع للنشر (Configuration)

التطبيق مبني باستخدام **React.js**. لنشره على GitHub Pages، نحتاج لإضافة مكتبة مساعدة وإعداد ملف `package.json`.

### أ. تثبيت مكتبة النشر
افتح الشاشة السوداء (Terminal) داخل مجلد المشروع واكتب الأمر التالي:

```bash
npm install gh-pages --save-dev
```

### ب. تعديل ملف `package.json`
افتح ملف `package.json` وأضف السطر التالي في الأعلى (استبدل البيانات بما يناسب حسابك):

```json
"homepage": "https://{username}.github.io/{repo-name}",
```
*   `{username}`: اسم المستخدم الخاص بك على GitHub.
*   `{repo-name}`: اسم المستودع (Repository) الذي ستنشئه (مثلاً: `botany-portal`).

### ج. إضافة أوامر النشر (Scripts)
في نفس الملف `package.json`، داخل قسم `"scripts"`، أضف السطرين التاليين:

```json
"scripts": {
  "predeploy": "npm run build",
  "deploy": "gh-pages -d build",
  ... (باقي الأوامر)
}
```

---

## 3. رفع الكود والنشر (Deployment Steps)

### الخطوة 1: إنشاء مستودع على GitHub
1.  ادخل على [GitHub.com](https://github.com) وقم بإنشاء **New Repository**.
2.  سمّهِ بنفس الاسم الذي وضعته في الـ `homepage` (مثلاً `botany-portal`).
3.  اجعل المستودع **Public** (أو Private إذا كنت تملك حساب GitHub Pro وتريد إخفاء الكود).

### الخطوة 2: ربط المشروع ورفعه
في الـ Terminal، نفذ الأوامر التالية لرفع الكود لأول مرة:

```bash
git init
git add .
git commit -m "Initial commit - Botany Portal V1"
git branch -M main
git remote add origin https://github.com/{username}/{repo-name}.git
git push -u origin main
```

### الخطوة 3: تنفيذ أمر النشر
الآن، لرفع النسخة الحية (Live Version) على الرابط المجاني، اكتب:

```bash
npm run deploy
```
*   سيقوم هذا الأمر ببناء المشروع (Build) وإنشاء فرع جديد اسمه `gh-pages` يحتوي على ملفات الموقع الجاهزة.

### الخطوة 4: تفعيل الاستضافة
1.  اذهب إلى إعدادات المستودع (Settings) على GitHub.
2.  اختر **Pages** من القائمة الجانبية.
3.  في قسم **Build and deployment**، تأكد أن المصدر (Source) هو `Deploy from a branch`.
4.  اختر الفرع `gh-pages` والمجلد `/(root)`.
5.  اضغط **Save**.
6.  خلال دقائق، سيظهر رابط موقعك في الأعلى (مثلاً: `https://ahmed-azhar.github.io/botany-portal`).

---

## 4. ملاحظة هامة جداً: قاعدة البيانات (Database)

⚠️ **الوضع الحالي (Demo Mode):**
الكود المرفوع حالياً يعتمد على `LocalStorage` في ملف `services/dbService.ts`. هذا يعني أن البيانات التي يتم إدخالها (المكاتبات، الطلاب، المستخدمين) **تُحفظ فقط على متصفح المستخدم الحالي**.
*   إذا دخل رئيس القسم من جهازه، لن يرى البيانات التي أدخلها السكرتير من جهاز آخر.

✅ **الوضع المطلوب (Production Mode - Firebase):**
لجعل النظام يعمل كشبكة موحدة (Centralized) يراها الجميع، يجب استبدال الـ LocalStorage بخدمة **Firebase Firestore** المجانية.

### خطوات الترقية إلى Firebase:

1.  اذهب إلى [Firebase Console](https://console.firebase.google.com) وأنشئ مشروعاً جديداً.
2.  فعل خدمة **Cloud Firestore** و **Authentication**.
3.  انسخ إعدادات الاتصال (Config) وضعها في ملف جديد `src/firebaseConfig.ts`.
4.  قم بتحديث ملف `src/services/dbService.ts` لاستخدام دوال Firebase بدلاً من LocalStorage.

**مثال للتعديل البرمجي المطلوب في `dbService.ts`:**

```typescript
// بدلاً من:
// const docs = getLocalData(ARCHIVE_KEY, []);

// نستخدم Firebase:
// import { db } from '../firebaseConfig';
// import { collection, getDocs } from 'firebase/firestore';
// const querySnapshot = await getDocs(collection(db, "archive"));
```

---

## 5. إدارة الملفات (Google Drive Integration)

للحفاظ على مجانية الاستضافة وتوفير مساحة غير محدودة للمستندات (PDFs/Images):
1.  يتم استخدام **Google Apps Script** كواجهة (API) لرفع الملفات إلى مجلد Google Drive خاص بالقسم.
2.  الرابط الناتج من الرفع يتم تخزينه كنص (String) في قاعدة بيانات Firebase.
3.  هذا يضمن عدم استهلاك سعة تخزين Firebase المدفوعة.

---

## 6. الدعم الفني

في حالة وجود أي مشكلة في النشر أو الرغبة في تفعيل Firebase، يرجى التواصل مع فريق التطوير أو مراجعة وثائق [Create React App Deployment](https://create-react-app.dev/docs/deployment/#github-pages).
