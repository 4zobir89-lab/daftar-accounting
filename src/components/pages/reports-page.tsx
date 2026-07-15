"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileBarChart, Calendar, TrendingUp, TrendingDown, Scale } from "lucide-react";
import { formatMoney, ACCOUNT_TYPE_LABELS, formatArabicDate, todayISO } from "@/lib/accounting-utils";

type ReportType = "trial-balance" | "income-statement" | "balance-sheet";

export function ReportsPage() {
  const [reportType, setReportType] = useState<ReportType>("trial-balance");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState(todayISO());
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("type", reportType);
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      const res = await fetch(`/api/reports?${params}`);
      const data = await res.json();
      setReport(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div>
        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-primary">
          التقارير المحاسبية
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          ميزان المراجعة، قائمة الدخل، الميزانية العمومية
        </p>
      </div>

      {/* Report selector */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <Label>نوع التقرير</Label>
              <Select value={reportType} onValueChange={(v) => setReportType(v as ReportType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="trial-balance">ميزان المراجعة</SelectItem>
                  <SelectItem value="income-statement">قائمة الدخل</SelectItem>
                  <SelectItem value="balance-sheet">الميزانية العمومية</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>من تاريخ</Label>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div>
              <Label>إلى تاريخ</Label>
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
            <div className="flex items-end">
              <Button onClick={runReport} disabled={loading} className="w-full">
                <FileBarChart className="w-4 h-4 ml-2" />
                {loading ? "جارٍ..." : "عرض التقرير"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report display */}
      {report && (
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-xl text-primary">
              {report.type === "trial-balance" && "ميزان المراجعة"}
              {report.type === "income-statement" && "قائمة الدخل"}
              {report.type === "balance-sheet" && "الميزانية العمومية"}
              <span className="text-sm font-normal text-muted-foreground mr-3">
                {report.from ? `من ${formatArabicDate(report.from)}` : ""} {report.to ? `إلى ${formatArabicDate(report.to)}` : ""}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {report.type === "trial-balance" && <TrialBalanceView report={report} />}
            {report.type === "income-statement" && <IncomeStatementView report={report} />}
            {report.type === "balance-sheet" && <BalanceSheetView report={report} />}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function TrialBalanceView({ report }: { report: any }) {
  return (
    <div className="overflow-x-auto">
      <table className="banking-table">
        <thead>
          <tr>
            <th className="text-right">الكود</th>
            <th className="text-right">اسم الحساب</th>
            <th>النوع</th>
            <th>مدين</th>
            <th>دائن</th>
          </tr>
        </thead>
        <tbody>
          {report.rows.map((row: any, i: number) => (
            <tr key={i}>
              <td className="font-num text-xs">{row.account.code}</td>
              <td>{row.account.name}</td>
              <td className="text-center text-xs">
                <Badge variant="outline">{ACCOUNT_TYPE_LABELS[row.account.type]}</Badge>
              </td>
              <td className="text-center font-num">
                {row.debitBalance > 0 ? formatMoney(row.debitBalance) : "—"}
              </td>
              <td className="text-center font-num">
                {row.creditBalance > 0 ? formatMoney(row.creditBalance) : "—"}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot className="bg-[var(--cream-warm)] font-bold">
          <tr>
            <td colSpan={3} className="text-left">الإجمالي</td>
            <td className="text-center font-num text-[var(--debit)]">
              {formatMoney(report.totals.debit)}
            </td>
            <td className="text-center font-num text-[var(--credit)]">
              {formatMoney(report.totals.credit)}
            </td>
          </tr>
          <tr>
            <td colSpan={5} className="text-center">
              {Math.abs(report.totals.diff) < 0.01 ? (
                <span className="text-[var(--credit)]">✓ ميزان المراجعة متوازن</span>
              ) : (
                <span className="text-[var(--debit)]">
                  الفرق: {formatMoney(report.totals.diff)}
                </span>
              )}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function IncomeStatementView({ report }: { report: any }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-serif text-lg text-[var(--credit)] mb-2 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" /> الإيرادات
        </h3>
        <table className="banking-table">
          <thead>
            <tr><th className="text-right">الكود</th><th className="text-right">الحساب</th><th>المبلغ</th></tr>
          </thead>
          <tbody>
            {report.revenue.map((r: any, i: number) => (
              <tr key={i}>
                <td className="font-num text-xs">{r.account.code}</td>
                <td>{r.account.name}</td>
                <td className="text-center font-num text-[var(--credit)]">{formatMoney(r.balance)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-[var(--cream-warm)] font-bold">
            <tr><td colSpan={2} className="text-left">إجمالي الإيرادات</td>
              <td className="text-center font-num text-[var(--credit)]">{formatMoney(report.totals.revenue)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div>
        <h3 className="font-serif text-lg text-[var(--debit)] mb-2 flex items-center gap-2">
          <TrendingDown className="w-5 h-5" /> المصروفات
        </h3>
        <table className="banking-table">
          <thead>
            <tr><th className="text-right">الكود</th><th className="text-right">الحساب</th><th>المبلغ</th></tr>
          </thead>
          <tbody>
            {report.expenses.map((r: any, i: number) => (
              <tr key={i}>
                <td className="font-num text-xs">{r.account.code}</td>
                <td>{r.account.name}</td>
                <td className="text-center font-num text-[var(--debit)]">{formatMoney(r.balance)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-[var(--cream-warm)] font-bold">
            <tr><td colSpan={2} className="text-left">إجمالي المصروفات</td>
              <td className="text-center font-num text-[var(--debit)]">{formatMoney(report.totals.expenses)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <Card className={`border-2 ${report.totals.netIncome >= 0 ? "border-[var(--credit)]" : "border-[var(--debit)]"}`}>
        <CardContent className="p-5 text-center">
          <p className="text-sm text-muted-foreground mb-1">صافي الدخل</p>
          <p className={`text-3xl font-bold font-num ${report.totals.netIncome >= 0 ? "text-[var(--credit)]" : "text-[var(--debit)]"}`}>
            {formatMoney(report.totals.netIncome)}
          </p>
          <p className="text-xs mt-1">
            {report.totals.netIncome >= 0 ? "ربح" : "خسارة"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function BalanceSheetView({ report }: { report: any }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-serif text-lg text-primary mb-2">الأصول</h3>
        <table className="banking-table">
          <thead><tr><th className="text-right">الكود</th><th className="text-right">الحساب</th><th>المبلغ</th></tr></thead>
          <tbody>
            {report.assets.map((r: any, i: number) => (
              <tr key={i}>
                <td className="font-num text-xs">{r.account.code}</td>
                <td>{r.account.name}</td>
                <td className="text-center font-num">{formatMoney(r.balance)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-[var(--cream-warm)] font-bold">
            <tr><td colSpan={2} className="text-left">إجمالي الأصول</td>
              <td className="text-center font-num">{formatMoney(report.totals.assets)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div>
        <h3 className="font-serif text-lg text-[var(--debit)] mb-2">الخصوم</h3>
        <table className="banking-table">
          <thead><tr><th className="text-right">الكود</th><th className="text-right">الحساب</th><th>المبلغ</th></tr></thead>
          <tbody>
            {report.liabilities.map((r: any, i: number) => (
              <tr key={i}>
                <td className="font-num text-xs">{r.account.code}</td>
                <td>{r.account.name}</td>
                <td className="text-center font-num">{formatMoney(r.balance)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-[var(--cream-warm)] font-bold">
            <tr><td colSpan={2} className="text-left">إجمالي الخصوم</td>
              <td className="text-center font-num">{formatMoney(report.totals.liabilities)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div>
        <h3 className="font-serif text-lg text-[var(--gold-deep)] mb-2">حقوق الملكية</h3>
        <table className="banking-table">
          <thead><tr><th className="text-right">الكود</th><th className="text-right">الحساب</th><th>المبلغ</th></tr></thead>
          <tbody>
            {report.equity.map((r: any, i: number) => (
              <tr key={i}>
                <td className="font-num text-xs">{r.account.code}</td>
                <td>{r.account.name}</td>
                <td className="text-center font-num">{formatMoney(r.balance)}</td>
              </tr>
            ))}
            <tr className="border-t-2 border-primary">
              <td className="font-num text-xs"></td>
              <td className="font-semibold">صافي الدخل (من قائمة الدخل)</td>
              <td className="text-center font-num font-semibold">{formatMoney(report.netIncome)}</td>
            </tr>
          </tbody>
          <tfoot className="bg-[var(--cream-warm)] font-bold">
            <tr><td colSpan={2} className="text-left">إجمالي حقوق الملكية</td>
              <td className="text-center font-num">{formatMoney(report.totals.equity)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <Card className={`border-2 ${Math.abs(report.totals.diff) < 0.01 ? "border-[var(--credit)]" : "border-[var(--debit)]"}`}>
        <CardContent className="p-5">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-sm text-muted-foreground mb-1">إجمالي الأصول</p>
              <p className="text-2xl font-bold font-num">{formatMoney(report.totals.assets)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">إجمالي الخصوم + حقوق الملكية</p>
              <p className="text-2xl font-bold font-num">{formatMoney(report.totals.liabilitiesPlusEquity)}</p>
            </div>
          </div>
          <div className="mt-4 text-center">
            {Math.abs(report.totals.diff) < 0.01 ? (
              <span className="text-[var(--credit)] font-bold">✓ الميزانية متوازنة</span>
            ) : (
              <span className="text-[var(--debit)] font-bold">
                فرق: {formatMoney(report.totals.diff)}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Lazy import to avoid circular deps
import { Badge } from "@/components/ui/badge";
