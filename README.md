# 📒 دفتر المحاسب — Daftar Accounting

> نظام محاسبي تكاملي احترافي بدفتر يومية مزدوج القيد، شجرة حسابات، تقارير مالية، وكشوف حسابات PDF بنكية الاحتراف — بواجهة عربية (RTL) بتصميم بنكي كلاسيكي.

## 🌐 Live Demo

**Production URL**: [https://daftar-accounting.vercel.app](https://daftar-accounting.vercel.app)

## ✨ الميزات

- **دفتر يومية مزدوج القيد** مع تحقق تلقائي من التوازن
- **شجرة حسابات هرمية** (30 حساب جاهز: أصول/خصوم/حقوق ملكية/إيرادات/مصروفات)
- **إدارة العملاء والموردين** مع كشوف حسابات تفصيلية
- **إصدار PDF احترافي** لكشوف الحسابات
- **3 تقارير مالية**: ميزان المراجعة، قائمة الدخل، الميزانية العمومية
- **دعم تعدد العملات** (ريال سعودي + ريال يمني)
- **نسخ احتياطي JSON** كامل
- **لوحة تحكم** برسوم بيانية حية

## 🛠️ التقنيات

- **Next.js 16** + TypeScript 5
- **Prisma 6** + PostgreSQL (Neon cloud)
- **Tailwind CSS 4** + shadcn/ui
- **Recharts** + **pdf-lib**
- خطوط Google: Cairo + Amiri (Arabic RTL)

## 🚀 التشغيل محلياً

```bash
bun install
cp .env.example .env  # عدّل DATABASE_URL
bun run db:push
bun run db:seed
bun run dev
```

## ☁️ البنية السحابية

- **Frontend**: Vercel (auto-deploy on push to main)
- **Database**: Neon PostgreSQL (serverless)
- **CI/CD**: GitHub Actions

## 🔄 CI/CD Pipeline

- على كل push إلى `main`: GitHub Actions يبني المشروع وينشره على Vercel تلقائياً
- على كل PR: فحص lint + build قبل الدمج

## 📝 الترخيص

MIT License
