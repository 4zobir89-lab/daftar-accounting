# 📒 دفتر المحاسب — Daftar Accounting

نظام محاسبي تكاملي احترافي بدفتر يومية مزدوج القيد، شجرة حسابات، تقارير مالية، وكشوف حسابات PDF بنكية الاحتراف — بواجهة عربية (RTL) بتصميم بنكي كلاسيكي.

## ✨ الميزات

- **دفتر يومية مزدوج القيد** مع تحقق تلقائي من التوازن
- **شجرة حسابات هرمية** (30 حساب جاهز: أصول/خصوم/حقوق ملكية/إيرادات/مصروفات)
- **إدارة العملاء والموردين** مع كشوف حسابات تفصيلية
- **إصدار PDF احترافي** لكشوف الحسابات (تصميم بنكي كلاسيكي)
- **3 تقارير مالية**: ميزان المراجعة، قائمة الدخل، الميزانية العمومية
- **دعم تعدد العملات** (ريال سعودي + ريال يمني + أسعار صرف تاريخية)
- **نسخ احتياطي JSON** كامل للبيانات
- **لوحة تحكم** برسوم بيانية حية (Recharts)

## 🛠️ التقنيات

- **Next.js 16** + TypeScript 5
- **Prisma 6** + PostgreSQL (Neon)
- **Tailwind CSS 4** + shadcn/ui (New York)
- **Recharts** للرسوم البيانية
- **Playwright** لإصدار PDF متجهي
- خطوط Google: Cairo + Amiri (عربي)

## 🚀 التشغيل محلياً

```bash
# 1. تثبيت الحزم
bun install

# 2. إعداد قاعدة البيانات
cp .env.example .env
# عدّل DATABASE_URL بقيمة Neon الخاصة بك
bun run db:push
bun run db:seed

# 3. تشغيل التطبيق
bun run dev
```

ثم افتح `http://localhost:3000`

## ☁️ النشر على Vercel

المشروع مُعد للنشر التلقائي على Vercel:

1. اربط الـ repository بـ Vercel
2. أضف Environment Variable: `DATABASE_URL` (Neon connection string)
3. أي push إلى `main` سيُشغّل deployment تلقائياً

## 📁 هيكل المشروع

```
prisma/
  schema.prisma       # نموذج قاعدة البيانات
  seed.ts             # بيانات أولية
src/
  app/
    api/              # API routes (10 مسارات)
    page.tsx          # الصفحة الرئيسية
  components/
    pages/            # 7 صفحات (Dashboard, Journal, Accounts, ...)
    ui/               # shadcn/ui components
    main-shell.tsx    # الـ layout الرئيسي
    app-provider.tsx  # Global state + types
  lib/
    db.ts             # Prisma client
    accounting-utils.ts  # دوال محاسبية
```

## 📊 قاعدة البيانات (Neon PostgreSQL)

قاعدة بيانات سحابية على Neon مع:
- 12 نموذج (User, Account, Partner, JournalEntry, ...)
- حسابات جاهزة (أصول/خصوم/حقوق ملكية/إيرادات/مصروفات)
- عملتين (SAR + YER) وسعر صرف 139.5

## 🔄 CI/CD

GitHub Actions workflow يُشغّل تلقائياً على كل push:
- فحص الكود (lint)
- بناء المشروع
- نشر على Vercel

## 📝 الترخيص

MIT License
