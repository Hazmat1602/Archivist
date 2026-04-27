import { useEffect, useState } from "react";
import { api, type User } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Users as UsersIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface UserForm {
  username: string;
  email: string;
  full_name: string;
  password: string;
  is_active: boolean;
  is_admin: boolean;
}

const emptyForm: UserForm = {
  username: "",
  email: "",
  full_name: "",
  password: "",
  is_active: true,
  is_admin: false,
};

export function Users() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [selectionAnchorIndex, setSelectionAnchorIndex] = useState<number | null>(null);

  const handleUserSelection = (userId: number, rowIndex: number, event?: Pick<MouseEvent, "shiftKey" | "ctrlKey" | "metaKey">) => {
    const isRangeSelection = event?.shiftKey === true;
    const isAdditiveSelection = event?.ctrlKey === true || event?.metaKey === true;

    if (isRangeSelection) {
      const anchor = selectionAnchorIndex ?? rowIndex;
      const [start, end] = anchor <= rowIndex ? [anchor, rowIndex] : [rowIndex, anchor];
      const rangeIds = users.slice(start, end + 1).map((u) => u.id);
      setSelectedUserIds((current) => (isAdditiveSelection ? Array.from(new Set([...current, ...rangeIds])) : rangeIds));
      if (selectionAnchorIndex == null) {
        setSelectionAnchorIndex(rowIndex);
      }
      return;
    }

    if (isAdditiveSelection) {
      setSelectedUserIds((current) => (
        current.includes(userId)
          ? current.filter((id) => id !== userId)
          : [...current, userId]
      ));
      setSelectionAnchorIndex(rowIndex);
      return;
    }

    setSelectedUserIds([userId]);
    setSelectionAnchorIndex(rowIndex);
  };

  const allVisibleSelected = users.length > 0 && selectedUserIds.length === users.length;
  const someVisibleSelected = selectedUserIds.length > 0 && !allVisibleSelected;

  const handleSelectAllVisibleUsers = (checked: boolean) => {
    if (checked) {
      setSelectedUserIds(users.map((u) => u.id));
      return;
    }
    setSelectedUserIds([]);
  };

  const loadUsers = () => {
    setError("");
    api.listUsers()
      .then(setUsers)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    const visibleIds = new Set(users.map((u) => u.id));
    setSelectedUserIds((current) => current.filter((id) => visibleIds.has(id)));
    if (selectionAnchorIndex !== null && (selectionAnchorIndex < 0 || selectionAnchorIndex >= users.length)) {
      setSelectionAnchorIndex(null);
    }
  }, [users, selectionAnchorIndex]);

  const openCreate = () => {
    setEditUser(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (selected: User) => {
    setEditUser(selected);
    setForm({
      username: selected.username,
      email: selected.email,
      full_name: selected.full_name || "",
      password: "",
      is_active: selected.is_active,
      is_admin: selected.is_admin,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (editUser) {
      await api.updateUser(editUser.id, {
        email: form.email,
        full_name: form.full_name || null,
        is_active: form.is_active,
        is_admin: form.is_admin,
        ...(form.password ? { password: form.password } : {}),
      });
    } else {
      await api.createUser({
        username: form.username,
        email: form.email,
        full_name: form.full_name || null,
        password: form.password,
        is_active: form.is_active,
        is_admin: form.is_admin,
      });
    }
    setDialogOpen(false);
    setEditUser(null);
    setForm(emptyForm);
    loadUsers();
  };

  const handleDelete = async (id: number) => {
    await api.deleteUser(id);
    loadUsers();
  };

  if (!currentUser?.is_admin) {
    return (
      <div className="py-8 text-slate-500">
        You need admin access to manage users.
      </div>
    );
  }

  if (loading) return <div className="flex items-center justify-center py-20 text-slate-500">Loading...</div>;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Users</h1>
          <p className="text-sm text-slate-500">{users.length} accounts</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" /> New User
        </Button>
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><UsersIcon className="h-5 w-5" /> User Directory</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10 px-2">
                  <Checkbox
                    checked={allVisibleSelected ? true : someVisibleSelected ? "indeterminate" : false}
                    onCheckedChange={(checked) => handleSelectAllVisibleUsers(checked === true)}
                    aria-label="Select all users"
                  />
                </TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u, rowIndex) => (
                <TableRow
                  key={u.id}
                  className="cursor-pointer"
                  data-state={selectedUserIds.includes(u.id) ? "selected" : undefined}
                  onClick={(event) => {
                    const target = event.target as HTMLElement;
                    if (target.closest("button, a, input, select, textarea, [role='button']")) {
                      return;
                    }
                    handleUserSelection(u.id, rowIndex, event.nativeEvent);
                  }}
                >
                  <TableCell className="w-10 px-2">
                    <Checkbox
                      data-row-checkbox="true"
                      checked={selectedUserIds.includes(u.id)}
                      onClick={(event) => {
                        handleUserSelection(u.id, rowIndex, event.nativeEvent);
                      }}
                      onCheckedChange={() => {}}
                      aria-label={`Select ${u.username}`}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{u.username}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>{u.full_name || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={u.is_active ? "success" : "destructive"}>{u.is_active ? "Active" : "Disabled"}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={u.is_admin ? "default" : "secondary"}>{u.is_admin ? "Admin" : "User"}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(u)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(u.id)}
                      disabled={u.id === currentUser.id}
                      title={u.id === currentUser.id ? "You cannot delete yourself" : "Delete user"}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editUser ? "Edit User" : "Create User"}</DialogTitle>
            <DialogDescription>
              {editUser ? "Update account details and permissions." : "Create a new account and set initial access."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {!editUser && (
              <div className="space-y-2">
                <Label>Username</Label>
                <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
              </div>
            )}
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>{editUser ? "New Password (optional)" : "Password"}</Label>
              <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>

            <div className="flex items-center gap-2">
              <input
                id="is_active"
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              />
              <Label htmlFor="is_active">Active account</Label>
            </div>

            <div className="flex items-center gap-2">
              <input
                id="is_admin"
                type="checkbox"
                checked={form.is_admin}
                onChange={(e) => setForm({ ...form, is_admin: e.target.checked })}
                disabled={editUser?.id === currentUser.id}
              />
              <Label htmlFor="is_admin">Admin privileges</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSave}
              disabled={!form.email || (!editUser && (!form.username || !form.password))}
            >
              {editUser ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
