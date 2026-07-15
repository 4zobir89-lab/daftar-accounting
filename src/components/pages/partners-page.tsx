"use client";

import { useState, useMemo } from "react";
import { useApp } from "@/components/app-provider";
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
  Edit,
  Trash2,
  Users,
  FileDown,
  Search,
  Eye,
} from "lucide-react";
import { PARTNER_TYPE_LABELS, formatMoney, formatArabicDate } from "@/lib/accounting-utils";

export function PartnersPage() {
  const { partners, entries, refreshPartners, notify } = useApp();
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [viewing, setViewing] = useState<string | null>(null);
  const [filterType, setFilterType] = useState("all");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let result = partners;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) => p.name.toLowerCase().includes(q) || (p.phone || "").includes(q)
      );
    }
    if (filterType !== "all") {
      result = result.filter((p) => p.type === filterType);
    }
    return result;
  }, [partners, search, filterType]);

  // Compute balances per partner
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
    <div className="p-4 sm:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-primary">
            العملاء والموردون
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            إدارة الشركاء وإصدار كشوف الحسابات · {filtered.length} شريك
          </p>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <Plus className="w-4 h-4 ml-2" />
          إضافة شريك
        </Button>
      </div>

      <Card>
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
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>لا يوجد شركاء. ابدأ بإضافة عميل أو مورد.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="banking-table">
                <thead>
                  <tr>
                    <th className="text-right">الاسم</th>
                    <th>النوع</th>
                    <th>الهاتف</th>
                    <th>عدد المعاملات</th>
                    <th>الرصيد</th>
                    <th>إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => {
                    const bal = partnerBalances.get(p.id) || { debit: 0, credit: 0, count: 0 };
                    const balance = bal.credit - bal.debit;
                    return (
                      <tr key={p.id}>
                        <td>
                          <div className="font-semibold">{p.name}</div>
                          {p.email && <div className="text-xs text-muted-foreground">{p.email}</div>}
                        </td>
                        <td className="text-center">
                          <Badge variant="outline">{PARTNER_TYPE_LABELS[p.type]}</Badge>
                        </td>
                        <td className="text-center font-num text-xs">{p.phone || "—"}</td>
                        <td className="text-center font-num">{bal.count}</td>
                        <td className="text-center font-num font-bold">
                          <span className={balance < 0 ? "text-[var(--debit)]" : "text-[var(--credit)]"}>
                            {formatMoney(balance, "SAR")}
                          </span>
                        </td>
                        <td className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button size="sm" variant="ghost" onClick={() => setViewing(p.id)} title="عرض الكشف">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDownloadPDF(p.id)}
                              disabled={downloadingId === p.id}
                              title="إصدار PDF"
                            >
                              <FileDown className="w-4 h-4 text-[var(--gold-deep)]" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditing(p.id)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleDelete(p.id)}>
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

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
        <StatementDialog partnerId={viewing} onClose={() => setViewing(null)} onDownload={() => handleDownloadPDF(viewing)} />
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
        name,
        type,
        phone: phone || undefined,
        email: email || undefined,
        address: address || undefined,
        taxNumber: taxNumber || undefined,
        openingBalance: Number(openingBalance) || 0,
        notes: notes || undefined,
      };
      const url = "/api/partners";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing ? { id: editing.id, ...body } : body),
      });
      if (res.ok) onSuccess();
      else {
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
          <DialogTitle className="font-serif text-xl">
            {editing ? "تعديل شريك" : "إضافة شريك جديد"}
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label>الاسم *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label>النوع *</Label>
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
            <Label>الرصيد الافتتاحي</Label>
            <Input type="number" step="0.01" value={openingBalance} onChange={(e) => setOpeningBalance(e.target.value)} />
          </div>
          <div>
            <Label>الهاتف</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div>
            <Label>البريد الإلكتروني</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="col-span-2">
            <Label>العنوان</Label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
          <div className="col-span-2">
            <Label>الرقم الضريبي</Label>
            <Input value={taxNumber} onChange={(e) => setTaxNumber(e.target.value)} />
          </div>
          <div className="col-span-2">
            <Label>ملاحظات</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
          <Button onClick={handleSave} disabled={saving || !name}>
            {saving ? "جارٍ الحفظ..." : "حفظ"}
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
    () =>
      entries
        .filter((e) => e.partnerId === partnerId)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [entries, partnerId]
  );

  // Precompute running balances (immutable, accumulator pattern)
  const rowsWithBalance = useMemo(() => {
    return partnerEntries.reduce<Array<{ entry: typeof partnerEntries[0]; balance: number }>>(
      (acc, e) => {
        const prev = acc.length > 0 ? acc[acc.length - 1].balance : 0;
        const next = prev + (e.totalCredit - e.totalDebit);
        return [...acc, { entry: e, balance: next }];
      },
      []
    );
  }, [partnerEntries]);

  const finalBalance = rowsWithBalance.length > 0 ? rowsWithBalance[rowsWithBalance.length - 1].balance : 0;
  const totalDebit = partnerEntries.reduce((s, e) => s + e.totalDebit, 0);
  const totalCredit = partnerEntries.reduce((s, e) => s + e.totalCredit, 0);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">
            كشف حساب — {partner?.name}
          </DialogTitle>
        </DialogHeader>

        {partnerEntries.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>لا توجد معاملات لهذا الشريك</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="banking-table">
              <thead>
                <tr>
                  <th className="text-right">رقم القيد</th>
                  <th className="text-right">التاريخ</th>
                  <th className="text-right">البيان</th>
                  <th>مدين</th>
                  <th>دائن</th>
                  <th>الرصيد</th>
                </tr>
              </thead>
              <tbody>
                {rowsWithBalance.map(({ entry: e, balance }) => {
                  return (
                    <tr key={e.id}>
                      <td className="font-num text-xs">{e.entryNumber}</td>
                      <td className="text-xs">{formatArabicDate(e.date)}</td>
                      <td className="text-right">
                        <div className="text-sm">{e.description}</div>
                        {e.notes && (
                          <div className="text-xs text-muted-foreground mt-1 whitespace-pre-line">
                            {e.notes}
                          </div>
                        )}
                      </td>
                      <td className="text-center font-num text-[var(--debit)]">
                        {e.totalDebit > 0 ? formatMoney(e.totalDebit, e.currency?.code) : "—"}
                      </td>
                      <td className="text-center font-num text-[var(--credit)]">
                        {e.totalCredit > 0 ? formatMoney(e.totalCredit, e.currency?.code) : "—"}
                      </td>
                      <td className="text-center font-num font-bold">
                        <span className={balance < 0 ? "text-[var(--debit)]" : "text-primary"}>
                          {formatMoney(balance, e.currency?.code)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-[var(--cream-warm)] font-bold">
                <tr>
                  <td colSpan={3} className="text-left">الإجمالي</td>
                  <td className="text-center text-[var(--debit)]">
                    {formatMoney(totalDebit)}
                  </td>
                  <td className="text-center text-[var(--credit)]">
                    {formatMoney(totalCredit)}
                  </td>
                  <td className="text-center">
                    <span className={finalBalance < 0 ? "text-[var(--debit)]" : "text-primary"}>
                      {formatMoney(finalBalance)}
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>إغلاق</Button>
          <Button onClick={onDownload} disabled={partnerEntries.length === 0}>
            <FileDown className="w-4 h-4 ml-2" />
            إصدار PDF احترافي
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
