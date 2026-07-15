"use client";

import { useRef, useState } from "react";
import { useApp } from "@/components/app-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { DatabaseBackup, Download, Upload, RotateCcw, FileJson } from "lucide-react";

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
      } else {
        notify(result.error || "فشل الاستيراد", "error");
      }
    } catch (e) {
      notify("فشل قراءة الملف: " + (e as Error).message, "error");
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div>
        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-primary">
          النسخ الاحتياطي والاستعادة
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          تصدير واستيراد كامل بيانات النظام بصيغة JSON
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Export */}
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-lg flex items-center gap-2">
              <Download className="w-5 h-5 text-[var(--credit)]" /> تصدير البيانات
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              يقوم بتصدير جميع البيانات (العملات، الحسابات، الشركاء، القيود، الفواتير، الإعدادات) في ملف JSON واحد.
            </p>
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center gap-2">
                <Badge variant="outline">JSON</Badge>
                <span>صيغة قياسية</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">شامل</Badge>
                <span>كل الجداول والعلاقات</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">آمن</Badge>
                <span>البيانات تبقى محلية</span>
              </div>
            </div>
            <Button onClick={handleExport} disabled={exporting} className="w-full">
              <FileJson className="w-4 h-4 ml-2" />
              {exporting ? "جارٍ التصدير..." : "تنزيل النسخة الاحتياطية"}
            </Button>
          </CardContent>
        </Card>

        {/* Import */}
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-lg flex items-center gap-2">
              <Upload className="w-5 h-5 text-[var(--gold)]" /> استيراد البيانات
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              استورد بيانات من ملف JSON تم تصديره مسبقاً. سيتم دمج البيانات مع الموجودة.
            </p>
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center gap-2">
                <Badge variant="outline">دمج</Badge>
                <span>لن يحذف البيانات الحالية</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">آمن</Badge>
                <span>يتخطى التكرارات</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">JSON</Badge>
                <span>نفس صيغة التصدير</span>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleImportFile}
              className="hidden"
            />
            <Button onClick={handleImportClick} disabled={importing} variant="outline" className="w-full">
              <RotateCcw className="w-4 h-4 ml-2" />
              {importing ? "جارٍ الاستيراد..." : "اختر ملف للاستيراد"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Info card */}
      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-lg flex items-center gap-2">
            <DatabaseBackup className="w-5 h-5 text-primary" /> معلومات عن النسخ الاحتياطي
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between p-2 bg-[var(--cream-warm)] rounded">
            <span>قاعدة البيانات:</span>
            <span className="font-num">SQLite</span>
          </div>
          <div className="flex justify-between p-2 bg-[var(--cream-warm)] rounded">
            <span>مكان التخزين:</span>
            <span className="font-num text-xs">/home/z/my-project/db/custom.db</span>
          </div>
          <div className="flex justify-between p-2 bg-[var(--cream-warm)] rounded">
            <span>صيغة النسخة:</span>
            <span className="font-num">JSON v1.0</span>
          </div>
          <div className="mt-3 p-3 border-r-4 border-[var(--gold)] bg-[var(--cream-warm)] rounded text-xs">
            <p className="font-semibold mb-1">💡 نصيحة:</p>
            <p>قم بتصدير نسخة احتياطية بانتظام (أسبوعياً أو شهرياً) واحتفظ بنسخ منها في أماكن متعددة لضمان عدم فقدان بياناتك المحاسبية.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
