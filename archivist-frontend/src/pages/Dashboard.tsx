import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api, type DashboardStats } from "@/lib/api";
import {
  FolderOpen,
  Box,
  FileCode2,
  MapPin,
  AlertTriangle,
  Clock,
  FolderX,
} from "lucide-react";

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getStats().then(setStats).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-slate-500">Loading dashboard...</div>;
  }

  if (!stats) {
    return <div className="text-red-500">Failed to load dashboard stats.</div>;
  }

  const cards = [
    { title: "Total Folders", value: stats.total_folders, icon: FolderOpen, color: "text-blue-600 bg-blue-50" },
    { title: "Total Boxes", value: stats.total_boxes, icon: Box, color: "text-indigo-600 bg-indigo-50" },
    { title: "Retention Codes", value: stats.total_codes, icon: FileCode2, color: "text-purple-600 bg-purple-50" },
    { title: "Locations", value: stats.total_locations, icon: MapPin, color: "text-emerald-600 bg-emerald-50" },
    { title: "Unassigned Folders", value: stats.unassigned_folders, icon: FolderX, color: "text-amber-600 bg-amber-50" },
    { title: "Expiring Soon", value: stats.expiring_soon, icon: Clock, color: "text-orange-600 bg-orange-50" },
    { title: "Expired", value: stats.expired, icon: AlertTriangle, color: "text-red-600 bg-red-50" },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500">Overview of your archive system</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(({ title, value, icon: Icon, color }) => (
          <Card key={title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">{title}</CardTitle>
              <div className={`rounded-lg p-2 ${color}`}>
                <Icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{value}</div>
              {title === "Expired" && value > 0 && (
                <Badge variant="destructive" className="mt-2">Action Required</Badge>
              )}
              {title === "Expiring Soon" && value > 0 && (
                <Badge variant="warning" className="mt-2">Review Needed</Badge>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
