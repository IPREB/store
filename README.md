# 🌙 Moon TV Store — دليل الربط مع Netlify DB

## الملفات في هذا المشروع

```
moontv-store/
├── index.html                    ← الموقع الرئيسي (معدّل)
├── netlify.toml                  ← إعدادات Netlify
├── package.json                  ← مكتبة Neon
└── netlify/
    └── functions/
        ├── init-db.mjs           ← تهيئة قاعدة البيانات (مرة واحدة)
        └── api.mjs               ← API لجميع العمليات
```

---

## خطوات الرفع على Netlify

### 1. ارفع الملفات على GitHub
- افتح مستودعك `IPREB/store`
- احذف الملفات القديمة أو أضف الجديدة
- ارفع **كل الملفات** (index.html + netlify.toml + package.json + netlify/functions/)

### 2. اربط GitHub بـ Netlify
- اذهب إلى [netlify.com](https://netlify.com) → مشروعك `moontv-store`
- من **Site settings** → **Build & deploy** → تأكد أن:
  - **Publish directory:** `.`
  - **Functions directory:** `netlify/functions`

### 3. تهيئة قاعدة البيانات (مرة واحدة فقط!)
بعد رفع الموقع، افتح هذا الرابط في المتصفح:

```
https://YOUR-SITE.netlify.app/api/init-db
```

ستظهر رسالة: `{"success":true,"message":"Database initialized"}`
✅ هذا يعني الجداول اتأسست والبيانات الافتراضية اتحفظت.

---

## كيف يعمل الآن؟

| قبل | بعد |
|-----|-----|
| البيانات في localStorage (كل متصفح نسخته) | البيانات في Neon DB (مشتركة للكل) |
| لو غيرت منتج، يتغير عندك فقط | لو غيرت منتج، يتغير عند كل الزوار |
| كل زيارة جديدة تبدأ من البيانات الافتراضية | كل زيارة تجيب البيانات من قاعدة البيانات |

---

## API Endpoints

| Method | Path | الوظيفة |
|--------|------|---------|
| GET | `/api/settings` | جلب الإعدادات |
| PUT | `/api/settings` | حفظ الإعدادات |
| GET | `/api/categories` | جلب التصنيفات |
| POST | `/api/categories` | إضافة تصنيف |
| DELETE | `/api/categories/:id` | حذف تصنيف |
| GET | `/api/products` | جلب المنتجات |
| POST | `/api/products` | إضافة منتج |
| PUT | `/api/products/:id` | تعديل منتج |
| DELETE | `/api/products/:id` | حذف منتج |
| GET | `/api/policies` | جلب السياسات |
| PUT | `/api/policies` | حفظ السياسات |

---

## متغيرات البيئة المطلوبة
Netlify يضيفها تلقائياً عند ربط Neon DB:
- `NETLIFY_DATABASE_URL` ✅ (موجودة تلقائياً في مشروعك)
