"use client";

import { ReactNode, createContext, useContext, useEffect, useState, useCallback } from "react";
import { toast } from "@/hooks/use-toast";

// ====== Types ======
export type Currency = {
  id: string;
  code: string;
  name: string;
  symbol: string;
  isBase: boolean;
  decimals: number;
};

export type Account = {
  id: string;
  code: string;
  name: string;
  type: "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE";
  parentId: string | null;
  isGroup: boolean;
  currency: string;
  active: boolean;
  notes?: string;
  parent?: Account | null;
  children?: Account[];
};

export type Partner = {
  id: string;
  name: string;
  type: "CUSTOMER" | "SUPPLIER" | "EMPLOYEE" | "INDIVIDUAL" | "OTHER";
  phone?: string;
  email?: string;
  address?: string;
  taxNumber?: string;
  notes?: string;
  openingBalance: number;
  currencyId?: string;
  active: boolean;
};

export type JournalLine = {
  id?: string;
  accountId: string;
  account?: Account;
  debit: number;
  credit: number;
  description?: string;
};

export type JournalEntry = {
  id: string;
  entryNumber: string;
  date: string;
  description: string;
  reference?: string;
  notes?: string;
  status: "DRAFT" | "POSTED" | "REVERSED";
  totalDebit: number;
  totalCredit: number;
  currencyId: string;
  currency?: Currency;
  partnerId?: string;
  partner?: Partner;
  lines: JournalLine[];
  createdAt: string;
};

export type ExchangeRate = {
  id: string;
  fromCurrencyId: string;
  toCurrencyId: string;
  rate: number;
  date: string;
};

export type Settings = {
  companyName: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  taxNumber?: string;
  baseCurrency: string;
};

// ====== Context ======
type AppContextType = {
  // Data
  currencies: Currency[];
  accounts: Account[];
  partners: Partner[];
  entries: JournalEntry[];
  exchangeRates: ExchangeRate[];
  settings: Settings;
  loading: boolean;

  // Refreshers
  refreshAll: () => Promise<void>;
  refreshCurrencies: () => Promise<void>;
  refreshAccounts: () => Promise<void>;
  refreshPartners: () => Promise<void>;
  refreshEntries: () => Promise<void>;

  // Helpers
  getCurrency: (id: string) => Currency | undefined;
  getAccount: (id: string) => Account | undefined;
  getPartner: (id: string) => Partner | undefined;
  getExchangeRate: (from: string, to: string) => number;
  formatMoney: (amount: number, currencyCode?: string) => string;

  // Toast helper
  notify: (message: string, type?: "default" | "success" | "error") => void;
};

const AppContext = createContext<AppContextType | null>(null);

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

const DEFAULT_SETTINGS: Settings = {
  companyName: "شركتي",
  baseCurrency: "SAR",
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  const fetchJSON = async (url: string, options?: RequestInit) => {
    const res = await fetch(url, {
      ...options,
      headers: { "Content-Type": "application/json", ...(options?.headers || {}) },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Network error" }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
  };

  const refreshCurrencies = useCallback(async () => {
    try {
      const data = await fetchJSON("/api/currencies");
      setCurrencies(data);
    } catch (e) {
      console.error("refreshCurrencies:", e);
    }
  }, []);

  const refreshAccounts = useCallback(async () => {
    try {
      const data = await fetchJSON("/api/accounts");
      setAccounts(data);
    } catch (e) {
      console.error("refreshAccounts:", e);
    }
  }, []);

  const refreshPartners = useCallback(async () => {
    try {
      const data = await fetchJSON("/api/partners");
      setPartners(data);
    } catch (e) {
      console.error("refreshPartners:", e);
    }
  }, []);

  const refreshEntries = useCallback(async () => {
    try {
      const data = await fetchJSON("/api/journal");
      setEntries(data);
    } catch (e) {
      console.error("refreshEntries:", e);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      refreshCurrencies(),
      refreshAccounts(),
      refreshPartners(),
      refreshEntries(),
      (async () => {
        try {
          const r = await fetchJSON("/api/exchange-rates");
          setExchangeRates(r);
        } catch (e) {
          console.error("refreshExchangeRates:", e);
        }
      })(),
      (async () => {
        try {
          const s = await fetchJSON("/api/settings");
          setSettings({ ...DEFAULT_SETTINGS, ...s });
        } catch (e) {
          console.error("refreshSettings:", e);
        }
      })(),
    ]);
    setLoading(false);
  }, [refreshCurrencies, refreshAccounts, refreshPartners, refreshEntries]);

  useEffect(() => {
    // Initial load — runs once on mount
    let mounted = true;
    (async () => {
      const data = await Promise.all([
        fetchJSON("/api/currencies").catch(() => []),
        fetchJSON("/api/accounts").catch(() => []),
        fetchJSON("/api/partners").catch(() => []),
        fetchJSON("/api/journal").catch(() => []),
        fetchJSON("/api/exchange-rates").catch(() => []),
        fetchJSON("/api/settings").catch(() => ({})),
      ]);
      if (!mounted) return;
      const [c, a, p, e, r, s] = data;
      setCurrencies(c);
      setAccounts(a);
      setPartners(p);
      setEntries(e);
      setExchangeRates(r);
      setSettings({ ...DEFAULT_SETTINGS, ...s });
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const getCurrency = useCallback(
    (id: string) => currencies.find((c) => c.id === id),
    [currencies]
  );

  const getAccount = useCallback(
    (id: string) => accounts.find((a) => a.id === id),
    [accounts]
  );

  const getPartner = useCallback(
    (id: string) => partners.find((p) => p.id === id),
    [partners]
  );

  const getExchangeRate = useCallback(
    (from: string, to: string) => {
      if (from === to) return 1;
      const rate = exchangeRates.find(
        (r) => r.fromCurrencyId === from && r.toCurrencyId === to
      );
      if (rate) return rate.rate;
      // Try reverse
      const reverse = exchangeRates.find(
        (r) => r.fromCurrencyId === to && r.toCurrencyId === from
      );
      if (reverse) return 1 / reverse.rate;
      return 1;
    },
    [exchangeRates]
  );

  const formatMoney = useCallback(
    (amount: number, currencyCode?: string) => {
      const code = currencyCode || "SAR";
      const cur = currencies.find((c) => c.code === code);
      const decimals = cur?.decimals ?? 2;
      const formatted = new Intl.NumberFormat("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(Math.abs(amount));
      const sign = amount < 0 ? "-" : "";
      return `${sign}${formatted} ${code}`;
    },
    [currencies]
  );

  const notify = useCallback(
    (message: string, type: "default" | "success" | "error" = "default") => {
      toast({
        title: message,
        variant: type === "error" ? "destructive" : "default",
      });
    },
    []
  );

  return (
    <AppContext.Provider
      value={{
        currencies,
        accounts,
        partners,
        entries,
        exchangeRates,
        settings,
        loading,
        refreshAll,
        refreshCurrencies,
        refreshAccounts,
        refreshPartners,
        refreshEntries,
        getCurrency,
        getAccount,
        getPartner,
        getExchangeRate,
        formatMoney,
        notify,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
