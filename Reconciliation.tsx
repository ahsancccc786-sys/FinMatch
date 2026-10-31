import { useMemo, useState } from "react";
import { ArrowLeftRight, Check, X, Info, FileText, Wallet2, Sparkles } from "lucide-react";
import { useApp } from "../context/AppContext";
import ConfidenceBadge from "../components/ConfidenceBadge";
import { formatINR, formatDate } from "../utils/format";
import { CONFIDENCE_RANK } from "../utils/matching";
import type { MatchSuggestion } from "../types";

export default function Reconciliation() {
  const {
    invoices,
    payments,
    suggestions,
    confirmSuggestion,
    rejectSuggestion,
    resolveAmbiguous,
    manualMatch,
    remainingBalanceForInvoice,
    isPaymentUsed,
  } = useApp();

  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);

  const sortedSuggestions = useMemo(
    () => [...suggestions].sort((a, b) => CONFIDENCE_RANK[b.confidence] - CONFIDENCE_RANK[a.confidence]),
    [suggestions]
  );

  const unmatchedInvoices = useMemo(
    () => invoices.filter((i) => remainingBalanceForInvoice(i.id) > 0),
    [invoices, remainingBalanceForInvoice]
  );
  const unmatchedPayments = useMemo(() => payments.filter((p) => !isPaymentUsed(p.id)), [payments, isPaymentUsed]);

  const invoiceById = (id: string) => invoices.find((i) => i.id === id);
  const paymentById = (id: string) => payments.find((p) => p.id === id);

  const stats = {
    high: suggestions.filter((s) => s.confidence === "high").length,
    medium: suggestions.filter((s) => s.confidence === "medium").length,
    low: suggestions.filter((s) => s.confidence === "low").length,
    ambiguous: suggestions.filter((s) => s.confidence === "ambiguous").length,
  };

  const handleManualMatch = () => {
    if (!selectedInvoice || !selectedPayment) return;
    manualMatch(selectedInvoice, selectedPayment);
    setSelectedInvoice(null);
    setSelectedPayment(null);
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MiniStat label="High Confidence" value={stats.high} color="text-emerald-500" />
        <MiniStat label="Medium Confidence" value={stats.medium} color="text-fin-500" />
        <MiniStat label="Low Confidence" value={stats.low} color="text-slate-400" />
        <MiniStat label="Ambiguous" value={stats.ambiguous} color="text-amber-500" />
      </div>

      <div className="rounded-2xl border border-fin-900/10 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-fin-900">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-fin-500" />
          <h3 className="font-semibold text-fin-900 dark:text-white">Suggested Matches</h3>
          <span className="rounded-full bg-fin-500/10 px-2.5 py-0.5 text-xs font-medium text-fin-600 dark:text-fin-300">
            {sortedSuggestions.length}
          </span>
        </div>

        {sortedSuggestions.length === 0 ? (
          <p className="rounded-xl bg-fin-900/5 p-6 text-center text-sm text-fin-500 dark:bg-white/5 dark:text-fin-300">
            No suggestions right now — import more data or check Manual Review.
          </p>
        ) : (
          <div className="space-y-4">
            {sortedSuggestions.map((s) => (
              <SuggestionCard
                key={s.id}
                suggestion={s}
                invoice={invoiceById(s.invoiceId)}
                payment={paymentById(s.paymentId)}
                ambiguousInvoices={s.ambiguousWith?.map((id) => invoiceById(id)).filter(Boolean) as ReturnType<typeof invoiceById>[] | undefined}
                onConfirm={() => confirmSuggestion(s)}
                onReject={() => rejectSuggestion(s)}
                onResolve={(invId) => resolveAmbiguous(s, invId)}
              />
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-fin-900/10 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-fin-900">
        <div className="mb-4 flex items-center gap-2">
          <ArrowLeftRight className="h-5 w-5 text-fin-500" />
          <h3 className="font-semibold text-fin-900 dark:text-white">Manual Pairing</h3>
          <span className="text-xs text-fin-500 dark:text-fin-400">Select one invoice & one payment to match manually</span>
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <ListPanel
            title="Invoices awaiting payment"
            icon={FileText}
            items={unmatchedInvoices.map((i) => ({
              id: i.id,
              primary: `${i.invoiceId} · ${i.customerName}`,
              secondary: `${formatDate(i.date)} · Due ${formatDate(i.dueDate)}`,
              amount: remainingBalanceForInvoice(i.id),
            }))}
            selected={selectedInvoice}
            onSelect={setSelectedInvoice}
          />
          <ListPanel
            title="Unallocated payments"
            icon={Wallet2}
            items={unmatchedPayments.map((p) => ({
              id: p.id,
              primary: `${p.transactionId} · ${p.payerName}`,
              secondary: `${formatDate(p.date)} · ${p.mode ?? ""}${p.referenceNotes ? " · " + p.referenceNotes : ""}`,
              amount: p.amount,
            }))}
            selected={selectedPayment}
            onSelect={setSelectedPayment}
          />
        </div>
        <button
          disabled={!selectedInvoice || !selectedPayment}
          onClick={handleManualMatch}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-fin-600 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-fin-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Check className="h-4 w-4" /> Confirm Manual Match
        </button>
      </div>
    </div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-xl border border-fin-900/10 bg-white p-4 text-center shadow-sm dark:border-white/10 dark:bg-fin-900">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="mt-1 text-xs font-medium text-fin-500 dark:text-fin-400">{label}</p>
    </div>
  );
}

function SuggestionCard({
  suggestion,
  invoice,
  payment,
  ambiguousInvoices,
  onConfirm,
  onReject,
  onResolve,
}: {
  suggestion: MatchSuggestion;
  invoice?: { id: string; invoiceId: string; customerName: string; amount: number; date: string };
  payment?: { id: string; transactionId: string; payerName: string; amount: number; date: string; referenceNotes: string };
  ambiguousInvoices?: ({ id: string; invoiceId: string; customerName: string; amount: number } | undefined)[];
  onConfirm: () => void;
  onReject: () => void;
  onResolve: (invoiceId: string) => void;
}) {
  if (!payment) return null;
  const isAmbiguous = suggestion.confidence === "ambiguous";

  return (
    <div
      className={`rounded-xl border p-4 transition ${
        isAmbiguous
          ? "border-amber-400/50 bg-amber-400/10"
          : "border-fin-900/10 bg-fin-900/[0.02] dark:border-white/10 dark:bg-white/[0.02]"
      }`}
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <ConfidenceBadge confidence={suggestion.confidence} />
        <div className="flex gap-2">
          {!isAmbiguous && (
            <>
              <button
                onClick={onConfirm}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-emerald-500"
              >
                <Check className="h-3.5 w-3.5" /> Confirm
              </button>
              <button
                onClick={onReject}
                className="flex items-center gap-1.5 rounded-lg border border-rose-400/40 px-3 py-1.5 text-xs font-semibold text-rose-500 hover:bg-rose-500/10"
              >
                <X className="h-3.5 w-3.5" /> Reject
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-fin-900/10 bg-white p-3 dark:border-white/10 dark:bg-fin-950/40">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-fin-500">Invoice</p>
          {invoice ? (
            <>
              <p className="font-semibold text-fin-900 dark:text-white">{invoice.invoiceId}</p>
              <p className="text-sm text-fin-600 dark:text-fin-300">{invoice.customerName}</p>
              <p className="mt-1 text-sm font-bold text-fin-700 dark:text-fin-200">{formatINR(invoice.amount)}</p>
              <p className="text-xs text-fin-400">{formatDate(invoice.date)}</p>
            </>
          ) : (
            <p className="text-sm text-fin-400">Invoice not found</p>
          )}
        </div>
        <div className="rounded-lg border border-fin-900/10 bg-white p-3 dark:border-white/10 dark:bg-fin-950/40">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-fin-500">Payment</p>
          <p className="font-semibold text-fin-900 dark:text-white">{payment.transactionId}</p>
          <p className="text-sm text-fin-600 dark:text-fin-300">{payment.payerName}</p>
          <p className="mt-1 text-sm font-bold text-fin-700 dark:text-fin-200">{formatINR(payment.amount)}</p>
          <p className="text-xs text-fin-400">
            {formatDate(payment.date)} {payment.referenceNotes && `· "${payment.referenceNotes}"`}
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-start gap-2 rounded-lg bg-fin-900/5 p-2.5 text-xs text-fin-600 dark:bg-white/5 dark:text-fin-300">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <ul className="list-disc space-y-0.5 pl-4">
          {suggestion.reasons.map((r, idx) => (
            <li key={idx}>{r}</li>
          ))}
        </ul>
      </div>

      {isAmbiguous && ambiguousInvoices && (
        <div className="mt-3 rounded-lg border border-amber-400/40 bg-white p-3 dark:bg-fin-950/40">
          <p className="mb-2 text-xs font-semibold text-amber-600 dark:text-amber-400">
            Select which invoice this payment actually belongs to:
          </p>
          <div className="flex flex-wrap gap-2">
            {ambiguousInvoices.map(
              (inv) =>
                inv && (
                  <button
                    key={inv.id}
                    onClick={() => onResolve(inv.id)}
                    className="rounded-lg border border-fin-900/15 bg-fin-900/5 px-3 py-2 text-left text-xs transition hover:border-fin-400 hover:bg-fin-400/10 dark:border-white/10 dark:bg-white/5"
                  >
                    <p className="font-semibold text-fin-900 dark:text-white">{inv.invoiceId}</p>
                    <p className="text-fin-500 dark:text-fin-300">{inv.customerName}</p>
                    <p className="text-fin-500 dark:text-fin-300">{formatINR(inv.amount)}</p>
                  </button>
                )
            )}
          </div>
          <button
            onClick={onReject}
            className="mt-2 flex items-center gap-1.5 text-xs font-medium text-rose-500 hover:underline"
          >
            <X className="h-3 w-3" /> None of these — reject payment match
          </button>
        </div>
      )}
    </div>
  );
}

function ListPanel({
  title,
  icon: Icon,
  items,
  selected,
  onSelect,
}: {
  title: string;
  icon: typeof FileText;
  items: { id: string; primary: string; secondary: string; amount: number }[];
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="rounded-xl border border-fin-900/10 dark:border-white/10">
      <div className="flex items-center gap-2 border-b border-fin-900/10 px-3 py-2.5 dark:border-white/10">
        <Icon className="h-4 w-4 text-fin-500" />
        <h4 className="text-sm font-semibold text-fin-900 dark:text-white">{title}</h4>
        <span className="ml-auto text-xs text-fin-400">{items.length}</span>
      </div>
      <div className="max-h-72 overflow-y-auto">
        {items.length === 0 && <p className="p-4 text-center text-xs text-fin-400">Nothing pending here 🎉</p>}
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelect(item.id)}
            className={`flex w-full items-center justify-between gap-2 border-b border-fin-900/5 px-3 py-2.5 text-left text-xs last:border-0 transition dark:border-white/5 ${
              selected === item.id ? "bg-fin-500/10" : "hover:bg-fin-900/5 dark:hover:bg-white/5"
            }`}
          >
            <span>
              <p className="font-medium text-fin-800 dark:text-fin-100">{item.primary}</p>
              <p className="text-fin-400">{item.secondary}</p>
            </span>
            <span className="shrink-0 font-semibold text-fin-700 dark:text-fin-200">{formatINR(item.amount)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
