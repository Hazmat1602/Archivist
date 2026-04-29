import { useCallback, useEffect, useMemo, useState } from "react";
import { api, type Box, type Folder, type Location } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ExcelStyleDataTable, type ExcelColumnDef } from "@/components/ui/dataTable";
import { Plus, Trash2, Package, Pencil, Printer, MapPin } from "lucide-react";
import { useUserDisplayMap } from "@/lib/userDisplay";

export function Boxes() {
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editBox, setEditBox] = useState<Box | null>(null);
  const [form, setForm] = useState({ name: "", location_id: "" });
  const [bulkAssignOpen, setBulkAssignOpen] = useState(false);
  const [selectedBoxes, setSelectedBoxes] = useState<Box[]>([]);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectionResetKey, setSelectionResetKey] = useState(0);
  const { getUserLabel } = useUserDisplayMap();

  const load = () => {
    Promise.all([api.listBoxes(), api.listLocations(), api.listFolders()])
        .then(([b, l, f]) => { setBoxes(b); setLocations(l); setFolders(f); })
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

  const handleSelectedRowsChange = useCallback((rows: Box[]) => {
    setSelectedBoxes(rows);
  }, []);

  const handleClearSelection = () => {
    setSelectedBoxes([]);
    setSelectionResetKey((key) => key + 1);
  };

  const handlePrintSelectedLabels = async () => {
    if (selectedBoxes.length === 0) return;
    try {
      await api.downloadBoxLabels(selectedBoxes.map((box) => box.id));
    } catch {
      alert("Failed to generate selected box labels");
    }
  };

  const handleBulkAssignLocation = async () => {
    if (!selectedLocation || selectedBoxes.length === 0) return;

    await Promise.all(
      selectedBoxes.map((box) =>
        api.updateBox(box.id, {
          location_id: parseInt(selectedLocation, 10),
        }),
      ),
    );

    setBulkAssignOpen(false);
    setSelectedLocation("");
    setSelectedBoxes([]);
    setSelectionResetKey((key) => key + 1);
    load();
  };

  const isExpired = (expiry: string | null) => {
    if (!expiry) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(expiry) < today;
  };

  const expiryVariantByBox = useMemo(() => {
    const map = new Map<number, "destructive" | "warning" | "outline">();

    boxes.forEach((box) => {
      const boxFolders = folders.filter((folder) => folder.box_id === box.id);
      if (boxFolders.length === 0) {
        map.set(box.id, "outline");
        return;
      }

      const expiredCount = boxFolders.filter((folder) => isExpired(folder.expiry_date)).length;
      if (expiredCount === 0) {
        map.set(box.id, "outline");
      } else if (expiredCount === boxFolders.length) {
        map.set(box.id, "destructive");
      } else {
        map.set(box.id, "warning");
      }
    });

    return map;
  }, [boxes, folders]);

  const columns = useMemo<ExcelColumnDef<Box>[]>(() => [
    {
      accessorKey: "code",
      header: "Code",
      cell: ({ row }) => (
        <span className="font-mono text-xs">{row.original.code}</span>
      ),
      enableSorting: true,
      enableColumnFilter: true,
      filterFn: "excelLikeMultiValue" as const,
    },
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.name || "\u2014"}</span>
      ),
      enableSorting: true,
      enableColumnFilter: true,
      filterFn: "excelLikeMultiValue" as const,
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
      filterFn: "excelLikeMultiValue" as const,
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
        const variant = expiryVariantByBox.get(row.original.id) || "outline";
        return expiry ? (
            <Badge variant={variant}>{expiry}</Badge>
        ) : "\u2014";
      },
      enableSorting: true,
      enableColumnFilter: true,
      filterFn: "excelLikeMultiValue" as const,
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
      filterFn: "excelLikeMultiValue" as const,
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
      filterFn: "excelLikeMultiValue" as const,
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
                {getUserLabel(b.modified_by)}
              </span>
            ) : b.created_by != null ? (
              <span>Created by {getUserLabel(b.created_by)}</span>
            ) : (
              "\u2014"
            )}
          </span>
        );
      },
      enableSorting: true,
      enableColumnFilter: true,
      filterFn: "excelLikeMultiValue" as const,
      meta: {
        getFilterValue: (box) => {
          if (box.modified_by != null) return `modified:${box.modified_by}`;
          if (box.created_by != null) return `created:${box.created_by}`;
          return "none";
        },
        getOptionLabel: (box) => {
          if (box.modified_by != null) return getUserLabel(box.modified_by) || "—";
          if (box.created_by != null) return `Created by ${getUserLabel(box.created_by)}`;
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
        <div className="text-right max-w-[80px]">
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
      meta: { filterVariant: "none" as const, headerClassName: "text-center" },
    },
  ], [expiryVariantByBox, locations, handleDelete, openEdit, getUserLabel]);

  if (loading) return <div className="flex items-center justify-center py-20 text-slate-500">Loading...</div>;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Boxes</h1>
          <p className="text-sm text-slate-500">{boxes.length} boxes total</p>
        </div>
        <div className="flex gap-2">
          {selectedBoxes.length > 0 && (
            <>
              <Button variant="outline" onClick={handlePrintSelectedLabels}>
                <Printer className="mr-2 h-4 w-4" />
                Print Selected Labels ({selectedBoxes.length})
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedLocation("");
                  setBulkAssignOpen(true);
                }}
              >
                <MapPin className="mr-2 h-4 w-4" />
                Bulk Assign Location ({selectedBoxes.length})
              </Button>
              <Button variant="destructive" onClick={handleClearSelection}>
                Clear
              </Button>
              <Separator orientation="vertical" className="h-9" />
            </>
          )}
          <Button
            variant="outline"
            onClick={async () => {
              try {
                await api.downloadBoxLabels();
              } catch {
                alert("Failed to generate box labels");
              }
            }}
          >
            <Printer className="mr-2 h-4 w-4" /> Print Labels
          </Button>
          <Button onClick={() => { setForm({ name: "", location_id: "" }); setDialogOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" /> New Box
          </Button>
        </div>
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
            rowIdAccessor={(box) => String(box.id)}
            onSelectedRowsChange={handleSelectedRowsChange}
            selectionResetKey={selectionResetKey}
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
                    <SelectItem key={l.id} value={String(l.id)}>{l.code} - {l.description}</SelectItem>
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
                    <SelectItem key={l.id} value={String(l.id)}>{l.code} - {l.description}</SelectItem>
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

      {/* Bulk Assign Location Dialog */}
      <Dialog open={bulkAssignOpen} onOpenChange={setBulkAssignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Assign Boxes to Location</DialogTitle>
            <DialogDescription>
              Assign {selectedBoxes.length} selected box{selectedBoxes.length === 1 ? "" : "es"} to a location.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger><SelectValue placeholder="Select a location" /></SelectTrigger>
              <SelectContent>
                {locations.map((location) => (
                  <SelectItem key={location.id} value={String(location.id)}>
                    {location.code} - {location.description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkAssignOpen(false)}>Cancel</Button>
            <Button onClick={handleBulkAssignLocation} disabled={!selectedLocation || selectedBoxes.length === 0}>
              Assign Selected
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
