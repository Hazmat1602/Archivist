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
  LogOut,
  User,
  Users,
  Search,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";

const topLinks = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/search", label: "Search", icon: Search },
  { to: "/folders", label: "Folders", icon: FolderOpen },
  { to: "/boxes", label: "Boxes", icon: Box },
  { to: "/codes", label: "Retention Codes", icon: FileCode2 },
  { to: "/locations", label: "Locations", icon: MapPin },
  //{ to: "/archives", label: "Archives", icon: Archive },
];

const bottomLinks = [
  { to: "/imports", label: "Import", icon: Upload },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const { user, logout } = useAuth();
  const { mode, cycleMode } = useTheme();

  const visibleTopLinks = user?.is_admin
    ? [...topLinks, { to: "/users", label: "Users", icon: Users }]
    : topLinks;

  const themeIcon =
    mode === "light" ? <Sun className="h-4 w-4" /> : mode === "dark" ? <Moon className="h-4 w-4" /> : <Monitor className="h-4 w-4" />;

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
      <div className="flex h-14 items-center border-b border-slate-200 px-4 dark:border-slate-800">
        <Archive className="mr-2 h-6 w-6 text-slate-700 dark:text-slate-200" />
        <span className="text-lg font-bold text-slate-900 dark:text-slate-100">Archivist</span>
      </div>
      <nav className="flex h-full flex-1 flex-col p-3">
        <div className="space-y-1">
          {visibleTopLinks.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                }`
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </div>

        <div className="mt-auto space-y-1">
          {bottomLinks.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                }`
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>
      <div className="border-t border-slate-200 p-3 dark:border-slate-800">
        <button
          onClick={cycleMode}
          className="mb-3 flex w-full items-center justify-center gap-2 rounded-md border border-slate-200 px-2 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"
          title="Toggle theme: Light → Dark → System"
        >
          {themeIcon}
          <span className="capitalize">{mode}</span>
        </button>

        {user && (
          <div className="flex items-center justify-between">
            <div className="flex min-w-0 items-center gap-2">
              <User className="h-4 w-4 shrink-0 text-slate-500 dark:text-slate-400" />
              <span className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">
                {user.full_name || user.username}
              </span>
            </div>
            <button
              onClick={logout}
              className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
        <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">Archivist v2.0</p>
      </div>
    </aside>
  );
}
