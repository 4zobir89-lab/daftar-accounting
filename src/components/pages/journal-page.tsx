"use client";

import { useState, useMemo } from "react";
import { useApp, JournalEntry, JournalLine } from "@/components/app-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Calendar,
  FileText,
} from "lucide-react";
import { formatMoney, formatArabicDate, todayISO, ACCOUNT_TYPE_LABELS } from "@/lib/accounting-utils";

export function JournalPage() {
  const { entries, accounts, partners, currencies, refreshEntries, notify } = useApp();
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterPartner, setFilterPartner] = useState<string>("all");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");

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
    if (filterPartner !== "all") {
      result = result.filter((e) => e.partnerId === filterPartner);
    }
    if (filterFrom) {
      result = result.filter((e) => new Date(e.date) >= new Date(filterFrom));
    }
    if (filterTo) {
      result = result.filter((e) => new Date(e.date) <= new Date(filterTo));
    }
    return [...result].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [entries, search, filterPartner, filterFrom, filterTo]);

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

  return (
    <div className="p-4 sm:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-primary">
            دفتر اليومية
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            القيود المحاسبية المزدوجة · {filtered.length} قيد
          </p>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <Plus className="w-4 h-4 ml-2" />
          إضافة قيد جديد
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="بحث في الأرقام والبيانات..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-9"
              />
            </div>
            <Select value={filterPartner} onValueChange={setFilterPartner}>
              <SelectTrigger><SelectValue placeholder="كل الشركاء" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الشركاء</SelectItem>
                {partners.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div>
              <Label className="text-xs text-muted-foreground">من تاريخ</Label>
              <Input type="date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">إلى تاريخ</Label>
              <Input type="date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} />
            </div>
          </div>
          {(search || filterPartner !== "all" || filterFrom || filterTo) && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-2"
              onClick={() => {
                setSearch("");
                setFilterPartner("all");
                setFilterFrom("");
                setFilterTo("");
              }}
            >
              <X className="w-4 h-4 ml-1" /> مسح الفلاتر
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Entries table */}
      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="mb-2">لا توجد قيود محاسبية بعد</p>
              <Button onClick={() => setShowAdd(true)} variant="outline" size="sm">
                <Plus className="w-4 h-4 ml-2" />
                إضافة أول قيد
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="banking-table">
                <thead>
                  <tr>
                    <th className="text-right">رقم القيد</th>
                    <th className="text-right">التاريخ</th>
                    <th className="text-right">البيان</th>
                    <th>الشريك</th>
                    <th>مدين (ر.س)</th>
                    <th>دائن (ر.س)</th>
                    <th>الحالة</th>
                    <th>إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((entry) => (
                    <>
                      <tr
                        key={entry.id}
                        className="cursor-pointer"
                        onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                      >
                        <td className="text-primary font-num font-semibold">{entry.entryNumber}</td>
                        <td className="text-sm">{formatArabicDate(entry.date)}</td>
                        <td className="text-right max-w-md">
                          <div className="truncate">{entry.description}</div>
                          {entry.notes && (
                            <div className="text-xs text-muted-foreground truncate mt-0.5">
                              {entry.notes}
                            </div>
                          )}
                        </td>
                        <td className="text-sm">{entry.partner?.name || "—"}</td>
                        <td className="text-[var(--debit)] font-num font-semibold text-center">
                          {formatMoney(entry.totalDebit, entry.currency?.code)}
                        </td>
                        <td className="text-[var(--credit)] font-num font-semibold text-center">
                          {formatMoney(entry.totalCredit, entry.currency?.code)}
                        </td>
                        <td className="text-center">
                          <Badge variant={entry.status === "POSTED" ? "default" : "secondary"}>
                            {entry.status === "POSTED" ? "مرحّل" : entry.status === "DRAFT" ? "مسودة" : "ملغى"}
                          </Badge>
                        </td>
                        <td className="text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(entry.id);
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </td>
                      </tr>
                      {expandedId === entry.id && (
                        <tr key={`${entry.id}-detail`} className="bg-[var(--cream-warm)]">
                          <td colSpan={8} className="p-4">
                            <div className="bg-white rounded-md p-3 border border-border">
                              <h4 className="font-semibold text-sm mb-2 text-primary">
                                تفاصيل القيد — بنود القيد المزدوج:
                              </h4>
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="border-b border-border">
                                    <th className="text-right p-2">الحساب</th>
                                    <th className="text-right p-2">البيان</th>
                                    <th className="p-2">مدين</th>
                                    <th className="p-2">دائن</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {entry.lines.map((line, i) => (
                                    <tr key={i} className="border-b border-border">
                                      <td className="p-2">
                                        <span className="font-num text-xs text-muted-foreground">
                                          {line.account?.code}
                                        </span>{" "}
                                        {line.account?.name}
                                      </td>
                                      <td className="p-2 text-muted-foreground text-xs">
                                        {line.description || "—"}
                                      </td>
                                      <td className="p-2 text-center text-[var(--debit)] font-num">
                                        {line.debit > 0 ? formatMoney(line.debit, entry.currency?.code) : "—"}
                                      </td>
                                      <td className="p-2 text-center text-[var(--credit)] font-num">
                                        {line.credit > 0 ? formatMoney(line.credit, entry.currency?.code) : "—"}
                                      </td>
                                    </tr>
                                  ))}
                                  <tr className="font-bold border-t-2 border-primary">
                                    <td colSpan={2} className="p-2 text-left">الإجمالي</td>
                                    <td className="p-2 text-center text-[var(--debit)] font-num">
                                      {formatMoney(entry.totalDebit, entry.currency?.code)}
                                    </td>
                                    <td className="p-2 text-center text-[var(--credit)] font-num">
                                      {formatMoney(entry.totalCredit, entry.currency?.code)}
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                              {entry.notes && (
                                <div className="mt-3 p-2 bg-[var(--cream-warm)] rounded text-xs">
                                  <strong>ملاحظات:</strong> {entry.notes}
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

      {/* Add entry dialog */}
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
  const { accounts, partners, currencies } = useApp();
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
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;
  const canSave = description && currencyId && lines.every((l) => l.accountId) && isBalanced && lines.length >= 2;

  const addLine = () =>
    setLines([...lines, { accountId: "", debit: 0, credit: 0, description: "" }]);

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
          date,
          description,
          notes,
          reference,
          currencyId,
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
        onSuccess();
      } else {
        alert(data.error || "فشل الحفظ");
      }
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const nonGroupAccounts = accounts.filter((a) => !a.isGroup);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">إضافة قيد محاسبي جديد</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label>التاريخ *</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <Label>العملة *</Label>
            <Select value={currencyId} onValueChange={setCurrencyId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {currencies.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name} ({c.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2">
            <Label>البيان *</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="مثال: مستلم مبلغ 1000 سعودي"
            />
          </div>
          <div>
            <Label>الشريك</Label>
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
            <Label>المرجع</Label>
            <Input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="رقم شيك/حوالة/فاتورة"
            />
          </div>
          <div className="sm:col-span-2">
            <Label>ملاحظات</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="تفاصيل إضافية عن القيد (المستفيدين، الأغراض، إلخ)"
              rows={2}
            />
          </div>
        </div>

        {/* Lines */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-sm">بنود القيد (مزدوج)</h4>
            <Button onClick={addLine} size="sm" variant="outline">
              <Plus className="w-3 h-3 ml-1" />
              إضافة بند
            </Button>
          </div>
          <div className="border border-border rounded-md overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-primary text-primary-foreground">
                <tr>
                  <th className="p-2 text-right">الحساب</th>
                  <th className="p-2 text-right">البيان</th>
                  <th className="p-2">مدين</th>
                  <th className="p-2">دائن</th>
                  <th className="p-2"></th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line, i) => (
                  <tr key={i} className="border-b border-border">
                    <td className="p-1">
                      <Select
                        value={line.accountId}
                        onValueChange={(v) => updateLine(i, "accountId", v)}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="اختر حساب" />
                        </SelectTrigger>
                        <SelectContent>
                          {nonGroupAccounts.map((a) => (
                            <SelectItem key={a.id} value={a.id}>
                              <span className="font-num text-xs">{a.code}</span> — {a.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="p-1">
                      <Input
                        value={line.description || ""}
                        onChange={(e) => updateLine(i, "description", e.target.value)}
                        className="h-8 text-xs"
                        placeholder="اختياري"
                      />
                    </td>
                    <td className="p-1 w-24">
                      <Input
                        type="number"
                        step="0.01"
                        value={line.debit || ""}
                        onChange={(e) => updateLine(i, "debit", e.target.value)}
                        className="h-8 text-xs text-[var(--debit)]"
                        placeholder="0.00"
                      />
                    </td>
                    <td className="p-1 w-24">
                      <Input
                        type="number"
                        step="0.01"
                        value={line.credit || ""}
                        onChange={(e) => updateLine(i, "credit", e.target.value)}
                        className="h-8 text-xs text-[var(--credit)]"
                        placeholder="0.00"
                      />
                    </td>
                    <td className="p-1 w-8">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeLine(i)}
                        disabled={lines.length <= 2}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-[var(--cream-warm)] font-bold">
                <tr>
                  <td colSpan={2} className="p-2 text-left">الإجمالي</td>
                  <td className="p-2 text-center text-[var(--debit)] font-num">
                    {totalDebit.toFixed(2)}
                  </td>
                  <td className="p-2 text-center text-[var(--credit)] font-num">
                    {totalCredit.toFixed(2)}
                  </td>
                  <td></td>
                </tr>
                <tr>
                  <td colSpan={5} className="p-2">
                    {isBalanced ? (
                      <Badge className="bg-[var(--credit)] text-white">
                        ✓ القيد متوازن
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        الفرق: {(totalDebit - totalCredit).toFixed(2)} — القيد غير متوازن
                      </Badge>
                    )}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
          <Button onClick={handleSave} disabled={!canSave || saving}>
            <Save className="w-4 h-4 ml-2" />
            {saving ? "جارٍ الحفظ..." : "حفظ القيد"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
