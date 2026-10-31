import { useMemo } from "react";
import { FileDown, Printer, CheckCircle2, AlertTriangle, Wallet, IndianRupee } from "lucide-react";
import { useApp } from "../context/AppContext";
import StatCard from "../components/StatCard";
import { formatINR, formatDate } from "../utils/format";
import { downloadCsv } from "../utils/csv";

export default function Reports() {
  const { invoices, payments, matches, suggestions, remainingBalanceForInvoice, statusForInvoice, user } = useApp();

  const confirmedMatches = useMemo(() => matches.filter((m) => m.status === "confirmed"), [matches]);
  const totalReconciled = confirmedMatches.reduce((sum, m) => {
    const p = payments.find((pp) => pp.id === m.paymentId);
    return sum + (p?.amount ?? 0);
  }, 0);
  const totalOutstanding = invoices.reduce((s, i) => s + remainingBalanceForInvoice(i.id), 0);
  const unresolved = suggestions.filter((s) => s.confidence === "ambiguous" || s.confidence === "low").length;

  const reconciledRows = useMemo(
    () =>
      confirmedMatches.map((m) => {
        const inv = invoices.find((i) => i.id === m.invoiceId);
        const pay = payments.find((p) => p.id === m.paymentId);
        return {
          invoiceId: inv?.invoiceId ?? "—",
          customer: inv?.customerName ?? "—",
          transactionId: pay?.transactionId ?? "—",
          amount: pay?.amount ?? 0,
          matchedBy: m.reasons[0] ?? (m.manual ? "Manual match" : "—"),
          confidence: m.confidence,
          date: pay?.date ?? "",
        };
      }),
    [confirmedMatches, invoices, payments]
  );

  const exportCsv = () => {
    downloadCsv(
      "finmatch-reconciliation-report.csv",
      reconciledRows.map((r) => ({
        "Invoice ID": r.invoiceId,
        Customer: r.customer,
        "Transaction ID": r.transactionId,
        "Amount (INR)": r.amount,
        "Matched By": r.matchedBy,
        Confidence: r.confidence,
        Date: r.date,
      }))
    );
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-fin-900 dark:text-white">{user?.companyName ?? "FinMatch"} — Reconciliation Report</h2>
          <p className="text-xs text-fin-500 dark:text-fin-400">Generated on {formatDate(new Date().toISOString())}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportCsv}
            className="flex items-center gap-2 rounded-xl bg-fin-600 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-fin-500"
          >
            <FileDown className="h-4 w-4" /> Export as CSV
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 rounded-xl border border-fin-900/15 px-4 py-2.5 text-sm font-semibold text-fin-700 hover:bg-fin-900/5 dark:border-white/15 dark:text-fin-200 dark:hover:bg-white/5"
          >
            <Printer className="h-4 w-4" /> Export as PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={CheckCircle2} label="Total Reconciled Amount" value={formatINR(totalReconciled)} sub={`${confirmedMatches.length} confirmed matches`} accent="emerald" />
        <StatCard icon={Wallet} label="Outstanding Balance" value={formatINR(totalOutstanding)} accent="rose" />
        <StatCard icon={AlertTriangle} label="Unresolved Discrepancies" value={`${unresolved}`} sub="Ambiguous or low-confidence" accent="amber" />
      </div>

      <div className="rounded-2xl border border-fin-900/10 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-fin-900">
        <h3 className="mb-4 flex items-center gap-2 font-semibold text-fin-900 dark:text-white">
          <IndianRupee className="h-4 w-4 text-fin-500" /> Confirmed Reconciliations
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-fin-900/10 text-xs uppercase tracking-wide text-fin-500 dark:border-white/10 dark:text-fin-400">
                <th className="py-2 pr-4">Invoice</th>
                <th className="py-2 pr-4">Customer</th>
                <th className="py-2 pr-4">Transaction</th>
                <th className="py-2 pr-4">Amount</th>
                <th className="py-2 pr-4">Matched By</th>
                <th className="py-2 pr-4">Date</th>
              </tr>
            </thead>
            <tbody>
              {reconciledRows.map((r, i) => (
                <tr key={i} className="border-b border-fin-900/5 last:border-0 dark:border-white/5">
                  <td className="py-2.5 pr-4 font-semibold text-fin-900 dark:text-white">{r.invoiceId}</td>
                  <td className="py-2.5 pr-4 text-fin-700 dark:text-fin-200">{r.customer}</td>
                  <td className="py-2.5 pr-4 text-fin-500 dark:text-fin-400">{r.transactionId}</td>
                  <td className="py-2.5 pr-4 font-semibold text-emerald-600 dark:text-emerald-400">{formatINR(r.amount)}</td>
                  <td className="py-2.5 pr-4 text-xs text-fin-500 dark:text-fin-400">{r.matchedBy}</td>
                  <td className="py-2.5 pr-4 text-fin-500 dark:text-fin-400">{formatDate(r.date)}</td>
                </tr>
              ))}
              {reconciledRows.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-sm text-fin-400">
                    No confirmed matches yet. Head to Reconciliation to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-2xl border border-fin-900/10 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-fin-900">
        <h3 className="mb-3 font-semibold text-fin-900 dark:text-white">Bill Status Breakdown</h3>
        <div className="grid grid-cols-3 gap-3 text-center">
          {(["Paid", "Partial", "Unpaid"] as const).map((status) => {
            const count = invoices.filter((i) => statusForInvoice(i.id) === status).length;
            return (
              <div key={status} className="rounded-xl bg-fin-900/5 p-4 dark:bg-white/5">
                <p className="text-2xl font-bold text-fin-900 dark:text-white">{count}</p>
                <p className="text-xs font-medium text-fin-500 dark:text-fin-400">{status}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
