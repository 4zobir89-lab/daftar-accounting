"use client";

import { useApp } from "@/components/app-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatMoney, formatArabicDate, ACCOUNT_TYPE_LABELS } from "@/lib/accounting-utils";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Receipt,
  ArrowLeftRight,
  AlertTriangle,
  FileBarChart,
  BookOpen,
  Sparkles,
} from "lucide-react";
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
  Area,
  AreaChart,
} from "recharts";

type PageKey = "dashboard" | "journal" | "accounts" | "partners" | "reports" | "currencies" | "backup";

export function Dashboard({ onNavigate }: { onNavigate: (p: PageKey) => void }) {
  const { entries, accounts, partners, currencies, formatMoney, settings, refreshAll } = useApp();

  // Compute stats
  const totalCredits = entries.reduce((s, e) => s + e.totalCredit, 0);
  const totalDebits = entries.reduce((s, e) => s + e.totalDebit, 0);
  const netBalance = totalCredits - totalDebits;

  // Last 30 days activity
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentEntries = entries.filter((e) => new Date(e.date) >= thirtyDaysAgo);
  const recentTotal = recentEntries.reduce((s, e) => s + e.totalCredit + e.totalDebit, 0);

  // Chart data: activity by day (last 14 days)
  const chartData = (() => {
    const days: Array<{ date: string; credit: number; debit: number; label: string }> = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayStr = d.toISOString().split("T")[0];
      const dayEntries = entries.filter((e) => e.date.split("T")[0] === dayStr);
      days.push({
        date: dayStr,
        label: d.toLocaleDateString("ar-SA-u-ca-gregory", { day: "numeric", month: "numeric" }),
        credit: dayEntries.reduce((s, e) => s + e.totalCredit, 0),
        debit: dayEntries.reduce((s, e) => s + e.totalDebit, 0),
      });
    }
    return days;
  })();

  // Account distribution by type
  const accountTypeData = (() => {
    const counts = new Map<string, number>();
    accounts.forEach((a) => {
      if (!a.isGroup) {
        counts.set(a.type, (counts.get(a.type) || 0) + 1);
      }
    });
    const colors: Record<string, string> = {
      ASSET: "#15294b",
      LIABILITY: "#8a2330",
      EQUITY: "#b8964e",
      REVENUE: "#1f6b3a",
      EXPENSE: "#243b66",
    };
    return Array.from(counts.entries()).map(([type, value]) => ({
      name: ACCOUNT_TYPE_LABELS[type] || type,
      value,
      color: colors[type] || "#999",
    }));
  })();

  const baseCurrency = currencies.find((c) => c.isBase) || currencies[0];

  // Latest 5 entries
  const latestEntries = [...entries]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  // Quick stats cards
  const stats = [
    {
      title: "إجمالي الإيرادات (دائن)",
      value: formatMoney(totalCredits, baseCurrency?.code),
      icon: TrendingUp,
      color: "text-[var(--credit)]",
      bg: "bg-[var(--credit-bg)]",
    },
    {
      title: "إجمالي المصروفات (مدين)",
      value: formatMoney(totalDebits, baseCurrency?.code),
      icon: TrendingDown,
      color: "text-[var(--debit)]",
      bg: "bg-[var(--debit-bg)]",
    },
    {
      title: "صافي الرصيد",
      value: formatMoney(netBalance, baseCurrency?.code),
      icon: Wallet,
      color: netBalance >= 0 ? "text-[var(--primary)]" : "text-[var(--debit)]",
      bg: "bg-[var(--cream-warm)]",
    },
    {
      title: "عدد المعاملات",
      value: `${entries.length} معاملة`,
      icon: Receipt,
      color: "text-[var(--gold-deep)]",
      bg: "bg-[var(--cream-warm)]",
    },
  ];

  const handleSeedDemo = async () => {
    if (!confirm("هل تريد تحميل بيانات تجريبية؟ سيتم إنشاء شريك و١٧ معاملة مطابقة لكشف الحساب السابق.")) {
      return;
    }
    try {
      const res = await fetch("/api/seed-demo", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        await refreshAll();
      } else {
        alert("خطأ: " + data.error);
      }
    } catch (e) {
      alert("فشل: " + (e as Error).message);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-primary">
            لوحة التحكم
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            نظرة شاملة على الوضع المالي · {formatArabicDate(new Date().toISOString())}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSeedDemo} variant="outline" size="sm">
            <Sparkles className="w-4 h-4 ml-2" />
            تحميل بيانات تجريبية
          </Button>
          <Button onClick={() => onNavigate("journal")} size="sm">
            <BookOpen className="w-4 h-4 ml-2" />
            قيد جديد
          </Button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="overflow-hidden border-border">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-start justify-between mb-2">
                  <p className="text-xs sm:text-sm text-muted-foreground leading-tight">
                    {stat.title}
                  </p>
                  <div className={`p-2 rounded-md ${stat.bg}`}>
                    <Icon className={`w-4 h-4 ${stat.color}`} />
                  </div>
                </div>
                <p className={`font-bold text-base sm:text-xl ${stat.color} leading-tight font-num`}>
                  {stat.value}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Activity chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-serif text-primary flex items-center gap-2">
              <ArrowLeftRight className="w-5 h-5 text-[var(--gold)]" />
              حركة المعاملات آخر ١٤ يوم
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCredit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1f6b3a" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#1f6b3a" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorDebit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8a2330" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8a2330" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#d8d2c2" />
                <XAxis dataKey="label" stroke="#4a4a4a" fontSize={11} />
                <YAxis stroke="#4a4a4a" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    background: "#faf7f0",
                    border: "1px solid #d8d2c2",
                    borderRadius: "6px",
                  }}
                  formatter={(v: number) => formatMoney(v, baseCurrency?.code)}
                />
                <Area
                  type="monotone"
                  dataKey="credit"
                  name="إيرادات"
                  stroke="#1f6b3a"
                  strokeWidth={2}
                  fill="url(#colorCredit)"
                />
                <Area
                  type="monotone"
                  dataKey="debit"
                  name="مصروفات"
                  stroke="#8a2330"
                  strokeWidth={2}
                  fill="url(#colorDebit)"
                />
                <Legend />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Account types pie */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-serif text-primary">
              توزيع الحسابات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={accountTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {accountTypeData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "#faf7f0",
                    border: "1px solid #d8d2c2",
                    borderRadius: "6px",
                  }}
                />
                <Legend
                  layout="horizontal"
                  verticalAlign="bottom"
                  align="center"
                  wrapperStyle={{ fontSize: 11 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Latest entries + alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Latest entries */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-serif text-primary">
              آخر المعاملات
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => onNavigate("journal")}>
              عرض الكل
            </Button>
          </CardHeader>
          <CardContent>
            {latestEntries.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <Receipt className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>لا توجد معاملات بعد. ابدأ بإضافة قيد محاسبي.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {latestEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-3 rounded-md border border-border bg-card hover:bg-[var(--cream-warm)] transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{entry.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground font-num">
                          {entry.entryNumber}
                        </span>
                        <span className="text-xs text-muted-foreground">·</span>
                        <span className="text-xs text-muted-foreground">
                          {formatArabicDate(entry.date)}
                        </span>
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-sm font-num text-[var(--credit)]">
                        {entry.totalCredit > 0 ? "+" : ""}
                        {formatMoney(entry.totalCredit, entry.currency?.code)}
                      </p>
                      <p className="text-xs text-[var(--debit)] font-num">
                        {entry.totalDebit > 0 ? "-" : ""}
                        {formatMoney(entry.totalDebit, entry.currency?.code)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick stats + alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-serif text-primary flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-[var(--gold)]" />
              إحصائيات ونشاط
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center p-2.5 bg-[var(--cream-warm)] rounded-md">
              <span className="text-sm">آخر ٣٠ يوم</span>
              <span className="font-bold font-num text-sm">
                {recentEntries.length} معاملة
              </span>
            </div>
            <div className="flex justify-between items-center p-2.5 bg-[var(--cream-warm)] rounded-md">
              <span className="text-sm">قيمة آخر ٣٠ يوم</span>
              <span className="font-bold font-num text-sm">
                {formatMoney(recentTotal, baseCurrency?.code)}
              </span>
            </div>
            <div className="flex justify-between items-center p-2.5 bg-[var(--cream-warm)] rounded-md">
              <span className="text-sm">عدد الشركاء</span>
              <span className="font-bold font-num text-sm">
                {partners.length}
              </span>
            </div>
            <div className="flex justify-between items-center p-2.5 bg-[var(--cream-warm)] rounded-md">
              <span className="text-sm">عدد الحسابات</span>
              <span className="font-bold font-num text-sm">
                {accounts.filter((a) => !a.isGroup).length}
              </span>
            </div>
            <div className="flex justify-between items-center p-2.5 bg-[var(--cream-warm)] rounded-md">
              <span className="text-sm">العملات النشطة</span>
              <span className="font-bold font-num text-sm">
                {currencies.length}
              </span>
            </div>

            <Button
              onClick={() => onNavigate("reports")}
              className="w-full mt-2"
              variant="outline"
            >
              <FileBarChart className="w-4 h-4 ml-2" />
              عرض التقارير المالية
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
