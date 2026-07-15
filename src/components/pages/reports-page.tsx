"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileBarChart,
  TrendingUp,
  TrendingDown,
  Scale,
  Calendar,
  Wallet,
  PieChart as PieChartIcon,
  BarChart3,
  FileText,
  Download,
  Sparkles,
} from "lucide-react";
import { formatMoney, ACCOUNT_TYPE_LABELS, formatArabicDate, todayISO } from "@/lib/accounting-utils";
import { cn } from "@/lib/utils";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

type ReportType = "trial-balance" | "income-statement" | "balance-sheet";

const REPORT_INFO: Record<ReportType, { title: string; description: string; icon: any; gradient: string }> = {
  "trial-balance": {
    title: "ميزان المراجعة",
    description: "تحقق توازن القيود المحاسبية",
    icon: Scale,
    gradient: "from-navy to-navy-light",
  },
  "income-statement": {
    title: "قائمة الدخل",
    description: "الإيرادات والمصروفات وصافي الدخل",
    icon: TrendingUp,
    gradient: "from-emerald to-emerald-600",
  },
  "balance-sheet": {
    title: "الميزانية العمومية",
    description: "الأصول، الخصوم، وحقوق الملكية",
    icon: Wallet,
    gradient: "from-gold to-gold-dark",
  },
};

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
    <div className="p-4 sm:p-6 lg:p-8 space-y-5 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="stagger-item">
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
          التقارير المالية
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          ميزان المراجعة · قائمة الدخل · الميزانية العمومية
        </p>
      </div>

      {/* Report cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 stagger-item" style={{ animationDelay: "80ms" }}>
        {(Object.keys(REPORT_INFO) as ReportType[]).map((key) => {
          const info = REPORT_INFO[key];
          const Icon = info.icon;
          const isActive = reportType === key;
          return (
            <Card
              key={key}
              className={cn(
                "cursor-pointer transition-all duration-300 overflow-hidden",
                isActive ? "ring-2 ring-primary shadow-lg" : "hover:shadow-md"
              )}
              onClick={() => setReportType(key)}
            >
              <CardContent className="p-5">
                <div className={cn("w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center mb-3", info.gradient)}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="font-display font-bold text-lg">{info.title}</div>
                <div className="text-xs text-muted-foreground mt-1">{info.description}</div>
                {isActive && (
                  <div className="mt-3 flex items-center gap-1 text-xs text-primary font-medium">
                    <Sparkles className="w-3 h-3" />
                    محدد
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <Card className="stagger-item" style={{ animationDelay: "160ms" }}>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
            <div>
              <Label className="text-xs">من تاريخ</Label>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">إلى تاريخ</Label>
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <Button onClick={runReport} disabled={loading} className="w-full btn-premium">
                <FileBarChart className="w-4 h-4 ml-2" />
                {loading ? "جارٍ التحضير..." : "عرض التقرير"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report display */}
      {report && (
        <Card className="overflow-hidden stagger-item" style={{ animationDelay: "240ms" }}>
          <CardHeader className="bg-gradient-to-l from-primary/5 to-transparent border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="font-display text-xl flex items-center gap-2">
                  {REPORT_INFO[reportType as ReportType].title}
                  {report.totals && report.totals.diff !== undefined && Math.abs(report.totals.diff) < 0.01 && (
                    <Badge className="bg-emerald text-white border-0">
                      <Scale className="w-3 h-3 ml-1" />
                      متوازن
                    </Badge>
                  )}
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  {report.from ? `من ${formatArabicDate(report.from)}` : "من البداية"} {report.to && `إلى ${formatArabicDate(report.to)}`}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => window.print()}>
                <Download className="w-4 h-4 ml-2" />
                تصدير
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
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
  const chartData = report.rows.slice(0, 10).map((r: any) => ({
    name: r.account.name.substring(0, 20),
    debit: r.debitBalance,
    credit: r.creditBalance,
  }));

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Chart */}
      {chartData.length > 0 && (
        <div className="bg-muted/30 rounded-xl p-4">
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-gold" />
            رسم بياني لأرصدة الحسابات
          </h4>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
              <XAxis type="number" stroke="#94a3b8" fontSize={10} tickFormatter={(v) => v >= 1000 ? `${v/1000}k` : v} />
              <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={10} width={120} />
              <Tooltip
                contentStyle={{ background: "rgba(255,255,255,0.95)", border: "1px solid rgba(0,0,0,0.1)", borderRadius: "12px" }}
                formatter={(v: number) => formatMoney(v)}
              />
              <Bar dataKey="debit" fill="#b91c1c" name="مدين" radius={[0, 4, 4, 0]} />
              <Bar dataKey="credit" fill="#047857" name="دائن" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="table-premium">
          <thead>
            <tr>
              <th>الكود</th>
              <th>اسم الحساب</th>
              <th className="text-center">النوع</th>
              <th className="text-center">مدين</th>
              <th className="text-center">دائن</th>
            </tr>
          </thead>
          <tbody>
            {report.rows.map((row: any, i: number) => (
              <tr key={i}>
                <td className="font-mono text-xs">{row.account.code}</td>
                <td className="font-medium">{row.account.name}</td>
                <td className="text-center">
                  <Badge variant="outline" className="text-[10px]">{ACCOUNT_TYPE_LABELS[row.account.type]}</Badge>
                </td>
                <td className="text-center font-mono tabular-nums">
                  {row.debitBalance > 0 ? (
                    <span className="text-crimson">{formatMoney(row.debitBalance)}</span>
                  ) : "—"}
                </td>
                <td className="text-center font-mono tabular-nums">
                  {row.creditBalance > 0 ? (
                    <span className="text-emerald">{formatMoney(row.creditBalance)}</span>
                  ) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-muted/50 font-bold border-t-2 border-primary">
            <tr>
              <td colSpan={3} className="p-3 text-left text-xs uppercase tracking-wider">الإجمالي</td>
              <td className="p-3 text-center text-crimson font-mono tabular-nums">{formatMoney(report.totals.debit)}</td>
              <td className="p-3 text-center text-emerald font-mono tabular-nums">{formatMoney(report.totals.credit)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className={cn(
        "p-4 rounded-xl text-center font-semibold",
        Math.abs(report.totals.diff) < 0.01 ? "bg-emerald/10 text-emerald" : "bg-crimson/10 text-crimson"
      )}>
        {Math.abs(report.totals.diff) < 0.01
          ? "✓ ميزان المراجعة متوازن تماماً"
          : `الفرق: ${formatMoney(report.totals.diff)}`}
      </div>
    </div>
  );
}

function IncomeStatementView({ report }: { report: any }) {
  const chartData = [
    { name: "الإيرادات", value: report.totals.revenue, color: "#047857" },
    { name: "المصروفات", value: report.totals.expenses, color: "#b91c1c" },
    { name: "صافي الدخل", value: Math.abs(report.totals.netIncome), color: report.totals.netIncome >= 0 ? "#0a1f44" : "#b91c1c" },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl gradient-card-emerald">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-6 h-6" />
            <span className="text-xs">الإيرادات</span>
          </div>
          <div className="text-xl font-bold tabular-nums">{formatMoney(report.totals.revenue)}</div>
        </div>
        <div className="p-4 rounded-xl gradient-card-crimson">
          <div className="flex items-center justify-between mb-2">
            <TrendingDown className="w-6 h-6" />
            <span className="text-xs">المصروفات</span>
          </div>
          <div className="text-xl font-bold tabular-nums">{formatMoney(report.totals.expenses)}</div>
        </div>
        <div className={cn("p-4 rounded-xl", report.totals.netIncome >= 0 ? "gradient-card-navy" : "gradient-card-crimson")}>
          <div className="flex items-center justify-between mb-2">
            <Wallet className="w-6 h-6" />
            <span className="text-xs">صافي الدخل</span>
          </div>
          <div className="text-xl font-bold tabular-nums">{formatMoney(report.totals.netIncome)}</div>
          <div className="text-xs mt-1 opacity-80">
            {report.totals.netIncome >= 0 ? "ربح" : "خسارة"}
          </div>
        </div>
      </div>

      {/* Revenue table */}
      <div>
        <h4 className="font-display font-bold text-lg mb-2 flex items-center gap-2 text-emerald">
          <TrendingUp className="w-5 h-5" />
          الإيرادات
        </h4>
        <div className="border border-border rounded-xl overflow-hidden">
          <table className="table-premium">
            <thead><tr><th>الكود</th><th>الحساب</th><th className="text-center">المبلغ</th></tr></thead>
            <tbody>
              {report.revenue.map((r: any, i: number) => (
                <tr key={i}>
                  <td className="font-mono text-xs">{r.account.code}</td>
                  <td>{r.account.name}</td>
                  <td className="text-center text-emerald font-mono tabular-nums">{formatMoney(r.balance)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-emerald/10 font-bold">
              <tr><td colSpan={2} className="p-3 text-left">إجمالي الإيرادات</td><td className="p-3 text-center text-emerald font-mono tabular-nums">{formatMoney(report.totals.revenue)}</td></tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Expenses table */}
      <div>
        <h4 className="font-display font-bold text-lg mb-2 flex items-center gap-2 text-crimson">
          <TrendingDown className="w-5 h-5" />
          المصروفات
        </h4>
        <div className="border border-border rounded-xl overflow-hidden">
          <table className="table-premium">
            <thead><tr><th>الكود</th><th>الحساب</th><th className="text-center">المبلغ</th></tr></thead>
            <tbody>
              {report.expenses.map((r: any, i: number) => (
                <tr key={i}>
                  <td className="font-mono text-xs">{r.account.code}</td>
                  <td>{r.account.name}</td>
                  <td className="text-center text-crimson font-mono tabular-nums">{formatMoney(r.balance)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-crimson/10 font-bold">
              <tr><td colSpan={2} className="p-3 text-left">إجمالي المصروفات</td><td className="p-3 text-center text-crimson font-mono tabular-nums">{formatMoney(report.totals.expenses)}</td></tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

function BalanceSheetView({ report }: { report: any }) {
  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assets */}
        <div>
          <h4 className="font-display font-bold text-lg mb-2 flex items-center gap-2 text-navy">
            <Wallet className="w-5 h-5" />
            الأصول
          </h4>
          <div className="border border-border rounded-xl overflow-hidden">
            <table className="table-premium">
              <thead><tr><th>الحساب</th><th className="text-center">المبلغ</th></tr></thead>
              <tbody>
                {report.assets.map((r: any, i: number) => (
                  <tr key={i}>
                    <td>{r.account.name}</td>
                    <td className="text-center font-mono tabular-nums">{formatMoney(r.balance)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-navy/10 font-bold">
                <tr><td className="p-3 text-left">إجمالي الأصول</td><td className="p-3 text-center text-navy font-mono tabular-nums">{formatMoney(report.totals.assets)}</td></tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Liabilities + Equity */}
        <div className="space-y-4">
          <div>
            <h4 className="font-display font-bold text-lg mb-2 flex items-center gap-2 text-crimson">
              <Scale className="w-5 h-5" />
              الخصوم
            </h4>
            <div className="border border-border rounded-xl overflow-hidden">
              <table className="table-premium">
                <thead><tr><th>الحساب</th><th className="text-center">المبلغ</th></tr></thead>
                <tbody>
                  {report.liabilities.map((r: any, i: number) => (
                    <tr key={i}>
                      <td>{r.account.name}</td>
                      <td className="text-center font-mono tabular-nums">{formatMoney(r.balance)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-crimson/10 font-bold">
                  <tr><td className="p-3 text-left">إجمالي الخصوم</td><td className="p-3 text-center text-crimson font-mono tabular-nums">{formatMoney(report.totals.liabilities)}</td></tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div>
            <h4 className="font-display font-bold text-lg mb-2 flex items-center gap-2 text-gold-dark">
              <PieChartIcon className="w-5 h-5" />
              حقوق الملكية
            </h4>
            <div className="border border-border rounded-xl overflow-hidden">
              <table className="table-premium">
                <thead><tr><th>الحساب</th><th className="text-center">المبلغ</th></tr></thead>
                <tbody>
                  {report.equity.map((r: any, i: number) => (
                    <tr key={i}>
                      <td>{r.account.name}</td>
                      <td className="text-center font-mono tabular-nums">{formatMoney(r.balance)}</td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-primary">
                    <td className="font-semibold">صافي الدخل</td>
                    <td className="text-center font-mono tabular-nums font-semibold">{formatMoney(report.netIncome)}</td>
                  </tr>
                </tbody>
                <tfoot className="bg-gold/10 font-bold">
                  <tr><td className="p-3 text-left">إجمالي حقوق الملكية</td><td className="p-3 text-center text-gold-dark font-mono tabular-nums">{formatMoney(report.totals.equity)}</td></tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Balance check */}
      <div className={cn(
        "p-5 rounded-xl text-center",
        Math.abs(report.totals.diff) < 0.01 ? "bg-emerald/10" : "bg-crimson/10"
      )}>
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div>
            <div className="text-xs text-muted-foreground mb-1">إجمالي الأصول</div>
            <div className="text-2xl font-bold tabular-nums">{formatMoney(report.totals.assets)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">إجمالي الخصوم + حقوق الملكية</div>
            <div className="text-2xl font-bold tabular-nums">{formatMoney(report.totals.liabilitiesPlusEquity)}</div>
          </div>
        </div>
        <div className={cn(
          "inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold",
          Math.abs(report.totals.diff) < 0.01 ? "bg-emerald text-white" : "bg-crimson text-white"
        )}>
          <Scale className="w-4 h-4" />
          {Math.abs(report.totals.diff) < 0.01
            ? "الميزانية متوازنة"
            : `الفرق: ${formatMoney(report.totals.diff)}`}
        </div>
      </div>
    </div>
  );
}
