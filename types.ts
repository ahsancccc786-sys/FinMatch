export type InvoiceStatus = "Paid" | "Partial" | "Unpaid";

export interface Invoice {
  id: string;
  invoiceId: string;
  customerName: string;
  customerPhone: string;
  date: string; // ISO date
  dueDate: string; // ISO date
  amount: number;
  notes?: string;
}

export interface Payment {
  id: string;
  transactionId: string;
  payerName: string;
  date: string; // ISO date
  amount: number;
  referenceNotes: string;
  mode?: string;
}

export type MatchConfidence = "high" | "medium" | "low" | "ambiguous";
export type MatchStatus = "suggested" | "confirmed" | "rejected";

export interface MatchSuggestion {
  id: string;
  invoiceId: string;
  paymentId: string;
  confidence: MatchConfidence;
  reasons: string[];
  status: MatchStatus;
  ambiguousWith?: string[]; // other invoiceIds competing for same payment
  createdAt: string;
  manual?: boolean;
}

export interface User {
  name: string;
  email: string;
  companyName: string;
  baseCurrency: string;
}

export type PageKey =
  | "dashboard"
  | "upload"
  | "reconciliation"
  | "manual-review"
  | "pending-bills"
  | "all-entries"
  | "reports";
