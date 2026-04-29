import { useEffect, useMemo, useState } from "react";
import { api, type Archive } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { ExcelStyleDataTable, type ExcelColumnDef } from "@/components/ui/dataTable";
import { Plus, Trash2, Archive as ArchiveIcon, Pencil } from "lucide-react";
import { useUserDisplayMap } from "@/lib/userDisplay";

export function Archives() {
  const [archives, setArchives] = useState<Archive[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editArc, setEditArc] = useState<Archive | null>(null);
  const [form, setForm] = useState({ code: "", name: "", address: "" });
  const { getUserLabel } = useUserDisplayMap();

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

  const columns = useMemo<ExcelColumnDef<Archive>[]>(() => [
    {
      accessorKey: "code",
      header: "Code",
      cell: ({ row }) => (
        <Badge variant="secondary" className="font-mono">{row.original.code}</Badge>
      ),
      enableSorting: true,
      enableColumnFilter: true,
      filterFn: "excelLikeMultiValue",
    },
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.name}</span>
      ),
      enableSorting: true,
      enableColumnFilter: true,
      filterFn: "excelLikeMultiValue",
    },
    {
      accessorKey: "address",
      header: "Address",
      cell: ({ row }) => (
        <span className="text-sm text-slate-500">{row.original.address || "\u2014"}</span>
      ),
      enableSorting: true,
      enableColumnFilter: true,
      filterFn: "excelLikeMultiValue",
      meta: {
        getFilterValue: (arc) => arc.address || "",
        getOptionLabel: (arc) => arc.address || "(Blank)",
      },
    },
    {
      accessorKey: "modified_at",
      header: "Modified",
      cell: ({ row }) => {
        const a = row.original;
        return (
          <span className="text-xs text-slate-400">
            {a.modified_by != null ? (
              <span title={a.modified_at ? new Date(a.modified_at).toLocaleString() : undefined}>
                {getUserLabel(a.modified_by)}
              </span>
            ) : a.created_by != null ? (
              <span>Created by {getUserLabel(a.created_by)}</span>
            ) : (
              "\u2014"
            )}
          </span>
        );
      },
      enableSorting: true,
      enableColumnFilter: true,
      filterFn: "excelLikeMultiValue",
      meta: {
        getFilterValue: (arc) => {
          if (arc.modified_by != null) return `modified:${arc.modified_by}`;
          if (arc.created_by != null) return `created:${arc.created_by}`;
          return "none";
        },
        getOptionLabel: (arc) => {
          if (arc.modified_by != null) return getUserLabel(arc.modified_by) || "—";
          if (arc.created_by != null) return `Created by ${getUserLabel(arc.created_by)}`;
          return "\u2014";
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
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="text-right">
          <Button variant="ghost" size="icon" onClick={() => openEdit(row.original)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => handleDelete(row.original.id)}>
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ),
      enableSorting: false,
      enableColumnFilter: false,
      meta: { filterVariant: "none" as const, headerClassName: "text-right" },
    },
  ], []);

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
          <ExcelStyleDataTable
            columns={columns}
            data={archives}
            pageSize={10}
            emptyMessage="No archives yet."
          />
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
