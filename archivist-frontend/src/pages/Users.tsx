import { useEffect, useState } from "react";
import { api, type User } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { KeyRound, Plus, Shield, Trash2, Users as UsersIcon } from "lucide-react";
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

const PAGE_SIZE = 100;

export function Users() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [roleDialogUser, setRoleDialogUser] = useState<User | null>(null);
  const [resetDialogUser, setResetDialogUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState("");

  const loadUsers = async () => {
    setError("");
    setLoading(true);
    try {
      const allUsers: User[] = [];
      let offset = 0;

      while (true) {
        const page = await api.listUsers(offset, PAGE_SIZE);
        allUsers.push(...page);
        if (page.length < PAGE_SIZE) break;
        offset += PAGE_SIZE;
      }

      setUsers(allUsers);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers();
  }, []);

  const handleCreate = async () => {
    await api.createUser({
      username: form.username,
      email: form.email,
      full_name: form.full_name || null,
      password: form.password,
      is_active: form.is_active,
      is_admin: form.is_admin,
    });

    setDialogOpen(false);
    setForm(emptyForm);
    await loadUsers();
  };

  const handleUpdateRole = async (isAdmin: boolean) => {
    if (!roleDialogUser) return;
    await api.updateUser(roleDialogUser.id, { is_admin: isAdmin });
    setRoleDialogUser(null);
    await loadUsers();
  };

  const handleResetPassword = async () => {
    if (!resetDialogUser || !newPassword) return;

    await api.updateUser(resetDialogUser.id, { password: newPassword });
    setResetDialogUser(null);
    setNewPassword("");
    await loadUsers();
  };

  const handleDelete = async (id: number) => {
    await api.deleteUser(id);
    await loadUsers();
  };

  const activeAdminCount = users.filter((u) => u.is_admin && u.is_active).length;
  const isLastActiveAdmin = (u: User) => u.is_admin && u.is_active && activeAdminCount === 1;

  if (!currentUser?.is_admin) {
    return <div className="py-8 text-slate-500">You need admin access to manage users.</div>;
  }

  if (loading) return <div className="flex items-center justify-center py-20 text-slate-500">Loading...</div>;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Users</h1>
          <p className="text-sm text-slate-500">{users.length} accounts</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> New User
        </Button>
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UsersIcon className="h-5 w-5" /> User Directory
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => {
                const lastActiveAdmin = isLastActiveAdmin(u);
                const cannotDeleteSelf = u.id === currentUser.id;
                const disableRoleChange = lastActiveAdmin;
                const disableDelete = cannotDeleteSelf || lastActiveAdmin;
                const roleTitle = disableRoleChange
                  ? "Cannot change role for the last active admin"
                  : "Update role";
                const deleteTitle = cannotDeleteSelf
                  ? "You cannot delete yourself"
                  : lastActiveAdmin
                    ? "Cannot delete the last active admin"
                    : "Delete user";

                return (
                <TableRow key={u.id}>
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
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setRoleDialogUser(u)}
                        disabled={disableRoleChange}
                        title={roleTitle}
                      >
                        <Shield className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setResetDialogUser(u)} title="Reset password">
                        <KeyRound className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(u.id)}
                        disabled={disableDelete}
                        title={deleteTitle}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create User</DialogTitle>
            <DialogDescription>Create a new account and set initial access.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Username</Label>
              <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!form.username || !form.email || !form.password}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(roleDialogUser)} onOpenChange={(open) => !open && setRoleDialogUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Role</DialogTitle>
            <DialogDescription>Change account role for {roleDialogUser?.username}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Role</Label>
            <Select
              value={roleDialogUser?.is_admin ? "admin" : "user"}
              onValueChange={(value) => handleUpdateRole(value === "admin")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(resetDialogUser)} onOpenChange={(open) => !open && setResetDialogUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>Set a new password for {resetDialogUser?.username}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>New Password</Label>
            <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetDialogUser(null)}>Cancel</Button>
            <Button onClick={handleResetPassword} disabled={!newPassword}>Reset Password</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
