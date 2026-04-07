import { useEffect, useState } from "react";
import { api, type Folder, type RetentionCode, type Box } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Trash2, FolderOpen } from "lucide-react";

export function Folders() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [codes, setCodes] = useState<RetentionCode[]>([]);
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
  const [form, setForm] = useState({ code: "", name: "", start_date: "" });
  const [selectedBox, setSelectedBox] = useState("");

  const load = () => {
    Promise.all([api.listFolders(), api.listCodes(), api.listBoxes()])
      .then(([f, c, b]) => { setFolders(f); setCodes(c); setBoxes(b); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    try {
      await api.createFolder({ code: form.code, name: form.name, start_date: form.start_date });
      setForm({ code: "", name: "", start_date: "" });
      setDialogOpen(false);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create folder");
    }
  };

  const handleDelete = async (id: number) => {
    await api.deleteFolder(id);
    load();
  };

  const handleAssign = async () => {
    if (selectedFolder && selectedBox) {
      await api.assignFolder(selectedFolder.id, parseInt(selectedBox));
      setAssignOpen(false);
      setSelectedFolder(null);
      setSelectedBox("");
      load();
    }
  };

  const handleUnassign = async (id: number) => {
    await api.unassignFolder(id);
    load();
  };

  const isExpired = (expiry: string | null) => {
    if (!expiry) return false;
    return new Date(expiry) < new Date();
  };

  if (loading) return <div className="flex items-center justify-center py-20 text-slate-500">Loading...</div>;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Folders</h1>
          <p className="text-sm text-slate-500">{folders.length} folders total</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> New Folder
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" /> All Folders
          </CardTitle>
        </CardHeader>
        <CardContent>
          {folders.length === 0 ? (
            <p className="py-8 text-center text-slate-400">No folders yet. Create one to get started.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Retention ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>Expiry</TableHead>
                  <TableHead>Box</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {folders.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell className="font-mono text-xs">{f.retention_id}</TableCell>
                    <TableCell className="font-medium">{f.name}</TableCell>
                    <TableCell><Badge variant="secondary">{f.code}</Badge></TableCell>
                    <TableCell>{f.start_date}</TableCell>
                    <TableCell>
                      {f.expiry_date ? (
                        <Badge variant={isExpired(f.expiry_date) ? "destructive" : "outline"}>
                          {f.expiry_date}
                        </Badge>
                      ) : (
                        <Badge variant="success">Permanent</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {f.box_id ? (
                        <div className="flex items-center gap-1">
                          <Badge variant="default">
                            {boxes.find((b) => b.id === f.box_id)?.code || `Box #${f.box_id}`}
                          </Badge>
                          <Button variant="ghost" size="sm" onClick={() => handleUnassign(f.id)} className="h-6 px-1 text-xs">
                            ×
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => { setSelectedFolder(f); setAssignOpen(true); }}
                          className="h-7 text-xs"
                        >
                          Assign
                        </Button>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(f.id)}>
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

      {/* Create Folder Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogDescription>Add a new folder to the archive system.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Retention Code</Label>
              <Select value={form.code} onValueChange={(v) => setForm({ ...form, code: v })}>
                <SelectTrigger><SelectValue placeholder="Select a code" /></SelectTrigger>
                <SelectContent>
                  {codes.map((c) => (
                    <SelectItem key={c.id} value={c.code}>{c.code} – {c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Folder Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Employee Files 2024" />
            </div>
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!form.code || !form.name || !form.start_date}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign to Box Dialog */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign to Box</DialogTitle>
            <DialogDescription>
              Assign folder "{selectedFolder?.name}" to a box.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={selectedBox} onValueChange={setSelectedBox}>
              <SelectTrigger><SelectValue placeholder="Select a box" /></SelectTrigger>
              <SelectContent>
                {boxes.map((b) => (
                  <SelectItem key={b.id} value={String(b.id)}>{b.code} – {b.name || "Unnamed"}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(false)}>Cancel</Button>
            <Button onClick={handleAssign} disabled={!selectedBox}>Assign</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
