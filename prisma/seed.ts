// Database seed: initial currencies, accounts, settings, and admin user
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // === Currencies ===
  const sar = await db.currency.upsert({
    where: { code: "SAR" },
    update: {},
    create: {
      code: "SAR",
      name: "ريال سعودي",
      symbol: "ر.س",
      isBase: true,
      decimals: 2,
    },
  });

  const yer = await db.currency.upsert({
    where: { code: "YER" },
    update: {},
    create: {
      code: "YER",
      name: "ريال يمني",
      symbol: "ر.ي",
      isBase: false,
      decimals: 0,
    },
  });

  // === Exchange rate: 1 SAR = 139.5 YER ===
  await db.exchangeRate.upsert({
    where: {
      fromCurrencyId_toCurrencyId_date: {
        fromCurrencyId: sar.id,
        toCurrencyId: yer.id,
        date: new Date(),
      },
    },
    update: { rate: 139.5 },
    create: {
      fromCurrencyId: sar.id,
      toCurrencyId: yer.id,
      rate: 139.5,
      date: new Date(),
    },
  });

  // === Chart of Accounts — default banking-style structure ===
  const accounts = [
    // Assets — 1000
    { code: "1000", name: "الأصول", type: "ASSET", isGroup: true, parent: null },
    { code: "1100", name: "الأصول المتداولة", type: "ASSET", isGroup: true, parent: "1000" },
    { code: "1110", name: "الصندوق", type: "ASSET", isGroup: false, parent: "1100" },
    { code: "1120", name: "البنك", type: "ASSET", isGroup: false, parent: "1100" },
    { code: "1130", name: "محفظة جيب", type: "ASSET", isGroup: false, parent: "1100" },
    { code: "1140", name: "العملاء (مدينون)", type: "ASSET", isGroup: false, parent: "1100" },
    { code: "1150", name: "الإيرادات المستحقة", type: "ASSET", isGroup: false, parent: "1100" },
    // Fixed assets
    { code: "1200", name: "الأصول الثابتة", type: "ASSET", isGroup: true, parent: "1000" },
    { code: "1210", name: "أثاث ومعدات", type: "ASSET", isGroup: false, parent: "1200" },
    { code: "1220", name: "سيارات", type: "ASSET", isGroup: false, parent: "1200" },

    // Liabilities — 2000
    { code: "2000", name: "الخصوم", type: "LIABILITY", isGroup: true, parent: null },
    { code: "2100", name: "الخصوم المتداولة", type: "LIABILITY", isGroup: true, parent: "2000" },
    { code: "2110", name: "الموردون (دائنون)", type: "LIABILITY", isGroup: false, parent: "2100" },
    { code: "2120", name: "مصروفات مستحقة", type: "LIABILITY", isGroup: false, parent: "2100" },
    { code: "2200", name: "قروض طويلة الأجل", type: "LIABILITY", isGroup: false, parent: "2000" },

    // Equity — 3000
    { code: "3000", name: "حقوق الملكية", type: "EQUITY", isGroup: true, parent: null },
    { code: "3100", name: "رأس المال", type: "EQUITY", isGroup: false, parent: "3000" },
    { code: "3200", name: "الأرباح المحتجزة", type: "EQUITY", isGroup: false, parent: "3000" },

    // Revenue — 4000
    { code: "4000", name: "الإيرادات", type: "REVENUE", isGroup: true, parent: null },
    { code: "4100", name: "إيرادات المبيعات", type: "REVENUE", isGroup: false, parent: "4000" },
    { code: "4200", name: "إيرادات خدمات", type: "REVENUE", isGroup: false, parent: "4000" },
    { code: "4300", name: "إيرادات أخرى", type: "REVENUE", isGroup: false, parent: "4000" },

    // Expenses — 5000
    { code: "5000", name: "المصروفات", type: "EXPENSE", isGroup: true, parent: null },
    { code: "5100", name: "مصروفات الرواتب", type: "EXPENSE", isGroup: false, parent: "5000" },
    { code: "5200", name: "مصروفات إيجار", type: "EXPENSE", isGroup: false, parent: "5000" },
    { code: "5300", name: "مصروفات مرافق", type: "EXPENSE", isGroup: false, parent: "5000" },
    { code: "5400", name: "مصروفات مواد", type: "EXPENSE", isGroup: false, parent: "5000" },
    { code: "5500", name: "مصروفات نثرية", type: "EXPENSE", isGroup: false, parent: "5000" },
    { code: "5600", name: "مصروفات قات", type: "EXPENSE", isGroup: false, parent: "5000" },
    { code: "5700", name: "مصروفات مواصلات", type: "EXPENSE", isGroup: false, parent: "5000" },
  ] as const;

  // Insert accounts with parent resolution
  const codeToId = new Map<string, string>();
  // First pass: create accounts without parent or with parent already inserted
  for (const acc of accounts) {
    let parentId: string | null = null;
    if (acc.parent) {
      parentId = codeToId.get(acc.parent) || null;
    }
    const created = await db.account.upsert({
      where: { code: acc.code },
      update: {},
      create: {
        code: acc.code,
        name: acc.name,
        type: acc.type,
        isGroup: acc.isGroup,
        parentId,
        currency: "SAR",
        active: true,
      },
    });
    codeToId.set(acc.code, created.id);
  }

  // === Default settings ===
  await db.setting.upsert({
    where: { key: "companyName" },
    update: {},
    create: { key: "companyName", value: "شركتي", type: "string" },
  });

  await db.setting.upsert({
    where: { key: "baseCurrency" },
    update: {},
    create: { key: "baseCurrency", value: "SAR", type: "string" },
  });

  await db.setting.upsert({
    where: { key: "entryNumberPrefix" },
    update: {},
    create: { key: "entryNumberPrefix", value: "JE", type: "string" },
  });

  console.log("✅ Database seeded successfully");
  console.log(`   - ${await db.currency.count()} currencies`);
  console.log(`   - ${await db.account.count()} accounts`);
  console.log(`   - ${await db.setting.count()} settings`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
