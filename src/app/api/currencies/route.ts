import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const items = await db.currency.findMany({
      orderBy: [{ isBase: "desc" }, { code: "asc" }],
    });
    return NextResponse.json(items);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, name, symbol, isBase, decimals } = body;

    if (!code || !name) {
      return NextResponse.json({ error: "الرمز والاسم مطلوبان" }, { status: 400 });
    }

    if (isBase) {
      await db.currency.updateMany({
        where: { isBase: true },
        data: { isBase: false },
      });
    }

    const created = await db.currency.create({
      data: {
        code: code.toUpperCase(),
        name,
        symbol: symbol || code,
        isBase: !!isBase,
        decimals: Number(decimals) || 2,
      },
    });
    return NextResponse.json(created);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...data } = body;

    if (data.isBase) {
      await db.currency.updateMany({
        where: { isBase: true, NOT: { id } },
        data: { isBase: false },
      });
    }

    const updated = await db.currency.update({
      where: { id },
      data,
    });
    return NextResponse.json(updated);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    await db.currency.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
