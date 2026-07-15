import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { spawn } from "child_process";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

// Generate a professional bank-statement-style PDF
// Mirrors the design of the previous PDF (navy/gold/cream banking theme)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { partnerId, from, to, type = "statement" } = body;

    // Fetch partner
    const partner = partnerId
      ? await db.partner.findUnique({ where: { id: partnerId } })
      : null;

    // Fetch entries for partner (or all)
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
        lines: { include: { account: true, currency: true } },
      },
    });

    // Fetch SAR and YER currencies
    const sar = await db.currency.findUnique({ where: { code: "SAR" } });
    const yer = await db.currency.findUnique({ where: { code: "YER" } });

    // Get latest SAR->YER rate
    let exchangeRate = 139.5;
    if (sar && yer) {
      const rate = await db.exchangeRate.findFirst({
        where: { fromCurrencyId: sar.id, toCurrencyId: yer.id },
        orderBy: { date: "desc" },
      });
      if (rate) exchangeRate = rate.rate;
    }

    // Fetch settings
    const settings = await db.setting.findMany();
    const settingsObj: Record<string, string> = {};
    settings.forEach((s) => (settingsObj[s.key] = s.value));

    // Build HTML using the same template as the previous PDF
    const html = generateStatementHTML({
      partner,
      entries,
      exchangeRate,
      from,
      to,
      companyName: settingsObj.companyName || "شركتي",
      statementNumber: `ST-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999)).padStart(4, "0")}`,
    });

    // Save HTML to file
    const tmpDir = "/home/z/my-project/db/pdf-tmp";
    if (!existsSync(tmpDir)) await mkdir(tmpDir, { recursive: true });
    const htmlPath = path.join(tmpDir, `statement-${Date.now()}.html`);
    const pdfPath = path.join(tmpDir, `statement-${Date.now()}.pdf`);

    await writeFile(htmlPath, html, "utf8");

    // Use html2poster.js (single-page long image) or html2pdf-next.js (multipage)
    // For multi-page documents like account statements, use html2pdf-next.js
    const scriptPath = "/home/z/my-project/skills/pdf/scripts/html2pdf-next.js";
    await new Promise<void>((resolve, reject) => {
      const proc = spawn(
        "node",
        [scriptPath, htmlPath, "--output", pdfPath, "--width", "210mm", "--height", "297mm", "--nopaged"],
        { cwd: "/home/z/my-project" }
      );
      let stderr = "";
      proc.stderr.on("data", (d) => (stderr += d.toString()));
      proc.on("close", (code) => {
        if (code !== 0) reject(new Error(`PDF generation failed: ${stderr}`));
        else resolve();
      });
    });

    // Read PDF and return as binary
    const { readFile } = await import("fs/promises");
    const pdfBuffer = await readFile(pdfPath);

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

