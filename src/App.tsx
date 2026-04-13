import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, Outlet } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Suspense, lazy } from "react";
import { Loader2 } from "lucide-react";

// Lazy load pages for better performance
const LandingPage = lazy(() => import("./pages/LandingPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const QueryPage = lazy(() => import("./pages/QueryPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const AdminDashboardPage = lazy(() => import("./pages/AdminDashboardPage"));
const AdminLoginPage = lazy(() => import("./pages/AdminLoginPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const VerifyEmailPage = lazy(() => import("./pages/VerifyEmailPage"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));

const queryClient = new QueryClient();

// ─── Protected Route Components ─────────────────────────────────

/** Check if user is logged in (member) */
function ProtectedMemberRoute() {
  const token = localStorage.getItem("amdon_access_token");
  return token ? <Outlet /> : <Navigate to="/login" replace />;
}

/** Check if admin is logged in */
function ProtectedAdminRoute() {
  const adminToken = localStorage.getItem("adminToken");
  const adminSecret = localStorage.getItem("amdon_admin_secret");
  
  // Require either JWT token OR admin secret (for backward compatibility)
  return (adminToken || adminSecret) ? <Outlet /> : <Navigate to="/admin/login" replace />;
}

/** Loading fallback for lazy-loaded components */
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

// ─── Main App Component ───────────────────────────────────────

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* ─── Public Routes ───────────────────────────────── */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/query" element={<QueryPage />} />

            {/* ─── Protected Member Routes ───────────────────── */}
            <Route element={<ProtectedMemberRoute />}>
              <Route path="/dashboard" element={<DashboardPage />} />
            </Route>

            {/* ─── Admin Routes ────────────────────────────────── */}
            <Route path="/admin/login" element={<AdminLoginPage />} />
            
            <Route element={<ProtectedAdminRoute />}>
              <Route path="/admin" element={<AdminDashboardPage />} />
              <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            </Route>

            {/* ─── Fallback ───────────────────────────────────── */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;