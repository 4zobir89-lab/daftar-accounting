"use client";

import { useState } from "react";
import { useApp } from "@/components/app-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Plus, Edit, Trash2, Coins, ArrowRightLeft } from "lucide-react";
import { formatArabicDate } from "@/lib/accounting-utils";

export function CurrenciesPage() {
  const { currencies, exchangeRates, refreshCurrencies, notify } = useApp();
  const [showAdd, setShowAdd] = useState(false);
  const [showRate, setShowRate] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه العملة؟")) return;
    try {
      const res = await fetch(`/api/currencies?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        notify("تم الحذف", "success");
        await refreshCurrencies();
      }
    } catch (e) {
      notify((e as Error).message, "error");
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-primary">
            العملات وأسعار الصرف
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            إدارة العملات وتحديث أسعار الصرف
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowRate(true)}>
            <ArrowRightLeft className="w-4 h-4 ml-2" />
            سعر صرف جديد
          </Button>
          <Button onClick={() => setShowAdd(true)}>
            <Plus className="w-4 h-4 ml-2" />
            عملة جديدة
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Currencies list */}
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-lg flex items-center gap-2">
              <Coins className="w-5 h-5 text-[var(--gold)]" /> العملات ({currencies.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="banking-table">
                <thead>
                  <tr>
                    <th className="text-right">الرمز</th>
                    <th className="text-right">الاسم</th>
                    <th>الرمز المختصر</th>
                    <th>الأساسية</th>
                    <th>الكسور</th>
                    <th>إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {currencies.map((c) => (
                    <tr key={c.id}>
                      <td className="font-num font-bold">{c.code}</td>
                      <td>{c.name}</td>
                      <td className="text-center">{c.symbol}</td>
                      <td className="text-center">
                        {c.isBase && <Badge className="bg-[var(--gold)]">نعم</Badge>}
                      </td>
                      <td className="text-center font-num">{c.decimals}</td>
                      <td className="text-center">
                        <Button size="sm" variant="ghost" onClick={() => setEditing(c.id)}>
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        {!c.isBase && (
                          <Button size="sm" variant="ghost" onClick={() => handleDelete(c.id)}>
                            <Trash2 className="w-3.5 h-3.5 text-destructive" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Exchange rates */}
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-lg flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-[var(--gold)]" />
              أسعار الصرف ({exchangeRates.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="banking-table">
                <thead>
                  <tr>
                    <th className="text-right">من</th>
                    <th></th>
                    <th className="text-right">إلى</th>
                    <th>السعر</th>
                    <th>التاريخ</th>
                  </tr>
                </thead>
                <tbody>
                  {exchangeRates.map((r) => (
                    <tr key={r.id}>
                      <td>{r.fromCurrency?.code}</td>
                      <td className="text-center">←</td>
                      <td>{r.toCurrency?.code}</td>
                      <td className="text-center font-num font-bold text-[var(--gold-deep)]">
                        {r.rate}
                      </td>
                      <td className="text-center text-xs">{formatArabicDate(r.date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {(showAdd || editing) && (
        <CurrencyDialog
          currencyId={editing}
          onClose={() => {
            setShowAdd(false);
            setEditing(null);
          }}
          onSuccess={() => {
            setShowAdd(false);
            setEditing(null);
            refreshCurrencies();
          }}
        />
      )}

      {showRate && (
        <RateDialog
          onClose={() => setShowRate(false)}
          onSuccess={() => {
            setShowRate(false);
            refreshCurrencies();
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}

function CurrencyDialog({
  currencyId,
  onClose,
  onSuccess,
}: {
  currencyId: string | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { currencies, notify } = useApp();
  const editing = currencyId ? currencies.find((c) => c.id === currencyId) : null;
  const [code, setCode] = useState(editing?.code || "");
  const [name, setName] = useState(editing?.name || "");
  const [symbol, setSymbol] = useState(editing?.symbol || "");
  const [isBase, setIsBase] = useState(editing?.isBase || false);
  const [decimals, setDecimals] = useState(editing?.decimals?.toString() || "2");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!code || !name) {
      notify("الرمز والاسم مطلوبان", "error");
      return;
    }
    setSaving(true);
    try {
      const body = { code, name, symbol: symbol || code, isBase, decimals: Number(decimals) };
      const res = await fetch("/api/currencies", {
        method: editing ? "PUT" : "POST",
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif">
            {editing ? "تعديل عملة" : "إضافة عملة"}
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>الرمز *</Label>
            <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="SAR" disabled={!!editing} />
          </div>
          <div>
            <Label>الرمز المختصر</Label>
            <Input value={symbol} onChange={(e) => setSymbol(e.target.value)} placeholder="ر.س" />
          </div>
          <div className="col-span-2">
            <Label>الاسم *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="ريال سعودي" />
          </div>
          <div>
            <Label>الكسور العشرية</Label>
            <Input type="number" value={decimals} onChange={(e) => setDecimals(e.target.value)} />
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={isBase}
                onChange={(e) => setIsBase(e.target.checked)}
                className="w-4 h-4"
              />
              العملة الأساسية
            </label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "جارٍ..." : "حفظ"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RateDialog({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { currencies, notify } = useApp();
  const [fromCurrencyId, setFromCurrencyId] = useState("");
  const [toCurrencyId, setToCurrencyId] = useState("");
  const [rate, setRate] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!fromCurrencyId || !toCurrencyId || !rate) {
      notify("كل الحقول مطلوبة", "error");
      return;
    }
    if (fromCurrencyId === toCurrencyId) {
      notify("يجب اختيار عملتين مختلفتين", "error");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/exchange-rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromCurrencyId, toCurrencyId, rate: Number(rate) }),
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif">سعر صرف جديد</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-3">
          <div>
            <Label>من عملة</Label>
            <Select value={fromCurrencyId} onValueChange={setFromCurrencyId}>
              <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
              <SelectContent>
                {currencies.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name} ({c.code})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>إلى عملة</Label>
            <Select value={toCurrencyId} onValueChange={setToCurrencyId}>
              <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
              <SelectContent>
                {currencies.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name} ({c.code})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>السعر</Label>
            <Input
              type="number"
              step="0.0001"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              placeholder="مثال: 139.5"
            />
            <p className="text-xs text-muted-foreground mt-1">
              1 وحدة من العملة الأولى = السعر بالعملة الثانية
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "جارٍ..." : "حفظ"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
