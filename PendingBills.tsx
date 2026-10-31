import { Fragment, useMemo, useState } from "react";
import { MessageCircle, Pencil, Save, X, Wallet2, AlertCircle, PlusCircle } from "lucide-react";
import toast from "react-hot-toast";
import { useApp } from "../context/AppContext";
import StatCard from "../components/StatCard";
import { formatINR, formatDate } from "../utils/format";
import type { Invoice } from "../types";

function buildWhatsAppLink(phone: string, message: string) {
  const digits = phone.replace(/[^0-9]/g, "");
  const withCountryCode = digits.startsWith("91") ? digits : `91${digits.slice(-10)}`;
  return `https://wa.me/${withCountryCode}?text=${encodeURIComponent(message)}`;
}

export default function PendingBills() {
  const { invoices, statusForInvoice, remainingBalanceForInvoice, paidAmountForInvoice, editInvoice, addPayments, manualMatch, user } =
    useApp();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);

  const pending = useMemo(
    () => invoices.filter((i) => statusForInvoice(i.id) !== "Paid").sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()),
    [invoices, statusForInvoice]
  );

  const totalOutstanding = pending.reduce((s, i) => s + remainingBalanceForInvoice(i.id), 0);
  const overdueCount = pending.filter((i) => new Date(i.dueDate) < new Date()).length;

  const sendReminder = (invoice: Invoice) => {
    const outstanding = remainingBalanceForInvoice(invoice.id);
    const message = `Hi ${invoice.customerName}, this is a friendly reminder from ${
      user?.companyName ?? "our business"
    } regarding Invoice ${invoice.invoiceId} of ${formatINR(outstanding)}, due on ${formatDate(
      invoice.dueDate
    )}. Kindly complete the payment at your earliest convenience. Thank you!`;
    window.open(buildWhatsAppLink(invoice.customerPhone, message), "_blank");
    toast.success(`WhatsApp reminder opened for ${invoice.customerName}`, { icon: "📲" });
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={Wallet2} label="Total Outstanding" value={formatINR(totalOutstanding)} accent="rose" />
        <StatCard icon={AlertCircle} label="Overdue Invoices" value={`${overdueCount}`} accent="amber" />
        <StatCard icon={AlertCircle} label="Pending Bills" value={`${pending.length}`} sub="Unpaid + partially paid" accent="fin" />
      </div>

      <div className="rounded-2xl border border-fin-900/10 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-fin-900">
        <h3 className="mb-4 font-semibold text-fin-900 dark:text-white">Outstanding Balances</h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="border-b border-fin-900/10 text-xs uppercase tracking-wide text-fin-500 dark:border-white/10 dark:text-fin-400">
                <th className="py-2 pr-4">Invoice</th>
                <th className="py-2 pr-4">Customer</th>
                <th className="py-2 pr-4">Billed</th>
                <th className="py-2 pr-4">Paid</th>
                <th className="py-2 pr-4">Outstanding</th>
                <th className="py-2 pr-4">Due Date</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pending.map((inv) => {
                const outstanding = remainingBalanceForInvoice(inv.id);
                const paid = paidAmountForInvoice(inv.id);
                const status = statusForInvoice(inv.id);
                const overdue = new Date(inv.dueDate) < new Date();
                const editing = editingId === inv.id;
                const paying = payingId === inv.id;

                return (
                  <Fragment key={inv.id}>
                    <tr className="border-b border-fin-900/5 last:border-0 dark:border-white/5">
                      <td className="py-3 pr-4 font-semibold text-fin-900 dark:text-white">{inv.invoiceId}</td>
                      <td className="py-3 pr-4 text-fin-700 dark:text-fin-200">
                        {inv.customerName}
                        <p className="text-xs text-fin-400">{inv.customerPhone}</p>
                      </td>
                      <td className="py-3 pr-4 text-fin-700 dark:text-fin-200">{formatINR(inv.amount)}</td>
                      <td className="py-3 pr-4 text-emerald-600 dark:text-emerald-400">{formatINR(paid)}</td>
                      <td className="py-3 pr-4 font-bold text-rose-600 dark:text-rose-400">{formatINR(outstanding)}</td>
                      <td className="py-3 pr-4 text-fin-700 dark:text-fin-200">
                        {formatDate(inv.dueDate)}
                        {overdue && <span className="ml-1.5 rounded-full bg-rose-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-rose-500">Overdue</span>}
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            status === "Partial" ? "bg-amber-500/10 text-amber-600" : "bg-rose-500/10 text-rose-500"
                          }`}
                        >
                          {status}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => sendReminder(inv)}
                            title="Send WhatsApp reminder"
                            className="flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500"
                          >
                            <MessageCircle className="h-3.5 w-3.5" /> Remind
                          </button>
                          <button
                            onClick={() => {
                              setPayingId(paying ? null : inv.id);
                              setEditingId(null);
                            }}
                            title="Record a payment"
                            className="flex items-center gap-1 rounded-lg border border-fin-500/40 px-2.5 py-1.5 text-xs font-semibold text-fin-600 hover:bg-fin-500/10 dark:text-fin-300"
                          >
                            <PlusCircle className="h-3.5 w-3.5" /> Record
                          </button>
                          <button
                            onClick={() => {
                              setEditingId(editing ? null : inv.id);
                              setPayingId(null);
                            }}
                            title="Edit invoice"
                            className="rounded-lg border border-fin-900/15 p-1.5 text-fin-500 hover:bg-fin-900/5 dark:border-white/15 dark:hover:bg-white/5"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {editing && (
                      <tr className="bg-fin-500/5">
                        <td colSpan={8} className="p-4">
                          <EditInvoiceRow
                            invoice={inv}
                            onCancel={() => setEditingId(null)}
                            onSave={(patch) => {
                              editInvoice(inv.id, patch);
                              setEditingId(null);
                              toast.success("Invoice updated");
                            }}
                          />
                        </td>
                      </tr>
                    )}
                    {paying && (
                      <tr className="bg-emerald-500/5">
                        <td colSpan={8} className="p-4">
                          <RecordPaymentRow
                            invoice={inv}
                            outstanding={outstanding}
                            onCancel={() => setPayingId(null)}
                            onSave={(amount, date) => {
                              const paymentId = `manual-pay-${Date.now()}`;
                              addPayments([
                                {
                                  id: paymentId,
                                  transactionId: `MANUAL-${inv.invoiceId}`,
                                  payerName: inv.customerName,
                                  date,
                                  amount,
                                  referenceNotes: `Manually recorded against ${inv.invoiceId}`,
                                  mode: "Manual Entry",
                                },
                              ]);
                              manualMatch(inv.id, paymentId);
                              setPayingId(null);
                            }}
                          />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
              {pending.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-sm text-fin-400">
                    🎉 No pending bills — everything is reconciled!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function EditInvoiceRow({
  invoice,
  onCancel,
  onSave,
}: {
  invoice: Invoice;
  onCancel: () => void;
  onSave: (patch: Partial<Invoice>) => void;
}) {
  const [form, setForm] = useState({
    customerName: invoice.customerName,
    customerPhone: invoice.customerPhone,
    amount: invoice.amount,
    dueDate: invoice.dueDate,
  });
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
      <input
        value={form.customerName}
        onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))}
        className="rounded-lg border border-fin-900/15 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-fin-950 dark:text-white"
        placeholder="Customer name"
      />
      <input
        value={form.customerPhone}
        onChange={(e) => setForm((f) => ({ ...f, customerPhone: e.target.value }))}
        className="rounded-lg border border-fin-900/15 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-fin-950 dark:text-white"
        placeholder="Phone (+91...)"
      />
      <input
        type="number"
        value={form.amount}
        onChange={(e) => setForm((f) => ({ ...f, amount: Number(e.target.value) }))}
        className="rounded-lg border border-fin-900/15 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-fin-950 dark:text-white"
        placeholder="Invoice amount"
      />
      <input
        type="date"
        value={form.dueDate}
        onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
        className="rounded-lg border border-fin-900/15 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-fin-950 dark:text-white"
      />
      <div className="flex gap-2">
        <button onClick={() => onSave(form)} className="flex items-center gap-1 rounded-lg bg-fin-600 px-3 py-2 text-xs font-semibold text-white hover:bg-fin-500">
          <Save className="h-3.5 w-3.5" /> Save
        </button>
        <button onClick={onCancel} className="flex items-center gap-1 rounded-lg border border-fin-900/15 px-3 py-2 text-xs dark:border-white/15">
          <X className="h-3.5 w-3.5" /> Cancel
        </button>
      </div>
    </div>
  );
}

function RecordPaymentRow({
  invoice,
  outstanding,
  onCancel,
  onSave,
}: {
  invoice: Invoice;
  outstanding: number;
  onCancel: () => void;
  onSave: (amount: number, date: string) => void;
}) {
  const [amount, setAmount] = useState(outstanding);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  return (
    <div className="flex flex-wrap items-center gap-3">
      <p className="text-xs text-fin-600 dark:text-fin-300">
        Record a payment for <strong>{invoice.invoiceId}</strong>:
      </p>
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(Number(e.target.value))}
        className="w-36 rounded-lg border border-fin-900/15 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-fin-950 dark:text-white"
        placeholder="Amount"
      />
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="rounded-lg border border-fin-900/15 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-fin-950 dark:text-white"
      />
      <button
        onClick={() => onSave(amount, date)}
        className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-500"
      >
        <Save className="h-3.5 w-3.5" /> Save Payment
      </button>
      <button onClick={onCancel} className="flex items-center gap-1 rounded-lg border border-fin-900/15 px-3 py-2 text-xs dark:border-white/15">
        <X className="h-3.5 w-3.5" /> Cancel
      </button>
    </div>
  );
}
