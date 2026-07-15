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
import { Plus, Edit, Trash2, Coins, ArrowRightLeft, Star, TrendingUp } from "lucide-react";
import { formatArabicDate } from "@/lib/accounting-utils";
import { cn } from "@/lib/utils";

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
    <div className="p-4 sm:p-6 lg:p-8 space-y-5 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 stagger-item">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
            العملات وأسعار الصرف
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {currencies.length} عملة · {exchangeRates.length} سعر صرف
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowRate(true)}>
            <ArrowRightLeft className="w-4 h-4 ml-2" />
            سعر صرف
          </Button>
          <Button onClick={() => setShowAdd(true)} size="sm" className="btn-premium">
            <Plus className="w-4 h-4 ml-2" />
            عملة جديدة
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Currencies */}
        <Card className="stagger-item" style={{ animationDelay: "80ms" }}>
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <Coins className="w-5 h-5 text-gold" />
              العملات
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="table-premium">
                <thead>
                  <tr>
                    <th>الرمز</th>
                    <th>الاسم</th>
                    <th className="text-center">الأساسية</th>
                    <th className="text-center">الكسور</th>
                    <th className="text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {currencies.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-navy to-navy-light flex items-center justify-center text-white text-xs font-bold">
                            {c.code.substring(0, 2)}
                          </div>
                          <span className="font-mono font-bold">{c.code}</span>
                        </div>
                      </td>
                      <td>
                        <div className="font-medium">{c.name}</div>
                        <div className="text-xs text-muted-foreground">{c.symbol}</div>
                      </td>
                      <td className="text-center">
                        {c.isBase ? (
                          <Badge className="bg-gold text-white border-0">
                            <Star className="w-2.5 h-2.5 ml-1" />
                            أساسية
                          </Badge>
                        ) : "—"}
                      </td>
                      <td className="text-center font-mono text-xs">{c.decimals}</td>
                      <td className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setEditing(c.id)}>
                            <Edit className="w-3 h-3" />
                          </Button>
                          {!c.isBase && (
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => handleDelete(c.id)}>
                              <Trash2 className="w-3 h-3 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Exchange rates */}
        <Card className="stagger-item" style={{ animationDelay: "160ms" }}>
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-gold" />
              أسعار الصرف
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="table-premium">
                <thead>
                  <tr>
                    <th>من</th>
                    <th className="text-center">→</th>
                    <th>إلى</th>
                    <th className="text-center">السعر</th>
                    <th className="text-center">التاريخ</th>
                  </tr>
                </thead>
                <tbody>
                  {exchangeRates.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-muted-foreground">
                        <ArrowRightLeft className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">لا توجد أسعار صرف بعد</p>
                      </td>
                    </tr>
                  ) : exchangeRates.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <Badge variant="outline" className="font-mono">{r.fromCurrency?.code}</Badge>
                      </td>
                      <td className="text-center">
                        <ArrowRightLeft className="w-3.5 h-3.5 text-muted-foreground mx-auto" />
                      </td>
                      <td>
                        <Badge variant="outline" className="font-mono">{r.toCurrency?.code}</Badge>
                      </td>
                      <td className="text-center">
                        <span className="font-bold font-mono tabular-nums text-gold-dark">{r.rate}</span>
                      </td>
                      <td className="text-center text-xs text-muted-foreground">{formatArabicDate(r.date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info card */}
      <Card className="gradient-card-navy border-0 stagger-item" style={{ animationDelay: "240ms" }}>
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              <Coins className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <div className="font-bold text-white mb-1">كيف تععمل أسعار الصرف؟</div>
              <p className="text-xs text-white/70 leading-relaxed">
                عند إدخال معاملة بعملة مختلفة عن العملة الأساسية، يحسب النظام تلقائياً القيمة المكافئة
                باستخدام أحدث سعر صرف متاح. يمكنك إضافة عدة أسعار صرف بتواريخ مختلفة لتتبع التغيرات.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

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

function CurrencyDialog({ currencyId, onClose, onSuccess }: { currencyId: string | null; onClose: () => void; onSuccess: () => void }) {
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
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <Coins className="w-5 h-5 text-gold" />
            {editing ? "تعديل عملة" : "عملة جديدة"}
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">الرمز *</Label>
            <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="SAR" disabled={!!editing} />
          </div>
          <div>
            <Label className="text-xs">الرمز المختصر</Label>
            <Input value={symbol} onChange={(e) => setSymbol(e.target.value)} placeholder="ر.س" />
          </div>
          <div className="col-span-2">
            <Label className="text-xs">الاسم *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="ريال سعودي" />
          </div>
          <div>
            <Label className="text-xs">الكسور العشرية</Label>
            <Input type="number" value={decimals} onChange={(e) => setDecimals(e.target.value)} />
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 text-sm cursor-pointer p-2.5">
              <input type="checkbox" checked={isBase} onChange={(e) => setIsBase(e.target.checked)} className="w-4 h-4 rounded accent-primary" />
              العملة الأساسية
            </label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
          <Button onClick={handleSave} disabled={saving} className="btn-premium">
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
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-gold" />
            سعر صرف جديد
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">من عملة</Label>
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
            <Label className="text-xs">إلى عملة</Label>
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
            <Label className="text-xs">السعر</Label>
            <Input type="number" step="0.0001" value={rate} onChange={(e) => setRate(e.target.value)} placeholder="مثال: 139.5" />
            <p className="text-xs text-muted-foreground mt-1">1 وحدة من العملة الأولى = السعر بالعملة الثانية</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
          <Button onClick={handleSave} disabled={saving} className="btn-premium">
            {saving ? "جارٍ..." : "حفظ"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
