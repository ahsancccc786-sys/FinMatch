import type { LucideIcon } from "lucide-react";
import { cn } from "../utils/cn";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  sub?: string;
  accent?: "fin" | "emerald" | "rose" | "amber";
}

const ACCENTS: Record<string, string> = {
  fin: "from-fin-500 to-fin-700 shadow-fin-900/30",
  emerald: "from-emerald-500 to-emerald-700 shadow-emerald-900/30",
  rose: "from-rose-500 to-rose-700 shadow-rose-900/30",
  amber: "from-amber-500 to-amber-600 shadow-amber-900/30",
};

export default function StatCard({ icon: Icon, label, value, sub, accent = "fin" }: StatCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-fin-900/10 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:border-white/10 dark:bg-fin-900">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-fin-600 dark:text-fin-300">{label}</p>
          <p className="mt-2 text-2xl font-bold text-fin-900 dark:text-white">{value}</p>
          {sub && <p className="mt-1 text-xs text-fin-500 dark:text-fin-400">{sub}</p>}
        </div>
        <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg", ACCENTS[accent])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-fin-500/5 dark:bg-fin-400/5" />
    </div>
  );
}
