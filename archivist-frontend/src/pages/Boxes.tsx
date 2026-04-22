import { useEffect, useMemo, useState } from "react";
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
import { ExcelStyleDataTable, type ExcelColumnDef } from "@/components/ui/dataTable";
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

  const columns = useMemo<ExcelColumnDef<Box>[]>(() => [
    {
      accessorKey: "code",
      header: "Code",
      cell: ({ row }) => (
        <span className="font-mono text-xs">{row.original.code}</span>
      ),
      enableSorting: true,
      enableColumnFilter: true,
      filterFn: "excelLikeMultiValue",
    },
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.name || "\u2014"}</span>
      ),
      enableSorting: true,
      enableColumnFilter: true,
      filterFn: "excelLikeMultiValue",
      meta: {
        getFilterValue: (box) => box.name || "",
        getOptionLabel: (box) => box.name || "(Blank)",
      },
    },
    {
      accessorKey: "created_date",
      header: "Created",
      cell: ({ row }) => row.original.created_date,
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
          <Badge variant="outline">{expiry}</Badge>
        ) : "\u2014";
      },
      enableSorting: true,
      enableColumnFilter: true,
      filterFn: "excelLikeMultiValue",
      meta: {
        getOptionLabel: (box) => box.expiry_date || "(None)",
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
      accessorKey: "location_id",
      header: "Location",
      cell: ({ row }) => {
        const b = row.original;
        return b.location_id
          ? locations.find((l) => l.id === b.location_id)?.code || `#${b.location_id}`
          : <span className="text-slate-400">None</span>;
      },
      enableSorting: true,
      enableColumnFilter: true,
      filterFn: "excelLikeMultiValue",
      meta: {
        getFilterValue: (box) => box.location_id != null ? String(box.location_id) : "",
        getOptionLabel: (box) => {
          if (!box.location_id) return "None";
          const loc = locations.find((l) => l.id === box.location_id);
          return loc?.code || `#${box.location_id}`;
        },
      },
    },
    {
      accessorKey: "folder_count",
      header: "Folders",
      cell: ({ row }) => (
        <Badge variant="secondary">{row.original.folder_count}</Badge>
      ),
      enableSorting: true,
      enableColumnFilter: true,
      filterFn: "excelLikeMultiValue",
    },
    {
      accessorKey: "modified_at",
      header: "Modified",
      cell: ({ row }) => {
        const b = row.original;
        return (
          <span className="text-xs text-slate-400">
            {b.modified_by != null ? (
              <span title={b.modified_at ? new Date(b.modified_at).toLocaleString() : undefined}>
                User #{b.modified_by}
              </span>
            ) : b.created_by != null ? (
              <span>Created by #{b.created_by}</span>
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
        getFilterValue: (box) => {
          if (box.modified_by != null) return `modified:${box.modified_by}`;
          if (box.created_by != null) return `created:${box.created_by}`;
          return "none";
        },
        getOptionLabel: (box) => {
          if (box.modified_by != null) return `User #${box.modified_by}`;
          if (box.created_by != null) return `Created by #${box.created_by}`;
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
  ], [locations]);

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
          <ExcelStyleDataTable
            columns={columns}
            data={boxes}
            pageSize={10}
            emptyMessage="No boxes yet. Create one to get started."
          />
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
                    <SelectItem key={l.id} value={String(l.id)}>{l.code} \u2013 {l.description}</SelectItem>
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
                    <SelectItem key={l.id} value={String(l.id)}>{l.code} \u2013 {l.description}</SelectItem>
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
