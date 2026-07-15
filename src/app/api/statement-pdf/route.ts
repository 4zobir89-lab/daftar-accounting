import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Generate a professional bank-statement-style PDF
// Uses pdf-lib (Vercel-compatible, no Playwright needed)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { partnerId, from, to } = body;

    // Fetch partner
    const partner = partnerId
      ? await db.partner.findUnique({ where: { id: partnerId } })
      : null;

    const where: Record<string, unknown> = {};
    if (partnerId) where.partnerId = partnerId;
    if (from || to) {
      where.date = {};
      if (from) (where.date as Record<string, unknown>).gte = new Date(from);
      if (to) (where.date as Record<string, unknown>).lte = new Date(to);
    }

    const entries = await db.journalEntry.findMany({
      where,
      orderBy: [{ date: "asc" }, { entryNumber: "asc" }],
      include: {
        currency: true,
        partner: true,
        lines: { include: { account: true } },
      },
    });

    const sar = await db.currency.findUnique({ where: { code: "SAR" } });
    const yer = await db.currency.findUnique({ where: { code: "YER" } });
    let exchangeRate = 139.5;
    if (sar && yer) {
      const rate = await db.exchangeRate.findFirst({
        where: { fromCurrencyId: sar.id, toCurrencyId: yer.id },
        orderBy: { date: "desc" },
      });
      if (rate) exchangeRate = rate.rate;
    }

    const settings = await db.setting.findMany();
    const settingsObj: Record<string, string> = {};
    settings.forEach((s) => (settingsObj[s.key] = s.value));

    // Generate PDF using pdf-lib
    const pdfBuffer = await generatePDF({
      partner,
      entries,
      exchangeRate,
      from,
      to,
      companyName: settingsObj.companyName || "شركتي",
      statementNumber: `ST-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999)).padStart(4, "0")}`,
    });

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="account-statement-${Date.now()}.pdf"`,
      },
    });
  } catch (e) {
    console.error("PDF generation error:", e);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

async function generatePDF({
  partner,
  entries,
  exchangeRate,
  from,
  to,
  companyName,
  statementNumber,
}: {
  partner: { name: string } | null;
  entries: Array<{
    entryNumber: string;
    date: Date;
    description: string;
    notes?: string | null;
    totalDebit: number;
    totalCredit: number;
    currency: { code: string };
    lines: Array<{ account: { name: string }; debit: number; credit: number }>;
  }>;
  exchangeRate: number;
  from?: string;
  to?: string;
  companyName: string;
  statementNumber: string;
}): Promise<Buffer> {
  // Use dynamic import to ensure pdf-lib loads on Vercel
  const { PDFDocument, rgb, StandardFonts } = await import("pdf-lib");
  const doc = await PDFDocument.create();
  doc.setTitle(`كشف حساب - ${partner?.name || "كشف حساب شامل"}`);
  doc.setAuthor("دفتر المحاسب");
  doc.setSubject("كشف حساب محاسبي");
  doc.setCreator("Daftar Accounting");

  // Colors
  const NAVY = rgb(0.082, 0.161, 0.294);
  const GOLD = rgb(0.722, 0.588, 0.306);
  const CREAM = rgb(0.98, 0.969, 0.941);
  const INK = rgb(0.102, 0.102, 0.102);
  const CREDIT = rgb(0.122, 0.42, 0.227);
  const DEBIT = rgb(0.541, 0.137, 0.188);
  const LIGHT = rgb(0.847, 0.823, 0.761);

  // Use Helvetica fonts (built-in). Note: Arabic not directly supported by pdf-lib
  // We will use transliteration approach for Arabic text or English equivalent
  // For now, generate a clean English-styled PDF with Arabic numerals in amounts
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  const page = doc.addPage([595.28, 841.89]); // A4
  const { width, height } = page.getSize();

  // Top gold bar
  page.drawRectangle({
    x: 0,
    y: height - 20,
    width,
    height: 20,
    color: GOLD,
  });

  // Title
  page.drawText("STATEMENT OF ACCOUNT", {
    x: 50,
    y: height - 60,
    size: 24,
    font: fontBold,
    color: NAVY,
  });

  page.drawText("Daftar Accounting System", {
    x: 50,
    y: height - 80,
    size: 11,
    font: font,
    color: INK,
  });

  // Subtitle
  const partnerName = partner?.name || "All Partners";
  page.drawText(`Statement for: ${partnerName}`, {
    x: 50,
    y: height - 110,
    size: 13,
    font: fontBold,
    color: INK,
  });

  // Meta info
  const today = new Date().toLocaleDateString("en-GB");
  page.drawText(`Issued: ${today}`, { x: 400, y: height - 60, size: 9, font: font, color: INK });
  page.drawText(`Ref: ${statementNumber}`, { x: 400, y: height - 75, size: 9, font: font, color: INK });
  page.drawText(`Rate: ${exchangeRate}`, { x: 400, y: height - 90, size: 9, font: font, color: INK });

  // Gold line separator
  page.drawLine({
    start: { x: 50, y: height - 130 },
    end: { x: width - 50, y: height - 130 },
    thickness: 2,
    color: GOLD,
  });

  // Summary box
  let totalDebit = 0;
  let totalCredit = 0;
  entries.forEach((e) => {
    totalDebit += e.totalDebit;
    totalCredit += e.totalCredit;
  });
  const balance = totalCredit - totalDebit;

  page.drawText("SUMMARY", { x: 50, y: height - 155, size: 11, font: fontBold, color: NAVY });
  page.drawText(`Total Credits: ${totalCredit.toFixed(2)} SAR`, { x: 50, y: height - 175, size: 10, font: font, color: CREDIT });
  page.drawText(`Total Debits: ${totalDebit.toFixed(2)} SAR`, { x: 50, y: height - 190, size: 10, font: font, color: DEBIT });
  page.drawText(`Final Balance: ${balance.toFixed(2)} SAR`, { x: 50, y: height - 205, size: 10, font: fontBold, color: NAVY });
  page.drawText(`(YER equiv: ${(balance * exchangeRate).toFixed(0)})`, { x: 50, y: height - 220, size: 9, font: font, color: INK });

  // Transactions header
  page.drawText("TRANSACTIONS", { x: 50, y: height - 255, size: 11, font: fontBold, color: NAVY });

  // Header row
  const headerY = height - 275;
  page.drawRectangle({ x: 50, y: headerY, width: width - 100, height: 18, color: NAVY });
  page.drawText("#", { x: 55, y: headerY + 5, size: 9, font: fontBold, color: rgb(1, 1, 1) });
  page.drawText("Date", { x: 80, y: headerY + 5, size: 9, font: fontBold, color: rgb(1, 1, 1) });
  page.drawText("Description", { x: 150, y: headerY + 5, size: 9, font: fontBold, color: rgb(1, 1, 1) });
  page.drawText("Debit", { x: 380, y: headerY + 5, size: 9, font: fontBold, color: rgb(1, 1, 1) });
  page.drawText("Credit", { x: 450, y: headerY + 5, size: 9, font: fontBold, color: rgb(1, 1, 1) });
  page.drawText("Balance", { x: 520, y: headerY + 5, size: 9, font: fontBold, color: rgb(1, 1, 1) });

  // Rows
  let y = headerY - 5;
  let running = 0;
  const formatNum = (n: number) => n.toFixed(2);
  const formatDate = (d: Date) => d.toLocaleDateString("en-GB");

  entries.forEach((entry, idx) => {
    if (y < 80) {
      // Add new page
      const newPage = doc.addPage([595.28, 841.89]);
      y = newPage.getSize().height - 50;
    }
    running += entry.totalCredit - entry.totalDebit;

    // Alternate row background
    if (idx % 2 === 0) {
      page.drawRectangle({ x: 50, y: y - 10, width: width - 100, height: 14, color: CREAM });
    }

    page.drawText(String(idx + 1), { x: 55, y: y - 5, size: 8, font: font, color: INK });
    page.drawText(formatDate(new Date(entry.date)), { x: 80, y: y - 5, size: 8, font: font, color: INK });

    // Truncate description if too long
    let desc = entry.description.substring(0, 45);
    page.drawText(desc, { x: 150, y: y - 5, size: 8, font: font, color: INK });

    page.drawText(entry.totalDebit > 0 ? formatNum(entry.totalDebit) : "-", {
      x: 380, y: y - 5, size: 8, font: font, color: DEBIT,
    });
    page.drawText(entry.totalCredit > 0 ? formatNum(entry.totalCredit) : "-", {
      x: 450, y: y - 5, size: 8, font: font, color: CREDIT,
    });
    page.drawText(formatNum(running), {
      x: 520, y: y - 5, size: 8, font: fontBold, color: NAVY,
    });

    y -= 14;
  });

  // Footer
  page.drawLine({
    start: { x: 50, y: 50 },
    end: { x: width - 50, y: 50 },
    thickness: 1,
    color: LIGHT,
  });
  page.drawText("Approved by: Accounting Department", { x: 50, y: 35, size: 9, font: fontBold, color: GOLD });
  page.drawText(`Generated: ${new Date().toISOString().split("T")[0]}`, { x: 400, y: 35, size: 8, font: font, color: INK });

  // Bottom gold bar
  page.drawRectangle({ x: 0, y: 0, width, height: 10, color: GOLD });

  const pdfBytes = await doc.save();
  return Buffer.from(pdfBytes);
}
