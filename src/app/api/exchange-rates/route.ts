import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const items = await db.exchangeRate.findMany({
      orderBy: [{ date: "desc" }],
      include: {
        fromCurrency: true,
        toCurrency: true,
      },
    });
    return NextResponse.json(items);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fromCurrencyId, toCurrencyId, rate } = body;

    if (!fromCurrencyId || !toCurrencyId || !rate) {
      return NextResponse.json({ error: "العملتان والسعر مطلوبة" }, { status: 400 });
    }

    // Upsert: if rate for today exists, update; else create
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await db.exchangeRate.findUnique({
      where: {
        fromCurrencyId_toCurrencyId_date: {
          fromCurrencyId,
          toCurrencyId,
          date: today,
        },
      },
    });

    let result;
    if (existing) {
      result = await db.exchangeRate.update({
        where: { id: existing.id },
        data: { rate: Number(rate) },
      });
    } else {
      result = await db.exchangeRate.create({
        data: {
          fromCurrencyId,
          toCurrencyId,
          rate: Number(rate),
          date: today,
        },
      });
    }

    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    await db.exchangeRate.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
