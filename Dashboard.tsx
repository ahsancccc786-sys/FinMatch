import { useMemo } from "react";
import {
  IndianRupee,
  Wallet,
  CheckCircle2,
  Clock3,
  TrendingUp,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useApp } from "../context/AppContext";
import StatCard from "../components/StatCard";
import { formatINR } from "../utils/format";

const PIE_COLORS = ["#2a835f", "#439973", "#8bbb92", "#12544f", "#b6d4ba"];

export default function Dashboard() {
  const { invoices, payments, statusForInvoice, paidAmountForInvoice } = useApp();

  const totalBilled = useMemo(() => invoices.reduce((s, i) => s + i.amount, 0), [invoices]);
  const totalReceived = useMemo(() => payments.reduce((s, p) => s + p.amount, 0), [payments]);
  const totalMatchedBills = useMemo(
    () => invoices.filter((i) => statusForInvoice(i.id) === "Paid").length,
    [invoices, statusForInvoice]
  );
  const totalPending = useMemo(
    () => invoices.reduce((s, i) => s + Math.max(0, i.amount - paidAmountForInvoice(i.id)), 0),
    [invoices, paidAmountForInvoice]
  );

  const monthlyData = useMemo(() => {
    const months: { key: string; label: string }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleDateString("en-IN", { month: "short" }) });
    }
    return months.map(({ key, label }) => {
      const [y, m] = key.split("-").map(Number);
      const billed = invoices
        .filter((inv) => {
          const d = new Date(inv.date);
          return d.getFullYear() === y && d.getMonth() === m;
        })
        .reduce((s, i) => s + i.amount, 0);
      const received = payments
        .filter((p) => {
          const d = new Date(p.date);
          return d.getFullYear() === y && d.getMonth() === m;
        })
        .reduce((s, p) => s + p.amount, 0);
      return { month: label, Billed: billed, Received: received };
    });
  }, [invoices, payments]);

  const topCustomers = useMemo(() => {
    const map = new Map<string, number>();
    for (const inv of invoices) {
      map.set(inv.customerName, (map.get(inv.customerName) ?? 0) + inv.amount);
    }
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, value]) => ({ name, value }));
  }, [invoices]);

  const statusCounts = useMemo(() => {
    const counts = { Paid: 0, Partial: 0, Unpaid: 0 };
    for (const inv of invoices) counts[statusForInvoice(inv.id)]++;
    const total = invoices.length || 1;
    return {
      ...counts,
      total,
      paidPct: Math.round((counts.Paid / total) * 100),
      partialPct: Math.round((counts.Partial / total) * 100),
      unpaidPct: Math.round((counts.Unpaid / total) * 100),
    };
  }, [invoices, statusForInvoice]);

  return (
    <div className="animate-fade-in space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={IndianRupee} label="Total Billed" value={formatINR(totalBilled)} sub={`${invoices.length} invoices`} accent="fin" />
        <StatCard icon={Wallet} label="Total Money Received" value={formatINR(totalReceived)} sub={`${payments.length} payments`} accent="emerald" />
        <StatCard icon={CheckCircle2} label="Total Matched Bills" value={`${totalMatchedBills}`} sub="Fully reconciled invoices" accent="fin" />
        <StatCard icon={Clock3} label="Total Pending Amount" value={formatINR(totalPending)} sub="Across unpaid & partial bills" accent="rose" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="rounded-2xl border border-fin-900/10 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-fin-900 xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-fin-900 dark:text-white">Past 6 Months: Billed vs Received</h3>
              <p className="text-xs text-fin-500 dark:text-fin-400">Track financial health trends over time</p>
            </div>
            <TrendingUp className="h-5 w-5 text-fin-500" />
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={monthlyData} margin={{ left: -10, right: 10 }}>
              <defs>
                <linearGradient id="billedGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#12544f" stopOpacity={0.7} />
                  <stop offset="95%" stopColor="#12544f" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="receivedGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2a835f" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#2a835f" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-fin-900/5 dark:text-white/5" />
              <XAxis dataKey="month" stroke="currentColor" className="text-fin-600 dark:text-fin-300" fontSize={12} />
              <YAxis
                stroke="currentColor"
                className="text-fin-600 dark:text-fin-300"
                fontSize={12}
                tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(value) => formatINR(Number(value))}
                contentStyle={{ borderRadius: 12, border: "1px solid rgba(139,187,146,0.3)", background: "#092328", color: "#fff" }}
              />
              <Legend />
              <Area type="monotone" dataKey="Billed" stroke="#12544f" fill="url(#billedGradient)" strokeWidth={2} />
              <Area type="monotone" dataKey="Received" stroke="#2a835f" fill="url(#receivedGradient)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border border-fin-900/10 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-fin-900">
          <h3 className="font-semibold text-fin-900 dark:text-white">Top 5 Customers</h3>
          <p className="mb-2 text-xs text-fin-500 dark:text-fin-400">By total invoice value</p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={topCustomers} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                {topCustomers.map((_, idx) => (
                  <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatINR(Number(value))} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 space-y-1.5">
            {topCustomers.map((c, idx) => (
              <div key={c.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 truncate text-fin-700 dark:text-fin-200">
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                  <span className="truncate">{c.name}</span>
                </span>
                <span className="shrink-0 font-semibold text-fin-900 dark:text-white">{formatINR(c.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-fin-900/10 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-fin-900">
        <h3 className="mb-4 font-semibold text-fin-900 dark:text-white">Bills Status Summary</h3>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <StatusBar label="Paid" pct={statusCounts.paidPct} count={statusCounts.Paid} color="bg-emerald-500" />
          <StatusBar label="Partially Paid" pct={statusCounts.partialPct} count={statusCounts.Partial} color="bg-amber-500" />
          <StatusBar label="Unpaid" pct={statusCounts.unpaidPct} count={statusCounts.Unpaid} color="bg-rose-500" />
        </div>
      </div>
    </div>
  );
}

function StatusBar({ label, pct, count, color }: { label: string; pct: number; count: number; color: string }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="font-medium text-fin-700 dark:text-fin-200">{label}</span>
        <span className="font-semibold text-fin-900 dark:text-white">
          {pct}% <span className="font-normal text-fin-500 dark:text-fin-400">({count})</span>
        </span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-fin-900/5 dark:bg-white/10">
        <div className={`h-full rounded-full ${color} transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
