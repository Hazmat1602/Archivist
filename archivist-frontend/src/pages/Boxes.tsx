import { useEffect, useState } from "react";
import { api, type Box, type Location } from "@/lib/api";
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
import { Plus, Trash2, Package, Pencil } from "lucide-react";

export function Boxes() {
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editBox, setEditBox] = useState<Box | null>(null);
  const [form, setForm] = useState({ name: "", location_id: "" });

  const load = () => {
    Promise.all([api.listBoxes(), api.listLocations()])
      .then(([b, l]) => { setBoxes(b); setLocations(l); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    await api.createBox({
      name: form.name,
      location_id: form.location_id ? parseInt(form.location_id) : null,
    });
    setForm({ name: "", location_id: "" });
    setDialogOpen(false);
    load();
  };

  const handleUpdate = async () => {
    if (!editBox) return;
    await api.updateBox(editBox.id, {
      name: form.name,
      location_id: form.location_id ? parseInt(form.location_id) : null,
    });
    setEditBox(null);
    setForm({ name: "", location_id: "" });
    load();
  };

  const handleDelete = async (id: number) => {
    await api.deleteBox(id);
    load();
  };

  const openEdit = (box: Box) => {
    setEditBox(box);
    setForm({ name: box.name || "", location_id: box.location_id ? String(box.location_id) : "" });
  };

  if (loading) return <div className="flex items-center justify-center py-20 text-slate-500">Loading...</div>;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Boxes</h1>
          <p className="text-sm text-slate-500">{boxes.length} boxes total</p>
        </div>
        <Button onClick={() => { setForm({ name: "", location_id: "" }); setDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" /> New Box
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" /> All Boxes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {boxes.length === 0 ? (
            <p className="py-8 text-center text-slate-400">No boxes yet. Create one to get started.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Expiry</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Folders</TableHead>
                  <TableHead>Modified</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {boxes.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-mono text-xs">{b.code}</TableCell>
                    <TableCell className="font-medium">{b.name || "—"}</TableCell>
                    <TableCell>{b.created_date}</TableCell>
                    <TableCell>
                      {b.expiry_date ? (
                        <Badge variant="outline">{b.expiry_date}</Badge>
                      ) : "—"}
                    </TableCell>
                    <TableCell>
                      {b.location_id
                        ? locations.find((l) => l.id === b.location_id)?.code || `#${b.location_id}`
                        : <span className="text-slate-400">None</span>}
                    </TableCell>
                    <TableCell><Badge variant="secondary">{b.folder_count}</Badge></TableCell>
                    <TableCell className="text-xs text-slate-400">
                      {b.modified_by != null ? (
                        <span title={b.modified_at ? new Date(b.modified_at).toLocaleString() : undefined}>
                          User #{b.modified_by}
                        </span>
                      ) : b.created_by != null ? (
                        <span>Created by #{b.created_by}</span>
                      ) : "\u2014"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(b)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(b.id)}>
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

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Box</DialogTitle>
            <DialogDescription>A unique box code will be generated automatically.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Box Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. HR Records 2024" />
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Select value={form.location_id} onValueChange={(v) => setForm({ ...form, location_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select location (optional)" /></SelectTrigger>
                <SelectContent>
                  {locations.map((l) => (
                    <SelectItem key={l.id} value={String(l.id)}>{l.code} – {l.description}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!form.name}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editBox} onOpenChange={(open) => { if (!open) setEditBox(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Box</DialogTitle>
            <DialogDescription>Update box details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Box Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Select value={form.location_id} onValueChange={(v) => setForm({ ...form, location_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select location" /></SelectTrigger>
                <SelectContent>
                  {locations.map((l) => (
                    <SelectItem key={l.id} value={String(l.id)}>{l.code} – {l.description}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditBox(null)}>Cancel</Button>
            <Button onClick={handleUpdate}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
