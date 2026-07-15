"use client";

import { useRef, useState } from "react";
import { useApp } from "@/components/app-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DatabaseBackup, Download, Upload, RotateCcw, FileJson, Shield, Cloud, HardDrive } from "lucide-react";

export function BackupPage() {
  const { refreshAll, notify } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch("/api/backup");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `daftar-backup-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      notify("تم تصدير النسخة الاحتياطية", "success");
    } catch (e) {
      notify((e as Error).message, "error");
    } finally {
      setExporting(false);
    }
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!confirm("استيراد سيمزج البيانات الحالية مع البيانات المستوردة. متابعة؟")) {
      e.target.value = "";
      return;
    }
    setImporting(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const res = await fetch("/api/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data, mode: "merge" }),
      });
      const result = await res.json();
      if (result.imported !== undefined) {
        notify(`تم استيراد ${result.imported} عنصر، تخطى ${result.skipped}`, "success");
        await refreshAll();
      } else notify(result.error || "فشل الاستيراد", "error");
    } catch (e) {
      notify("فشل قراءة الملف: " + (e as Error).message, "error");
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5 max-w-[1200px] mx-auto">
      <div className="stagger-item">
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
          النسخ الاحتياطي والاستعادة
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          احمِ بياناتك المحاسبية بالتصدير الدوري والاستعادة عند الحاجة
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Export */}
        <Card className="overflow-hidden stagger-item" style={{ animationDelay: "80ms" }}>
          <div className="gradient-card-emerald p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                <Download className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="font-display text-lg font-bold text-white">تصدير البيانات</div>
                <div className="text-xs text-white/80">احفظ نسخة كاملة من بياناتك</div>
              </div>
            </div>
          </div>
          <CardContent className="p-5 space-y-3">
            <p className="text-sm text-muted-foreground">
              يقوم بتصدير جميع البيانات (العملات، الحسابات، الشركاء، القيود، الإعدادات) في ملف JSON واحد.
            </p>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded-lg bg-muted/50">
                <FileJson className="w-4 h-4 mx-auto mb-1 text-gold" />
                <div className="text-[10px] text-muted-foreground">JSON</div>
              </div>
              <div className="p-2 rounded-lg bg-muted/50">
                <Shield className="w-4 h-4 mx-auto mb-1 text-emerald" />
                <div className="text-[10px] text-muted-foreground">شامل</div>
              </div>
              <div className="p-2 rounded-lg bg-muted/50">
                <Cloud className="w-4 h-4 mx-auto mb-1 text-navy" />
                <div className="text-[10px] text-muted-foreground">سحابي</div>
              </div>
            </div>
            <Button onClick={handleExport} disabled={exporting} className="w-full btn-premium">
              <FileJson className="w-4 h-4 ml-2" />
              {exporting ? "جارٍ التصدير..." : "تنزيل النسخة الاحتياطية"}
            </Button>
          </CardContent>
        </Card>

        {/* Import */}
        <Card className="overflow-hidden stagger-item" style={{ animationDelay: "160ms" }}>
          <div className="gradient-card-gold p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                <Upload className="w-6 h-6 text-navy" />
              </div>
              <div>
                <div className="font-display text-lg font-bold text-navy">استيراد البيانات</div>
                <div className="text-xs text-navy/80">استعد بياناتك من ملف JSON</div>
              </div>
            </div>
          </div>
          <CardContent className="p-5 space-y-3">
            <p className="text-sm text-muted-foreground">
              استورد بيانات من ملف JSON تم تصديره مسبقاً. سيتم دمج البيانات مع الموجودة.
            </p>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded-lg bg-muted/50">
                <RotateCcw className="w-4 h-4 mx-auto mb-1 text-gold-dark" />
                <div className="text-[10px] text-muted-foreground">دمج</div>
              </div>
              <div className="p-2 rounded-lg bg-muted/50">
                <Shield className="w-4 h-4 mx-auto mb-1 text-emerald" />
                <div className="text-[10px] text-muted-foreground">آمن</div>
              </div>
              <div className="p-2 rounded-lg bg-muted/50">
                <FileJson className="w-4 h-4 mx-auto mb-1 text-gold" />
                <div className="text-[10px] text-muted-foreground">JSON</div>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleImportFile}
              className="hidden"
            />
            <Button onClick={handleImportClick} disabled={importing} variant="outline" className="w-full btn-premium">
              <RotateCcw className="w-4 h-4 ml-2" />
              {importing ? "جارٍ الاستيراد..." : "اختر ملف للاستيراد"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Info card */}
      <Card className="stagger-item" style={{ animationDelay: "240ms" }}>
        <CardHeader>
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <DatabaseBackup className="w-5 h-5 text-gold" />
            معلومات النظام
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <span className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-muted-foreground" />
              قاعدة البيانات
            </span>
            <Badge variant="outline" className="font-mono">PostgreSQL (Neon)</Badge>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <span className="flex items-center gap-2">
              <Cloud className="w-4 h-4 text-muted-foreground" />
              نوع التخزين
            </span>
            <Badge variant="outline">سحابي (Serverless)</Badge>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <span className="flex items-center gap-2">
              <FileJson className="w-4 h-4 text-muted-foreground" />
              صيغة النسخة
            </span>
            <Badge variant="outline" className="font-mono">JSON v1.0</Badge>
          </div>
          <div className="mt-3 p-4 border-r-4 border-gold bg-gradient-to-l from-gold/10 to-transparent rounded-lg">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-gold-dark shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm mb-1">💡 نصيحة للنسخ الاحتياطي</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  قم بتصدير نسخة احتياطية بانتظام (أسبوعياً أو شهرياً) واحتفظ بنسخ منها في أماكن متعددة
                  (جهازك، التخزين السحابي، فلاش) لضمان عدم فقدان بياناتك المحاسبية أبداً.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
