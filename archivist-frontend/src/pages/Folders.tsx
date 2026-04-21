import { useEffect, useMemo, useState } from "react";
import { api, type Folder, type RetentionCode, type Box, type UserSummary } from "@/lib/api";
import { formatModifiedLabel } from "@/lib/audit";
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
import { ExcelStyleDataTable, type ExcelColumnDef } from "@/components/ui/dataTable";
import { Plus, Trash2, FolderOpen } from "lucide-react";

export function Folders() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [codes, setCodes] = useState<RetentionCode[]>([]);
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
  const [form, setForm] = useState({ code: "", name: "", start_date: "" });
  const [selectedBox, setSelectedBox] = useState("");

  const load = () => {
    Promise.all([api.listFolders(), api.listCodes(), api.listBoxes(), api.listUsers()])
      .then(([f, c, b, u]) => { setFolders(f); setCodes(c); setBoxes(b); setUsers(u); })
      .finally(() => setLoading(false));
  };

  const userLookup = useMemo(
    () => Object.fromEntries(users.map((user) => [user.id, user.username])),
    [users],
  );

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

  const boxOptions = useMemo(
      () =>
          boxes.map((b) => ({
            label: `${b.code} – ${b.name || "Unnamed"}`,
            value: String(b.id),
          })),
      [boxes]
  );

  const columns = useMemo<ExcelColumnDef<Folder>[]>(() => [
    {
      accessorKey: "retention_id",
      header: "Retention ID",
      cell: ({ row }) => (
          <span className="font-mono text-xs">{row.original.retention_id}</span>
      ),
      enableSorting: true,
      enableColumnFilter: true,
      filterFn: "excelLikeMultiValue",
      meta: {
        getFilterValue: (folder) =>
            folder.retention_id == null ? "" : String(folder.retention_id),
        getOptionLabel: (folder) =>
            folder.retention_id == null ? "(Blank)" : String(folder.retention_id),
      },
    },
    {
      accessorKey: "code",
      header: "Code",
      cell: ({ row }) => (
          <Badge variant="secondary">{row.original.code}</Badge>
      ),
      enableSorting: true,
      enableColumnFilter: true,
      filterFn: "excelLikeMultiValue",
    },
    {
      accessorKey: "start_date",
      header: "Start Date",
      cell: ({ row }) => row.original.start_date || "—",
      enableSorting: true,
      enableColumnFilter: true,
      filterFn: "excelLikeMultiValue",
      sortingFn: (a, b, id) => {
        const aTime = a.getValue<string | null>(id) ? new Date(a.getValue<string>(id)).getTime() : 0;
        const bTime = b.getValue<string | null>(id) ? new Date(b.getValue<string>(id)).getTime() : 0;
        return aTime - bTime;
      },
    },
    {
      accessorKey: "expiry_date",
      header: "Expiry",
      cell: ({ row }) => {
        const expiry = row.original.expiry_date;
        return expiry ? (
            <Badge variant={isExpired(expiry) ? "destructive" : "outline"}>
              {expiry}
            </Badge>
        ) : (
            <Badge variant="success">Permanent</Badge>
        );
      },
      enableSorting: true,
      enableColumnFilter: true,
      filterFn: "excelLikeMultiValue",
      meta: {
        getOptionLabel: (folder) => folder.expiry_date || "Permanent",
      },
      sortingFn: (a, b, id) => {
        const aVal = a.getValue<string | null>(id);
        const bVal = b.getValue<string | null>(id);
        const aTime = aVal ? new Date(aVal).getTime() : Number.MAX_SAFE_INTEGER;
        const bTime = bVal ? new Date(bVal).getTime() : Number.MAX_SAFE_INTEGER;
        return aTime - bTime;
      },
    },
    {
      accessorKey: "box_id",
      header: "Box",
      cell: ({ row }) => {
        const f = row.original;

        return f.box_id ? (
            <div className="flex items-center gap-1">
              <Badge variant="default">
                {boxes.find((b) => b.id === f.box_id)?.code || `Box #${f.box_id}`}
              </Badge>
              <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleUnassign(f.id)}
                  className="h-6 px-1 text-xs"
              >
                ×
              </Button>
            </div>
        ) : (
            <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedFolder(f);
                  setAssignOpen(true);
                }}
                className="h-7 text-xs"
            >
              Assign
            </Button>
        );
      },
      enableSorting: true,
      enableColumnFilter: true,
      filterFn: "excelLikeMultiValue",
      meta: {
        getOptionLabel: (folder) => {
          if (!folder.box_id) return "Unassigned";
          const box = boxes.find((b) => b.id === folder.box_id);
          return box?.code || `Box #${folder.box_id}`;
        },
      },
    },
    {
      accessorKey: "modified_at",
      header: "Modified",
      cell: ({ row }) => {
        const f = row.original;
        return (
            <span className="text-xs text-slate-400">
        <span title={f.modified_at ? new Date(f.modified_at).toLocaleString() : undefined}>
          {formatModifiedLabel(f, userLookup)}
        </span>
      </span>
        );
      },
      enableSorting: true,
      enableColumnFilter: true,
      filterFn: "excelLikeMultiValue",
      meta: {
        getFilterValue: (folder) => {
          if (folder.modified_by != null) return `modified:${folder.modified_by}`;
          if (folder.created_by != null) return `created:${folder.created_by}`;
          return "none";
        },
        getOptionLabel: (folder) => {
          if (folder.modified_by != null) return userLookup[folder.modified_by] || `User #${folder.modified_by}`;
          if (folder.created_by != null) return `Created by ${userLookup[folder.created_by] || `#${folder.created_by}`}`;
          return "—";
        },
      },
      sortingFn: (a, b, id) => {
        const aVal = a.getValue<string | null>(id);
        const bVal = b.getValue<string | null>(id);
        const aTime = aVal ? new Date(aVal).getTime() : 0;
        const bTime = bVal ? new Date(bVal).getTime() : 0;
        return aTime - bTime;
      },
    },
  ], [boxes, boxOptions, userLookup]);

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
              <p className="py-8 text-center text-slate-400">
                No folders yet. Create one to get started.
              </p>
          ) : (
              <ExcelStyleDataTable
                  columns={columns}
                  data={folders}
                  pageSize={10}
                  emptyMessage="No folders found."
              />
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
