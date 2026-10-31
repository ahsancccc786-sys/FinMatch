import { useState } from "react";
import { Landmark, Lock, Mail, User as UserIcon, Building2, IndianRupee, ArrowRight } from "lucide-react";
import { useApp } from "../context/AppContext";
import toast from "react-hot-toast";

export default function Login() {
  const { login } = useApp();
  const [mode, setMode] = useState<"login" | "register">("register");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    companyName: "",
    baseCurrency: "INR",
  });

  const update = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password || !form.companyName) {
      toast.error("Please fill in all required fields.");
      return;
    }
    login({
      name: form.name,
      email: form.email,
      companyName: form.companyName,
      baseCurrency: form.baseCurrency,
    });
    toast.success(`Welcome to FinMatch, ${form.name.split(" ")[0]}!`);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-fin-950">
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-fin-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-20 h-[28rem] w-[28rem] rounded-full bg-fin-700/30 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(139,187,146,0.15)_1px,transparent_0)] bg-[size:28px_28px] opacity-40" />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-fin-900/60 shadow-2xl backdrop-blur-xl lg:grid-cols-5">
          {/* Left brand panel */}
          <div className="relative hidden flex-col justify-between bg-gradient-to-br from-fin-800 via-fin-900 to-fin-950 p-10 lg:col-span-2 lg:flex">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-fin-400 to-fin-600 shadow-lg">
                  <Landmark className="h-6 w-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-white">FinMatch</span>
              </div>
              <p className="mt-6 text-sm leading-relaxed text-fin-200">
                Reconcile invoices and payments in minutes — not hours. Built for Indian small businesses handling
                ₹10,000 – ₹20,000 ticket-size transactions every day.
              </p>
            </div>
            <ul className="space-y-4 text-sm text-fin-100">
              <li className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-fin-300" /> Explainable AI-style match suggestions
              </li>
              <li className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-fin-300" /> WhatsApp reminders for pending bills
              </li>
              <li className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-fin-300" /> Manual review for ambiguous matches
              </li>
              <li className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-fin-300" /> Built-in ₹ INR reporting & CSV export
              </li>
            </ul>
            <p className="text-xs text-fin-400">© {new Date().getFullYear()} FinMatch. All figures in INR.</p>
          </div>

          {/* Right form panel */}
          <div className="col-span-3 bg-fin-950/40 p-6 sm:p-10">
            <div className="mb-6 flex items-center gap-2 lg:hidden">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-fin-400 to-fin-600">
                <Landmark className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">FinMatch</span>
            </div>

            <div className="mb-6 flex gap-2 rounded-xl bg-white/5 p-1">
              <button
                onClick={() => setMode("register")}
                className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
                  mode === "register" ? "bg-fin-500 text-white shadow" : "text-fin-300 hover:text-white"
                }`}
              >
                Create Account
              </button>
              <button
                onClick={() => setMode("login")}
                className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
                  mode === "login" ? "bg-fin-500 text-white shadow" : "text-fin-300 hover:text-white"
                }`}
              >
                Login
              </button>
            </div>

            <h2 className="text-2xl font-bold text-white">
              {mode === "register" ? "Set up your business" : "Welcome back"}
            </h2>
            <p className="mt-1 text-sm text-fin-300">
              {mode === "register"
                ? "A quick profile helps us tailor reconciliation to your business."
                : "Log in to continue reconciling your invoices."}
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field icon={UserIcon} label="Full Name" placeholder="Rohan Mehta" value={form.name} onChange={update("name")} />
                <Field icon={Mail} label="Email" type="email" placeholder="rohan@business.in" value={form.email} onChange={update("email")} />
              </div>
              <Field icon={Lock} label="Password" type="password" placeholder="••••••••" value={form.password} onChange={update("password")} />

              {mode === "register" && (
                <div className="grid gap-4 border-t border-white/10 pt-4 sm:grid-cols-2">
                  <Field
                    icon={Building2}
                    label="Company Name"
                    placeholder="Mehta Traders Pvt. Ltd."
                    value={form.companyName}
                    onChange={update("companyName")}
                  />
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-fin-300">
                      Base Currency
                    </label>
                    <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
                      <IndianRupee className="h-4 w-4 text-fin-300" />
                      <select
                        value={form.baseCurrency}
                        onChange={update("baseCurrency")}
                        className="w-full bg-transparent text-sm text-white outline-none [&>option]:bg-fin-900"
                      >
                        <option value="INR">INR — Indian Rupee (₹)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="group mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-fin-500 to-fin-600 py-3 text-sm font-semibold text-white shadow-lg shadow-fin-900/50 transition hover:from-fin-400 hover:to-fin-500"
              >
                {mode === "register" ? "Create Account & Enter FinMatch" : "Login to FinMatch"}
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </button>
              <p className="text-center text-xs text-fin-400">
                This is a hackathon prototype — all data stays in your browser session.
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  icon: Icon,
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  icon: typeof UserIcon;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-fin-300">{label}</label>
      <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 focus-within:border-fin-400">
        <Icon className="h-4 w-4 shrink-0 text-fin-300" />
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm text-white placeholder:text-fin-500 outline-none"
        />
      </div>
    </div>
  );
}
