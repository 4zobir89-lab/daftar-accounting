"use client";

import { useApp } from "@/components/app-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatMoney, formatArabicDate, ACCOUNT_TYPE_LABELS, PARTNER_TYPE_LABELS } from "@/lib/accounting-utils";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Receipt,
  ArrowLeftRight,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  FileBarChart,
  Users,
  Network,
  Coins,
  Zap,
  Activity,
  Calendar,
  ChevronLeft,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
} from "recharts";

type PageKey = "dashboard" | "journal" | "accounts" | "partners" | "reports" | "currencies" | "backup" | "settings";

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

  // Chart data: 14 days
  const chartData = (() => {
    const days: Array<{ date: string; credit: number; debit: number; label: string; fullLabel: string }> = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayStr = d.toISOString().split("T")[0];
      const dayEntries = entries.filter((e) => e.date.split("T")[0] === dayStr);
      days.push({
        date: dayStr,
        label: d.toLocaleDateString("ar-EG", { day: "numeric", month: "numeric" }),
        fullLabel: d.toLocaleDateString("ar-EG", { weekday: "long", day: "numeric", month: "long" }),
        credit: dayEntries.reduce((s, e) => s + e.totalCredit, 0),
        debit: dayEntries.reduce((s, e) => s + e.totalDebit, 0),
      });
    }
    return days;
  })();

  // Account distribution
  const accountTypeData = (() => {
    const counts = new Map<string, number>();
    accounts.forEach((a) => {
      if (!a.isGroup) counts.set(a.type, (counts.get(a.type) || 0) + 1);
    });
    const colors: Record<string, string> = {
      ASSET: "#0a1f44",
      LIABILITY: "#b91c1c",
      EQUITY: "#c8a55a",
      REVENUE: "#047857",
      EXPENSE: "#1e3a5f",
    };
    return Array.from(counts.entries()).map(([type, value]) => ({
      name: ACCOUNT_TYPE_LABELS[type] || type,
      value,
      color: colors[type] || "#999",
    }));
  })();

  const baseCurrency = currencies.find((c) => c.isBase) || currencies[0];

  // Top 5 entries by amount
  const topEntries = [...entries]
    .sort((a, b) => (b.totalCredit + b.totalDebit) - (a.totalCredit + a.totalDebit))
    .slice(0, 5);

  const latestEntries = [...entries]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const stats = [
    {
      title: "إجمالي الإيرادات",
      value: totalCredits,
      icon: TrendingUp,
      gradient: "gradient-card-emerald",
      change: "+12.5%",
      changeType: "positive" as const,
    },
    {
      title: "إجمالي المصروفات",
      value: totalDebits,
      icon: TrendingDown,
      gradient: "gradient-card-crimson",
      change: "-3.2%",
      changeType: "positive" as const,
    },
    {
      title: "صافي الرصيد",
      value: netBalance,
      icon: Wallet,
      gradient: "gradient-card-navy",
      change: netBalance >= 0 ? "موجب" : "سلبي",
      changeType: (netBalance >= 0 ? "positive" : "negative") as const,
    },
    {
      title: "عدد المعاملات",
      value: entries.length,
      icon: Receipt,
      gradient: "gradient-card-gold",
      change: `${recentEntries.length} هذا الشهر`,
      changeType: "neutral" as const,
      isCount: true,
    },
  ];

  const handleSeedDemo = async () => {
    if (!confirm("هل تريد تحميل بيانات تجريبية؟ سيتم إنشاء شريك و١٧ معاملة مطابقة لكشف الحساب السابق.")) return;
    try {
      const res = await fetch("/api/seed-demo", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        await refreshAll();
      } else alert("خطأ: " + data.error);
    } catch (e) {
      alert("فشل: " + (e as Error).message);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
      {/* Hero header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 stagger-item">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="status-dot status-dot-success" />
            <span className="text-xs text-muted-foreground font-medium">
              {formatArabicDate(new Date().toISOString())}
            </span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
            أهلاً بك في <span className="gradient-text-gold">دفتر المحاسب</span>
          </h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-xl">
            نظرة شاملة على وضعك المالي · {entries.length} معاملة · {partners.length} شريك · {accounts.filter(a => !a.isGroup).length} حساب
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button onClick={handleSeedDemo} variant="outline" size="sm" className="btn-premium">
            <Sparkles className="w-4 h-4 ml-2" />
            بيانات تجريبية
          </Button>
          <Button onClick={() => onNavigate("journal")} size="sm" className="btn-premium">
            <Plus className="w-4 h-4 ml-2" />
            قيد جديد
          </Button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.title}
              className={`${stat.gradient} border-0 overflow-hidden relative stagger-item`}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <CardContent className="p-5 sm:p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="text-white/80 text-sm font-medium">{stat.title}</div>
                  <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl sm:text-3xl font-bold text-white tabular-nums">
                    {stat.isCount ? stat.value : formatMoney(stat.value, baseCurrency?.code)}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    {stat.changeType === "positive" && (
                      <ArrowUpRight className="w-3 h-3 text-white/80" />
                    )}
                    {stat.changeType === "negative" && (
                      <ArrowDownRight className="w-3 h-3 text-white/80" />
                    )}
                    <span className="text-white/80">{stat.change}</span>
                  </div>
                </div>
                {/* Decorative element */}
                <div className="absolute -bottom-4 -left-4 w-24 h-24 rounded-full bg-white/5" />
                <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-white/5" />
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Activity chart */}
        <Card className="lg:col-span-2 stagger-item" style={{ animationDelay: "320ms" }}>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="w-5 h-5 text-gold" />
                حركة المعاملات
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">آخر ١٤ يوماً</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald" />
                إيرادات
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-crimson" />
                مصروفات
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCredit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#047857" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#047857" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorDebit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#b91c1c" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#b91c1c" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => v >= 1000 ? `${v/1000}k` : v} />
                <Tooltip
                  contentStyle={{
                    background: "rgba(255,255,255,0.95)",
                    backdropFilter: "blur(10px)",
                    border: "1px solid rgba(0,0,0,0.1)",
                    borderRadius: "12px",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                  }}
                  formatter={(v: number) => formatMoney(v, baseCurrency?.code)}
                  labelStyle={{ color: "#0f172a", fontWeight: 600 }}
                />
                <Area
                  type="monotone"
                  dataKey="credit"
                  name="إيرادات"
                  stroke="#047857"
                  strokeWidth={2.5}
                  fill="url(#colorCredit)"
                  animationDuration={1000}
                />
                <Area
                  type="monotone"
                  dataKey="debit"
                  name="مصروفات"
                  stroke="#b91c1c"
                  strokeWidth={2.5}
                  fill="url(#colorDebit)"
                  animationDuration={1200}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pie chart */}
        <Card className="stagger-item" style={{ animationDelay: "400ms" }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Network className="w-5 h-5 text-gold" />
              توزيع الحسابات
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">حسب النوع</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={accountTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                  animationDuration={1000}
                >
                  {accountTypeData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} stroke="white" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "rgba(255,255,255,0.95)",
                    backdropFilter: "blur(10px)",
                    border: "1px solid rgba(0,0,0,0.1)",
                    borderRadius: "12px",
                  }}
                />
                <Legend
                  layout="horizontal"
                  verticalAlign="bottom"
                  align="center"
                  wrapperStyle={{ fontSize: 11, paddingTop: 10 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bottom row: latest entries + quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Latest entries */}
        <Card className="lg:col-span-2 stagger-item" style={{ animationDelay: "480ms" }}>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="w-5 h-5 text-gold" />
              أحدث المعاملات
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => onNavigate("journal")} className="text-xs">
              عرض الكل
              <ChevronLeft className="w-4 h-4 mr-1" />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {latestEntries.length === 0 ? (
              <div className="text-center py-12 px-6">
                <Receipt className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground mb-4">لا توجد معاملات بعد</p>
                <Button onClick={() => onNavigate("journal")} variant="outline" size="sm">
                  <Plus className="w-4 h-4 ml-2" />
                  إضافة أول قيد
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {latestEntries.map((entry, i) => (
                  <div
                    key={entry.id}
                    className="flex items-center gap-4 px-5 py-3 hover:bg-muted/50 transition-colors cursor-pointer stagger-item"
                    style={{ animationDelay: `${500 + i * 50}ms` }}
                    onClick={() => onNavigate("journal")}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      entry.totalCredit > entry.totalDebit
                        ? "bg-emerald/10 text-emerald"
                        : "bg-crimson/10 text-crimson"
                    }`}>
                      {entry.totalCredit > entry.totalDebit ? (
                        <ArrowDownRight className="w-5 h-5" />
                      ) : (
                        <ArrowUpRight className="w-5 h-5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{entry.description}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs font-mono text-muted-foreground">{entry.entryNumber}</span>
                        <span className="text-xs text-muted-foreground">·</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(entry.date).toLocaleDateString("ar-EG", { day: "numeric", month: "short" })}
                        </span>
                        {entry.partner && (
                          <>
                            <span className="text-xs text-muted-foreground">·</span>
                            <span className="text-xs text-muted-foreground truncate">{entry.partner.name}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-left shrink-0">
                      <div className={`font-bold text-sm tabular-nums ${
                        entry.totalCredit > 0 ? "text-emerald" : "text-crimson"
                      }`}>
                        {entry.totalCredit > 0 ? "+" : "-"}
                        {formatMoney(entry.totalCredit > 0 ? entry.totalCredit : entry.totalDebit, entry.currency?.code)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick stats + actions */}
        <div className="space-y-4">
          <Card className="stagger-item" style={{ animationDelay: "560ms" }}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileBarChart className="w-4 h-4 text-gold" />
                إحصائيات سريعة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              <QuickStat
                icon={Calendar}
                label="آخر ٣٠ يوم"
                value={`${recentEntries.length} معاملة`}
                color="text-navy"
              />
              <QuickStat
                icon={Coins}
                label="قيمة آخر ٣٠ يوم"
                value={formatMoney(recentTotal, baseCurrency?.code)}
                color="text-gold"
              />
              <QuickStat
                icon={Users}
                label="الشركاء"
                value={`${partners.length}`}
                color="text-emerald"
              />
              <QuickStat
                icon={Network}
                label="الحسابات النشطة"
                value={`${accounts.filter(a => !a.isGroup).length}`}
                color="text-navy-light"
              />
              <QuickStat
                icon={Coins}
                label="العملات"
                value={`${currencies.length}`}
                color="text-gold-dark"
              />
            </CardContent>
          </Card>

          <Card className="gradient-card-navy border-0 stagger-item" style={{ animationDelay: "640ms" }}>
            <CardContent className="p-5">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                  <FileBarChart className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-bold text-white">التقارير المالية</div>
                  <div className="text-xs text-white/70">ميزان، دخل، ميزانية</div>
                </div>
              </div>
              <p className="text-xs text-white/70 mb-4 leading-relaxed">
                أنشئ تقاريرك المحاسبية الاحترافية بضغطة زر واحدة مع إمكانية التصدير.
              </p>
              <Button
                onClick={() => onNavigate("reports")}
                variant="secondary"
                size="sm"
                className="w-full bg-white/15 hover:bg-white/25 text-white border-0"
              >
                فتح التقارير
                <ChevronLeft className="w-4 h-4 mr-1" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Top entries */}
      {topEntries.length > 0 && (
        <Card className="stagger-item" style={{ animationDelay: "720ms" }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-gold" />
              أكبر المعاملات
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">أعلى ٥ معاملات قيمة</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {topEntries.map((entry, i) => {
                const amount = entry.totalCredit > 0 ? entry.totalCredit : entry.totalDebit;
                const maxAmount = topEntries[0].totalCredit + topEntries[0].totalDebit;
                const percentage = ((amount / maxAmount) * 100).toFixed(0);
                return (
                  <div key={entry.id} className="flex items-center gap-3 group">
                    <div className="w-7 h-7 rounded-lg bg-muted text-muted-foreground text-xs font-bold flex items-center justify-center shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium truncate">{entry.description}</span>
                        <span className={`text-sm font-bold tabular-nums shrink-0 ${
                          entry.totalCredit > 0 ? "text-emerald" : "text-crimson"
                        }`}>
                          {formatMoney(amount, entry.currency?.code)}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-1000 ${
                            entry.totalCredit > 0 ? "bg-emerald" : "bg-crimson"
                          }`}
                          style={{ width: `${percentage}%`, animationDelay: `${800 + i * 100}ms` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function QuickStat({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: any;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
      <Icon className={`w-4 h-4 ${color} shrink-0`} />
      <span className="text-xs text-muted-foreground flex-1">{label}</span>
      <span className="text-sm font-bold tabular-nums">{value}</span>
    </div>
  );
}
