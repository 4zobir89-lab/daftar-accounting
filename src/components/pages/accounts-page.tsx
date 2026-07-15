"use client";

import { useState, useMemo } from "react";
import { useApp } from "@/components/app-provider";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Plus,
  Edit,
  Trash2,
  FolderTree,
  ChevronLeft,
  ChevronDown,
  Search,
  Network,
  Wallet,
  Scale,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { ACCOUNT_TYPE_LABELS, buildAccountTree } from "@/lib/accounting-utils";
import { cn } from "@/lib/utils";

const TYPE_COLORS: Record<string, { bg: string; text: string; icon: any }> = {
  ASSET: { bg: "bg-navy/10", text: "text-navy", icon: Wallet },
  LIABILITY: { bg: "bg-crimson/10", text: "text-crimson", icon: Scale },
  EQUITY: { bg: "bg-gold/10", text: "text-gold-dark", icon: Network },
  REVENUE: { bg: "bg-emerald/10", text: "text-emerald", icon: TrendingUp },
  EXPENSE: { bg: "bg-navy-light/10", text: "text-navy-light", icon: TrendingDown },
};

export function AccountsPage() {
  const { accounts, refreshAccounts, notify } = useApp();
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");

  const tree = useMemo(() => buildAccountTree(accounts), [accounts]);

  const filteredTree = useMemo(() => {
    if (!search && filterType === "all") return tree;
    // Flatten, filter, rebuild tree
    const filtered = accounts.filter((a) => {
      const matchesSearch = !search || a.name.includes(search) || a.code.includes(search);
      const matchesType = filterType === "all" || a.type === filterType;
      return matchesSearch && matchesType;
    });
    return buildAccountTree(filtered);
  }, [tree, accounts, search, filterType]);

  const toggleExpand = (id: string) => {
    const newSet = new Set(expanded);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpanded(newSet);
  };

  const expandAll = () => {
    const allIds = new Set(accounts.filter((a) => a.isGroup).map((a) => a.id));
    setExpanded(allIds);
  };

  const collapseAll = () => setExpanded(new Set());

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا الحساب؟")) return;
    try {
      const res = await fetch(`/api/accounts?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        notify("تم حذف الحساب", "success");
        await refreshAccounts();
      } else {
        const err = await res.json();
        notify(err.error, "error");
      }
    } catch (e) {
      notify((e as Error).message, "error");
    }
  };

  // Type counts
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    accounts.filter(a => !a.isGroup).forEach((a) => {
      counts[a.type] = (counts[a.type] || 0) + 1;
    });
    return counts;
  }, [accounts]);

  const renderNode = (node: typeof accounts[0] & { children?: typeof accounts }, depth: number): React.ReactNode => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expanded.has(node.id);
    const typeColor = TYPE_COLORS[node.type];
    const Icon = typeColor?.icon || Wallet;

    return (
      <>
        <tr
          key={node.id}
          className="hover:bg-muted/40 transition-colors stagger-item"
          style={{ animationDelay: `${depth * 30}ms` }}
        >
          <td className="py-2.5 px-3" style={{ paddingRight: `${16 + depth * 24}px` }}>
            <div className="flex items-center gap-2">
              {hasChildren ? (
                <button
                  onClick={() => toggleExpand(node.id)}
                  className="p-1 hover:bg-muted rounded transition-colors"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronLeft className="w-3.5 h-3.5" />
                  )}
                </button>
              ) : (
                <span className="w-6" />
              )}
              <div className={cn(
                "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                typeColor?.bg || "bg-muted"
              )}>
                <Icon className={cn("w-3.5 h-3.5", typeColor?.text || "text-muted-foreground")} />
              </div>
              <span className={cn(
                "font-mono text-xs font-bold",
                node.isGroup ? "text-primary" : "text-muted-foreground"
              )}>
                {node.code}
              </span>
              <span className={cn(node.isGroup && "font-bold")}>{node.name}</span>
              {node.isGroup && (
                <Badge variant="secondary" className="text-[10px] py-0 h-4">مجموعة</Badge>
              )}
            </div>
          </td>
          <td className="text-center">
            <Badge variant="outline" className={cn("text-[10px]", typeColor?.bg, typeColor?.text, "border-0")}>
              {ACCOUNT_TYPE_LABELS[node.type]}
            </Badge>
          </td>
          <td className="text-center">
            <Badge variant="outline" className="font-mono text-[10px]">{node.currency}</Badge>
          </td>
          <td className="text-center">
            <div className="flex items-center justify-center gap-1">
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setEditing(node.id)}>
                <Edit className="w-3 h-3" />
              </Button>
              {!node.isGroup && (
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => handleDelete(node.id)}>
                  <Trash2 className="w-3 h-3 text-destructive" />
                </Button>
              )}
            </div>
          </td>
        </tr>
        {hasChildren && isExpanded && node.children!.map((child) => renderNode(child as any, depth + 1))}
      </>
    );
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 stagger-item">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
            شجرة الحسابات
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            دليل الحسابات الهرمي · {accounts.length} حساب · {accounts.filter(a => !a.isGroup).length} حساب فرعي
          </p>
        </div>
        <Button onClick={() => setShowAdd(true)} size="sm" className="btn-premium">
          <Plus className="w-4 h-4 ml-2" />
          حساب جديد
        </Button>
      </div>

      {/* Type stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 stagger-item" style={{ animationDelay: "80ms" }}>
        {Object.entries(ACCOUNT_TYPE_LABELS).map(([type, label]) => {
          const config = TYPE_COLORS[type];
          const Icon = config?.icon || Wallet;
          return (
            <Card
              key={type}
              className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setFilterType(filterType === type ? "all" : type)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", config?.bg)}>
                    <Icon className={cn("w-4 h-4", config?.text)} />
                  </div>
                  <span className="text-2xl font-bold tabular-nums">{typeCounts[type] || 0}</span>
                </div>
                <div className="text-xs text-muted-foreground">{label}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Search & controls */}
      <Card className="stagger-item" style={{ animationDelay: "160ms" }}>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="بحث باسم الحساب أو الكود..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-9"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الأنواع</SelectItem>
                {Object.entries(ACCOUNT_TYPE_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={expandAll}>
                <ChevronDown className="w-4 h-4 ml-1" />
                توسيع
              </Button>
              <Button variant="outline" size="sm" onClick={collapseAll}>
                <ChevronLeft className="w-4 h-4 ml-1" />
                طي
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tree table */}
      <Card className="overflow-hidden stagger-item" style={{ animationDelay: "240ms" }}>
        <CardContent className="p-0">
          {filteredTree.length === 0 ? (
            <div className="text-center py-20 px-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted flex items-center justify-center">
                <FolderTree className="w-8 h-8 text-muted-foreground/50" />
              </div>
              <p className="text-base font-medium mb-1">لا توجد حسابات</p>
              <p className="text-sm text-muted-foreground mb-4">
                {search ? "لا نتائج للبحث" : "ابدأ بإنشاء دليل الحسابات"}
              </p>
              <Button onClick={() => setShowAdd(true)} variant="outline" size="sm">
                <Plus className="w-4 h-4 ml-2" />
                إضافة حساب
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table-premium">
                <thead>
                  <tr>
                    <th>الكود / الاسم</th>
                    <th className="text-center">النوع</th>
                    <th className="text-center">العملة</th>
                    <th className="text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTree.map((node) => renderNode(node as any, 0))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {(showAdd || editing) && (
        <AccountDialog
          accountId={editing}
          onClose={() => {
            setShowAdd(false);
            setEditing(null);
          }}
          onSuccess={() => {
            setShowAdd(false);
            setEditing(null);
            refreshAccounts();
          }}
        />
      )}
    </div>
  );
}

function AccountDialog({
  accountId,
  onClose,
  onSuccess,
}: {
  accountId: string | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { accounts, notify } = useApp();
  const editing = accountId ? accounts.find((a) => a.id === accountId) : null;
  const [code, setCode] = useState(editing?.code || "");
  const [name, setName] = useState(editing?.name || "");
  const [type, setType] = useState(editing?.type || "ASSET");
  const [parentId, setParentId] = useState(editing?.parentId || "");
  const [isGroup, setIsGroup] = useState(editing?.isGroup || false);
  const [currency, setCurrency] = useState(editing?.currency || "SAR");
  const [notes, setNotes] = useState(editing?.notes || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!code || !name) {
      notify("الكود والاسم مطلوبان", "error");
      return;
    }
    setSaving(true);
    try {
      const body = { code, name, type, parentId: parentId || null, isGroup, currency, notes };
      const res = await fetch("/api/accounts", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing ? { id: editing.id, ...body } : body),
      });
      if (res.ok) {
        notify(editing ? "تم تحديث الحساب" : "تم إنشاء الحساب", "success");
        onSuccess();
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
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <FolderTree className="w-5 h-5 text-gold" />
            {editing ? "تعديل حساب" : "حساب جديد"}
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">كود الحساب *</Label>
            <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="مثال: 1140" disabled={!!editing} />
          </div>
          <div>
            <Label className="text-xs">النوع *</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(ACCOUNT_TYPE_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2">
            <Label className="text-xs">اسم الحساب *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="مثال: الصندوق" />
          </div>
          <div className="col-span-2">
            <Label className="text-xs">الحساب الأب</Label>
            <Select value={parentId} onValueChange={setParentId}>
              <SelectTrigger><SelectValue placeholder="بدون (حساب رئيسي)" /></SelectTrigger>
              <SelectContent>
                {accounts.filter((a) => a.isGroup).map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    <span className="font-mono text-xs">{a.code}</span> — {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">العملة</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="SAR">ريال سعودي (SAR)</SelectItem>
                <SelectItem value="YER">ريال يمني (YER)</SelectItem>
                <SelectItem value="USD">دولار أمريكي (USD)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 text-sm cursor-pointer p-2.5">
              <input
                type="checkbox"
                checked={isGroup}
                onChange={(e) => setIsGroup(e.target.checked)}
                className="w-4 h-4 rounded accent-primary"
              />
              حساب تجميعي
            </label>
          </div>
          <div className="col-span-2">
            <Label className="text-xs">ملاحظات</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
          <Button onClick={handleSave} disabled={saving || !code || !name} className="btn-premium">
            {saving ? "جارٍ الحفظ..." : "حفظ"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
