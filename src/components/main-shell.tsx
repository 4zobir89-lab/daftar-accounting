"use client";

import { useState } from "react";
import { useApp } from "@/components/app-provider";
import { Dashboard } from "@/components/pages/dashboard";
import { JournalPage } from "@/components/pages/journal-page";
import { AccountsPage } from "@/components/pages/accounts-page";
import { PartnersPage } from "@/components/pages/partners-page";
import { ReportsPage } from "@/components/pages/reports-page";
import { CurrenciesPage } from "@/components/pages/currencies-page";
import { BackupPage } from "@/components/pages/backup-page";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  BookOpen,
  FolderTree,
  Users,
  FileBarChart,
  Coins,
  DatabaseBackup,
  Sparkles,
  X,
} from "lucide-react";

type PageKey =
  | "dashboard"
  | "journal"
  | "accounts"
  | "partners"
  | "reports"
  | "currencies"
  | "backup";

const NAV_ITEMS: { key: PageKey; label: string; icon: typeof LayoutDashboard }[] = [
  { key: "dashboard", label: "لوحة التحكم", icon: LayoutDashboard },
  { key: "journal", label: "دفتر اليومية", icon: BookOpen },
  { key: "accounts", label: "شجرة الحسابات", icon: FolderTree },
  { key: "partners", label: "العملاء والموردون", icon: Users },
  { key: "reports", label: "التقارير", icon: FileBarChart },
  { key: "currencies", label: "العملات والصرف", icon: Coins },
  { key: "backup", label: "النسخ الاحتياطي", icon: DatabaseBackup },
];

export function MainShell() {
  const [activePage, setActivePage] = useState<PageKey>("dashboard");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { loading, settings } = useApp();

  const handleNavClick = (key: PageKey) => {
    setActivePage(key);
    setMobileNavOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-40 h-14 bg-primary text-primary-foreground border-b-4 border-[var(--gold)] flex items-center px-4 sm:px-6 shadow-md">
        <button
          onClick={() => setMobileNavOpen(true)}
          className="md:hidden ml-2 p-2 rounded hover:bg-[var(--navy-light)]"
          aria-label="القائمة"
        >
          <LayoutDashboard className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 rounded-full border-2 border-[var(--gold)] flex items-center justify-center font-serif text-xl font-bold text-[var(--gold-light)]">
            ح
          </div>
          <div>
            <h1 className="font-serif text-lg sm:text-xl font-bold leading-tight">
              دفتر المحاسب
            </h1>
            <p className="text-[10px] sm:text-xs opacity-80 leading-tight">
              {settings.companyName} · نظام محاسبي تكاملي
            </p>
          </div>
        </div>
        <div className="text-xs opacity-80 hidden sm:block">
          {new Date().toLocaleDateString("ar-SA-u-ca-gregory", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* Sidebar - desktop */}
        <aside className="hidden md:block w-60 bg-[var(--sidebar)] text-[var(--sidebar-foreground)] border-l border-[var(--sidebar-border)]">
          <nav className="p-3 space-y-1 sticky top-14">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => handleNavClick(item.key)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors text-right",
                    isActive
                      ? "bg-[var(--gold)] text-white"
                      : "hover:bg-[var(--sidebar-accent)]"
                  )}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
            <div className="pt-3 mt-3 border-t border-[var(--sidebar-border)]">
              <div className="px-3 py-2 text-[10px] opacity-60">
                <p>الإصدار 1.0</p>
                <p>محرك قاعدة بيانات SQLite</p>
              </div>
            </div>
          </nav>
        </aside>

        {/* Mobile drawer */}
        {mobileNavOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setMobileNavOpen(false)}
            />
            <aside className="absolute right-0 top-0 bottom-0 w-72 bg-[var(--sidebar)] text-[var(--sidebar-foreground)] shadow-2xl">
              <div className="flex items-center justify-between p-4 border-b border-[var(--sidebar-border)]">
                <span className="font-serif text-lg font-bold">القائمة</span>
                <button onClick={() => setMobileNavOpen(false)} className="p-2">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="p-3 space-y-1">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = activePage === item.key;
                  return (
                    <button
                      key={item.key}
                      onClick={() => handleNavClick(item.key)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-right",
                        isActive
                          ? "bg-[var(--gold)] text-white"
                          : "hover:bg-[var(--sidebar-accent)]"
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </aside>
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 overflow-x-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-full p-8">
              <div className="text-center">
                <Sparkles className="w-10 h-10 animate-pulse text-[var(--gold)] mx-auto mb-3" />
                <p className="text-muted-foreground">جارٍ تحميل البيانات...</p>
              </div>
            </div>
          ) : (
            <>
              {activePage === "dashboard" && <Dashboard onNavigate={setActivePage} />}
              {activePage === "journal" && <JournalPage />}
              {activePage === "accounts" && <AccountsPage />}
              {activePage === "partners" && <PartnersPage />}
              {activePage === "reports" && <ReportsPage />}
              {activePage === "currencies" && <CurrenciesPage />}
              {activePage === "backup" && <BackupPage />}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
