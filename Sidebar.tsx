import {
  LayoutDashboard,
  UploadCloud,
  GitMerge,
  ClipboardCheck,
  Wallet,
  Database,
  FileBarChart2,
  LogOut,
  Landmark,
} from "lucide-react";
import type { PageKey } from "../types";
import { useApp } from "../context/AppContext";
import { cn } from "../utils/cn";

const NAV_ITEMS: { key: PageKey; label: string; icon: typeof LayoutDashboard }[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "upload", label: "Import Data", icon: UploadCloud },
  { key: "reconciliation", label: "Reconciliation", icon: GitMerge },
  { key: "manual-review", label: "Manual Review", icon: ClipboardCheck },
  { key: "pending-bills", label: "Pending / Outstanding", icon: Wallet },
  { key: "all-entries", label: "All Entries", icon: Database },
  { key: "reports", label: "Reports", icon: FileBarChart2 },
];

interface SidebarProps {
  current: PageKey;
  onNavigate: (page: PageKey) => void;
  mobileOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ current, onNavigate, mobileOpen, onClose }: SidebarProps) {
  const { user, logout } = useApp();

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={onClose} />
      )}
      <aside
        className={cn(
          "fixed z-40 flex h-full w-72 flex-col border-r border-fin-300/10 bg-fin-900 text-fin-50 transition-transform duration-300 lg:static lg:translate-x-0",
          "dark:bg-fin-950",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex items-center gap-3 border-b border-white/10 px-6 py-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-fin-400 to-fin-600 shadow-lg shadow-fin-900/50">
            <Landmark className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-lg font-bold tracking-tight text-white">FinMatch</p>
            <p className="text-[11px] uppercase tracking-widest text-fin-300">Reconciliation Suite</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-6">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = current === item.key;
            return (
              <button
                key={item.key}
                onClick={() => {
                  onNavigate(item.key);
                  onClose();
                }}
                className={cn(
                  "group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all",
                  active
                    ? "bg-gradient-to-r from-fin-600 to-fin-500 text-white shadow-md shadow-fin-900/40"
                    : "text-fin-200/80 hover:bg-white/5 hover:text-white"
                )}
              >
                <Icon className={cn("h-4 w-4 shrink-0", active ? "text-white" : "text-fin-300 group-hover:text-fin-200")} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="border-t border-white/10 px-4 py-4">
          <div className="mb-3 flex items-center gap-3 rounded-xl bg-white/5 px-3 py-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-fin-400 text-sm font-bold text-fin-950">
              {user?.name?.charAt(0).toUpperCase() ?? "U"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">{user?.name ?? "User"}</p>
              <p className="truncate text-xs text-fin-300">{user?.companyName ?? "Business"}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-fin-200 transition hover:bg-white/5 hover:text-white"
          >
            <LogOut className="h-4 w-4" /> Log out
          </button>
        </div>
      </aside>
    </>
  );
}
