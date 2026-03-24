import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/dashboard";
import Contracts from "@/pages/contracts";
import Staff from "@/pages/staff";
import Suppliers from "@/pages/suppliers";
import SupplyMoney from "@/pages/supply-money";
import Investors from "@/pages/investors";
import Reception from "@/pages/reception";
import Equipment from "@/pages/equipment";
import BudgetTypes from "@/pages/budget-types";
import Payments from "@/pages/payments";
import Progress from "@/pages/progress";
import Documents from "@/pages/documents";
import NotFound from "@/pages/not-found";
import Footer from "./components/layout/footer";
import LoginPage from "@/pages/login"; // 👈 thêm trang login
import ProtectedRoute from "./lib/protected-route";
import Export from "@/pages/export";
import WorkCalendar from "./pages/work-calendar";
import Settings from "@/pages/settings";
import Invoices from "@/pages/invoices";
import LegalDocuments from "@/pages/legal-documents";
import Missions from "@/pages/missions";
import Guarantees from "@/pages/guarantees";
import LetterOfCredit from "@/pages/letter-of-credit";
import ActualCosts from "@/pages/actual-costs";
import PlannedCosts from "@/pages/planned-costs";
import CostTypes from "@/pages/cost-types";
import CurrencyTypes from "@/pages/currency-types";
import Departments from "@/pages/departments";
import UsersPage from "@/pages/users";
import AuditLogs from "@/pages/audit-logs";

function Router() {
  console.log("Current pathname:", window.location.hash); // 👈 debug ở đây
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />

      {/* protected routes */}
      <Route
        path="/"
        component={() => (
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/hop-dong"
        component={() => (
          <ProtectedRoute>
            <Contracts />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/hop-dong/:id"
        component={() => (
          <ProtectedRoute>
            <Contracts />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/can-bo"
        component={() => (
          <ProtectedRoute>
            <Staff />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/nha-cung-cap"
        component={() => (
          <ProtectedRoute>
            <Suppliers />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/chu-dau-tu"
        component={() => (
          <ProtectedRoute>
            <Investors />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/tiep-nhan"
        component={() => (
          <ProtectedRoute>
            <Reception />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/trang-bi"
        component={() => (
          <ProtectedRoute>
            <Equipment />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/loai-ngan-sach"
        component={() => (
          <ProtectedRoute>
            <BudgetTypes />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/thanh-toan"
        component={() => (
          <ProtectedRoute>
            <Payments />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/tien-do"
        component={() => (
          <ProtectedRoute>
            <Progress />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/tai-lieu"
        component={() => (
          <ProtectedRoute>
            <Documents />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/xuat-du-lieu"
        component={() => (
          <ProtectedRoute>
            <Export />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/lich"
        component={() => (
          <ProtectedRoute>
            <WorkCalendar />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/cap-tien"
        component={() => (
          <ProtectedRoute>
            <SupplyMoney />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/cai-dat"
        component={() => (
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/hoa-don"
        component={() => (
          <ProtectedRoute>
            <Invoices />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/van-ban-phap-ly"
        component={() => (
          <ProtectedRoute>
            <LegalDocuments />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/doan-ra-vao"
        component={() => (
          <ProtectedRoute>
            <Missions />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/bao-lanh"
        component={() => (
          <ProtectedRoute>
            <Guarantees />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/thu-tin-dung"
        component={() => (
          <ProtectedRoute>
            <LetterOfCredit />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/loai-chi-phi"
        component={() => (
          <ProtectedRoute>
            <CostTypes />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/chi-phi-thuc-te"
        component={() => (
          <ProtectedRoute>
            <ActualCosts />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/chi-phi-theo-hop-dong"
        component={() => (
          <ProtectedRoute>
            <PlannedCosts />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/phong-ban"
        component={() => (
          <ProtectedRoute>
            <Departments />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/users"
        component={() => (
          <ProtectedRoute>
            <UsersPage />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/audit-logs"
        component={() => (
          <ProtectedRoute>
            <AuditLogs />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/loai-tien"
        component={() => (
          <ProtectedRoute>
            <CurrencyTypes />
          </ProtectedRoute>
        )}
      />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  console.log("App component loaded");
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
        <Footer />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
