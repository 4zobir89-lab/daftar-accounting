"use client";

import { useState, useEffect, useCallback } from "react";
import { useApp } from "@/components/app-provider";
import { useTheme } from "@/components/theme-provider";
import { Dashboard } from "@/components/pages/dashboard";
import { JournalPage } from "@/components/pages/journal-page";
import { AccountsPage } from "@/components/pages/accounts-page";
import { PartnersPage } from "@/components/pages/partners-page";
import { ReportsPage } from "@/components/pages/reports-page";
import { CurrenciesPage } from "@/components/pages/currencies-page";
import { BackupPage } from "@/components/pages/backup-page";
import { SettingsPage } from "@/components/pages/settings-page";
import { CommandPalette } from "@/components/command-palette";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  BookOpen,
  FolderTree,
  Users,
  FileBarChart,
  Coins,
  DatabaseBackup,
  Settings,
  Menu,
  X,
  Sun,
  Moon,
  Search,
  Bell,
  ChevronLeft,
  Sparkles,
  TrendingUp,
  Wallet,
} from "lucide-react";

type PageKey =
  | "dashboard"
  | "journal"
  | "accounts"
  | "partners"
  | "reports"
  | "currencies"
  | "backup"
  | "settings";

const NAV_ITEMS: {
  key: PageKey;
  label: string;
  icon: typeof LayoutDashboard;
  description: string;
  shortcut?: string;
}[] = [
  { key: "dashboard", label: "لوحة التحكم", icon: LayoutDashboard, description: "نظرة شاملة على الوضع المالي", shortcut: "1" },
  { key: "journal", label: "دفتر اليومية", icon: BookOpen, description: "القيود المحاسبية المزدوجة", shortcut: "2" },
  { key: "accounts", label: "شجرة الحسابات", icon: FolderTree, description: "دليل الحسابات الهرمي", shortcut: "3" },
  { key: "partners", label: "العملاء والموردون", icon: Users, description: "إدارة الشركاء وكشوف الحسابات", shortcut: "4" },
  { key: "reports", label: "التقارير المالية", icon: FileBarChart, description: "ميزان، دخل، ميزانية", shortcut: "5" },
  { key: "currencies", label: "العملات والصرف", icon: Coins, description: "إدارة العملات وأسعار الصرف", shortcut: "6" },
  { key: "backup", label: "النسخ الاحتياطي", icon: DatabaseBackup, description: "تصدير واستيراد البيانات", shortcut: "7" },
  { key: "settings", label: "الإعدادات", icon: Settings, description: "إعدادات النظام", shortcut: "8" },
];

