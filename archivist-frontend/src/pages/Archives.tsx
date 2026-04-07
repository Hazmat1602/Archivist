import { useEffect, useState } from "react";
import { api, type Archive } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Plus, Trash2, Archive as ArchiveIcon, Pencil } from "lucide-react";

export function Archives() {
  const [archives, setArchives] = useState<Archive[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editArc, setEditArc] = useState<Archive | null>(null);
  const [form, setForm] = useState({ code: "", name: "", address: "" });

  const load = () => {
    api.listArchives().then(setArchives).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    await api.createArchive({ code: form.code, name: form.name, address: form.address || null });
    setForm({ code: "", name: "", address: "" });
    setDialogOpen(false);
    load();
  };

  const handleUpdate = async () => {
    if (!editArc) return;
    await api.updateArchive(editArc.id, { code: form.code, name: form.name, address: form.address || null });
    setEditArc(null);
    setForm({ code: "", name: "", address: "" });
    load();
  };

  const handleDelete = async (id: number) => {
    await api.deleteArchive(id);
    load();
  };

  const openEdit = (arc: Archive) => {
    setEditArc(arc);
    setForm({ code: arc.code, name: arc.name, address: arc.address || "" });
  };

  if (loading) return <div className="flex items-center justify-center py-20 text-slate-500">Loading...</div>;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Archives</h1>
          <p className="text-sm text-slate-500">{archives.length} archives</p>
        </div>
        <Button onClick={() => { setForm({ code: "", name: "", address: "" }); setDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" /> New Archive
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ArchiveIcon className="h-5 w-5" /> All Archives</CardTitle>
        </CardHeader>
        <CardContent>
          {archives.length === 0 ? (
            <p className="py-8 text-center text-slate-400">No archives yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {archives.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell><Badge variant="secondary" className="font-mono">{a.code}</Badge></TableCell>
                    <TableCell className="font-medium">{a.name}</TableCell>
                    <TableCell className="text-sm text-slate-500">{a.address || "—"}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(a)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(a.id)}>
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

      <Dialog open={dialogOpen || !!editArc} onOpenChange={(open) => { if (!open) { setDialogOpen(false); setEditArc(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editArc ? "Edit Archive" : "Create Archive"}</DialogTitle>
            <DialogDescription>{editArc ? "Update archive details." : "Add a new archive location."}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Code</Label>
              <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="e.g. ARC-01" />
            </div>
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Central Archive" />
            </div>
            <div className="space-y-2">
              <Label>Address (optional)</Label>
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="e.g. 123 Storage Way" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogOpen(false); setEditArc(null); }}>Cancel</Button>
            <Button onClick={editArc ? handleUpdate : handleCreate} disabled={!form.code || !form.name}>
              {editArc ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
