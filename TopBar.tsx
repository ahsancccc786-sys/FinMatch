import { Menu, Moon, Sun, Bell } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import type { PageKey } from "../types";

const TITLES: Record<PageKey, { title: string; subtitle: string }> = {
  dashboard: { title: "Dashboard", subtitle: "Your business reconciliation, at a glance" },
  upload: { title: "Import Data", subtitle: "Upload invoices.csv and payments.csv" },
  reconciliation: { title: "Reconciliation Engine", subtitle: "Review AI-suggested invoice ↔ payment matches" },
  "manual-review": { title: "Manual Review", subtitle: "Edit, confirm or reject uncertain matches" },
  "pending-bills": { title: "Pending & Outstanding Balances", subtitle: "Track dues and send WhatsApp reminders" },
  "all-entries": { title: "All Entries", subtitle: "Master data for invoices & payments" },
  reports: { title: "Reports", subtitle: "Reconciliation summary & exports" },
};

interface TopBarProps {
  page: PageKey;
  onMenuClick: () => void;
}

export default function TopBar({ page, onMenuClick }: TopBarProps) {
  const { theme, toggleTheme } = useTheme();
  const meta = TITLES[page];

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-fin-900/10 bg-fin-50/80 px-4 py-4 backdrop-blur-md dark:border-white/10 dark:bg-fin-950/80 sm:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 text-fin-700 hover:bg-fin-900/5 dark:text-fin-200 dark:hover:bg-white/5 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="min-w-0">
          <h1 className="truncate text-lg font-bold text-fin-900 dark:text-white sm:text-xl">{meta.title}</h1>
          <p className="truncate text-xs text-fin-600 dark:text-fin-300 sm:text-sm">{meta.subtitle}</p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <span className="hidden rounded-full border border-fin-500/30 bg-fin-500/10 px-3 py-1 text-xs font-semibold text-fin-700 dark:text-fin-200 sm:inline-block">
          ₹ INR
        </span>
        <button className="relative rounded-full p-2 text-fin-700 hover:bg-fin-900/5 dark:text-fin-200 dark:hover:bg-white/5">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500" />
        </button>
        <button
          onClick={toggleTheme}
          className="flex items-center gap-2 rounded-full border border-fin-900/10 bg-white px-3 py-2 text-fin-700 shadow-sm transition hover:shadow-md dark:border-white/10 dark:bg-fin-800 dark:text-fin-100"
          title="Toggle dark / light theme"
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          <span className="hidden text-xs font-medium sm:inline">{theme === "dark" ? "Light mode" : "Dark mode"}</span>
        </button>
      </div>
    </header>
  );
}
