"use client";

import { useState, useEffect } from "react";
import { useApp } from "@/components/app-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Settings, Building2, Save, Sparkles, Database, GitBranch, Cloud } from "lucide-react";

export function SettingsPage() {
  const { settings, refreshAll, notify } = useApp();
  const [form, setForm] = useState({
    companyName: settings.companyName || "",
    companyAddress: settings.companyAddress || "",
    companyPhone: settings.companyPhone || "",
    companyEmail: settings.companyEmail || "",
    taxNumber: settings.taxNumber || "",
    baseCurrency: settings.baseCurrency || "SAR",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({
      companyName: settings.companyName || "",
      companyAddress: settings.companyAddress || "",
      companyPhone: settings.companyPhone || "",
      companyEmail: settings.companyEmail || "",
      taxNumber: settings.taxNumber || "",
      baseCurrency: settings.baseCurrency || "SAR",
    });
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        notify("تم حفظ الإعدادات", "success");
        await refreshAll();
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
    <div className="p-4 sm:p-6 lg:p-8 space-y-5 max-w-[1200px] mx-auto">
      <div className="stagger-item">
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
          الإعدادات
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          إعدادات النظام والمعلومات الأساسية للشركة
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Company info */}
        <Card className="lg:col-span-2 stagger-item" style={{ animationDelay: "80ms" }}>
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <Building2 className="w-5 h-5 text-gold" />
              معلومات الشركة
            </CardTitle>
            <p className="text-xs text-muted-foreground">تظهر هذه المعلومات في كشوف الحسابات والتقارير</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <Label className="text-xs">اسم الشركة</Label>
                <Input
                  value={form.companyName}
                  onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                  placeholder="شركتي للتجارة"
                />
              </div>
              <div>
                <Label className="text-xs">الهاتف</Label>
                <Input
                  value={form.companyPhone}
                  onChange={(e) => setForm({ ...form, companyPhone: e.target.value })}
                  dir="ltr"
                  placeholder="+966..."
                />
              </div>
              <div>
                <Label className="text-xs">البريد الإلكتروني</Label>
                <Input
                  value={form.companyEmail}
                  onChange={(e) => setForm({ ...form, companyEmail: e.target.value })}
                  dir="ltr"
                  placeholder="info@company.com"
                />
              </div>
              <div className="sm:col-span-2">
                <Label className="text-xs">العنوان</Label>
                <Textarea
                  value={form.companyAddress}
                  onChange={(e) => setForm({ ...form, companyAddress: e.target.value })}
                  rows={2}
                  placeholder="المدينة، الحي، الشارع"
                />
              </div>
              <div>
                <Label className="text-xs">الرقم الضريبي</Label>
                <Input
                  value={form.taxNumber}
                  onChange={(e) => setForm({ ...form, taxNumber: e.target.value })}
                  placeholder="3000000000000"
                />
              </div>
              <div>
                <Label className="text-xs">العملة الأساسية</Label>
                <Input
                  value={form.baseCurrency}
                  onChange={(e) => setForm({ ...form, baseCurrency: e.target.value })}
                  placeholder="SAR"
                />
              </div>
            </div>
            <div className="pt-3 border-t border-border">
              <Button onClick={handleSave} disabled={saving} className="btn-premium">
                <Save className="w-4 h-4 ml-2" />
                {saving ? "جارٍ الحفظ..." : "حفظ الإعدادات"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* System info */}
        <div className="space-y-4">
          <Card className="stagger-item" style={{ animationDelay: "160ms" }}>
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-base flex items-center gap-2">
                <Database className="w-4 h-4 text-gold" />
                معلومات النظام
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50">
                <span className="text-muted-foreground">الإصدار</span>
                <Badge variant="outline" className="font-mono">v1.0.0</Badge>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50">
                <span className="text-muted-foreground">قاعدة البيانات</span>
                <Badge variant="outline" className="font-mono">PostgreSQL</Badge>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50">
                <span className="text-muted-foreground">المزود</span>
                <Badge variant="outline" className="font-mono">Neon Cloud</Badge>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50">
                <span className="text-muted-foreground">الإطار</span>
                <Badge variant="outline" className="font-mono">Next.js 16</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="gradient-card-navy border-0 stagger-item" style={{ animationDelay: "240ms" }}>
            <CardContent className="p-5">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-bold text-white text-sm">نصيحة احترافية</div>
                  <div className="text-[10px] text-white/70">حسّن تجربتك</div>
                </div>
              </div>
              <ul className="space-y-2 text-xs text-white/80">
                <li className="flex items-start gap-2">
                  <span className="text-gold-light">⌘K</span>
                  <span>افتح لوحة الأوامر للبحث السريع</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gold-light">⌘B</span>
                  <span>اطِ القائمة الجانبية للتركيز</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gold-light">١-٨</span>
                  <span>تنقل سريع بين الصفحات</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
