import { useEffect, useState } from "react";
import { api, type Location } from "@/lib/api";
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
import { Plus, Trash2, MapPin, Pencil } from "lucide-react";

export function Locations() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editLoc, setEditLoc] = useState<Location | null>(null);
  const [form, setForm] = useState({ code: "", description: "", local_storage: true });

  const load = () => {
    api.listLocations().then(setLocations).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    await api.createLocation({ code: form.code, description: form.description, local_storage: form.local_storage });
    setForm({ code: "", description: "", local_storage: true });
    setDialogOpen(false);
    load();
  };

  const handleUpdate = async () => {
    if (!editLoc) return;
    await api.updateLocation(editLoc.id, { code: form.code, description: form.description, local_storage: form.local_storage });
    setEditLoc(null);
    setForm({ code: "", description: "", local_storage: true });
    load();
  };

  const handleDelete = async (id: number) => {
    await api.deleteLocation(id);
    load();
  };

  const openEdit = (loc: Location) => {
    setEditLoc(loc);
    setForm({ code: loc.code, description: loc.description, local_storage: loc.local_storage });
  };

  if (loading) return <div className="flex items-center justify-center py-20 text-slate-500">Loading...</div>;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Locations</h1>
          <p className="text-sm text-slate-500">{locations.length} locations</p>
        </div>
        <Button onClick={() => { setForm({ code: "", description: "", local_storage: true }); setDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" /> New Location
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5" /> All Locations</CardTitle>
        </CardHeader>
        <CardContent>
          {locations.length === 0 ? (
            <p className="py-8 text-center text-slate-400">No locations yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {locations.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell><Badge variant="secondary" className="font-mono">{l.code}</Badge></TableCell>
                    <TableCell className="font-medium">{l.description}</TableCell>
                    <TableCell>
                      <Badge variant={l.local_storage ? "success" : "warning"}>
                        {l.local_storage ? "On-site" : "Off-site"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(l)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(l.id)}>
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

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen || !!editLoc} onOpenChange={(open) => { if (!open) { setDialogOpen(false); setEditLoc(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editLoc ? "Edit Location" : "Create Location"}</DialogTitle>
            <DialogDescription>{editLoc ? "Update location details." : "Add a new storage location."}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Code</Label>
              <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="e.g. LOC-01" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="e.g. Main Office Storage Room" />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.local_storage}
                onChange={(e) => setForm({ ...form, local_storage: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300"
                id="local_storage"
              />
              <Label htmlFor="local_storage">On-site (local) storage</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogOpen(false); setEditLoc(null); }}>Cancel</Button>
            <Button onClick={editLoc ? handleUpdate : handleCreate} disabled={!form.code || !form.description}>
              {editLoc ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