// === HTML generator — same banking-classic design as before ===
function generateStatementHTML({
  partner,
  entries,
  exchangeRate,
  from,
  to,
  companyName,
  statementNumber,
}: {
  partner: { name: string; type: string } | null;
  entries: Array<{
    id: string;
    entryNumber: string;
    date: Date;
    description: string;
    notes?: string | null;
    totalDebit: number;
    totalCredit: number;
    currency: { code: string; symbol: string };
    lines: Array<{
      account: { code: string; name: string };
      debit: number;
      credit: number;
      description?: string | null;
    }>;
  }>;
  exchangeRate: number;
  from?: string;
  to?: string;
  companyName: string;
  statementNumber: string;
}): string {
  const formatNum = (n: number, decimals = 2) =>
    new Intl.NumberFormat("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(n || 0);

  // Build rows for each entry
  let rowsHtml = "";
  let runningBalance = 0;
  let totalDebit = 0;
  let totalCredit = 0;
  let txnNum = 0;

  entries.forEach((entry) => {
    txnNum++;
    // For a partner statement, debit = paid to partner (their credit), credit = received from partner
    const debit = entry.totalDebit;
    const credit = entry.totalCredit;
    runningBalance += credit - debit;
    totalDebit += debit;
    totalCredit += credit;

    const yerBalance = runningBalance * exchangeRate;

    // Build description including all line items
    const descLines = entry.lines
      .filter((l) => l.account && (l.debit > 0 || l.credit > 0))
      .map((l) => {
        const accountName = l.account.name;
        const amt = l.debit > 0 ? formatNum(l.debit) : formatNum(l.credit);
        return `<span class="desc-line"><span class="desc-label">${escapeHtml(accountName)}:</span> <span class="desc-amount">${amt}</span></span>`;
      })
      .join("");

    const descHtml = entry.notes
      ? `<span class="desc-line">${escapeHtml(entry.notes)}</span>${descLines}`
      : descLines || escapeHtml(entry.description);

    const balClass = runningBalance < 0 ? "negative" : "";

    rowsHtml += `
      <div class="txn-row">
        <div class="txn-num">${toArabicDigits(txnNum)}</div>
        <div class="txn-desc">
          <span class="desc-line" style="font-weight:600;color:var(--navy);">${escapeHtml(entry.description)}</span>
          ${descHtml}
        </div>
        <div class="txn-credit">${credit > 0 ? formatNum(credit) : '<span class="txn-empty">—</span>'}</div>
        <div class="txn-debit">${debit > 0 ? formatNum(debit) : '<span class="txn-empty">—</span>'}</div>
        <div class="txn-bal ${balClass}">${formatNum(runningBalance)}</div>
        <div class="txn-yer ${balClass}">${formatNum(yerBalance, 0)}</div>
      </div>
    `;
  });

  const partnerName = partner?.name || "كشف حساب شامل";
  const periodLabel =
    from && to
      ? `للفترة من ${formatDateArabic(from)} إلى ${formatDateArabic(to)}`
      : `حتى ${formatDateArabic(to || new Date().toISOString())}`;

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<title>كشف حساب - ${escapeHtml(partnerName)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Cairo:wght@300;400;600;700;900&display=swap" rel="stylesheet">
<style>
@page { size: 210mm 297mm; margin: 0; }
:root {
  --navy: #15294b; --navy-deep: #0d1c38; --navy-light: #243b66;
  --gold: #b8964e; --gold-light: #d4b876; --gold-deep: #8a6e34;
  --cream: #faf7f0; --cream-warm: #f5efe1; --paper: #ffffff;
  --ink: #1a1a1a; --ink-soft: #4a4a4a; --line: #d8d2c2; --line-soft: #ebe6d8;
  --credit: #1f6b3a; --credit-bg: #e8f3ec; --debit: #8a2330; --debit-bg: #f6e7e9;
}
* { box-sizing: border-box; }
html, body { margin:0; padding:0; width:210mm; background:var(--cream); color:var(--ink);
  font-family:'Cairo','Amiri',sans-serif; font-size:10pt; line-height:1.5; -webkit-font-smoothing:antialiased; }

.cover { width:210mm; height:297mm;
  background:linear-gradient(160deg,var(--navy-deep) 0%,var(--navy) 60%,var(--navy-light) 100%);
  color:var(--cream); position:relative; overflow:hidden; break-after:page; }
.cover::before { content:""; position:absolute; top:0;right:0;left:0; height:8mm; background:var(--gold); }
.cover::after { content:""; position:absolute; bottom:0;right:0;left:0; height:4mm; background:var(--gold); }
.cover-frame { position:absolute; top:22mm; bottom:18mm; right:18mm; left:18mm;
  border:1.2pt solid var(--gold); padding:14mm 16mm;
  display:flex; flex-direction:column; justify-content:space-between; }
.cover-frame::before { content:""; position:absolute; top:4mm;bottom:4mm;right:4mm;left:4mm;
  border:0.4pt solid rgba(184,150,78,0.4); pointer-events:none; }
.cover-header { text-align:center; }
.cover-eyebrow { font-size:10pt; letter-spacing:4pt; color:var(--gold-light); text-transform:uppercase; margin-bottom:8mm; }
.cover-emblem { width:28mm; height:28mm; margin:0 auto 8mm; border:1.5pt solid var(--gold);
  border-radius:50%; display:flex; align-items:center; justify-content:center;
  background:rgba(184,150,78,0.08); font-family:'Amiri',serif; font-size:24pt; font-weight:700; color:var(--gold-light); }
.cover-title { font-family:'Amiri',serif; font-size:36pt; font-weight:700; color:#fff; line-height:1.2; margin:0 0 6mm; letter-spacing:1pt; }
.cover-subtitle { font-size:14pt; font-weight:300; color:var(--gold-light); letter-spacing:2pt; margin-bottom:4mm; }
.cover-divider { width:50mm; height:1pt; background:var(--gold); margin:6mm auto; position:relative; }
.cover-divider::before, .cover-divider::after { content:""; position:absolute; top:50%;
  width:4mm; height:4mm; background:var(--gold); border-radius:50%; transform:translateY(-50%); }
.cover-divider::before { right:-10mm; }
.cover-divider::after { left:-10mm; }
.cover-meta { display:grid; grid-template-columns:1fr 1fr; gap:6mm; margin-top:12mm; padding:8mm;
  background:rgba(255,255,255,0.05); border:0.5pt solid rgba(184,150,78,0.3); border-radius:2mm; }
.cover-meta-item { text-align:center; }
.cover-meta-label { font-size:8pt; color:var(--gold-light); letter-spacing:1pt; margin-bottom:2mm; text-transform:uppercase; }
.cover-meta-value { font-size:12pt; font-weight:600; color:#fff; }
.cover-footer { text-align:center; font-size:9pt; color:rgba(212,184,118,0.7); letter-spacing:1pt; }
.cover-footer-line { width:30mm; height:0.5pt; background:rgba(184,150,78,0.5); margin:4mm auto; }

.main-content { padding:12mm 14mm 14mm 14mm; background:var(--cream); }
.page-header { display:flex; justify-content:space-between; align-items:center; padding-bottom:4mm; margin-bottom:8mm;
  border-bottom:1.5pt solid var(--navy); position:relative; }
.page-header::after { content:""; position:absolute; bottom:-2pt; right:0;left:0; height:0.5pt; background:var(--gold); }
.page-header-title { font-family:'Amiri',serif; font-size:16pt; font-weight:700; color:var(--navy); }
.page-header-meta { font-size:8pt; color:var(--ink-soft); text-align:left; line-height:1.4; }

.info-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:3mm; margin-bottom:6mm; }
.info-card { background:var(--paper); border:0.5pt solid var(--line); border-top:2pt solid var(--gold); padding:3mm 4mm; }
.info-card-label { font-size:7.5pt; color:var(--ink-soft); margin-bottom:1mm; letter-spacing:0.5pt; }
.info-card-value { font-size:10pt; font-weight:600; color:var(--navy); }

.txn-row { display:grid; grid-template-columns:8mm 1fr 26mm 26mm 28mm 22mm; background:var(--paper);
  border-bottom:0.3pt solid var(--line-soft); break-inside:avoid; align-items:stretch; }
.txn-row:nth-child(even) { background:#fbf9f3; }
.txn-num { background:var(--navy); color:#fff; font-weight:700; font-size:11pt;
  display:flex; align-items:center; justify-content:center; padding:3mm 1mm; }
.txn-desc { padding:2.5mm 3mm; font-size:9pt; line-height:1.5; color:var(--ink); text-align:right; }
.txn-desc .desc-line { display:block; margin-bottom:0.8mm; }
.txn-desc .desc-line:last-child { margin-bottom:0; }
.txn-desc .desc-amount { color:var(--navy); font-weight:700; display:inline-block; min-width:8mm; }
.txn-desc .desc-label { color:var(--ink-soft); }
.txn-credit, .txn-debit, .txn-bal, .txn-yer { padding:2.5mm 1.5mm; text-align:center;
  font-size:9.5pt; display:flex; flex-direction:column; justify-content:center; align-items:center; }
.txn-credit { color:var(--credit); font-weight:600; background:var(--credit-bg); }
.txn-debit { color:var(--debit); font-weight:600; background:var(--debit-bg); }
.txn-bal { color:var(--navy); font-weight:700; }
.txn-bal.negative { color:var(--debit); background:var(--debit-bg); }
.txn-yer { color:var(--ink-soft); font-size:8pt; }
.txn-yer.negative { color:var(--debit); font-weight:600; }
.txn-empty { color:var(--ink-soft); opacity:0.3; font-weight:400; }

.txn-header { display:grid; grid-template-columns:8mm 1fr 26mm 26mm 28mm 22mm;
  background:var(--navy); color:#fff; font-size:8.5pt; font-weight:600; }
.txn-header > div { padding:3mm 1.5mm; text-align:center; border-left:0.5pt solid var(--navy-light); }
.txn-header > div:first-child { border-left:none; }
.txn-header > div:nth-child(2) { text-align:right; padding-right:3mm; }

.account-card { background:var(--paper); border:0.5pt solid var(--line); margin-bottom:6mm; break-inside:avoid-page; }
.account-card-header { background:var(--cream-warm); padding:4mm 6mm; border-bottom:1pt solid var(--gold);
  display:flex; justify-content:space-between; align-items:center; }
.account-name { font-family:'Amiri',serif; font-size:13pt; font-weight:700; color:var(--navy); }
.account-name-icon { display:inline-block; width:6mm; height:6mm; background:var(--navy); color:var(--gold);
  border-radius:50%; text-align:center; line-height:6mm; font-size:9pt; font-weight:700; margin-left:3mm; vertical-align:middle; }
.account-meta { font-size:8.5pt; color:var(--ink-soft); text-align:left; }
.account-meta strong { color:var(--navy); font-weight:600; }

.account-subtotal { background:var(--cream-warm); padding:4mm 6mm; border-top:1.5pt solid var(--navy);
  display:grid; grid-template-columns:repeat(3,1fr); gap:4mm; }
.subtotal-item { text-align:center; }
.subtotal-label { font-size:8pt; color:var(--ink-soft); margin-bottom:1mm; }
.subtotal-value { font-size:12pt; font-weight:700; color:var(--navy); }
.subtotal-value.credit { color:var(--credit); }
.subtotal-value.debit { color:var(--debit); }
.subtotal-value .yer-eq { display:block; font-size:8pt; font-weight:400; color:var(--ink-soft); margin-top:1mm; }

.doc-footer { margin-top:8mm; padding-top:4mm; border-top:1pt solid var(--line);
  display:flex; justify-content:space-between; font-size:8pt; color:var(--ink-soft); }
.doc-footer-stamp { text-align:center; margin-top:6mm; padding:4mm; border:1pt dashed var(--gold);
  font-family:'Amiri',serif; font-size:10pt; color:var(--gold-deep); background:rgba(184,150,78,0.05); }
</style>
</head>
<body>
<div class="cover">
  <div class="cover-frame">
    <div class="cover-header">
      <div class="cover-eyebrow">STATEMENT OF ACCOUNT</div>
      <div class="cover-emblem">ح</div>
      <div class="cover-title">كشف حساب</div>
      <div class="cover-subtitle">${escapeHtml(partnerName)}</div>
      <div class="cover-divider"></div>
      <div style="font-size:10pt;color:#d4b876;letter-spacing:2pt;">${escapeHtml(companyName)}</div>
    </div>
    <div class="cover-meta">
      <div class="cover-meta-item"><div class="cover-meta-label">تاريخ الإصدار</div>
        <div class="cover-meta-value">${formatDateArabic(new Date().toISOString())}</div></div>
      <div class="cover-meta-item"><div class="cover-meta-label">رقم المرجع</div>
        <div class="cover-meta-value">${statementNumber}</div></div>
      <div class="cover-meta-item"><div class="cover-meta-label">العملة الأساسية</div>
        <div class="cover-meta-value">ريال سعودي (ر.س)</div></div>
      <div class="cover-meta-item"><div class="cover-meta-label">سعر الصرف (ر.ي)</div>
        <div class="cover-meta-value">${toArabicDigits(formatNum(exchangeRate, 1))}</div></div>
    </div>
    <div class="cover-footer">
      <div>${escapeHtml(periodLabel)}</div>
      <div class="cover-footer-line"></div>
      <div style="font-size:8pt;opacity:0.6;">CONFIDENTIAL · للاستخدام الداخلي</div>
    </div>
  </div>
</div>

<div class="main-content">
  <div class="page-header">
    <div class="page-header-title">كشف حساب — ${escapeHtml(partnerName)}</div>
    <div class="page-header-meta">
      تاريخ الإصدار: ${formatDateArabic(new Date().toISOString())}<br>
      رقم المرجع: ${statementNumber}<br>
      عملة الكشف: ريال سعودي (ر.س)
    </div>
  </div>

  <div class="info-grid">
    <div class="info-card"><div class="info-card-label">اسم</div>
      <div class="info-card-value">${escapeHtml(partnerName)}</div></div>
    <div class="info-card"><div class="info-card-label">فترة الكشف</div>
      <div class="info-card-value">${escapeHtml(periodLabel)}</div></div>
    <div class="info-card"><div class="info-card-label">عدد المعاملات</div>
      <div class="info-card-value">${toArabicDigits(entries.length)} معاملة</div></div>
    <div class="info-card"><div class="info-card-label">سعر الصرف</div>
      <div class="info-card-value">${toArabicDigits(formatNum(exchangeRate, 1))} ر.ي</div></div>
  </div>

  <div class="account-card">
    <div class="account-card-header">
      <div class="account-name"><span class="account-name-icon">ح</span>${escapeHtml(partnerName)}</div>
      <div class="account-meta">العملة: <strong>ريال سعودي</strong> · عدد المعاملات: <strong>${toArabicDigits(entries.length)} معاملة</strong></div>
    </div>

    <div class="txn-header">
      <div>م</div><div>البيان</div><div>دائن ر.س</div><div>مدين ر.س</div><div>الرصيد ر.س</div><div>الرصيد ر.ي</div>
    </div>

    ${rowsHtml || '<div style="padding:20mm;text-align:center;color:var(--ink-soft);">لا توجد معاملات في هذه الفترة</div>'}

    <div class="account-subtotal">
      <div class="subtotal-item">
        <div class="subtotal-label">إجمالي الإيداعات (دائن)</div>
        <div class="subtotal-value credit">${formatNum(totalCredit)} ر.س<span class="yer-eq">≈ ${formatNum(totalCredit * exchangeRate, 0)} ر.ي</span></div>
      </div>
      <div class="subtotal-item">
        <div class="subtotal-label">إجمالي السحوبات (مدين)</div>
        <div class="subtotal-value debit">${formatNum(totalDebit)} ر.س<span class="yer-eq">≈ ${formatNum(totalDebit * exchangeRate, 0)} ر.ي</span></div>
      </div>
      <div class="subtotal-item">
        <div class="subtotal-label">الرصيد الختامي</div>
        <div class="subtotal-value ${runningBalance < 0 ? "debit" : ""}">${formatNum(runningBalance)} ر.س<span class="yer-eq">≈ ${formatNum(runningBalance * exchangeRate, 0)} ر.ي</span></div>
      </div>
    </div>
  </div>

  <div class="doc-footer">
    <div>مراجعة وإعداد: قسم المحاسبة<br>تاريخ الإصدار: ${formatDateArabic(new Date().toISOString())}</div>
    <div style="text-align:left;">رقم المرجع: ${statementNumber}<br>نهاية الكشف</div>
  </div>
  <div class="doc-footer-stamp">معتمد — قسم المحاسبة</div>
</div>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function toArabicDigits(input: string | number): string {
  return String(input).replace(/[0-9]/g, (d) => "٠١٢٣٤٥٦٧٨٩"[parseInt(d)]);
}

function formatDateArabic(dateStr: string): string {
  const d = new Date(dateStr);
  try {
    return d.toLocaleDateString("ar-SA-u-ca-gregory", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return d.toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" });
  }
}
