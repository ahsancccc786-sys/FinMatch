import Papa from "papaparse";
import type { Invoice, Payment } from "../types";

export function parseCsvFile(file: File): Promise<Record<string, string>[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => resolve(results.data),
      error: (err) => reject(err),
    });
  });
}

function findColumn(headers: string[], candidates: string[]): string | undefined {
  const normalized = headers.map((h) => ({ raw: h, norm: h.toLowerCase().replace(/[^a-z0-9]/g, "") }));
  for (const candidate of candidates) {
    const c = candidate.toLowerCase().replace(/[^a-z0-9]/g, "");
    const found = normalized.find((h) => h.norm === c);
    if (found) return found.raw;
  }
  for (const candidate of candidates) {
    const c = candidate.toLowerCase().replace(/[^a-z0-9]/g, "");
    const found = normalized.find((h) => h.norm.includes(c));
    if (found) return found.raw;
  }
  return undefined;
}

function toAmount(val: string | undefined): number {
  if (!val) return 0;
  const cleaned = val.toString().replace(/[^0-9.-]/g, "");
  return Number(cleaned) || 0;
}

function toDate(val: string | undefined): string {
  if (!val) return new Date().toISOString().slice(0, 10);
  const d = new Date(val);
  if (isNaN(d.getTime())) return new Date().toISOString().slice(0, 10);
  return d.toISOString().slice(0, 10);
}

let importSeq = 1;

export function mapRowsToInvoices(rows: Record<string, string>[]): Invoice[] {
  if (!rows.length) return [];
  const headers = Object.keys(rows[0]);
  const idCol = findColumn(headers, ["Invoice ID", "InvoiceId", "Invoice No", "Invoice Number", "ID"]);
  const nameCol = findColumn(headers, ["Customer Name", "Customer", "Client Name", "Client", "Name"]);
  const amountCol = findColumn(headers, ["Amount", "Invoice Amount", "Total", "Total Amount"]);
  const dateCol = findColumn(headers, ["Date", "Invoice Date", "Issued Date"]);
  const dueCol = findColumn(headers, ["Due Date", "DueDate", "Payment Due"]);
  const phoneCol = findColumn(headers, ["Phone", "Customer Phone", "Contact", "Mobile"]);

  return rows
    .filter((r) => Object.values(r).some((v) => v && v.toString().trim() !== ""))
    .map((row) => {
      const date = toDate(dateCol ? row[dateCol] : undefined);
      const due = dueCol ? toDate(row[dueCol]) : date;
      return {
        id: `imp-inv-${importSeq++}`,
        invoiceId: idCol ? row[idCol] || `INV-IMP-${importSeq}` : `INV-IMP-${importSeq}`,
        customerName: nameCol ? row[nameCol] || "Unknown Customer" : "Unknown Customer",
        customerPhone: phoneCol ? row[phoneCol] || "+91 90000 00000" : "+91 90000 00000",
        date,
        dueDate: due,
        amount: toAmount(amountCol ? row[amountCol] : undefined),
        notes: "Imported from CSV",
      };
    });
}

export function mapRowsToPayments(rows: Record<string, string>[]): Payment[] {
  if (!rows.length) return [];
  const headers = Object.keys(rows[0]);
  const idCol = findColumn(headers, ["Transaction ID", "TransactionId", "Txn ID", "Payment ID", "ID"]);
  const nameCol = findColumn(headers, ["Payer Name", "Payer", "Customer Name", "Paid By", "Name"]);
  const amountCol = findColumn(headers, ["Amount", "Payment Amount", "Total"]);
  const dateCol = findColumn(headers, ["Date", "Payment Date", "Transaction Date"]);
  const notesCol = findColumn(headers, ["Reference Notes", "Reference", "Notes", "Remarks", "Narration"]);
  const modeCol = findColumn(headers, ["Mode", "Payment Mode", "Method"]);

  return rows
    .filter((r) => Object.values(r).some((v) => v && v.toString().trim() !== ""))
    .map((row) => ({
      id: `imp-pay-${importSeq++}`,
      transactionId: idCol ? row[idCol] || `TXN-IMP-${importSeq}` : `TXN-IMP-${importSeq}`,
      payerName: nameCol ? row[nameCol] || "Unknown Payer" : "Unknown Payer",
      date: toDate(dateCol ? row[dateCol] : undefined),
      amount: toAmount(amountCol ? row[amountCol] : undefined),
      referenceNotes: notesCol ? row[notesCol] || "" : "",
      mode: modeCol ? row[modeCol] || "UPI" : "UPI",
    }));
}

export function downloadCsv(filename: string, rows: Record<string, string | number>[]) {
  const csv = Papa.unparse(rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function invoicesToCsvRows(invoices: Invoice[]) {
  return invoices.map((i) => ({
    "Invoice ID": i.invoiceId,
    "Customer Name": i.customerName,
    "Customer Phone": i.customerPhone,
    Date: i.date,
    "Due Date": i.dueDate,
    "Amount (INR)": i.amount,
  }));
}

export function paymentsToCsvRows(payments: Payment[]) {
  return payments.map((p) => ({
    "Transaction ID": p.transactionId,
    "Payer Name": p.payerName,
    Date: p.date,
    "Amount (INR)": p.amount,
    "Reference Notes": p.referenceNotes,
    Mode: p.mode ?? "",
  }));
}
