"use client";

import { useState, useMemo } from "react";
import { useApp } from "@/components/app-provider";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Edit,
  Trash2,
  Users,
  FileDown,
  Search,
  Eye,
  Phone,
  Mail,
  MapPin,
  TrendingUp,
  TrendingDown,
  Wallet,
  UserCircle,
  Building2,
  Truck,
  User,
} from "lucide-react";
import { PARTNER_TYPE_LABELS, formatMoney, formatArabicDate } from "@/lib/accounting-utils";
import { cn } from "@/lib/utils";

const TYPE_ICONS: Record<string, any> = {
  CUSTOMER: UserCircle,
  SUPPLIER: Truck,
  EMPLOYEE: User,
  INDIVIDUAL: Users,
  OTHER: Building2,
};

const TYPE_COLORS: Record<string, string> = {
  CUSTOMER: "from-emerald to-emerald-600",
  SUPPLIER: "from-amber-500 to-orange-500",
  EMPLOYEE: "from-sky-500 to-blue-500",
  INDIVIDUAL: "from-purple-500 to-pink-500",
  OTHER: "from-slate-500 to-slate-600",
};

export function PartnersPage() {
  const { partners, entries, refreshPartners, notify } = useApp();
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [viewing, setViewing] = useState<string | null>(null);
  const [filterType, setFilterType] = useState("all");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  const filtered = useMemo(() => {
    let result = partners;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((p) => p.name.toLowerCase().includes(q) || (p.phone || "").includes(q));
    }
    if (filterType !== "all") result = result.filter((p) => p.type === filterType);
    return result;
  }, [partners, search, filterType]);

  const partnerBalances = useMemo(() => {
    const map = new Map<string, { debit: number; credit: number; count: number }>();
    entries.forEach((e) => {
      if (e.partnerId) {
        const cur = map.get(e.partnerId) || { debit: 0, credit: 0, count: 0 };
        cur.debit += e.totalDebit;
        cur.credit += e.totalCredit;
        cur.count += 1;
        map.set(e.partnerId, cur);
      }
    });
    return map;
  }, [entries]);

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا الشريك؟")) return;
    try {
      const res = await fetch(`/api/partners?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        notify("تم الحذف", "success");
        await refreshPartners();
      }
    } catch (e) {
      notify((e as Error).message, "error");
    }
  };

  const handleDownloadPDF = async (partnerId: string) => {
    setDownloadingId(partnerId);
    try {
      const res = await fetch("/api/statement-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partnerId }),
      });
      if (!res.ok) {
        const err = await res.json();
        notify(err.error, "error");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `account-statement-${Date.now()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      notify("تم إصدار كشف الحساب PDF", "success");
    } catch (e) {
      notify((e as Error).message, "error");
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5 max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 stagger-item">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
            العملاء والموردون
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {filtered.length} شريك · إدارة كشوف الحسابات وإصدار PDF احترافي
          </p>
        </div>
        <Button onClick={() => setShowAdd(true)} size="sm" className="btn-premium">
          <Plus className="w-4 h-4 ml-2" />
          شريك جديد
        </Button>
      </div>

      {/* Filter bar */}
      <Card className="stagger-item" style={{ animationDelay: "80ms" }}>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="بحث بالاسم أو الهاتف..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-9"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الأنواع</SelectItem>
                {Object.entries(PARTNER_TYPE_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-1 bg-muted p-1 rounded-lg">
              <Button
                size="sm"
                variant={viewMode === "grid" ? "default" : "ghost"}
                onClick={() => setViewMode("grid")}
                className="h-8"
              >
                شبكة
              </Button>
              <Button
                size="sm"
                variant={viewMode === "table" ? "default" : "ghost"}
                onClick={() => setViewMode("table")}
                className="h-8"
              >
                جدول
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Partners */}
      {filtered.length === 0 ? (
        <Card className="stagger-item" style={{ animationDelay: "160ms" }}>
          <CardContent className="p-0">
            <div className="text-center py-20 px-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted flex items-center justify-center">
                <Users className="w-8 h-8 text-muted-foreground/50" />
              </div>
              <p className="text-base font-medium mb-1">لا يوجد شركاء</p>
              <p className="text-sm text-muted-foreground mb-4">
                {search ? "لا نتائج للبحث" : "ابدأ بإضافة عميل أو مورد"}
              </p>
              <Button onClick={() => setShowAdd(true)} variant="outline" size="sm">
                <Plus className="w-4 h-4 ml-2" />
                إضافة شريك
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p, i) => {
            const bal = partnerBalances.get(p.id) || { debit: 0, credit: 0, count: 0 };
            const balance = bal.credit - bal.debit;
            const TypeIcon = TYPE_ICONS[p.type] || Users;
            const gradient = TYPE_COLORS[p.type] || TYPE_COLORS.OTHER;
            return (
              <Card
                key={p.id}
                className="overflow-hidden hover:shadow-lg transition-all duration-300 group stagger-item"
                style={{ animationDelay: `${160 + i * 60}ms` }}
              >
                <CardContent className="p-0">
                  {/* Header */}
                  <div className={cn("bg-gradient-to-br p-4 text-white relative", gradient)}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                        <TypeIcon className="w-6 h-6" />
                      </div>
                      <Badge className="bg-white/20 text-white border-0 text-[10px]">
                        {PARTNER_TYPE_LABELS[p.type]}
                      </Badge>
                    </div>
                    <div className="font-display text-lg font-bold truncate">{p.name}</div>
                    {p.phone && (
                      <div className="flex items-center gap-1.5 text-white/80 text-xs mt-1">
                        <Phone className="w-3 h-3" />
                        <span className="font-mono">{p.phone}</span>
                      </div>
                    )}
                    {/* Decorative */}
                    <div className="absolute -bottom-3 -left-3 w-20 h-20 rounded-full bg-white/10" />
                  </div>

                  {/* Stats */}
                  <div className="p-4 space-y-3">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2 rounded-lg bg-muted/50">
                        <div className="text-[10px] text-muted-foreground mb-0.5">معاملات</div>
                        <div className="font-bold text-sm tabular-nums">{bal.count}</div>
                      </div>
                      <div className="p-2 rounded-lg bg-emerald/5">
                        <div className="text-[10px] text-muted-foreground mb-0.5">دائن</div>
                        <div className="font-bold text-xs text-emerald tabular-nums">
                          {bal.credit > 0 ? formatMoney(bal.credit, "SAR").replace(" SAR", "") : "0"}
                        </div>
                      </div>
                      <div className="p-2 rounded-lg bg-crimson/5">
                        <div className="text-[10px] text-muted-foreground mb-0.5">مدين</div>
                        <div className="font-bold text-xs text-crimson tabular-nums">
                          {bal.debit > 0 ? formatMoney(bal.debit, "SAR").replace(" SAR", "") : "0"}
                        </div>
                      </div>
                    </div>

                    <div className={cn(
                      "p-3 rounded-lg flex items-center justify-between",
                      balance >= 0 ? "bg-emerald/10" : "bg-crimson/10"
                    )}>
                      <span className="text-xs text-muted-foreground">الرصيد</span>
                      <span className={cn(
                        "font-bold tabular-nums text-sm",
                        balance >= 0 ? "text-emerald" : "text-crimson"
                      )}>
                        {formatMoney(balance, "SAR")}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => setViewing(p.id)}
                      >
                        <Eye className="w-3.5 h-3.5 ml-1" />
                        كشف
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleDownloadPDF(p.id)}
                        disabled={downloadingId === p.id}
                      >
                        <FileDown className="w-3.5 h-3.5 ml-1 text-gold-dark" />
                        PDF
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setEditing(p.id)}>
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => handleDelete(p.id)}>
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="overflow-hidden stagger-item" style={{ animationDelay: "160ms" }}>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="table-premium">
                <thead>
                  <tr>
                    <th>الاسم</th>
                    <th className="text-center">النوع</th>
                    <th className="text-center">الهاتف</th>
                    <th className="text-center">معاملات</th>
                    <th className="text-center">الرصيد</th>
                    <th className="text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p, i) => {
                    const bal = partnerBalances.get(p.id) || { debit: 0, credit: 0, count: 0 };
                    const balance = bal.credit - bal.debit;
                    const TypeIcon = TYPE_ICONS[p.type] || Users;
                    return (
                      <tr key={p.id} className="stagger-item" style={{ animationDelay: `${200 + i * 30}ms` }}>
                        <td>
                          <div className="flex items-center gap-3">
                            <div className={cn("w-9 h-9 rounded-lg bg-gradient-to-br flex items-center justify-center text-white shrink-0", TYPE_COLORS[p.type])}>
                              <TypeIcon className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="font-semibold text-sm">{p.name}</div>
                              {p.email && <div className="text-xs text-muted-foreground">{p.email}</div>}
                            </div>
                          </div>
                        </td>
                        <td className="text-center">
                          <Badge variant="outline">{PARTNER_TYPE_LABELS[p.type]}</Badge>
                        </td>
                        <td className="text-center font-mono text-xs">{p.phone || "—"}</td>
                        <td className="text-center font-mono">{bal.count}</td>
                        <td className="text-center">
                          <span className={cn("font-bold tabular-nums", balance < 0 ? "text-crimson" : "text-emerald")}>
                            {formatMoney(balance, "SAR")}
                          </span>
                        </td>
                        <td>
                          <div className="flex items-center justify-center gap-1">
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setViewing(p.id)} title="عرض">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => handleDownloadPDF(p.id)} disabled={downloadingId === p.id} title="PDF">
                              <FileDown className="w-4 h-4 text-gold-dark" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setEditing(p.id)}>
                              <Edit className="w-3.5 h-3.5" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => handleDelete(p.id)}>
                              <Trash2 className="w-3.5 h-3.5 text-destructive" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {(showAdd || editing) && (
        <PartnerDialog
          partnerId={editing}
          onClose={() => {
            setShowAdd(false);
            setEditing(null);
          }}
          onSuccess={() => {
            setShowAdd(false);
            setEditing(null);
            refreshPartners();
          }}
        />
      )}

      {viewing && (
        <StatementDialog
          partnerId={viewing}
          onClose={() => setViewing(null)}
          onDownload={() => handleDownloadPDF(viewing)}
        />
      )}
    </div>
  );
}

