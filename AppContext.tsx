import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import toast from "react-hot-toast";
import type { Invoice, InvoiceStatus, MatchSuggestion, Payment, User } from "../types";
import { buildMockData } from "../data/mockData";
import { generateSuggestions } from "../utils/matching";

interface AppContextValue {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;

  invoices: Invoice[];
  payments: Payment[];
  matches: MatchSuggestion[];
  suggestions: MatchSuggestion[];

  addInvoices: (rows: Invoice[]) => void;
  addPayments: (rows: Payment[]) => void;
  editInvoice: (id: string, patch: Partial<Invoice>) => void;
  editPayment: (id: string, patch: Partial<Payment>) => void;

  confirmSuggestion: (s: MatchSuggestion) => void;
  rejectSuggestion: (s: MatchSuggestion) => void;
  resolveAmbiguous: (s: MatchSuggestion, chosenInvoiceId: string) => void;
  manualMatch: (invoiceId: string, paymentId: string) => void;
  unconfirmMatch: (matchId: string) => void;

  paidAmountForInvoice: (invoiceId: string) => number;
  remainingBalanceForInvoice: (invoiceId: string) => number;
  statusForInvoice: (invoiceId: string) => InvoiceStatus;
  isPaymentUsed: (paymentId: string) => boolean;
  confirmedMatchForInvoice: (invoiceId: string) => MatchSuggestion[];
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const seed = useMemo(() => buildMockData(), []);
  const [invoices, setInvoices] = useState<Invoice[]>(seed.invoices);
  const [payments, setPayments] = useState<Payment[]>(seed.payments);
  const [matches, setMatches] = useState<MatchSuggestion[]>([]);

  const login = useCallback((u: User) => {
    setUser(u);
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  const addInvoices = useCallback((rows: Invoice[]) => {
    setInvoices((prev) => [...rows, ...prev]);
  }, []);

  const addPayments = useCallback((rows: Payment[]) => {
    setPayments((prev) => [...rows, ...prev]);
  }, []);

  const editInvoice = useCallback((id: string, patch: Partial<Invoice>) => {
    setInvoices((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }, []);

  const editPayment = useCallback((id: string, patch: Partial<Payment>) => {
    setPayments((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }, []);

  const confirmedForInvoice = useCallback(
    (invoiceId: string) => matches.filter((m) => m.invoiceId === invoiceId && m.status === "confirmed"),
    [matches]
  );

  const paidAmountForInvoice = useCallback(
    (invoiceId: string) => {
      const confirmed = matches.filter((m) => m.invoiceId === invoiceId && m.status === "confirmed");
      return confirmed.reduce((sum, m) => {
        const p = payments.find((pp) => pp.id === m.paymentId);
        return sum + (p?.amount ?? 0);
      }, 0);
    },
    [matches, payments]
  );

  const remainingBalanceForInvoice = useCallback(
    (invoiceId: string) => {
      const invoice = invoices.find((i) => i.id === invoiceId);
      if (!invoice) return 0;
      return Math.max(0, invoice.amount - paidAmountForInvoice(invoiceId));
    },
    [invoices, paidAmountForInvoice]
  );

  const statusForInvoice = useCallback(
    (invoiceId: string): InvoiceStatus => {
      const invoice = invoices.find((i) => i.id === invoiceId);
      if (!invoice) return "Unpaid";
      const paid = paidAmountForInvoice(invoiceId);
      if (paid <= 0) return "Unpaid";
      if (paid >= invoice.amount - 1) return "Paid";
      return "Partial";
    },
    [invoices, paidAmountForInvoice]
  );

  const isPaymentUsed = useCallback(
    (paymentId: string) => matches.some((m) => m.paymentId === paymentId && m.status === "confirmed"),
    [matches]
  );

  const suggestions = useMemo(
    () => generateSuggestions(invoices, payments, matches, remainingBalanceForInvoice, isPaymentUsed),
    [invoices, payments, matches, remainingBalanceForInvoice, isPaymentUsed]
  );

  const confirmSuggestion = useCallback(
    (s: MatchSuggestion) => {
      setMatches((prev) => [...prev, { ...s, status: "confirmed" }]);
      const invoice = invoices.find((i) => i.id === s.invoiceId);
      toast.success(`Match confirmed for ${invoice?.invoiceId ?? "invoice"}`, {
        icon: "✅",
      });
    },
    [invoices]
  );

  const rejectSuggestion = useCallback(
    (s: MatchSuggestion) => {
      setMatches((prev) => [...prev, { ...s, status: "rejected" }]);
      toast("Suggestion rejected — moved to manual review", { icon: "🚫" });
    },
    []
  );

  const resolveAmbiguous = useCallback(
    (s: MatchSuggestion, chosenInvoiceId: string) => {
      const others = (s.ambiguousWith ?? []).filter((id) => id !== chosenInvoiceId);
      setMatches((prev) => [
        ...prev,
        {
          ...s,
          id: `resolved-${s.paymentId}-${chosenInvoiceId}`,
          invoiceId: chosenInvoiceId,
          confidence: "medium",
          status: "confirmed",
          reasons: ["Manually resolved from ambiguous amount-only match"],
        },
        ...others.map((id) => ({
          ...s,
          id: `rejected-${s.paymentId}-${id}`,
          invoiceId: id,
          status: "rejected" as const,
        })),
      ]);
      toast.success("Ambiguous match resolved manually", { icon: "🔍" });
    },
    []
  );

  const manualMatch = useCallback(
    (invoiceId: string, paymentId: string) => {
      if (isPaymentUsed(paymentId)) {
        toast.error("This payment is already allocated to an invoice.");
        return;
      }
      if (remainingBalanceForInvoice(invoiceId) <= 0) {
        toast.error("This invoice is already fully paid.");
        return;
      }
      setMatches((prev) => [
        ...prev,
        {
          id: `manual-${invoiceId}-${paymentId}-${Date.now()}`,
          invoiceId,
          paymentId,
          confidence: "medium",
          reasons: ["Manually matched by user during review"],
          status: "confirmed",
          manual: true,
          createdAt: new Date().toISOString(),
        },
      ]);
      toast.success("Manual match created & confirmed", { icon: "🤝" });
    },
    [isPaymentUsed, remainingBalanceForInvoice]
  );

  const unconfirmMatch = useCallback((matchId: string) => {
    setMatches((prev) => prev.filter((m) => m.id !== matchId));
    toast("Match undone", { icon: "↩️" });
  }, []);

  const value: AppContextValue = {
    user,
    isAuthenticated,
    login,
    logout,
    invoices,
    payments,
    matches,
    suggestions,
    addInvoices,
    addPayments,
    editInvoice,
    editPayment,
    confirmSuggestion,
    rejectSuggestion,
    resolveAmbiguous,
    manualMatch,
    unconfirmMatch,
    paidAmountForInvoice,
    remainingBalanceForInvoice,
    statusForInvoice,
    isPaymentUsed,
    confirmedMatchForInvoice: confirmedForInvoice,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
