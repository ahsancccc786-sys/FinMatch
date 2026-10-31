import { BadgeCheck, BadgeAlert, BadgeHelp, ShieldAlert } from "lucide-react";
import type { MatchConfidence } from "../types";

const CONFIG: Record<MatchConfidence, { label: string; classes: string; icon: typeof BadgeCheck }> = {
  high: {
    label: "High Confidence",
    classes: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    icon: BadgeCheck,
  },
  medium: {
    label: "Medium Confidence",
    classes: "bg-fin-500/10 text-fin-600 dark:text-fin-300 border-fin-500/30",
    icon: BadgeAlert,
  },
  low: {
    label: "Low Confidence",
    classes: "bg-slate-400/10 text-slate-500 dark:text-slate-300 border-slate-400/30",
    icon: BadgeHelp,
  },
  ambiguous: {
    label: "Ambiguous — Needs Review",
    classes: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
    icon: ShieldAlert,
  },
};

export default function ConfidenceBadge({ confidence }: { confidence: MatchConfidence }) {
  const cfg = CONFIG[confidence];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${cfg.classes}`}>
      <Icon className="h-3.5 w-3.5" /> {cfg.label}
    </span>
  );
}
