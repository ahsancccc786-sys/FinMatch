import { useMemo, useState } from "react";
import { Pencil, Check, X, ClipboardList, Save, ShieldAlert } from "lucide-react";
import { useApp } from "../context/AppContext";
import ConfidenceBadge from "../components/ConfidenceBadge";
import { formatINR, formatDate } from "../utils/format";
import type { Invoice, Payment } from "../types";

export default function ManualReview() {
  const { suggestions, invoices, payments, confirmSuggestion, rejectSuggestion, resolveAmbiguous, editInvoice, editPayment } =
    useApp();
  const [editingInvoice, setEditingInvoice] = useState<string | null>(null);
  const [editingPayment, setEditingPayment] = useState<string | null>(null);

  const reviewItems = useMemo(
    () => suggestions.filter((s) => s.confidence === "low" || s.confidence === "ambiguous" || s.confidence === "medium"),
    [suggestions]
  );

  const invoiceById = (id: string) => invoices.find((i) => i.id === id);
  const paymentById = (id: string) => payments.find((p) => p.id === id);

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center gap-3 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4">
        <ShieldAlert className="h-5 w-5 shrink-0 text-amber-500" />
        <p className="text-sm text-amber-700 dark:text-amber-300">
          These matches need a closer look — low confidence, ambiguous amounts, or partial payments. Fix typos
          directly in the record, then confirm or reject.
        </p>
      </div>

      {reviewItems.length === 0 ? (
        <div className="rounded-2xl border border-fin-900/10 bg-white p-10 text-center shadow-sm dark:border-white/10 dark:bg-fin-900">
          <ClipboardList className="mx-auto mb-3 h-10 w-10 text-fin-300" />
          <p className="font-semibold text-fin-800 dark:text-white">All clear!</p>
          <p className="text-sm text-fin-500 dark:text-fin-400">Nothing needs manual review right now.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviewItems.map((s) => {
            const invoice = invoiceById(s.invoiceId);
            const payment = paymentById(s.paymentId);
            if (!invoice || !payment) return null;
            return (
              <div key={s.id} className="rounded-2xl border border-fin-900/10 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-fin-900">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <ConfidenceBadge confidence={s.confidence} />
                  <div className="flex gap-2">
                    {s.confidence !== "ambiguous" && (
                      <>
                        <button
                          onClick={() => confirmSuggestion(s)}
                          className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500"
                        >
                          <Check className="h-3.5 w-3.5" /> Confirm
                        </button>
                        <button
                          onClick={() => rejectSuggestion(s)}
                          className="flex items-center gap-1.5 rounded-lg border border-rose-400/40 px-3 py-1.5 text-xs font-semibold text-rose-500 hover:bg-rose-500/10"
                        >
                          <X className="h-3.5 w-3.5" /> Reject
                        </button>
                      </>
                    )}
                    {s.confidence === "ambiguous" && (
                      <button
                        onClick={() => resolveAmbiguous(s, invoice.id)}
                        className="flex items-center gap-1.5 rounded-lg bg-fin-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-fin-500"
                      >
                        <Check className="h-3.5 w-3.5" /> Assign to {invoice.invoiceId}
                      </button>
                    )}
                  </div>
                </div>

                <div className="mb-3 rounded-lg bg-fin-900/5 p-2.5 text-xs text-fin-600 dark:bg-white/5 dark:text-fin-300">
                  <ul className="list-disc space-y-0.5 pl-4">
                    {s.reasons.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <EditableInvoiceCard
                    invoice={invoice}
                    editing={editingInvoice === invoice.id}
                    onEdit={() => setEditingInvoice(invoice.id)}
                    onCancel={() => setEditingInvoice(null)}
                    onSave={(patch) => {
                      editInvoice(invoice.id, patch);
                      setEditingInvoice(null);
                    }}
                  />
                  <EditablePaymentCard
                    payment={payment}
                    editing={editingPayment === payment.id}
                    onEdit={() => setEditingPayment(payment.id)}
                    onCancel={() => setEditingPayment(null)}
                    onSave={(patch) => {
                      editPayment(payment.id, patch);
                      setEditingPayment(null);
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function EditableInvoiceCard({
  invoice,
  editing,
  onEdit,
  onCancel,
  onSave,
}: {
  invoice: Invoice;
  editing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: (patch: Partial<Invoice>) => void;
}) {
  const [form, setForm] = useState({ customerName: invoice.customerName, amount: invoice.amount, date: invoice.date });

  if (!editing) {
    return (
      <div className="group relative rounded-lg border border-fin-900/10 bg-fin-900/[0.02] p-3 dark:border-white/10 dark:bg-white/[0.02]">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-fin-500">Invoice</p>
        <p className="font-semibold text-fin-900 dark:text-white">{invoice.invoiceId}</p>
        <p className="text-sm text-fin-600 dark:text-fin-300">{invoice.customerName}</p>
        <p className="mt-1 text-sm font-bold text-fin-700 dark:text-fin-200">{formatINR(invoice.amount)}</p>
        <p className="text-xs text-fin-400">{formatDate(invoice.date)}</p>
        <button
          onClick={onEdit}
          className="absolute right-2 top-2 rounded-md bg-white p-1.5 text-fin-500 opacity-0 shadow transition group-hover:opacity-100 dark:bg-fin-800"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-fin-400 bg-fin-400/5 p-3">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-fin-500">Edit Invoice {invoice.invoiceId}</p>
      <div className="space-y-2">
        <input
          value={form.customerName}
          onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))}
          className="w-full rounded-md border border-fin-900/15 bg-white px-2 py-1.5 text-sm dark:border-white/15 dark:bg-fin-950 dark:text-white"
          placeholder="Customer name"
        />
        <input
          type="number"
          value={form.amount}
          onChange={(e) => setForm((f) => ({ ...f, amount: Number(e.target.value) }))}
          className="w-full rounded-md border border-fin-900/15 bg-white px-2 py-1.5 text-sm dark:border-white/15 dark:bg-fin-950 dark:text-white"
          placeholder="Amount"
        />
        <input
          type="date"
          value={form.date}
          onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
          className="w-full rounded-md border border-fin-900/15 bg-white px-2 py-1.5 text-sm dark:border-white/15 dark:bg-fin-950 dark:text-white"
        />
      </div>
      <div className="mt-2 flex gap-2">
        <button
          onClick={() => onSave(form)}
          className="flex items-center gap-1 rounded-md bg-fin-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-fin-500"
        >
          <Save className="h-3 w-3" /> Save
        </button>
        <button onClick={onCancel} className="rounded-md border border-fin-900/15 px-2.5 py-1.5 text-xs dark:border-white/15">
          Cancel
        </button>
      </div>
    </div>
  );
}

function EditablePaymentCard({
  payment,
  editing,
  onEdit,
  onCancel,
  onSave,
}: {
  payment: Payment;
  editing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: (patch: Partial<Payment>) => void;
}) {
  const [form, setForm] = useState({
    payerName: payment.payerName,
    amount: payment.amount,
    date: payment.date,
    referenceNotes: payment.referenceNotes,
  });

  if (!editing) {
    return (
      <div className="group relative rounded-lg border border-fin-900/10 bg-fin-900/[0.02] p-3 dark:border-white/10 dark:bg-white/[0.02]">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-fin-500">Payment</p>
        <p className="font-semibold text-fin-900 dark:text-white">{payment.transactionId}</p>
        <p className="text-sm text-fin-600 dark:text-fin-300">{payment.payerName}</p>
        <p className="mt-1 text-sm font-bold text-fin-700 dark:text-fin-200">{formatINR(payment.amount)}</p>
        <p className="text-xs text-fin-400">
          {formatDate(payment.date)} {payment.referenceNotes && `· "${payment.referenceNotes}"`}
        </p>
        <button
          onClick={onEdit}
          className="absolute right-2 top-2 rounded-md bg-white p-1.5 text-fin-500 opacity-0 shadow transition group-hover:opacity-100 dark:bg-fin-800"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-fin-400 bg-fin-400/5 p-3">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-fin-500">Edit Payment {payment.transactionId}</p>
      <div className="space-y-2">
        <input
          value={form.payerName}
          onChange={(e) => setForm((f) => ({ ...f, payerName: e.target.value }))}
          className="w-full rounded-md border border-fin-900/15 bg-white px-2 py-1.5 text-sm dark:border-white/15 dark:bg-fin-950 dark:text-white"
          placeholder="Payer name"
        />
        <input
          type="number"
          value={form.amount}
          onChange={(e) => setForm((f) => ({ ...f, amount: Number(e.target.value) }))}
          className="w-full rounded-md border border-fin-900/15 bg-white px-2 py-1.5 text-sm dark:border-white/15 dark:bg-fin-950 dark:text-white"
          placeholder="Amount"
        />
        <input
          type="date"
          value={form.date}
          onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
          className="w-full rounded-md border border-fin-900/15 bg-white px-2 py-1.5 text-sm dark:border-white/15 dark:bg-fin-950 dark:text-white"
        />
        <input
          value={form.referenceNotes}
          onChange={(e) => setForm((f) => ({ ...f, referenceNotes: e.target.value }))}
          className="w-full rounded-md border border-fin-900/15 bg-white px-2 py-1.5 text-sm dark:border-white/15 dark:bg-fin-950 dark:text-white"
          placeholder="Reference notes"
        />
      </div>
      <div className="mt-2 flex gap-2">
        <button
          onClick={() => onSave(form)}
          className="flex items-center gap-1 rounded-md bg-fin-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-fin-500"
        >
          <Save className="h-3 w-3" /> Save
        </button>
        <button onClick={onCancel} className="rounded-md border border-fin-900/15 px-2.5 py-1.5 text-xs dark:border-white/15">
          Cancel
        </button>
      </div>
    </div>
  );
}