export function MainShell() {
  const [activePage, setActivePage] = useState<PageKey>("dashboard");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const { loading, settings, entries, partners } = useApp();
  const { theme, toggleTheme } = useTheme();

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K → command palette
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCmdOpen(true);
      }
      // Number keys for navigation (when not typing)
      if (
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        const num = parseInt(e.key);
        if (num >= 1 && num <= NAV_ITEMS.length) {
          setActivePage(NAV_ITEMS[num - 1].key);
        }
      }
      // Cmd/Ctrl + B → toggle sidebar
      if ((e.metaKey || e.ctrlKey) && e.key === "b") {
        e.preventDefault();
        setSidebarCollapsed((p) => !p);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleNavigate = useCallback((key: PageKey) => {
    setActivePage(key);
    setMobileNavOpen(false);
  }, []);

  // Compute notification count (overdraft entries, etc.)
  const notificationCount = entries.filter(
    (e) => e.lines?.some((l) => l.debit > 0 && (e.totalDebit - e.totalCredit) > 0)
  ).length;

  return (
    <div className="min-h-screen bg-background flex">
      {/* ============ SIDEBAR (Desktop) ============ */}
      <aside
        className={cn(
          "hidden md:flex flex-col bg-sidebar text-sidebar-foreground border-l border-sidebar-border transition-all duration-300 ease-out sticky top-0 h-screen",
          sidebarCollapsed ? "w-[68px]" : "w-64"
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border shrink-0">
          <div className={cn("flex items-center gap-3", sidebarCollapsed && "justify-center w-full")}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center font-display text-xl font-bold text-navy shrink-0 shadow-lg">
              د
            </div>
            {!sidebarCollapsed && (
              <div className="overflow-hidden">
                <div className="font-display font-bold text-lg leading-tight text-white">دفتر المحاسب</div>
                <div className="text-[10px] text-sidebar-foreground/60 leading-tight">
                  {settings.companyName || "نظام محاسبي"}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-hide">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.key;
            return (
              <button
                key={item.key}
                onClick={() => handleNavigate(item.key)}
                className={cn(
                  "sidebar-item group",
                  isActive && "active",
                  sidebarCollapsed && "justify-center px-2"
                )}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <Icon className={cn("w-5 h-5 shrink-0", isActive && "text-sidebar-primary")} />
                {!sidebarCollapsed && (
                  <>
                    <span className="flex-1 text-right">{item.label}</span>
                    {item.shortcut && (
                      <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-sidebar-accent/50 text-sidebar-foreground/50 font-mono">
                        {item.shortcut}
                      </kbd>
                    )}
                  </>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-sidebar-border shrink-0">
          {!sidebarCollapsed && (
            <div className="p-3 rounded-xl bg-sidebar-accent/30 mb-2">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald to-emerald-600 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <div className="text-xs text-sidebar-foreground/60">عدد المعاملات</div>
                  <div className="font-bold text-sm text-white tabular-nums">{entries.length}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center">
                  <Wallet className="w-4 h-4 text-navy" />
                </div>
                <div className="flex-1">
                  <div className="text-xs text-sidebar-foreground/60">الشركاء</div>
                  <div className="font-bold text-sm text-white tabular-nums">{partners.length}</div>
                </div>
              </div>
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed((p) => !p)}
            className={cn(
              "w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors",
              sidebarCollapsed && "px-2"
            )}
          >
            <ChevronLeft className={cn("w-4 h-4 transition-transform", sidebarCollapsed && "rotate-180")} />
            {!sidebarCollapsed && <span>طي القائمة</span>}
          </button>
        </div>
      </aside>

      {/* ============ MOBILE DRAWER ============ */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileNavOpen(false)}
          />
          <aside className="absolute right-0 top-0 bottom-0 w-72 bg-sidebar text-sidebar-foreground shadow-2xl animate-in slide-in-from-right duration-300">
            <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center font-display text-lg font-bold text-navy">
                  د
                </div>
                <div>
                  <div className="font-display font-bold text-base text-white leading-tight">دفتر المحاسب</div>
                  <div className="text-[10px] text-sidebar-foreground/60">{settings.companyName || "نظام محاسبي"}</div>
                </div>
              </div>
              <button onClick={() => setMobileNavOpen(false)} className="p-2 rounded-lg hover:bg-sidebar-accent">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="p-3 space-y-1 overflow-y-auto" style={{ maxHeight: "calc(100vh - 4rem)" }}>
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activePage === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => handleNavigate(item.key)}
                    className={cn("sidebar-item", isActive && "active")}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    <span className="flex-1 text-right">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* ============ MAIN CONTENT ============ */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border flex items-center px-4 sm:px-6 gap-3">
          {/* Mobile menu */}
          <button
            onClick={() => setMobileNavOpen(true)}
            className="md:hidden p-2 rounded-lg hover:bg-muted"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Page title */}
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-lg sm:text-xl font-bold text-foreground truncate">
              {NAV_ITEMS.find((n) => n.key === activePage)?.label || "لوحة التحكم"}
            </h1>
            <p className="text-[10px] sm:text-xs text-muted-foreground truncate hidden sm:block">
              {NAV_ITEMS.find((n) => n.key === activePage)?.description}
            </p>
          </div>

          {/* Search button */}
          <button
            onClick={() => setCmdOpen(true)}
            className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-muted/50 hover:bg-muted text-sm text-muted-foreground transition-colors min-w-[200px]"
          >
            <Search className="w-4 h-4" />
            <span className="flex-1 text-right">بحث سريع...</span>
            <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-background border border-border font-mono">⌘K</kbd>
          </button>

          <button
            onClick={() => setCmdOpen(true)}
            className="sm:hidden p-2 rounded-lg hover:bg-muted"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Notifications */}
          <button className="relative p-2 rounded-lg hover:bg-muted">
            <Bell className="w-5 h-5" />
            {notificationCount > 0 && (
              <span className="absolute top-1 left-1 w-2 h-2 rounded-full bg-destructive" />
            )}
          </button>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            aria-label="تبديل المظهر"
          >
            {theme === "light" ? (
              <Moon className="w-5 h-5" />
            ) : (
              <Sun className="w-5 h-5" />
            )}
          </button>

          {/* User avatar */}
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-navy to-navy-light flex items-center justify-center text-white font-bold text-sm shrink-0">
            م
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-x-hidden">
          {loading ? (
            <LoadingScreen />
          ) : (
            <div key={activePage} className="page-enter">
              {activePage === "dashboard" && <Dashboard onNavigate={handleNavigate} />}
              {activePage === "journal" && <JournalPage />}
              {activePage === "accounts" && <AccountsPage />}
              {activePage === "partners" && <PartnersPage />}
              {activePage === "reports" && <ReportsPage />}
              {activePage === "currencies" && <CurrenciesPage />}
              {activePage === "backup" && <BackupPage />}
              {activePage === "settings" && <SettingsPage />}
            </div>
          )}
        </main>
      </div>

      {/* Command palette */}
      <CommandPalette
        open={cmdOpen}
        onOpenChange={setCmdOpen}
        onNavigate={handleNavigate}
      />
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] p-8">
      <div className="text-center">
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-gold to-gold-dark animate-pulse" />
          <div className="absolute inset-0 flex items-center justify-center font-display text-3xl font-bold text-navy">
            د
          </div>
          <div className="absolute -inset-2 rounded-2xl border-2 border-gold/30 animate-ping" />
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Sparkles className="w-4 h-4 animate-spin" />
          <span className="text-sm">جارٍ تحميل النظام المحاسبي...</span>
        </div>
      </div>
    </div>
  );
}
