import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  FolderOpen,
  Box,
  FileCode2,
  MapPin,
  Archive,
  Settings,
  Upload,
} from "lucide-react";

const links = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/folders", label: "Folders", icon: FolderOpen },
  { to: "/boxes", label: "Boxes", icon: Box },
  { to: "/codes", label: "Retention Codes", icon: FileCode2 },
  { to: "/locations", label: "Locations", icon: MapPin },
  { to: "/archives", label: "Archives", icon: Archive },
  { to: "/imports", label: "Import", icon: Upload },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-slate-50">
      <div className="flex h-14 items-center border-b px-4">
        <Archive className="mr-2 h-6 w-6 text-slate-700" />
        <span className="text-lg font-bold text-slate-900">Archivist</span>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t p-4 text-xs text-slate-400">
        Archivist v2.0
      </div>
    </aside>
  );
}
