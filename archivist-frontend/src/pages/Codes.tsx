import { useEffect, useMemo, useState } from "react";
import { api, type RetentionCode, type Category, type UserSummary } from "@/lib/api";
import { formatModifiedLabel } from "@/lib/audit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Plus, Trash2, FileCode2, Pencil } from "lucide-react";

export function Codes() {
  const [codes, setCodes] = useState<RetentionCode[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [editCode, setEditCode] = useState<RetentionCode | null>(null);
  const [form, setForm] = useState({
    category_id: "", code: "", name: "", code_description: "",
    period_description: "", period: "", m_period: "", date: "",
  });
  const [catForm, setCatForm] = useState({ name: "", parent_id: "" });

  const load = () => {
    Promise.all([api.listCodes(), api.listCategories(), api.listUsers()])
      .then(([c, cat, u]) => { setCodes(c); setCategories(cat); setUsers(u); })
      .finally(() => setLoading(false));
  };

  const userLookup = useMemo(
    () => Object.fromEntries(users.map((user) => [user.id, user.username])),
    [users],
  );

  useEffect(() => { load(); }, []);

  const resetForm = () => setForm({
    category_id: "", code: "", name: "", code_description: "",
    period_description: "", period: "", m_period: "", date: "",
  });

  const handleCreate = async () => {
    await api.createCode({
      category_id: parseInt(form.category_id),
      code: form.code,
      name: form.name,
      code_description: form.code_description,
      period_description: form.period_description,
      period: form.period ? parseInt(form.period) : null,
      m_period: form.m_period ? parseInt(form.m_period) : null,
      date: form.date || null,
    });
    resetForm();
    setDialogOpen(false);
    load();
  };

  const handleUpdate = async () => {
    if (!editCode) return;
    await api.updateCode(editCode.id, {
      name: form.name,
      code_description: form.code_description,
      period_description: form.period_description,
    });
    setEditCode(null);
    resetForm();
    load();
  };

  const handleDelete = async (id: number) => {
    await api.deleteCode(id);
    load();
  };

  const handleCreateCategory = async () => {
    await api.createCategory({
      name: catForm.name,
      is_subcategory: !!catForm.parent_id,
      parent_id: catForm.parent_id ? parseInt(catForm.parent_id) : null,
    });
    setCatForm({ name: "", parent_id: "" });
    setCatDialogOpen(false);
    load();
  };

  const openEdit = (c: RetentionCode) => {
    setEditCode(c);
    setForm({
      category_id: String(c.category_id),
      code: c.code,
      name: c.name,
      code_description: c.code_description,
      period_description: c.period_description,
      period: c.period !== null ? String(c.period) : "",
      m_period: c.m_period !== null ? String(c.m_period) : "",
      date: c.date || "",
    });
  };

  if (loading) return <div className="flex items-center justify-center py-20 text-slate-500">Loading...</div>;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Retention Codes</h1>
          <p className="text-sm text-slate-500">{codes.length} codes, {categories.length} categories</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setCatDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Category
          </Button>
          <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" /> New Code
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCode2 className="h-5 w-5" /> All Codes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {codes.length === 0 ? (
            <p className="py-8 text-center text-slate-400">No retention codes yet. Create a category first, then add codes.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Modified</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {codes.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell><Badge variant="secondary" className="font-mono">{c.code}</Badge></TableCell>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>{categories.find((cat) => cat.id === c.category_id)?.name || "—"}</TableCell>
                    <TableCell className="max-w-xs truncate text-sm text-slate-500">{c.code_description}</TableCell>
                    <TableCell><Badge variant="outline">{c.period_description}</Badge></TableCell>
                    <TableCell className="text-xs text-slate-400">
                      <span title={c.modified_at ? new Date(c.modified_at).toLocaleString() : undefined}>
                        {formatModifiedLabel(c, userLookup)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(c)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Code Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Retention Code</DialogTitle>
            <DialogDescription>Define a new retention code with its period rules.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Code</Label>
                <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="e.g. HR01" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Employee Records" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input value={form.code_description} onChange={(e) => setForm({ ...form, code_description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Period Description</Label>
                <Input value={form.period_description} onChange={(e) => setForm({ ...form, period_description: e.target.value })} placeholder="e.g. 7 Years" />
              </div>
              <div className="space-y-2">
                <Label>Years (-1 = permanent)</Label>
                <Input type="number" value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!form.category_id || !form.code || !form.name}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Code Dialog */}
      <Dialog open={!!editCode} onOpenChange={(open) => { if (!open) setEditCode(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Retention Code</DialogTitle>
            <DialogDescription>Update code details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input value={form.code_description} onChange={(e) => setForm({ ...form, code_description: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Period Description</Label>
              <Input value={form.period_description} onChange={(e) => setForm({ ...form, period_description: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditCode(null)}>Cancel</Button>
            <Button onClick={handleUpdate}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Category Dialog */}
      <Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Category</DialogTitle>
            <DialogDescription>Add a new retention category.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={catForm.name} onChange={(e) => setCatForm({ ...catForm, name: e.target.value })} placeholder="e.g. Human Resources" />
            </div>
            <div className="space-y-2">
              <Label>Parent Category (optional)</Label>
              <Select value={catForm.parent_id} onValueChange={(v) => setCatForm({ ...catForm, parent_id: v })}>
                <SelectTrigger><SelectValue placeholder="None (top-level)" /></SelectTrigger>
                <SelectContent>
                  {categories.filter((c) => !c.is_subcategory).map((cat) => (
                    <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCatDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateCategory} disabled={!catForm.name}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
