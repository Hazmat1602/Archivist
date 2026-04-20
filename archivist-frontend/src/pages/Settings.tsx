import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Database, Server, Info, User } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

export function Settings() {
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
  const { user } = useAuth();

  const [status, setStatus] = useState<"checking" | "connected" | "error">("checking");

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const res = await fetch(`${apiUrl}/health`, {
          method: "GET",
        });

        if (res.ok) {
          setStatus("connected");
        } else {
          setStatus("error");
        }
      } catch {
        setStatus("error");
      }
    };

    checkConnection();
  }, [apiUrl]);

  const renderStatus = () => {
    switch (status) {
      case "checking":
        return <Badge variant="outline">Checking...</Badge>;
      case "connected":
        return <Badge variant="success">Connected</Badge>;
      case "error":
        return <Badge variant="destructive">Offline</Badge>;
    }
  };

  return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
          <p className="text-sm text-slate-500">Application configuration and information</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><User className="h-5 w-5" /> Account</CardTitle>
            <CardDescription>Your account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Username</span>
              <span className="text-sm font-medium">{user?.username}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Email</span>
              <span className="text-sm font-medium">{user?.email}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Full Name</span>
              <span className="text-sm font-medium">{user?.full_name || "—"}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Role</span>
              <Badge variant={user?.is_admin ? "default" : "secondary"}>
                {user?.is_admin ? "Admin" : "User"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" /> API Connection
              </CardTitle>
              <CardDescription>Backend server configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">API URL</span>
                <Badge variant="outline" className="font-mono text-xs">{apiUrl}</Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Status</span>
                {renderStatus()}
              </div>
            </CardContent>
          </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Database className="h-5 w-5" /> Database</CardTitle>
            <CardDescription>Storage backend information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Engine</span>
              <Badge variant="secondary">SQL Server</Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Driver</span>
              <Badge variant="outline">pyodbc (ODBC 18)</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Info className="h-5 w-5" /> About Archivist</CardTitle>
            <CardDescription>Application information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Version</span>
              <Badge>v2.0.0</Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Architecture</span>
              <span className="text-sm">FastAPI + React + SQL Server</span>
            </div>
            <Separator />
            <p className="text-sm text-slate-500">
              Archivist is a records management system for tracking physical archives, boxes, and folders
              with automated retention period calculations and lifecycle management.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
