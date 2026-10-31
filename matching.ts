import type { Invoice, MatchConfidence, MatchSuggestion, Payment } from "../types";

const STOP_WORDS = new Set([
  "pvt",
  "ltd",
  "limited",
  "enterprises",
  "enterprise",
  "traders",
  "trading",
  "textiles",
  "co",
  "company",
  "stores",
  "store",
  "supplies",
  "supply",
  "logistics",
  "foods",
  "food",
  "crafts",
  "craft",
  "electricals",
  "electrical",
  "hardware",
  "general",
  "stationers",
  "stationery",
  "agro",
  "and",
  "the",
]);

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(s: string): string[] {
  return normalize(s)
    .split(" ")
    .filter((t) => t.length > 1 && !STOP_WORDS.has(t));
}

function nameExactMatch(payer: string, customer: string): boolean {
  const p = normalize(payer);
  const c = normalize(customer);
  if (!p || !c) return false;
  if (p === c) return true;
  if (p.length > 3 && c.includes(p)) return true;
  if (c.length > 3 && p.includes(c)) return true;
  return false;
}

function nameFuzzyMatch(payer: string, customer: string): boolean {
  const pt = tokens(payer);
  const ct = tokens(customer);
  if (!pt.length || !ct.length) return false;
  return pt.some((a) => ct.some((b) => a.length > 2 && b.length > 2 && (a === b || a.startsWith(b) || b.startsWith(a))));
}

function closeAmount(a: number, b: number, tolerance = 1): boolean {
  return Math.abs(a - b) <= tolerance;
}

function diffDays(dateA: string, dateB: string): number {
  const a = new Date(dateA).getTime();
  const b = new Date(dateB).getTime();
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

const CONFIDENCE_RANK: Record<MatchConfidence, number> = {
  high: 3,
  medium: 2,
  low: 1,
  ambiguous: 0,
};

export { CONFIDENCE_RANK, diffDays };

interface Candidate {
  invoice: Invoice;
  tier: number;
  confidence: MatchConfidence;
  reasons: string[];
}

export function generateSuggestions(
  invoices: Invoice[],
  payments: Payment[],
  existing: MatchSuggestion[],
  remainingBalanceFor: (invoiceId: string) => number,
  isPaymentUsed: (paymentId: string) => boolean
): MatchSuggestion[] {
  const rejectedPairs = new Set(
    existing.filter((m) => m.status === "rejected").map((m) => `${m.invoiceId}::${m.paymentId}`)
  );
  const confirmedPairs = new Set(
    existing.filter((m) => m.status === "confirmed").map((m) => `${m.invoiceId}::${m.paymentId}`)
  );

  const suggestions: MatchSuggestion[] = [];

  for (const payment of payments) {
    if (isPaymentUsed(payment.id)) continue;

    const candidates: Candidate[] = [];

    for (const invoice of invoices) {
      const remaining = remainingBalanceFor(invoice.id);
      if (remaining <= 0) continue;
      const pairKey = `${invoice.id}::${payment.id}`;
      if (rejectedPairs.has(pairKey) || confirmedPairs.has(pairKey)) continue;

      const refMatch = payment.referenceNotes
        ? payment.referenceNotes.toLowerCase().includes(invoice.invoiceId.toLowerCase())
        : false;
      const amountExact = closeAmount(payment.amount, remaining);
      const exactName = nameExactMatch(payment.payerName, invoice.customerName);
      const fuzzyName = !exactName && nameFuzzyMatch(payment.payerName, invoice.customerName);
      const dDiff = diffDays(invoice.date, payment.date);
      const dateOk = dDiff >= -5 && dDiff <= 60;
      const isPartial =
        !amountExact &&
        (exactName || fuzzyName) &&
        payment.amount < remaining &&
        payment.amount >= remaining * 0.4 &&
        dateOk;

      if (refMatch && amountExact) {
        candidates.push({
          invoice,
          tier: 1,
          confidence: "high",
          reasons: [
            `Matched by Invoice ID "${invoice.invoiceId}" found in payment reference notes`,
            "Payment amount matches invoice amount exactly",
          ],
        });
      } else if (exactName && amountExact) {
        candidates.push({
          invoice,
          tier: 2,
          confidence: "high",
          reasons: ["Matched by Customer Name & Exact Amount", `"${payment.payerName}" ↔ "${invoice.customerName}"`],
        });
      } else if (fuzzyName && amountExact && dateOk) {
        candidates.push({
          invoice,
          tier: 3,
          confidence: "medium",
          reasons: [
            `Customer name closely matches ("${payment.payerName}" ~ "${invoice.customerName}")`,
            "Amount matches exactly",
            `Payment received ${Math.abs(dDiff)} day(s) ${dDiff >= 0 ? "after" : "before"} invoice date`,
          ],
        });
      } else if (isPartial) {
        candidates.push({
          invoice,
          tier: 4,
          confidence: "medium",
          reasons: [
            `Customer name ${exactName ? "matches" : "closely matches"}`,
            `Partial payment: ₹${payment.amount.toLocaleString("en-IN")} of ₹${remaining.toLocaleString("en-IN")} outstanding`,
            "Date falls within a reasonable payment window",
          ],
        });
      } else if (amountExact) {
        candidates.push({
          invoice,
          tier: 5,
          confidence: "low",
          reasons: ["Only the invoice amount matches the payment amount", "Customer name could not be confidently matched"],
        });
      }
    }

    if (!candidates.length) continue;

    candidates.sort((a, b) => a.tier - b.tier);
    const best = candidates[0];
    const ties = candidates.filter((c) => c.tier === best.tier);

    if (best.tier === 5 && ties.length > 1) {
      suggestions.push({
        id: `sugg-${payment.id}-ambiguous`,
        invoiceId: best.invoice.id,
        paymentId: payment.id,
        confidence: "ambiguous",
        reasons: [
          `Amount ₹${payment.amount.toLocaleString("en-IN")} matches ${ties.length} different invoices`,
          "Customer name on payment is unclear — manual verification required",
          "System will NOT auto-confirm to avoid misallocation",
        ],
        status: "suggested",
        ambiguousWith: ties.map((t) => t.invoice.id),
        createdAt: new Date().toISOString(),
      });
    } else {
      suggestions.push({
        id: `sugg-${payment.id}-${best.invoice.id}`,
        invoiceId: best.invoice.id,
        paymentId: payment.id,
        confidence: best.confidence,
        reasons: best.reasons,
        status: "suggested",
        createdAt: new Date().toISOString(),
      });
    }
  }

  return suggestions;
}
