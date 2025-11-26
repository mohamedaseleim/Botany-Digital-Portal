# الدليل الشامل لنشر "بوابة قسم النبات" على GitHub Pages
## دليل للمبتدئين (خطوة بخطوة)

هذا الملف يشرح بالتفصيل الممل كيفية أخذ الكود الموجود على جهازك (أو على GitHub) وجعله موقعاً حياً يعمل على الإنترنت مجاناً، وكيفية تحويله من نظام "تجريبي" إلى نظام "حقيقي" متصل بقاعدة بيانات.

---

## المرحلة الأولى: تجهيز البيئة (على جهاز الكمبيوتر)

قبل أن تفعل أي شيء بالكود، تأكد أن جهاز الكمبيوتر الخاص بك يحتوي على البرامج الأساسية للبرمجة.

### 1. تثبيت Node.js
هو المحرك الذي يشغل كود الموقع.
*   حمل البرنامج من هنا: [nodejs.org](https://nodejs.org).
*   اختر نسخة **LTS** (Recommended for most users).
*   ثبته مثل أي برنامج عادي (Next, Next, Finish).

### 2. تثبيت Git
أداة رفع الملفات إلى GitHub.
*   حمل البرنامج من: [git-scm.com](https://git-scm.com).
*   ثبته بالإعدادات الافتراضية.

### 3. برنامج تعديل الكود (VS Code)
*   يفضل استخدام [Visual Studio Code](https://code.visualstudio.com).

---

## المرحلة الثانية: إعداد المشروع للنشر

الآن سنقوم بضبط إعدادات المشروع ليقبل العمل على خوادم GitHub.

### خطوة 1: فتح المشروع
1.  افتح مجلد المشروع في VS Code.
2.  من القائمة العلوية، اضغط `Terminal` ثم `New Terminal`.

### خطوة 2: تثبيت المكتبات
اكتب هذا الأمر في الشاشة السوداء (Terminal) واضغط Enter:
```bash
npm install
```
*انتظر حتى ينتهي التحميل.*

ثم ثبت مكتبة النشر الخاصة بـ GitHub:
```bash
npm install gh-pages --save-dev
```

### خطوة 3: تعديل ملف `package.json`
ابحث عن ملف اسمه `package.json` في قائمة الملفات، وافتحه.

**أضف السطر التالي في أول الملف** (تحت الاسم والاصدار):
```json
"homepage": "https://{USERNAME}.github.io/{REPO-NAME}",
```
*   استبدل `{USERNAME}` باسم حسابك على GitHub.
*   استبدل `{REPO-NAME}` باسم المستودع الذي ستنشئه (مثلاً `botany-portal`).

**أضف أوامر النشر في قسم `scripts`**:
ابحث عن `"scripts": {` وأضف هذين السطرين داخله:
```json
"predeploy": "npm run build",
"deploy": "gh-pages -d dist"
```
*(ملاحظة: إذا كان المشروع مبنياً بـ Create React App استخدم `build` بدلاً من `dist` في السطر الأخير. إذا كان Vite استخدم `dist`)*.

---

## المرحلة الثالثة: الرفع إلى GitHub (Push)

### 1. إنشاء المستودع (Repository)
1.  ادخل على حسابك في [GitHub.com](https://github.com).
2.  اضغط علامة `+` في الأعلى واختر **New repository**.
3.  في خانة **Repository name** اكتب نفس الاسم الذي اخترته سابقاً (مثلاً `botany-portal`).
4.  اضغط **Create repository**.

### 2. رفع الملفات
ارجع للـ Terminal في VS Code واكتب الأوامر التالية بالترتيب (اضغط Enter بعد كل أمر):

```bash
git init
git add .
git commit -m "رفع النسخة الأولى للموقع"
git branch -M main
git remote add origin https://github.com/{USERNAME}/{REPO-NAME}.git
git push -u origin main
```
*(سيطلب منك تسجيل الدخول لحساب GitHub إذا كانت أول مرة)*.

---

## المرحلة الرابعة: النشر الفعلي (Deploy)

الآن الكود موجود على GitHub، لكنه لا يعمل كموقع بعد. لنشره، اكتب هذا الأمر السحري في الـ Terminal:

```bash
npm run deploy
```

انتظر حتى تظهر رسالة `Published`.

### تفعيل الموقع:
1.  اذهب لصفحة المشروع على موقع GitHub.
2.  ادخل على **Settings** (الإعدادات) > ثم **Pages** (من القائمة الجانبية).
3.  تأكد أن الـ **Source** هو `Deploy from a branch`.
4.  تأكد أن الـ **Branch** المختار هو `gh-pages` (وليس main).
5.  انتظر دقيقتين، وستجد الرابط ظهر في أعلى الصفحة (مثلاً: `https://ali.github.io/botany-portal`).
6.  **مبروك! التطبيق يعمل الآن.**

---

## المرحلة الخامسة (متقدم): تحويل البيانات من "وهمية" إلى "حقيقية" (Firebase)

⚠️ **هام:** التطبيق حالياً يعمل ببيانات وهمية (تختفي عند تغيير المتصفح). لجعله يحتفظ بالبيانات لكل المستخدمين، يجب ربطه بـ **Google Firebase**.

### 1. إنشاء قاعدة البيانات
1.  ادخل على [console.firebase.google.com](https://console.firebase.google.com).
2.  اضغط **Add project** وسمه `botany-db`.
3.  من القائمة الجانبية، اختر **Build** > **Firestore Database**.
4.  اضغط **Create Database** > اختر **Start in production mode**.
5.  اختر السيرفر (مثلاً `eur3` أوروبا).

### 2. الحصول على مفاتيح الربط
1.  اضغط على أيقونة الترس (Settings) > **Project settings**.
2.  في الأسفل، اختر أيقونة الويب `</>`.
3.  سجل التطبيق باسم `BotanyApp`.
4.  سيظهر لك كود (`const firebaseConfig = ...`). انسخ هذا الكود.

### 3. إضافة الكود في المشروع
ارجع إلى VS Code:
1.  أنشئ ملفاً جديداً في مجلد `src` سمه `firebaseConfig.ts`.
2.  الصق الكود الذي نسخته، واجعل نهايته كالتالي:

```typescript
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app); // تصدير قاعدة البيانات لاستخدامها
```

### 4. تعديل ملف `dbService.ts`
الآن، الخطوة الأخيرة والأهم. سنستبدل التخزين المحلي (LocalStorage) بـ Firebase.
افتح `src/services/dbService.ts`:

**أضف في الأعلى:**
```typescript
import { db } from '../firebaseConfig';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where } from 'firebase/firestore';
```

**مثال لتغيير دالة الجلب (Get):**
بدلاً من الكود القديم، استخدم هذا:
```typescript
export const getDocuments = async (type?: DocType): Promise<ArchiveDocument[]> => {
  const querySnapshot = await getDocs(collection(db, "archive"));
  let docs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ArchiveDocument));
  
  if (type) {
    docs = docs.filter(d => d.type === type);
  }
  return docs.sort((a, b) => b.createdAt - a.createdAt);
};
```

**مثال لتغيير دالة الإضافة (Add):**
```typescript
export const addDocument = async (data: any) => {
  await addDoc(collection(db, "archive"), {
    ...data,
    createdAt: Date.now()
  });
};
```

كرر هذا النمط لباقي الدوال (Delete, Update) وباقي المجموعات (students, staff, assets).

### 5. تحديث الموقع
بعد تعديل الكود، اكتب مرة أخرى:
```bash
npm run deploy
```
الآن أصبح لديك نظام إداري كامل، مجاني، ومربوط بقاعدة بيانات سحابية!
