import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Database, Server, Info } from "lucide-react";

export function Settings() {
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500">Application configuration and information</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Server className="h-5 w-5" /> API Connection</CardTitle>
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
              <Badge variant="success">Connected</Badge>
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
