// Utility: format numbers, dates, money with Arabic locale support

const ARABIC_INDIC_DIGITS = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];

/**
 * Convert Latin digits (0-9) to Arabic-Indic digits (٠-٩)
 */
export function toArabicDigits(input: string | number): string {
  return String(input).replace(/[0-9]/g, (d) => ARABIC_INDIC_DIGITS[parseInt(d)]);
}

/**
 * Format a number with thousands separators
 */
export function formatNumber(value: number, decimals = 2): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value || 0);
}

/**
 * Format money with currency symbol
 */
export function formatMoney(value: number, currencyCode = "SAR", decimals = 2): string {
  const formatted = formatNumber(value, decimals);
  return `${formatted} ${currencyCode}`;
}

/**
 * Format date in Arabic locale
 */
export function formatArabicDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  try {
    return d.toLocaleDateString("ar-SA-u-ca-gregory", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return d.toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }
}

/**
 * Format short date
 */
export function formatShortDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  try {
    return d.toLocaleDateString("ar-SA-u-ca-gregory", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  } catch {
    return d.toLocaleDateString("en-GB");
  }
}

/**
 * Get current ISO date string (YYYY-MM-DD)
 */
export function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * Get current timestamp for entries
 */
export function nowTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Convert number to Arabic-Indic with thousand separators
 */
export function formatArabicNumber(value: number, decimals = 2): string {
  return toArabicDigits(formatNumber(value, decimals));
}

/**
 * Calculate the running balance from a list of journal lines for an account
 */
export function calculateBalance(
  lines: Array<{ debit: number; credit: number }>,
  accountType: "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE"
): number {
  const totalDebit = lines.reduce((s, l) => s + (l.debit || 0), 0);
  const totalCredit = lines.reduce((s, l) => s + (l.credit || 0), 0);
  // For Asset and Expense accounts, debit increases balance
  // For Liability, Equity, Revenue, credit increases balance
  if (accountType === "ASSET" || accountType === "EXPENSE") {
    return totalDebit - totalCredit;
  }
  return totalCredit - totalDebit;
}

/**
 * Generate sequential entry number like JE-2026-0001
 */
export function generateEntryNumber(prefix: string, year: number, seq: number): string {
  return `${prefix}-${year}-${String(seq).padStart(4, "0")}`;
}

/**
 * Sanitize string for HTML embedding
 */
export function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Group accounts into a hierarchical tree
 */
export function buildAccountTree<T extends { id: string; parentId: string | null; children?: T[] }>(
  accounts: T[]
): T[] {
  const map = new Map<string, T & { children: T[] }>();
  accounts.forEach((a) => map.set(a.id, { ...a, children: [] }));
  const roots: Array<T & { children: T[] }> = [];
  map.forEach((node) => {
    if (node.parentId && map.has(node.parentId)) {
      map.get(node.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  });
  return roots;
}

/**
 * Account type labels in Arabic
 */
export const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  ASSET: "أصول",
  LIABILITY: "خصوم",
  EQUITY: "حقوق ملكية",
  REVENUE: "إيرادات",
  EXPENSE: "مصروفات",
};

/**
 * Partner type labels in Arabic
 */
export const PARTNER_TYPE_LABELS: Record<string, string> = {
  CUSTOMER: "عميل",
  SUPPLIER: "مورّد",
  EMPLOYEE: "موظف",
  INDIVIDUAL: "شخص",
  OTHER: "أخرى",
};
