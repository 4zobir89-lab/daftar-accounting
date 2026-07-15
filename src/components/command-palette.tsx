"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { useApp } from "@/components/app-provider";
import { cn } from "@/lib/utils";
import {
  Search,
  LayoutDashboard,
  BookOpen,
  FolderTree,
  Users,
  FileBarChart,
  Coins,
  DatabaseBackup,
  Settings,
  ArrowLeft,
  Plus,
  TrendingUp,
  TrendingDown,
  CornerDownLeft,
} from "lucide-react";

type PageKey = "dashboard" | "journal" | "accounts" | "partners" | "reports" | "currencies" | "backup" | "settings";

const PAGES: { key: PageKey; label: string; icon: any; description: string }[] = [
  { key: "dashboard", label: "لوحة التحكم", icon: LayoutDashboard, description: "نظرة شاملة" },
  { key: "journal", label: "دفتر اليومية", icon: BookOpen, description: "القيود المحاسبية" },
  { key: "accounts", label: "شجرة الحسابات", icon: FolderTree, description: "دليل الحسابات" },
  { key: "partners", label: "العملاء والموردون", icon: Users, description: "الشركاء" },
  { key: "reports", label: "التقارير المالية", icon: FileBarChart, description: "ميزان، دخل، ميزانية" },
  { key: "currencies", label: "العملات والصرف", icon: Coins, description: "العملات" },
  { key: "backup", label: "النسخ الاحتياطي", icon: DatabaseBackup, description: "تصدير/استيراد" },
  { key: "settings", label: "الإعدادات", icon: Settings, description: "إعدادات النظام" },
];

export function CommandPalette({
  open,
  onOpenChange,
  onNavigate,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onNavigate: (key: PageKey) => void;
}) {
  const { entries, accounts, partners } = useApp();
  const [search, setSearch] = useState("");
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setSearch("");
      setSelectedIdx(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  // Build searchable items
  const items = useMemo(() => {
    const result: Array<{
      type: "page" | "entry" | "account" | "partner" | "action";
      title: string;
      subtitle?: string;
      icon: any;
      action: () => void;
      group: string;
    }> = [];

    // Pages
    PAGES.forEach((p) => {
      result.push({
        type: "page",
        title: p.label,
        subtitle: p.description,
        icon: p.icon,
        action: () => {
          onNavigate(p.key);
          onOpenChange(false);
        },
        group: "الصفحات",
      });
    });

    // Actions
    result.push({
      type: "action",
      title: "إضافة قيد محاسبي جديد",
      subtitle: "فتح نموذج القيد الجديد",
      icon: Plus,
      action: () => {
        onNavigate("journal");
        onOpenChange(false);
      },
      group: "إجراءات سريعة",
    });

    // Entries
    entries.slice(0, 20).forEach((e) => {
      result.push({
        type: "entry",
        title: e.description,
        subtitle: `${e.entryNumber} · ${new Date(e.date).toLocaleDateString("ar-EG")}`,
        icon: e.totalCredit > e.totalDebit ? TrendingUp : TrendingDown,
        action: () => {
          onNavigate("journal");
          onOpenChange(false);
        },
        group: "القيود الأخيرة",
      });
    });

    // Accounts
    accounts.slice(0, 15).forEach((a) => {
      result.push({
        type: "account",
        title: a.name,
        subtitle: `${a.code} · ${a.type}`,
        icon: FolderTree,
        action: () => {
          onNavigate("accounts");
          onOpenChange(false);
        },
        group: "الحسابات",
      });
    });

    // Partners
    partners.slice(0, 10).forEach((p) => {
      result.push({
        type: "partner",
        title: p.name,
        subtitle: p.type,
        icon: Users,
        action: () => {
          onNavigate("partners");
          onOpenChange(false);
        },
        group: "الشركاء",
      });
    });

    // Filter
    if (!search.trim()) return result.slice(0, 12);
    const q = search.toLowerCase();
    return result
      .filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.subtitle?.toLowerCase().includes(q) ||
          r.group.toLowerCase().includes(q)
      )
      .slice(0, 30);
  }, [search, entries, accounts, partners, onNavigate, onOpenChange]);

  // Group items
  const grouped = useMemo(() => {
    const map = new Map<string, typeof items>();
    items.forEach((it) => {
      if (!map.has(it.group)) map.set(it.group, []);
      map.get(it.group)!.push(it);
    });
    return Array.from(map.entries());
  }, [items]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIdx((p) => Math.min(p + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIdx((p) => Math.max(p - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      items[selectedIdx]?.action();
    } else if (e.key === "Escape") {
      onOpenChange(false);
    }
  };

  useEffect(() => {
    setSelectedIdx(0);
  }, [search]);

  let runningIdx = -1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 max-w-2xl overflow-hidden gap-0 top-[20%] translate-y-0" dir="rtl">
        <DialogTitle className="sr-only">لوحة الأوامر</DialogTitle>
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="ابحث عن صفحة، قيد، حساب، شريك..."
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
          />
          <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-muted border border-border font-mono text-muted-foreground">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto py-2">
          {items.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
              لا توجد نتائج لـ &quot;{search}&quot;
            </div>
          ) : (
            grouped.map(([group, groupItems]) => (
              <div key={group} className="mb-2">
                <div className="px-4 py-1.5 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                  {group}
                </div>
                {groupItems.map((item) => {
                  runningIdx++;
                  const idx = runningIdx;
                  const Icon = item.icon;
                  const isSelected = idx === selectedIdx;
                  return (
                    <button
                      key={`${group}-${idx}`}
                      onClick={item.action}
                      onMouseEnter={() => setSelectedIdx(idx)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-2.5 text-right transition-colors",
                        isSelected && "bg-muted"
                      )}
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                        isSelected ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground"
                      )}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{item.title}</div>
                        {item.subtitle && (
                          <div className="text-xs text-muted-foreground truncate">{item.subtitle}</div>
                        )}
                      </div>
                      {isSelected && (
                        <CornerDownLeft className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border px-4 py-2 flex items-center justify-between text-[10px] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-muted border border-border font-mono">↑↓</kbd>
              تنقل
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-muted border border-border font-mono">↵</kbd>
              اختيار
            </span>
          </div>
          <div className="flex items-center gap-1">
            <ArrowLeft className="w-3 h-3" />
            <span>دفتر المحاسب</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
