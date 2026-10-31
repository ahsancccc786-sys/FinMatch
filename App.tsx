import { useState } from "react";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "./context/ThemeContext";
import { AppProvider, useApp } from "./context/AppContext";
import Sidebar from "./components/Sidebar";
import TopBar from "./components/TopBar";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import UploadPage from "./pages/Upload";
import Reconciliation from "./pages/Reconciliation";
import ManualReview from "./pages/ManualReview";
import PendingBills from "./pages/PendingBills";
import AllEntries from "./pages/AllEntries";
import Reports from "./pages/Reports";
import type { PageKey } from "./types";

function Shell() {
  const { isAuthenticated } = useApp();
  const [page, setPage] = useState<PageKey>("dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!isAuthenticated) return <Login />;

  const renderPage = () => {
    switch (page) {
      case "dashboard":
        return <Dashboard />;
      case "upload":
        return <UploadPage />;
      case "reconciliation":
        return <Reconciliation />;
      case "manual-review":
        return <ManualReview />;
      case "pending-bills":
        return <PendingBills />;
      case "all-entries":
        return <AllEntries />;
      case "reports":
        return <Reports />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex min-h-screen bg-fin-50 text-fin-900 dark:bg-fin-950 dark:text-fin-50">
      <Sidebar current={page} onNavigate={setPage} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="flex min-h-screen flex-1 flex-col lg:pl-0">
        <TopBar page={page} onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 p-4 sm:p-8">{renderPage()}</main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#092328",
              color: "#fff",
              border: "1px solid rgba(139,187,146,0.3)",
            },
          }}
        />
        <Shell />
      </AppProvider>
    </ThemeProvider>
  );
}
