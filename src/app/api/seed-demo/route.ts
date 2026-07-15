import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Seed demo data: partner (صاحب الحساب) + sample transactions matching the previous PDFs
export async function POST() {
  try {
    // Get or create a system user
    let systemUser = await db.user.findUnique({ where: { email: "system@local" } });
    if (!systemUser) {
      systemUser = await db.user.create({
        data: { email: "system@local", name: "النظام", password: "x", role: "ADMIN" },
      });
    }

    // Get or create the partner "صاحب الحساب"
    let partner = await db.partner.findFirst({ where: { name: "صاحب الحساب" } });
    if (!partner) {
      partner = await db.partner.create({
        data: {
          name: "صاحب الحساب",
          type: "INDIVIDUAL",
          notes: "حساب تجريبي",
          createdById: systemUser.id,
        },
      });
    }

    const sar = await db.currency.findUnique({ where: { code: "SAR" } });
    const yer = await db.currency.findUnique({ where: { code: "YER" } });
    if (!sar || !yer) {
      return NextResponse.json({ error: "العملات غير مهيأة" }, { status: 400 });
    }

    // Get accounts
    const pocketAccount = await db.account.findUnique({ where: { code: "1130" } }); // محفظة جيب
    const bankAccount = await db.account.findUnique({ where: { code: "1120" } }); // البنك
    const revenueAccount = await db.account.findUnique({ where: { code: "4100" } }); // إيرادات المبيعات
    const expenseAccount = await db.account.findUnique({ where: { code: "5500" } }); // مصروفات نثرية
    const qatAccount = await db.account.findUnique({ where: { code: "5600" } }); // قات
    const transportAccount = await db.account.findUnique({ where: { code: "5700" } }); // مواصلات

    if (!pocketAccount || !revenueAccount || !expenseAccount) {
      return NextResponse.json({ error: "الحسابات غير مهيأة. شغل seed.ts أولاً" }, { status: 400 });
    }

    // Sample transactions matching the previous PDFs
    const sampleEntries = [
      // Pocket wallet transactions
      { date: "2026-07-01", description: "مرتجع قيمة الجلخ من عند القدسي", debit: 0, credit: 14000, account: revenueAccount.id, notes: "مرتجع قيمة الجلخ من عند القدسي" },
      { date: "2026-07-02", description: "رصيد عبد الرحمن", debit: 500, credit: 0, account: expenseAccount.id, notes: "رصيد عبد الرحمن" },
      { date: "2026-07-03", description: "سحب وسيم مصروف", debit: 10000, credit: 0, account: expenseAccount.id, notes: "سحب وسيم مصروف" },
      { date: "2026-07-04", description: "رصيد للحاج", debit: 1000, credit: 0, account: expenseAccount.id, notes: "رصيد للحاج" },
      { date: "2026-07-05", description: "تحويل لعبد الرحمن يوم السبت", debit: 1500, credit: 0, account: expenseAccount.id, notes: "تحويل لعبد الرحمن يوم السبت" },
      { date: "2026-07-06", description: "تحويل رصيد لعبد الرحمن", debit: 500, credit: 0, account: expenseAccount.id, notes: "تحويل رصيد لعبد الرحمن" },
      { date: "2026-07-07", description: "تحويل رصيد وسيم", debit: 500, credit: 0, account: expenseAccount.id, notes: "تحويل رصيد وسيم" },
      { date: "2026-07-08", description: "إيداع 3900 سعودي مصارفة بـ 544000", debit: 0, credit: 544000, account: revenueAccount.id, notes: "إيداع 3900 سعودي مصارفة بـ 544000" },
      { date: "2026-07-09", description: "تحويل لعند ماهر", debit: 544000, credit: 0, account: expenseAccount.id, notes: "تحويل لعند ماهر" },

      // Saudi account transactions
      { date: "2026-07-10", description: "مستلم مبلغ 1000 سعودي", debit: 0, credit: 1000, account: revenueAccount.id, notes: "مستلم مبلغ 1000 سعودي" },
      { date: "2026-07-11", description: "مصروفات متنوعة - بيد عمي احمد السمكري", debit: 200, credit: 0, account: expenseAccount.id, notes: "بيد عمي احمد السمكري 16000، عصير وماء 400، حوالة جيب للبوذاء 10100، حساب صاحب التوت 400، مسلمة بيد الحاج احمد 1000، الإجمالي 27900 ريال" },
      { date: "2026-07-12", description: "سلف ومصروفات يومية", debit: 200, credit: 0, account: expenseAccount.id, notes: "سلف مع علاء المخرطة 5000، مواصلات 100، مصروفات يومية وسيم 2000/أمير 3000/عبد الرحمن 2000/جمعان 2000/الحاج احمد 2000، مصاريف نثرية (غسول قات، سجارة وماء، شمة)، غداء 4200، غاز 2000، رصيد للحاج احمد 1000، مسلمة بيد الحاج احمد 3600، الإجمالي 27900" },
      { date: "2026-07-13", description: "100 ريال سعودي مسلمة بيد الحاج احمد", debit: 100, credit: 0, account: expenseAccount.id, notes: "100 ريال سعودي مسلمة بيد الحاج احمد" },
      { date: "2026-07-14", description: "حوالات ومصاريف متنوعة", debit: 500, credit: 0, account: expenseAccount.id, notes: "حوالة لماهر 250 سعودي، حوالة لمحمد جمعان 200 سعودي، حوالة لمحمد جمعان 10000 ريال يمني، مع أمير 5000 ريال يمني، مع وسيم 3000 ريال يمني" },
      { date: "2026-07-15", description: "إيرادات يومية متنوعة", debit: 0, credit: 700, account: revenueAccount.id, notes: "الشيبة 10000، جمعان 5000، النيابة 5000، صبوح 2000، مع محمد جمعان 8000، مع أمير 3000، مع وسيم 2000، مع عبد الرحمن 2000، مع الحاج احمد حق القات 2500، سجارة + ماء 1000، مع أمير 5000، مع عبد الرحمن 8500، مع وسيم 3000، حق وايت ماء 2500" },
      { date: "2026-07-16", description: "تحويل رصيد وسيم", debit: 700, credit: 0, account: expenseAccount.id, notes: "سحب من الحساب (تحويل رصيد وسيم)" },
      { date: "2026-07-17", description: "مستلم من عمي احمد السمكري", debit: 0, credit: 272, account: revenueAccount.id, notes: "من عمي احمد السمكري: مستلم مبلغ 9000 ريال يمني، مستلمة من الحاج احمد 200 ريال سعودي" },
    ];

    let createdCount = 0;
    let yearCounter = await db.journalEntry.count({
      where: { entryNumber: { startsWith: "JE-2026-" } },
    });

    for (const entry of sampleEntries) {
      yearCounter++;
      const entryNumber = `JE-2026-${String(yearCounter).padStart(4, "0")}`;

      // Double entry: one line is the main account, the other is revenue/expense
      // For credit (income): debit pocket/bank, credit revenue
      // For debit (expense): debit expense, credit pocket/bank
      const lines =
        entry.credit > 0
          ? [
              { accountId: pocketAccount.id, debit: entry.credit, credit: 0, description: entry.description },
              { accountId: entry.account, debit: 0, credit: entry.credit, description: entry.description },
            ]
          : [
              { accountId: entry.account, debit: entry.debit, credit: 0, description: entry.description },
              { accountId: pocketAccount.id, debit: 0, credit: entry.debit, description: entry.description },
            ];

      await db.journalEntry.create({
        data: {
          entryNumber,
          date: new Date(entry.date),
          description: entry.description,
          notes: entry.notes,
          status: "POSTED",
          totalDebit: entry.debit || entry.credit,
          totalCredit: entry.credit || entry.debit,
          currencyId: sar.id,
          partnerId: partner.id,
          createdById: systemUser.id,
          lines: {
            create: lines.map((l) => ({
              accountId: l.accountId,
              debit: l.debit,
              credit: l.credit,
              description: l.description,
              currencyId: sar.id,
            })),
          },
        },
      });
      createdCount++;
    }

    return NextResponse.json({
      success: true,
      message: `تم إنشاء ${createdCount} معاملة تجريبية للشريك "${partner.name}"`,
      count: createdCount,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
