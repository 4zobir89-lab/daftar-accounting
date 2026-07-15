import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Trial balance, Income statement, Balance sheet — all in one endpoint
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const reportType = searchParams.get("type") || "trial-balance";
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const where: Record<string, unknown> = {};
    if (from || to) {
      where.date = {};
      if (from) (where.date as Record<string, unknown>).gte = new Date(from);
      if (to) (where.date as Record<string, unknown>).lte = new Date(to);
    }

    const entries = await db.journalEntry.findMany({
      where,
      include: { lines: { include: { account: true } } },
    });

    const accounts = await db.account.findMany({
      where: { isGroup: false },
      orderBy: { code: "asc" },
    });

    // Build per-account totals
    const accountBalances = new Map<
      string,
      { account: { id: string; code: string; name: string; type: string }; debit: number; credit: number }
    >();

    for (const acc of accounts) {
      accountBalances.set(acc.id, {
        account: { id: acc.id, code: acc.code, name: acc.name, type: acc.type },
        debit: 0,
        credit: 0,
      });
    }

    for (const entry of entries) {
      for (const line of entry.lines) {
        const bal = accountBalances.get(line.accountId);
        if (bal) {
          bal.debit += Number(line.debit) || 0;
          bal.credit += Number(line.credit) || 0;
        }
      }
    }

    if (reportType === "trial-balance") {
      const rows = Array.from(accountBalances.values())
        .filter((r) => r.debit !== 0 || r.credit !== 0)
        .map((r) => {
          // For ASSET/EXPENSE: balance = debit - credit (show as debit if positive)
          // For LIABILITY/EQUITY/REVENUE: balance = credit - debit (show as credit if positive)
          const isDebitType = r.account.type === "ASSET" || r.account.type === "EXPENSE";
          const net = r.debit - r.credit;
          return {
            ...r,
            net,
            debitBalance: isDebitType ? Math.max(0, net) : 0,
            creditBalance: !isDebitType ? Math.max(0, -net) : 0,
          };
        });

      const totalDebit = rows.reduce((s, r) => s + r.debitBalance, 0);
      const totalCredit = rows.reduce((s, r) => s + r.creditBalance, 0);

      return NextResponse.json({
        type: "trial-balance",
        from,
        to,
        rows,
        totals: { debit: totalDebit, credit: totalCredit, diff: totalDebit - totalCredit },
      });
    }

    if (reportType === "income-statement") {
      const revenueRows = Array.from(accountBalances.values())
        .filter((r) => r.account.type === "REVENUE")
        .map((r) => ({ ...r, balance: r.credit - r.debit }));
      const expenseRows = Array.from(accountBalances.values())
        .filter((r) => r.account.type === "EXPENSE")
        .map((r) => ({ ...r, balance: r.debit - r.credit }));

      const totalRevenue = revenueRows.reduce((s, r) => s + r.balance, 0);
      const totalExpenses = expenseRows.reduce((s, r) => s + r.balance, 0);
      const netIncome = totalRevenue - totalExpenses;

      return NextResponse.json({
        type: "income-statement",
        from,
        to,
        revenue: revenueRows,
        expenses: expenseRows,
        totals: { revenue: totalRevenue, expenses: totalExpenses, netIncome },
      });
    }

    if (reportType === "balance-sheet") {
      const assetRows = Array.from(accountBalances.values())
        .filter((r) => r.account.type === "ASSET")
        .map((r) => ({ ...r, balance: r.debit - r.credit }));
      const liabilityRows = Array.from(accountBalances.values())
        .filter((r) => r.account.type === "LIABILITY")
        .map((r) => ({ ...r, balance: r.credit - r.debit }));
      const equityRows = Array.from(accountBalances.values())
        .filter((r) => r.account.type === "EQUITY")
        .map((r) => ({ ...r, balance: r.credit - r.debit }));

      // Add net income to equity
      const totalRevenue = Array.from(accountBalances.values())
        .filter((r) => r.account.type === "REVENUE")
        .reduce((s, r) => s + (r.credit - r.debit), 0);
      const totalExpenses = Array.from(accountBalances.values())
        .filter((r) => r.account.type === "EXPENSE")
        .reduce((s, r) => s + (r.debit - r.credit), 0);
      const netIncome = totalRevenue - totalExpenses;

      const totalAssets = assetRows.reduce((s, r) => s + r.balance, 0);
      const totalLiabilities = liabilityRows.reduce((s, r) => s + r.balance, 0);
      const totalEquity = equityRows.reduce((s, r) => s + r.balance, 0) + netIncome;

      return NextResponse.json({
        type: "balance-sheet",
        from,
        to,
        assets: assetRows,
        liabilities: liabilityRows,
        equity: equityRows,
        netIncome,
        totals: {
          assets: totalAssets,
          liabilities: totalLiabilities,
          equity: totalEquity,
          liabilitiesPlusEquity: totalLiabilities + totalEquity,
          diff: totalAssets - (totalLiabilities + totalEquity),
        },
      });
    }

    return NextResponse.json({ error: "نوع تقرير غير معروف" }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
