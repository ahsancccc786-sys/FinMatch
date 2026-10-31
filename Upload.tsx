import { useRef, useState } from "react";
import { UploadCloud, FileSpreadsheet, Download, CheckCircle2, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";
import { useApp } from "../context/AppContext";
import {
  parseCsvFile,
  mapRowsToInvoices,
  mapRowsToPayments,
  downloadCsv,
  invoicesToCsvRows,
  paymentsToCsvRows,
} from "../utils/csv";
import { buildMockData } from "../data/mockData";
import { formatINR, formatDate } from "../utils/format";
import type { Invoice, Payment } from "../types";

type ParsedState<T> = { rows: T[]; fileName: string } | null;

export default function UploadPage() {
  const { addInvoices, addPayments } = useApp();
  const [invoicePreview, setInvoicePreview] = useState<ParsedState<Invoice>>(null);
  const [paymentPreview, setPaymentPreview] = useState<ParsedState<Payment>>(null);
  const invoiceInputRef = useRef<HTMLInputElement>(null);
  const paymentInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File, type: "invoices" | "payments") => {
    if (!file.name.toLowerCase().endsWith(".csv")) {
      toast.error("Please upload a .csv file");
      return;
    }
    try {
      const rows = await parseCsvFile(file);
      if (type === "invoices") {
        const mapped = mapRowsToInvoices(rows);
        setInvoicePreview({ rows: mapped, fileName: file.name });
        toast.success(`Parsed ${mapped.length} invoice rows from ${file.name}`);
      } else {
        const mapped = mapRowsToPayments(rows);
        setPaymentPreview({ rows: mapped, fileName: file.name });
        toast.success(`Parsed ${mapped.length} payment rows from ${file.name}`);
      }
    } catch {
      toast.error("Could not parse the CSV file. Please check formatting.");
    }
  };

  const confirmImport = (type: "invoices" | "payments") => {
    if (type === "invoices" && invoicePreview) {
      addInvoices(invoicePreview.rows);
      toast.success(`${invoicePreview.rows.length} invoices imported successfully!`, { icon: "📥" });
      setInvoicePreview(null);
    }
    if (type === "payments" && paymentPreview) {
      addPayments(paymentPreview.rows);
      toast.success(`${paymentPreview.rows.length} payments imported successfully!`, { icon: "📥" });
      setPaymentPreview(null);
    }
  };

  const downloadSample = (type: "invoices" | "payments") => {
    const { invoices, payments } = buildMockData();
    if (type === "invoices") downloadCsv("invoices.csv", invoicesToCsvRows(invoices.slice(0, 10)));
    else downloadCsv("payments.csv", paymentsToCsvRows(payments.slice(0, 10)));
    toast.success(`Sample ${type}.csv downloaded`);
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="rounded-2xl border border-fin-500/30 bg-fin-500/5 p-4 text-sm text-fin-700 dark:text-fin-200">
        <strong className="font-semibold">Tip:</strong> Don't have CSVs handy? Download sample files below, then
        drag them back in to see FinMatch parse &amp; validate columns automatically — including tricky rows with
        missing reference notes.
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <DropZone
          title="invoices.csv"
          description="Invoice ID, Customer Name, Date, Amount"
          icon={FileSpreadsheet}
          inputRef={invoiceInputRef}
          onFile={(f) => handleFile(f, "invoices")}
          onSample={() => downloadSample("invoices")}
        />
        <DropZone
          title="payments.csv"
          description="Transaction ID, Payer Name, Date, Amount, Reference Notes"
          icon={FileSpreadsheet}
          inputRef={paymentInputRef}
          onFile={(f) => handleFile(f, "payments")}
          onSample={() => downloadSample("payments")}
        />
      </div>

      {invoicePreview && (
        <PreviewTable
          title={`Preview: ${invoicePreview.fileName}`}
          columns={["Invoice ID", "Customer Name", "Date", "Amount"]}
          rows={invoicePreview.rows.map((r) => [r.invoiceId, r.customerName, formatDate(r.date), formatINR(r.amount)])}
          onConfirm={() => confirmImport("invoices")}
          onDiscard={() => setInvoicePreview(null)}
        />
      )}

      {paymentPreview && (
        <PreviewTable
          title={`Preview: ${paymentPreview.fileName}`}
          columns={["Transaction ID", "Payer Name", "Date", "Amount", "Reference Notes"]}
          rows={paymentPreview.rows.map((r) => [
            r.transactionId,
            r.payerName,
            formatDate(r.date),
            formatINR(r.amount),
            r.referenceNotes || "—",
          ])}
          onConfirm={() => confirmImport("payments")}
          onDiscard={() => setPaymentPreview(null)}
        />
      )}
    </div>
  );
}