function PartnerDialog({
  partnerId,
  onClose,
  onSuccess,
}: {
  partnerId: string | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { partners, currencies, notify } = useApp();
  const editing = partnerId ? partners.find((p) => p.id === partnerId) : null;
  const [name, setName] = useState(editing?.name || "");
  const [type, setType] = useState(editing?.type || "CUSTOMER");
  const [phone, setPhone] = useState(editing?.phone || "");
  const [email, setEmail] = useState(editing?.email || "");
  const [address, setAddress] = useState(editing?.address || "");
  const [taxNumber, setTaxNumber] = useState(editing?.taxNumber || "");
  const [openingBalance, setOpeningBalance] = useState(editing?.openingBalance?.toString() || "0");
  const [notes, setNotes] = useState(editing?.notes || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name) {
      notify("الاسم مطلوب", "error");
      return;
    }
    setSaving(true);
    try {
      const body = {
        name, type,
        phone: phone || undefined,
        email: email || undefined,
        address: address || undefined,
        taxNumber: taxNumber || undefined,
        openingBalance: Number(openingBalance) || 0,
        notes: notes || undefined,
      };
      const res = await fetch("/api/partners", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing ? { id: editing.id, ...body } : body),
      });
      if (res.ok) {
        notify(editing ? "تم التحديث" : "تم الإنشاء", "success");
        onSuccess();
      } else {
        const err = await res.json();
        notify(err.error, "error");
      }
    } catch (e) {
      notify((e as Error).message, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <Users className="w-5 h-5 text-gold" />
            {editing ? "تعديل شريك" : "شريك جديد"}
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label className="text-xs">الاسم *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">النوع *</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(PARTNER_TYPE_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">الرصيد الافتتاحي</Label>
            <Input type="number" step="0.01" value={openingBalance} onChange={(e) => setOpeningBalance(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">الهاتف</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} dir="ltr" />
          </div>
          <div>
            <Label className="text-xs">البريد الإلكتروني</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} dir="ltr" />
          </div>
          <div className="col-span-2">
            <Label className="text-xs">العنوان</Label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
          <div className="col-span-2">
            <Label className="text-xs">الرقم الضريبي</Label>
            <Input value={taxNumber} onChange={(e) => setTaxNumber(e.target.value)} />
          </div>
          <div className="col-span-2">
            <Label className="text-xs">ملاحظات</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
          <Button onClick={handleSave} disabled={saving || !name} className="btn-premium">
            {saving ? "جارٍ..." : "حفظ"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function StatementDialog({
  partnerId,
  onClose,
  onDownload,
}: {
  partnerId: string;
  onClose: () => void;
  onDownload: () => void;
}) {
  const { partners, entries, formatMoney } = useApp();
  const partner = partners.find((p) => p.id === partnerId);
  const partnerEntries = useMemo(
    () => entries
      .filter((e) => e.partnerId === partnerId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [entries, partnerId]
  );

  const { rowsWithBalance, finalBalance, totalDebit, totalCredit } = useMemo(() => {
    // Use reduce (accumulator pattern) to avoid reassignment
    const rows = partnerEntries.reduce<Array<{ entry: typeof partnerEntries[0]; balance: number }>>(
      (acc, e) => {
        const prev = acc.length > 0 ? acc[acc.length - 1].balance : 0;
        const next = prev + (e.totalCredit - e.totalDebit);
        return [...acc, { entry: e, balance: next }];
      },
      []
    );
    const finalBal = rows.length > 0 ? rows[rows.length - 1].balance : 0;
    return {
      rowsWithBalance: rows,
      finalBalance: finalBal,
      totalDebit: partnerEntries.reduce((s, e) => s + e.totalDebit, 0),
      totalCredit: partnerEntries.reduce((s, e) => s + e.totalCredit, 0),
    };
  }, [partnerEntries]);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <FileDown className="w-5 h-5 text-gold" />
            كشف حساب — {partner?.name}
          </DialogTitle>
        </DialogHeader>

        {partnerEntries.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>لا توجد معاملات لهذا الشريك</p>
          </div>
        ) : (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="p-3 rounded-xl bg-emerald/10 text-center">
                <div className="text-xs text-muted-foreground mb-1">إجمالي الإيداعات</div>
                <div className="font-bold text-emerald tabular-nums">{formatMoney(totalCredit)}</div>
              </div>
              <div className="p-3 rounded-xl bg-crimson/10 text-center">
                <div className="text-xs text-muted-foreground mb-1">إجمالي السحوبات</div>
                <div className="font-bold text-crimson tabular-nums">{formatMoney(totalDebit)}</div>
              </div>
              <div className={cn("p-3 rounded-xl text-center", finalBalance < 0 ? "bg-crimson/10" : "bg-navy/10")}>
                <div className="text-xs text-muted-foreground mb-1">الرصيد النهائي</div>
                <div className={cn("font-bold tabular-nums", finalBalance < 0 ? "text-crimson" : "text-navy")}>
                  {formatMoney(finalBalance)}
                </div>
              </div>
            </div>

            <div className="border border-border rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="table-premium">
                  <thead>
                    <tr>
                      <th>رقم القيد</th>
                      <th>التاريخ</th>
                      <th>البيان</th>
                      <th className="text-center">مدين</th>
                      <th className="text-center">دائن</th>
                      <th className="text-center">الرصيد</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rowsWithBalance.map(({ entry: e, balance }) => (
                      <tr key={e.id}>
                        <td className="font-mono text-xs">{e.entryNumber}</td>
                        <td className="text-xs whitespace-nowrap">{formatArabicDate(e.date)}</td>
                        <td className="max-w-xs">
                          <div className="text-sm">{e.description}</div>
                          {e.notes && (
                            <div className="text-xs text-muted-foreground mt-1 whitespace-pre-line line-clamp-2">
                              {e.notes}
                            </div>
                          )}
                        </td>
                        <td className="text-center">
                          {e.totalDebit > 0 ? (
                            <span className="text-crimson font-mono tabular-nums text-xs">
                              {formatMoney(e.totalDebit, e.currency?.code)}
                            </span>
                          ) : "—"}
                        </td>
                        <td className="text-center">
                          {e.totalCredit > 0 ? (
                            <span className="text-emerald font-mono tabular-nums text-xs">
                              {formatMoney(e.totalCredit, e.currency?.code)}
                            </span>
                          ) : "—"}
                        </td>
                        <td className="text-center">
                          <span className={cn("font-bold tabular-nums text-xs", balance < 0 ? "text-crimson" : "text-navy")}>
                            {formatMoney(balance, e.currency?.code)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-muted/50 font-bold border-t-2 border-primary">
                    <tr>
                      <td colSpan={3} className="p-3 text-left text-xs uppercase tracking-wider">الإجمالي</td>
                      <td className="p-3 text-center text-crimson font-mono tabular-nums text-sm">{formatMoney(totalDebit)}</td>
                      <td className="p-3 text-center text-emerald font-mono tabular-nums text-sm">{formatMoney(totalCredit)}</td>
                      <td className="p-3 text-center">
                        <span className={cn("tabular-nums", finalBalance < 0 ? "text-crimson" : "text-navy")}>
                          {formatMoney(finalBalance)}
                        </span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>إغلاق</Button>
          <Button onClick={onDownload} disabled={partnerEntries.length === 0} className="btn-premium">
            <FileDown className="w-4 h-4 ml-2" />
            إصدار PDF احترافي
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
