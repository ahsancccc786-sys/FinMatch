import { useMemo, useState } from "react";
import { Search, ArrowUpDown, FileText, Wallet2, Pencil, Save, X } from "lucide-react";
import { useApp } from "../context/AppContext";
import { formatINR, formatDate } from "../utils/format";
import type { Invoice, Payment } from "../types";

type SortKey = "date" | "amount" | "name";

export default function AllEntries() {
  const { invoices, payments, statusForInvoice, editInvoice, editPayment } = useApp();
  const [tab, setTab] = useState<"invoices" | "payments">("invoices");
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [editingId, setEditingId] = useState<string | null>(null);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const filteredInvoices = useMemo(() => {
    let list = invoices.filter(
      (i) =>
        i.invoiceId.toLowerCase().includes(query.toLowerCase()) ||
        i.customerName.toLowerCase().includes(query.toLowerCase())
    );
    if (statusFilter !== "All") list = list.filter((i) => statusForInvoice(i.id) === statusFilter);
    list = [...list].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "date") cmp = new Date(a.date).getTime() - new Date(b.date).getTime();
      if (sortKey === "amount") cmp = a.amount - b.amount;
      if (sortKey === "name") cmp = a.customerName.localeCompare(b.customerName);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [invoices, query, statusFilter, sortKey, sortDir, statusForInvoice]);

  const filteredPayments = useMemo(() => {
    let list = payments.filter(
      (p) =>
        p.transactionId.toLowerCase().includes(query.toLowerCase()) ||
        p.payerName.toLowerCase().includes(query.toLowerCase())
    );
    list = [...list].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "date") cmp = new Date(a.date).getTime() - new Date(b.date).getTime();
      if (sortKey === "amount") cmp = a.amount - b.amount;
      if (sortKey === "name") cmp = a.payerName.localeCompare(b.payerName);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [payments, query, sortKey, sortDir]);

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-xl bg-fin-900/5 p-1 dark:bg-white/5">
          <button
            onClick={() => setTab("invoices")}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
              tab === "invoices" ? "bg-fin-600 text-white shadow" : "text-fin-600 dark:text-fin-300"
            }`}
          >
            <FileText className="h-4 w-4" /> All Invoices ({invoices.length})
          </button>
          <button
            onClick={() => setTab("payments")}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
              tab === "payments" ? "bg-fin-600 text-white shadow" : "text-fin-600 dark:text-fin-300"
            }`}
          >
            <Wallet2 className="h-4 w-4" /> All Payments ({payments.length})
          </button>
        </div>

        <div className="flex flex-1 items-center gap-2 rounded-xl border border-fin-900/10 bg-white px-3 py-2 dark:border-white/10 dark:bg-fin-900">
          <Search className="h-4 w-4 text-fin-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={tab === "invoices" ? "Search invoice ID or customer..." : "Search transaction ID or payer..."}
            className="w-full bg-transparent text-sm outline-none dark:text-white"
          />
        </div>

        {tab === "invoices" && (
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-fin-900/10 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-fin-900 dark:text-white"
          >
            <option>All</option>
            <option>Paid</option>
            <option>Partial</option>
            <option>Unpaid</option>
          </select>
        )}
      </div>

      <div className="rounded-2xl border border-fin-900/10 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-fin-900">
        {tab === "invoices" ? (
          <InvoiceTable
            rows={filteredInvoices}
            statusForInvoice={statusForInvoice}
            toggleSort={toggleSort}
            editingId={editingId}
            setEditingId={setEditingId}
            editInvoice={editInvoice}
          />
        ) : (
          <PaymentTable rows={filteredPayments} toggleSort={toggleSort} editingId={editingId} setEditingId={setEditingId} editPayment={editPayment} />
        )}
      </div>
    </div>
  );
}

function SortHeader({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <th className="py-2 pr-4">
      <button onClick={onClick} className="flex items-center gap-1 font-semibold">
        {label} <ArrowUpDown className="h-3 w-3" />
      </button>
    </th>
  );
}

