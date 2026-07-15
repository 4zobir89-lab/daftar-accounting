"use client";

import { useState, useMemo } from "react";
import { useApp, JournalLine } from "@/components/app-provider";
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
  Search,
  Trash2,
  X,
  Save,
  BookOpen,
  ChevronLeft,
  ChevronDown,
  Filter,
  Calendar,
  TrendingUp,
  TrendingDown,
  Receipt,
  Check,
  AlertCircle,
} from "lucide-react";
import { formatMoney, formatArabicDate, todayISO, ACCOUNT_TYPE_LABELS } from "@/lib/accounting-utils";
import { cn } from "@/lib/utils";

export function JournalPage() {
  const { entries, accounts, partners, currencies, refreshEntries, notify } = useApp();
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterPartner, setFilterPartner] = useState<string>("all");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    let result = entries;
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (e) =>
          e.description.toLowerCase().includes(q) ||
          e.entryNumber.toLowerCase().includes(q) ||
          (e.notes || "").toLowerCase().includes(q)
      );
    }
    if (filterPartner !== "all") result = result.filter((e) => e.partnerId === filterPartner);
    if (filterFrom) result = result.filter((e) => new Date(e.date) >= new Date(filterFrom));
    if (filterTo) result = result.filter((e) => new Date(e.date) <= new Date(filterTo));
    return [...result].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [entries, search, filterPartner, filterFrom, filterTo]);

  const totalDebit = filtered.reduce((s, e) => s + e.totalDebit, 0);
  const totalCredit = filtered.reduce((s, e) => s + e.totalCredit, 0);

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا القيد؟ لا يمكن التراجع.")) return;
    try {
      const res = await fetch(`/api/journal?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        notify("تم حذف القيد بنجاح", "success");
        await refreshEntries();
      } else {
        const err = await res.json();
        notify(err.error || "فشل الحذف", "error");
      }
    } catch (e) {
      notify((e as Error).message, "error");
    }
  };

  const hasActiveFilters = search || filterPartner !== "all" || filterFrom || filterTo;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 stagger-item">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
            دفتر اليومية
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {filtered.length} قيد · إجمالي مدين {formatMoney(totalDebit)} · إجمالي دائن {formatMoney(totalCredit)}
          </p>
        </div>
        <Button onClick={() => setShowAdd(true)} size="sm" className="btn-premium">
          <Plus className="w-4 h-4 ml-2" />
          قيد جديد
        </Button>
      </div>

      {/* Filter bar */}
      <Card className="stagger-item" style={{ animationDelay: "80ms" }}>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="بحث في القيود، الأرقام، الملاحظات..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-9"
              />
            </div>
            <Button
              variant={showFilters ? "default" : "outline"}
              onClick={() => setShowFilters(!showFilters)}
              size="sm"
            >
              <Filter className="w-4 h-4 ml-2" />
              فلترة
              {hasActiveFilters && (
                <Badge variant="secondary" className="mr-2 px-1.5 py-0">●</Badge>
              )}
            </Button>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch("");
                  setFilterPartner("all");
                  setFilterFrom("");
                  setFilterTo("");
                }}
              >
                <X className="w-4 h-4 ml-1" />
                مسح
              </Button>
            )}
          </div>
          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-border">
              <div>
                <Label className="text-xs text-muted-foreground">الشريك</Label>
                <Select value={filterPartner} onValueChange={setFilterPartner}>
                  <SelectTrigger><SelectValue placeholder="كل الشركاء" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل الشركاء</SelectItem>
                    {partners.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">من تاريخ</Label>
                <Input type="date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">إلى تاريخ</Label>
                <Input type="date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Entries table */}
      <Card className="overflow-hidden stagger-item" style={{ animationDelay: "160ms" }}>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="text-center py-20 px-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-muted-foreground/50" />
              </div>
              <p className="text-base font-medium mb-1">لا توجد قيود محاسبية</p>
              <p className="text-sm text-muted-foreground mb-4">
                {hasActiveFilters ? "جرّب تعديل الفلاتر" : "ابدأ بإضافة أول قيد محاسبي"}
              </p>
              <Button onClick={() => setShowAdd(true)} variant="outline" size="sm">
                <Plus className="w-4 h-4 ml-2" />
                إضافة قيد
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table-premium">
                <thead>
                  <tr>
                    <th>رقم القيد</th>
                    <th>التاريخ</th>
                    <th>البيان</th>
                    <th className="text-center">الشريك</th>
                    <th className="text-center">مدين</th>
                    <th className="text-center">دائن</th>
                    <th className="text-center">الحالة</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((entry, i) => (
                    <>
                      <tr
                        key={entry.id}
                        className="cursor-pointer stagger-item"
                        style={{ animationDelay: `${200 + i * 30}ms` }}
                        onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                      >
                        <td>
                          <div className="flex items-center gap-2">
                            <ChevronLeft className={cn(
                              "w-3.5 h-3.5 text-muted-foreground transition-transform",
                              expandedId === entry.id && "-rotate-90"
                            )} />
                            <span className="font-mono text-xs font-semibold text-primary">{entry.entryNumber}</span>
                          </div>
                        </td>
                        <td className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatArabicDate(entry.date)}
                        </td>
                        <td className="max-w-md">
                          <div className="font-medium text-sm truncate">{entry.description}</div>
                          {entry.notes && (
                            <div className="text-xs text-muted-foreground truncate mt-0.5">{entry.notes}</div>
                          )}
                        </td>
                        <td className="text-center text-xs">{entry.partner?.name || "—"}</td>
                        <td className="text-center">
                          {entry.totalDebit > 0 ? (
                            <span className="text-crimson font-mono font-semibold text-sm tabular-nums">
                              {formatMoney(entry.totalDebit, entry.currency?.code)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/30">—</span>
                          )}
                        </td>
                        <td className="text-center">
                          {entry.totalCredit > 0 ? (
                            <span className="text-emerald font-mono font-semibold text-sm tabular-nums">
                              {formatMoney(entry.totalCredit, entry.currency?.code)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/30">—</span>
                          )}
                        </td>
                        <td className="text-center">
                          <Badge variant={entry.status === "POSTED" ? "default" : "secondary"} className="text-[10px]">
                            {entry.status === "POSTED" && <Check className="w-2.5 h-2.5 ml-1" />}
                            {entry.status === "POSTED" ? "مرحّل" : entry.status === "DRAFT" ? "مسودة" : "ملغى"}
                          </Badge>
                        </td>
                        <td>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(entry.id);
                            }}
                          >
                            <Trash2 className="w-3.5 h-3.5 text-destructive" />
                          </Button>
                        </td>
                      </tr>
                      {expandedId === entry.id && (
                        <tr key={`${entry.id}-detail`}>
                          <td colSpan={8} className="bg-muted/30 p-0">
                            <div className="p-5">
                              <div className="bg-card rounded-lg border border-border overflow-hidden">
                                <div className="bg-primary text-primary-foreground px-4 py-2.5 flex items-center justify-between">
                                  <span className="text-sm font-semibold flex items-center gap-2">
                                    <Receipt className="w-4 h-4" />
                                    بنود القيد المزدوج
                                  </span>
                                  <span className="text-xs opacity-80 font-mono">{entry.entryNumber}</span>
                                </div>
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="border-b border-border bg-muted/50">
                                      <th className="text-right p-2.5 text-xs font-semibold text-muted-foreground">الحساب</th>
                                      <th className="text-right p-2.5 text-xs font-semibold text-muted-foreground">البيان</th>
                                      <th className="p-2.5 text-xs font-semibold text-muted-foreground text-center">مدين</th>
                                      <th className="p-2.5 text-xs font-semibold text-muted-foreground text-center">دائن</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {entry.lines.map((line, j) => (
                                      <tr key={j} className="border-b border-border/50 last:border-0">
                                        <td className="p-2.5">
                                          <div className="flex items-center gap-2">
                                            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                                              {line.account?.code}
                                            </span>
                                            <span className="text-sm">{line.account?.name}</span>
                                          </div>
                                        </td>
                                        <td className="p-2.5 text-xs text-muted-foreground">{line.description || "—"}</td>
                                        <td className="p-2.5 text-center">
                                          {line.debit > 0 ? (
                                            <span className="text-crimson font-mono tabular-nums">{formatMoney(line.debit, entry.currency?.code)}</span>
                                          ) : "—"}
                                        </td>
                                        <td className="p-2.5 text-center">
                                          {line.credit > 0 ? (
                                            <span className="text-emerald font-mono tabular-nums">{formatMoney(line.credit, entry.currency?.code)}</span>
                                          ) : "—"}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                  <tfoot className="bg-muted/50">
                                    <tr className="font-bold border-t-2 border-primary">
                                      <td colSpan={2} className="p-2.5 text-left text-xs uppercase tracking-wider">الإجمالي</td>
                                      <td className="p-2.5 text-center text-crimson font-mono tabular-nums">{formatMoney(entry.totalDebit, entry.currency?.code)}</td>
                                      <td className="p-2.5 text-center text-emerald font-mono tabular-nums">{formatMoney(entry.totalCredit, entry.currency?.code)}</td>
                                    </tr>
                                  </tfoot>
                                </table>
                              </div>
                              {entry.notes && (
                                <div className="mt-3 p-3 rounded-lg bg-muted/50 border-r-4 border-gold text-xs">
                                  <div className="font-semibold text-muted-foreground mb-1">ملاحظات:</div>
                                  <div className="whitespace-pre-line">{entry.notes}</div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {showAdd && (
        <AddEntryDialog
          onClose={() => setShowAdd(false)}
          onSuccess={() => {
            setShowAdd(false);
            refreshEntries();
          }}
        />
      )}
    </div>
  );
}

function AddEntryDialog({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { accounts, partners, currencies, notify } = useApp();
  const [date, setDate] = useState(todayISO());
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [reference, setReference] = useState("");
  const [currencyId, setCurrencyId] = useState(currencies.find((c) => c.isBase)?.id || currencies[0]?.id || "");
  const [partnerId, setPartnerId] = useState("");
  const [lines, setLines] = useState<JournalLine[]>([
    { accountId: "", debit: 0, credit: 0, description: "" },
    { accountId: "", debit: 0, credit: 0, description: "" },
  ]);
  const [saving, setSaving] = useState(false);

  const totalDebit = lines.reduce((s, l) => s + (Number(l.debit) || 0), 0);
  const totalCredit = lines.reduce((s, l) => s + (Number(l.credit) || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0;
  const canSave = description && currencyId && lines.every((l) => l.accountId) && isBalanced && lines.length >= 2;

  const addLine = () => setLines([...lines, { accountId: "", debit: 0, credit: 0, description: "" }]);
  const removeLine = (i: number) => {
    if (lines.length <= 2) return;
    setLines(lines.filter((_, idx) => idx !== i));
  };
  const updateLine = (i: number, field: keyof JournalLine, value: string) => {
    const newLines = [...lines];
    if (field === "debit" || field === "credit") {
      newLines[i] = { ...newLines[i], [field]: Number(value) || 0 };
    } else {
      newLines[i] = { ...newLines[i], [field]: value };
    }
    setLines(newLines);
  };

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      const res = await fetch("/api/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date, description, notes, reference, currencyId,
          partnerId: partnerId || undefined,
          lines: lines.map((l) => ({
            accountId: l.accountId,
            debit: Number(l.debit) || 0,
            credit: Number(l.credit) || 0,
            description: l.description,
          })),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        notify("تم حفظ القيد بنجاح ✓", "success");
        onSuccess();
      } else notify(data.error || "فشل الحفظ", "error");
    } catch (e) {
      notify((e as Error).message, "error");
    } finally {
      setSaving(false);
    }
  };

  const nonGroupAccounts = accounts.filter((a) => !a.isGroup);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <Plus className="w-5 h-5 text-gold" />
            إضافة قيد محاسبي جديد
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">التاريخ *</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">العملة *</Label>
            <Select value={currencyId} onValueChange={setCurrencyId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {currencies.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name} ({c.code})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2">
            <Label className="text-xs">البيان *</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="مثال: مستلم مبلغ 1000 سعودي"
            />
          </div>
          <div>
            <Label className="text-xs">الشريك</Label>
            <Select value={partnerId} onValueChange={setPartnerId}>
              <SelectTrigger><SelectValue placeholder="بدون شريك" /></SelectTrigger>
              <SelectContent>
                {partners.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">المرجع</Label>
            <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="رقم شيك/حوالة" />
          </div>
          <div className="sm:col-span-2">
            <Label className="text-xs">ملاحظات</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="تفاصيل إضافية (المستفيدين، الأغراض، إلخ)"
              rows={2}
            />
          </div>
        </div>

        {/* Lines */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <Receipt className="w-4 h-4 text-gold" />
              بنود القيد المزدوج
            </h4>
            <Button onClick={addLine} size="sm" variant="outline">
              <Plus className="w-3 h-3 ml-1" />
              إضافة بند
            </Button>
          </div>
          <div className="border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs text-muted-foreground">
                <tr>
                  <th className="p-2 text-right font-medium">الحساب</th>
                  <th className="p-2 text-right font-medium">البيان</th>
                  <th className="p-2 text-center font-medium w-28">مدين</th>
                  <th className="p-2 text-center font-medium w-28">دائن</th>
                  <th className="p-2 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line, i) => (
                  <tr key={i} className="border-t border-border">
                    <td className="p-1.5">
                      <Select value={line.accountId} onValueChange={(v) => updateLine(i, "accountId", v)}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="اختر حساب" />
                        </SelectTrigger>
                        <SelectContent>
                          {nonGroupAccounts.map((a) => (
                            <SelectItem key={a.id} value={a.id}>
                              <span className="font-mono text-xs">{a.code}</span> — {a.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="p-1.5">
                      <Input
                        value={line.description || ""}
                        onChange={(e) => updateLine(i, "description", e.target.value)}
                        className="h-8 text-xs"
                        placeholder="اختياري"
                      />
                    </td>
                    <td className="p-1.5">
                      <Input
                        type="number"
                        step="0.01"
                        value={line.debit || ""}
                        onChange={(e) => updateLine(i, "debit", e.target.value)}
                        className="h-8 text-xs text-crimson text-center font-mono"
                        placeholder="0.00"
                      />
                    </td>
                    <td className="p-1.5">
                      <Input
                        type="number"
                        step="0.01"
                        value={line.credit || ""}
                        onChange={(e) => updateLine(i, "credit", e.target.value)}
                        className="h-8 text-xs text-emerald text-center font-mono"
                        placeholder="0.00"
                      />
                    </td>
                    <td className="p-1.5 text-center">
                      <Button size="sm" variant="ghost" onClick={() => removeLine(i)} disabled={lines.length <= 2} className="h-8 w-8 p-0">
                        <X className="w-3 h-3" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-muted/30 font-bold border-t-2 border-border">
                <tr>
                  <td colSpan={2} className="p-2.5 text-left text-xs uppercase tracking-wider">الإجمالي</td>
                  <td className="p-2.5 text-center text-crimson font-mono tabular-nums text-sm">{totalDebit.toFixed(2)}</td>
                  <td className="p-2.5 text-center text-emerald font-mono tabular-nums text-sm">{totalCredit.toFixed(2)}</td>
                  <td></td>
                </tr>
                <tr>
                  <td colSpan={5} className="p-2.5">
                    {isBalanced ? (
                      <div className="flex items-center justify-center gap-2 text-emerald text-sm font-medium">
                        <Check className="w-4 h-4" />
                        القيد متوازن وجاهز للحفظ
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2 text-amber-600 text-sm font-medium">
                        <AlertCircle className="w-4 h-4" />
                        الفرق: {(totalDebit - totalCredit).toFixed(2)} — يجب توازن القيد
                      </div>
                    )}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
          <Button onClick={handleSave} disabled={!canSave || saving} className="btn-premium">
            <Save className="w-4 h-4 ml-2" />
            {saving ? "جارٍ الحفظ..." : "حفظ القيد"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
