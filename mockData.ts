import type { Invoice, Payment } from "../types";

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setHours(10, 30, 0, 0);
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

let seq = 1;
function nextId(prefix: string) {
  return `${prefix}-${(seq++).toString().padStart(4, "0")}`;
}

function inv(
  invoiceId: string,
  customerName: string,
  customerPhone: string,
  daysAgo: number,
  dueInDays: number,
  amount: number,
  notes = ""
): Invoice {
  return {
    id: nextId("inv"),
    invoiceId,
    customerName,
    customerPhone,
    date: isoDaysAgo(daysAgo),
    dueDate: isoDaysAgo(daysAgo - dueInDays),
    amount,
    notes,
  };
}

function pay(
  transactionId: string,
  payerName: string,
  daysAgo: number,
  amount: number,
  referenceNotes: string,
  mode: string
): Payment {
  return {
    id: nextId("pay"),
    transactionId,
    payerName,
    date: isoDaysAgo(daysAgo),
    amount,
    referenceNotes,
    mode,
  };
}

export function buildMockData(): { invoices: Invoice[]; payments: Payment[] } {
  const invoices: Invoice[] = [
    inv("INV-1001", "Aarav Traders", "+91 98765 43210", 172, 15, 12500),
    inv("INV-1002", "Priya Sharma Textiles", "+91 91234 56780", 168, 15, 18200),
    inv("INV-1003", "Kiran Hardware Co.", "+91 99887 66554", 160, 20, 10750),
    inv("INV-1004", "Vikram Electricals", "+91 90909 12345", 150, 10, 16400),
    inv("INV-1005", "Sana Enterprises", "+91 88990 11223", 142, 15, 13990),
    inv("INV-1006", "Rohan Mehta Logistics", "+91 93456 78901", 138, 10, 15000),
    inv("INV-1007", "Rohan Malhotra Foods", "+91 97654 32109", 136, 10, 15000),
    inv("INV-1008", "Aarav Traders", "+91 98765 43210", 125, 15, 11200),
    inv("INV-1009", "Neha Agro Supplies", "+91 92233 44556", 118, 20, 19800),
    inv("INV-1010", "Kiran Hardware Co.", "+91 99887 66554", 112, 15, 10750, "Repeat order"),
    inv("INV-1011", "Deepak Stationers", "+91 95566 77889", 104, 10, 14300),
    inv("INV-1012", "Priya Sharma Textiles", "+91 91234 56780", 96, 15, 17650),
    inv("INV-1013", "Meera Crafts", "+91 94455 66778", 90, 10, 12000),
    inv("INV-1014", "Vikram Electricals", "+91 90909 12345", 82, 10, 16400),
    inv("INV-1015", "Sana Enterprises", "+91 88990 11223", 75, 15, 13990),
    inv("INV-1016", "Arjun General Store", "+91 96677 88990", 68, 10, 11990),
    inv("INV-1017", "Neha Agro Supplies", "+91 92233 44556", 58, 20, 19800),
    inv("INV-1018", "Deepak Stationers", "+91 95566 77889", 50, 10, 14300),
    inv("INV-1019", "Meera Crafts", "+91 94455 66778", 42, 10, 12500),
    inv("INV-1020", "Aarav Traders", "+91 98765 43210", 34, 15, 18750),
    inv("INV-1021", "Arjun General Store", "+91 96677 88990", 26, 10, 11990),
    inv("INV-1022", "Kiran Hardware Co.", "+91 99887 66554", 18, 15, 16100),
    inv("INV-1023", "Priya Sharma Textiles", "+91 91234 56780", 12, 15, 18200),
    inv("INV-1024", "Vikram Electricals", "+91 90909 12345", 6, 10, 15600),
    inv("INV-1025", "Sana Enterprises", "+91 88990 11223", 3, 15, 13200),
  ];

  const payments: Payment[] = [
    pay("TXN-55001", "AARAV TRADERS", 170, 12500, "Payment for INV-1001", "NEFT"),
    pay("TXN-55002", "Priya Sharma", 165, 18200, "settlement INV-1002 textiles", "RTGS"),
    pay("TXN-55003", "Kiran Hardware", 155, 10750, "", "UPI"),
    pay("TXN-55004", "Vikram Electricals Pvt Ltd", 148, 16400, "", "NEFT"),
    pay("TXN-55005", "Sana Enterprises", 140, 13990, "Invoice settlement", "IMPS"),
    // Ambiguous edge case: same amount, two possible customers, no clear name
    pay("TXN-55006", "UPI-884421", 135, 15000, "", "UPI"),
    pay("TXN-55007", "Aarav Traders", 122, 11200, "against INV-1008", "NEFT"),
    pay("TXN-55008", "Neha Agro", 115, 19800, "", "RTGS"),
    pay("TXN-55009", "Kiran Hardware Co", 108, 10750, "INV-1010 payment", "UPI"),
    pay("TXN-55010", "Deepak Stationers", 100, 14300, "", "IMPS"),
    pay("TXN-55011", "P. Sharma", 93, 17650, "", "UPI"),
    pay("TXN-55012", "Meera Crafts", 88, 12000, "paid in full", "NEFT"),
    pay("TXN-55013", "Vikram Electricals", 79, 16400, "ref INV-1014", "NEFT"),
    pay("TXN-55014", "Sana Enterprises", 70, 13990, "", "UPI"),
    // Partial payment edge case - underpaid
    pay("TXN-55015", "Arjun General Store", 64, 9000, "part payment", "UPI"),
    pay("TXN-55016", "Neha Agro Supplies", 54, 19800, "INV-1017", "RTGS"),
    pay("TXN-55017", "Deepak Stationers", 46, 14300, "", "IMPS"),
    pay("TXN-55018", "Meera Crafts", 39, 12500, "", "UPI"),
    pay("TXN-55019", "Aarav Traders", 30, 18750, "settlement", "NEFT"),
    pay("TXN-55020", "UPI-772310", 20, 16100, "", "UPI"),
  ];

  return { invoices, payments };
}
