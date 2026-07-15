import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Export all data as JSON for backup
export async function GET() {
  try {
    const [
      currencies,
      exchangeRates,
      accounts,
      partners,
      journalEntries,
      invoices,
      settings,
      users,
    ] = await Promise.all([
      db.currency.findMany(),
      db.exchangeRate.findMany(),
      db.account.findMany(),
      db.partner.findMany(),
      db.journalEntry.findMany({
        include: { lines: true },
      }),
      db.invoice.findMany({ include: { items: true } }),
      db.setting.findMany(),
      db.user.findMany({ select: { id: true, email: true, name: true, role: true } }),
    ]);

    const backup = {
      _meta: {
        exportedAt: new Date().toISOString(),
        version: "1.0",
        app: "Daftar Accounting",
      },
      currencies,
      exchangeRates,
      accounts,
      partners,
      journalEntries,
      invoices,
      settings,
      users,
    };

    return NextResponse.json(backup, {
      headers: {
        "Content-Disposition": `attachment; filename="daftar-backup-${new Date().toISOString().split("T")[0]}.json"`,
      },
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

// Import JSON backup (restore)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { mode = "merge" } = body;
    const data = body.data;

    if (!data || !data._meta) {
      return NextResponse.json({ error: "ملف النسخة الاحتياطية غير صالح" }, { status: 400 });
    }

    const result = { imported: 0, skipped: 0, errors: [] as string[] };

    // If mode is "replace", clear existing data first
    if (mode === "replace") {
      await db.journalLine.deleteMany();
      await db.journalEntry.deleteMany();
      await db.invoiceItem.deleteMany();
      await db.invoice.deleteMany();
      await db.partnerAccount.deleteMany();
      await db.partner.deleteMany();
      await db.account.deleteMany();
      await db.exchangeRate.deleteMany();
      await db.currency.deleteMany();
      await db.setting.deleteMany();
    }

    // Currencies
    for (const cur of data.currencies || []) {
      try {
        await db.currency.upsert({
          where: { code: cur.code },
          update: {},
          create: cur,
        });
        result.imported++;
      } catch {
        result.skipped++;
      }
    }

    // Accounts
    for (const acc of data.accounts || []) {
      try {
        await db.account.upsert({
          where: { code: acc.code },
          update: {},
          create: {
            ...acc,
            id: undefined, // let DB generate
            parentId: null, // will fix after all inserted
          },
        });
        result.imported++;
      } catch {
        result.skipped++;
      }
    }

    // Settings
    for (const s of data.settings || []) {
      try {
        await db.setting.upsert({
          where: { key: s.key },
          update: { value: s.value },
          create: s,
        });
        result.imported++;
      } catch {
        result.skipped++;
      }
    }

    // Partners
    for (const p of data.partners || []) {
      try {
        await db.partner.upsert({
          where: { id: p.id },
          update: {},
          create: p,
        });
        result.imported++;
      } catch {
        result.skipped++;
      }
    }

    // Journal entries
    for (const entry of data.journalEntries || []) {
      try {
        await db.journalEntry.upsert({
          where: { id: entry.id },
          update: {},
          create: {
            id: entry.id,
            entryNumber: entry.entryNumber,
            date: new Date(entry.date),
            description: entry.description,
            reference: entry.reference,
            notes: entry.notes,
            status: entry.status,
            totalDebit: entry.totalDebit,
            totalCredit: entry.totalCredit,
            currencyId: entry.currencyId,
            partnerId: entry.partnerId,
            createdById: "system",
          },
        });
        for (const line of entry.lines || []) {
          await db.journalLine.create({
            data: {
              entryId: entry.id,
              accountId: line.accountId,
              debit: line.debit,
              credit: line.credit,
              description: line.description,
              currencyId: line.currencyId,
            },
          });
        }
        result.imported++;
      } catch {
        result.skipped++;
      }
    }

    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
