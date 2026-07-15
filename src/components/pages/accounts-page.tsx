"use client";

import { useState, useMemo } from "react";
import { useApp } from "@/components/app-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Plus, Edit, Trash2, FolderTree, ChevronLeft, ChevronDown } from "lucide-react";
import { ACCOUNT_TYPE_LABELS, buildAccountTree } from "@/lib/accounting-utils";

export function AccountsPage() {
  const { accounts, refreshAccounts, notify } = useApp();
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const tree = useMemo(() => buildAccountTree(accounts), [accounts]);

  const toggleExpand = (id: string) => {
    const newSet = new Set(expanded);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpanded(newSet);
  };

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

  // Render tree recursively
  const renderNode = (node: typeof accounts[0] & { children?: typeof accounts }, depth: number) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expanded.has(node.id);
    const indent = depth * 24;

    return (
      <>
        <tr key={node.id} className="hover:bg-[var(--cream-warm)]">
          <td className="py-2 px-3" style={{ paddingRight: `${12 + indent}px` }}>
            <div className="flex items-center gap-2">
              {hasChildren ? (
                <button
                  onClick={() => toggleExpand(node.id)}
                  className="p-0.5 hover:bg-muted rounded"
                >
                  {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
                </button>
              ) : (
                <span className="w-4" />
              )}
              <span className={`font-num font-semibold text-xs ${node.isGroup ? "text-primary" : "text-muted-foreground"}`}>
                {node.code}
              </span>
              <span className={node.isGroup ? "font-bold" : ""}>{node.name}</span>
              {node.isGroup && (
                <Badge variant="secondary" className="text-[10px] py-0">مجموعة</Badge>
              )}
            </div>
          </td>
          <td className="text-center">
            <Badge variant="outline">
              {ACCOUNT_TYPE_LABELS[node.type]}
            </Badge>
          </td>
          <td className="text-center font-num text-xs">{node.currency}</td>
          <td className="text-center">
            <Button size="sm" variant="ghost" onClick={() => setEditing(node.id)}>
              <Edit className="w-3.5 h-3.5" />
            </Button>
            {!node.isGroup && (
              <Button size="sm" variant="ghost" onClick={() => handleDelete(node.id)}>
                <Trash2 className="w-3.5 h-3.5 text-destructive" />
              </Button>
            )}
          </td>
        </tr>
        {hasChildren && isExpanded && node.children!.map((child) => renderNode(child as any, depth + 1))}
      </>
    );
  };

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-primary">
            شجرة الحسابات
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            دليل الحسابات الهرمي · {accounts.length} حساب
          </p>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <Plus className="w-4 h-4 ml-2" />
          إضافة حساب
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {accounts.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <FolderTree className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>لا توجد حسابات. ابدأ بإنشاء دليل الحسابات.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="banking-table">
                <thead>
                  <tr>
                    <th className="text-right">الكود / الاسم</th>
                    <th>النوع</th>
                    <th>العملة</th>
                    <th>إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {tree.map((node) => renderNode(node as any, 0))}
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
      const url = "/api/accounts";
      const method = editing ? "PUT" : "POST";
      const body = editing ? { id: editing.id, code, name, type, parentId: parentId || null, isGroup, currency, notes } : { code, name, type, parentId: parentId || null, isGroup, currency, notes };
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
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
          <DialogTitle className="font-serif text-xl">
            {editing ? "تعديل حساب" : "إضافة حساب جديد"}
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>كود الحساب *</Label>
            <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="مثال: 1140" disabled={!!editing} />
          </div>
          <div>
            <Label>النوع *</Label>
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
            <Label>اسم الحساب *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="مثال: الصندوق" />
          </div>
          <div className="col-span-2">
            <Label>الحساب الأب</Label>
            <Select value={parentId} onValueChange={setParentId}>
              <SelectTrigger><SelectValue placeholder="بدون (حساب رئيسي)" /></SelectTrigger>
              <SelectContent>
                {accounts.filter((a) => a.isGroup).map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    <span className="font-num text-xs">{a.code}</span> — {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>العملة</Label>
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
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={isGroup}
                onChange={(e) => setIsGroup(e.target.checked)}
                className="w-4 h-4"
              />
              حساب تجميعي (مجموعة)
            </label>
          </div>
          <div className="col-span-2">
            <Label>ملاحظات</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
          <Button onClick={handleSave} disabled={saving || !code || !name}>
            {saving ? "جارٍ الحفظ..." : "حفظ"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
