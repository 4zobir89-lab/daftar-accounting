import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const items = await db.account.findMany({
      orderBy: [{ code: "asc" }],
    });
    return NextResponse.json(items);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, name, type, parentId, isGroup, currency, notes } = body;

    if (!code || !name || !type) {
      return NextResponse.json({ error: "الرمز والاسم والنوع مطلوبة" }, { status: 400 });
    }

    const exists = await db.account.findUnique({ where: { code } });
    if (exists) {
      return NextResponse.json({ error: "الرمز مستخدم بالفعل" }, { status: 400 });
    }

    const created = await db.account.create({
      data: {
        code,
        name,
        nameEn: body.nameEn || null,
        type,
        parentId: parentId || null,
        isGroup: !!isGroup,
        currency: currency || "SAR",
        notes: notes || null,
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
    const updated = await db.account.update({
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

    // Check for children
    const children = await db.account.count({ where: { parentId: id } });
    if (children > 0) {
      return NextResponse.json({ error: "لا يمكن حذف حساب له حسابات فرعية" }, { status: 400 });
    }

    // Check for journal lines
    const lines = await db.journalLine.count({ where: { accountId: id } });
    if (lines > 0) {
      return NextResponse.json({ error: "لا يمكن حذف حساب مرتبط بقيود محاسبية" }, { status: 400 });
    }

    await db.account.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