function DropZone({
  title,
  description,
  icon: Icon,
  inputRef,
  onFile,
  onSample,
}: {
  title: string;
  description: string;
  icon: typeof FileSpreadsheet;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onFile: (file: File) => void;
  onSample: () => void;
}) {
  const [dragOver, setDragOver] = useState(false);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) onFile(file);
      }}
      className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 text-center transition ${
        dragOver
          ? "border-fin-400 bg-fin-500/10"
          : "border-fin-900/20 bg-white hover:border-fin-400/60 dark:border-white/15 dark:bg-fin-900"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
        }}
      />
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-fin-500/10 text-fin-500">
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="text-base font-semibold text-fin-900 dark:text-white">{title}</h3>
      <p className="mt-1 text-xs text-fin-500 dark:text-fin-400">{description}</p>
      <button
        onClick={() => inputRef.current?.click()}
        className="mt-5 flex items-center gap-2 rounded-xl bg-fin-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-fin-500"
      >
        <UploadCloud className="h-4 w-4" /> Drag & drop or browse
      </button>
      <button onClick={onSample} className="mt-3 flex items-center gap-1.5 text-xs font-medium text-fin-500 hover:text-fin-600 dark:hover:text-fin-300">
        <Download className="h-3.5 w-3.5" /> Download sample {title}
      </button>
    </div>
  );
}

function PreviewTable({
  title,
  columns,
  rows,
  onConfirm,
  onDiscard,
}: {
  title: string;
  columns: string[];
  rows: (string | number)[][];
  onConfirm: () => void;
  onDiscard: () => void;
}) {
  return (
    <div className="animate-fade-in rounded-2xl border border-fin-900/10 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-fin-900">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          <h3 className="font-semibold text-fin-900 dark:text-white">{title}</h3>
          <span className="rounded-full bg-fin-500/10 px-2.5 py-0.5 text-xs font-medium text-fin-600 dark:text-fin-300">
            {rows.length} rows detected
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onDiscard}
            className="rounded-lg border border-fin-900/15 px-4 py-2 text-xs font-semibold text-fin-600 hover:bg-fin-900/5 dark:border-white/15 dark:text-fin-200 dark:hover:bg-white/5"
          >
            Discard
          </button>
          <button
            onClick={onConfirm}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-emerald-500"
          >
            Confirm Import
          </button>
        </div>
      </div>
      {rows.length === 0 ? (
        <p className="flex items-center gap-2 rounded-lg bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-300">
          <AlertTriangle className="h-4 w-4" /> No valid rows detected. Check column headers.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead>
              <tr className="border-b border-fin-900/10 text-xs uppercase tracking-wide text-fin-500 dark:border-white/10 dark:text-fin-400">
                {columns.map((c) => (
                  <th key={c} className="py-2 pr-4 font-semibold">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 8).map((row, idx) => (
                <tr key={idx} className="border-b border-fin-900/5 last:border-0 dark:border-white/5">
                  {row.map((cell, i) => (
                    <td key={i} className="py-2 pr-4 text-fin-800 dark:text-fin-100">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length > 8 && (
            <p className="mt-2 text-xs text-fin-500 dark:text-fin-400">+ {rows.length - 8} more rows not shown</p>
          )}
        </div>
      )}
    </div>
  );
}
