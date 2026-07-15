import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const partnerId = searchParams.get("partnerId");
    const accountId = searchParams.get("accountId");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const limit = Number(searchParams.get("limit")) || 1000;

    const where: Record<string, unknown> = {};
    if (partnerId) where.partnerId = partnerId;
    if (from || to) {
      where.date = {};
      if (from) (where.date as Record<string, unknown>).gte = new Date(from);
      if (to) (where.date as Record<string, unknown>).lte = new Date(to);
    }
    if (accountId) {
      where.lines = { some: { accountId } };
    }

    const entries = await db.journalEntry.findMany({
      where,
      orderBy: [{ date: "desc" }, { entryNumber: "desc" }],
      take: limit,
      include: {
        currency: true,
        partner: true,
        lines: {
          include: {
            account: true,
            currency: true,
          },
        },
      },
    });

    return NextResponse.json(entries);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { date, description, reference, notes, currencyId, partnerId, lines } = body;

    // Validation
    if (!date || !description || !currencyId) {
      return NextResponse.json({ error: "التاريخ والبيان والعملة مطلوبة" }, { status: 400 });
    }
    if (!Array.isArray(lines) || lines.length < 2) {
      return NextResponse.json({ error: "يجب أن يحتوي القيد على بندين على الأقل" }, { status: 400 });
    }

    // Calculate totals
    const totalDebit = lines.reduce((s: number, l: { debit?: number }) => s + (Number(l.debit) || 0), 0);
    const totalCredit = lines.reduce((s: number, l: { credit?: number }) => s + (Number(l.credit) || 0), 0);

    // Round to avoid floating point errors
    const round = (n: number) => Math.round(n * 100) / 100;
    const dr = round(totalDebit);
    const cr = round(totalCredit);

    if (Math.abs(dr - cr) > 0.01) {
      return NextResponse.json(
        { error: `القيد غير متوازن: مدين ${dr} ≠ دائن ${cr}` },
        { status: 400 }
      );
    }

    // Generate entry number: JE-2026-0001
    const year = new Date(date).getFullYear();
    const prefix = "JE";
    const count = await db.journalEntry.count({
      where: {
        entryNumber: { startsWith: `${prefix}-${year}-` },
      },
    });
    const entryNumber = `${prefix}-${year}-${String(count + 1).padStart(4, "0")}`;

    // Get or create system user
    let systemUser = await db.user.findUnique({ where: { email: "system@local" } });
    if (!systemUser) {
      systemUser = await db.user.create({
        data: { email: "system@local", name: "النظام", password: "x", role: "ADMIN" },
      });
    }

    // Create entry with lines in a transaction
    const created = await db.$transaction(async (tx) => {
      const entry = await tx.journalEntry.create({
        data: {
          entryNumber,
          date: new Date(date),
          description,
          reference: reference || null,
          notes: notes || null,
          status: "POSTED",
          totalDebit: dr,
          totalCredit: cr,
          currencyId,
          partnerId: partnerId || null,
          createdById: systemUser!.id,
        },
      });

      // Create lines
      for (const line of lines) {
        if (!line.accountId) continue;
        const debit = Number(line.debit) || 0;
        const credit = Number(line.credit) || 0;
        if (debit === 0 && credit === 0) continue;
        await tx.journalLine.create({
          data: {
            entryId: entry.id,
            accountId: line.accountId,
            debit,
            credit,
            description: line.description || null,
            currencyId,
          },
        });
      }

      return entry;
    });

    // Fetch the full entry with relations
    const full = await db.journalEntry.findUnique({
      where: { id: created.id },
      include: {
        currency: true,
        partner: true,
        lines: { include: { account: true, currency: true } },
      },
    });

    return NextResponse.json(full);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    await db.journalEntry.delete({
      where: { id },
      include: { lines: true },
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