function InvoiceTable({
  rows,
  statusForInvoice,
  toggleSort,
  editingId,
  setEditingId,
  editInvoice,
}: {
  rows: Invoice[];
  statusForInvoice: (id: string) => string;
  toggleSort: (key: SortKey) => void;
  editingId: string | null;
  setEditingId: (id: string | null) => void;
  editInvoice: (id: string, patch: Partial<Invoice>) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[800px] text-left text-sm">
        <thead>
          <tr className="border-b border-fin-900/10 text-xs uppercase tracking-wide text-fin-500 dark:border-white/10 dark:text-fin-400">
            <th className="py-2 pr-4">Invoice ID</th>
            <SortHeader label="Customer" onClick={() => toggleSort("name")} />
            <SortHeader label="Date" onClick={() => toggleSort("date")} />
            <th className="py-2 pr-4">Due Date</th>
            <SortHeader label="Amount" onClick={() => toggleSort("amount")} />
            <th className="py-2 pr-4">Status</th>
            <th className="py-2 pr-4 text-right">Edit</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((inv) => {
            const editing = editingId === inv.id;
            const status = statusForInvoice(inv.id);
            return (
              <tr key={inv.id} className="border-b border-fin-900/5 last:border-0 dark:border-white/5">
                <td className="py-2.5 pr-4 font-semibold text-fin-900 dark:text-white">{inv.invoiceId}</td>
                <td className="py-2.5 pr-4 text-fin-700 dark:text-fin-200">
                  {editing ? (
                    <QuickInput
                      value={inv.customerName}
                      onSave={(v) => editInvoice(inv.id, { customerName: v })}
                    />
                  ) : (
                    inv.customerName
                  )}
                </td>
                <td className="py-2.5 pr-4 text-fin-500 dark:text-fin-400">{formatDate(inv.date)}</td>
                <td className="py-2.5 pr-4 text-fin-500 dark:text-fin-400">{formatDate(inv.dueDate)}</td>
                <td className="py-2.5 pr-4 font-semibold text-fin-800 dark:text-fin-100">
                  {editing ? (
                    <QuickInput type="number" value={String(inv.amount)} onSave={(v) => editInvoice(inv.id, { amount: Number(v) })} />
                  ) : (
                    formatINR(inv.amount)
                  )}
                </td>
                <td className="py-2.5 pr-4">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      status === "Paid"
                        ? "bg-emerald-500/10 text-emerald-600"
                        : status === "Partial"
                        ? "bg-amber-500/10 text-amber-600"
                        : "bg-rose-500/10 text-rose-500"
                    }`}
                  >
                    {status}
                  </span>
                </td>
                <td className="py-2.5 pr-4 text-right">
                  <button
                    onClick={() => setEditingId(editing ? null : inv.id)}
                    className="rounded-lg border border-fin-900/15 p-1.5 text-fin-500 hover:bg-fin-900/5 dark:border-white/15 dark:hover:bg-white/5"
                  >
                    {editing ? <X className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
                  </button>
                </td>
              </tr>
            );
          })}
          {rows.length === 0 && (
            <tr>
              <td colSpan={7} className="py-8 text-center text-sm text-fin-400">
                No invoices match your filters.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function PaymentTable({
  rows,
  toggleSort,
  editingId,
  setEditingId,
  editPayment,
}: {
  rows: Payment[];
  toggleSort: (key: SortKey) => void;
  editingId: string | null;
  setEditingId: (id: string | null) => void;
  editPayment: (id: string, patch: Partial<Payment>) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[800px] text-left text-sm">
        <thead>
          <tr className="border-b border-fin-900/10 text-xs uppercase tracking-wide text-fin-500 dark:border-white/10 dark:text-fin-400">
            <th className="py-2 pr-4">Transaction ID</th>
            <SortHeader label="Payer" onClick={() => toggleSort("name")} />
            <SortHeader label="Date" onClick={() => toggleSort("date")} />
            <SortHeader label="Amount" onClick={() => toggleSort("amount")} />
            <th className="py-2 pr-4">Reference Notes</th>
            <th className="py-2 pr-4">Mode</th>
            <th className="py-2 pr-4 text-right">Edit</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => {
            const editing = editingId === p.id;
            return (
              <tr key={p.id} className="border-b border-fin-900/5 last:border-0 dark:border-white/5">
                <td className="py-2.5 pr-4 font-semibold text-fin-900 dark:text-white">{p.transactionId}</td>
                <td className="py-2.5 pr-4 text-fin-700 dark:text-fin-200">
                  {editing ? <QuickInput value={p.payerName} onSave={(v) => editPayment(p.id, { payerName: v })} /> : p.payerName}
                </td>
                <td className="py-2.5 pr-4 text-fin-500 dark:text-fin-400">{formatDate(p.date)}</td>
                <td className="py-2.5 pr-4 font-semibold text-fin-800 dark:text-fin-100">
                  {editing ? (
                    <QuickInput type="number" value={String(p.amount)} onSave={(v) => editPayment(p.id, { amount: Number(v) })} />
                  ) : (
                    formatINR(p.amount)
                  )}
                </td>
                <td className="py-2.5 pr-4 text-fin-500 dark:text-fin-400">
                  {editing ? (
                    <QuickInput value={p.referenceNotes} onSave={(v) => editPayment(p.id, { referenceNotes: v })} />
                  ) : (
                    p.referenceNotes || "—"
                  )}
                </td>
                <td className="py-2.5 pr-4 text-fin-500 dark:text-fin-400">{p.mode}</td>
                <td className="py-2.5 pr-4 text-right">
                  <button
                    onClick={() => setEditingId(editing ? null : p.id)}
                    className="rounded-lg border border-fin-900/15 p-1.5 text-fin-500 hover:bg-fin-900/5 dark:border-white/15 dark:hover:bg-white/5"
                  >
                    {editing ? <X className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
                  </button>
                </td>
              </tr>
            );
          })}
          {rows.length === 0 && (
            <tr>
              <td colSpan={7} className="py-8 text-center text-sm text-fin-400">
                No payments match your filters.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function QuickInput({ value, onSave, type = "text" }: { value: string; onSave: (v: string) => void; type?: string }) {
  const [val, setVal] = useState(value);
  return (
    <div className="flex items-center gap-1.5">
      <input
        type={type}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        className="w-28 rounded-md border border-fin-900/15 bg-white px-2 py-1 text-xs dark:border-white/15 dark:bg-fin-950 dark:text-white"
      />
      <button onClick={() => onSave(val)} className="rounded-md bg-fin-600 p-1 text-white hover:bg-fin-500">
        <Save className="h-3 w-3" />
      </button>
    </div>
  );
}
