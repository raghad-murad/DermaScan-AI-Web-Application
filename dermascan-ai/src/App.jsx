import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClientInstance } from '@/lib/query-client';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { ThemeProvider } from '@/lib/ThemeContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ProtectedRoute from '@/components/ProtectedRoute';

// Public pages
import Landing from '@/pages/Landing';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import RequestAccount from '@/pages/RequestAccount';

// Doctor pages
import DoctorLayout from '@/components/doctor/DoctorLayout';
import Dashboard from '@/pages/doctor/Dashboard';
import NewAnalysis from '@/pages/doctor/NewAnalysis';
import Patients from '@/pages/doctor/Patients';
import PatientProfile from '@/pages/doctor/PatientProfile';
import History from '@/pages/doctor/History';
import AnalysisCase from '@/pages/doctor/AnalysisCase';
import Guide from '@/pages/doctor/Guide';
import Support from '@/pages/doctor/Support';
import DoctorSettings from '@/pages/doctor/DoctorSettings';

// Admin pages
import AdminLayout from '@/components/admin/AdminLayout';
import AdminOverview from '@/pages/admin/AdminOverview';
import AccountRequests from '@/pages/admin/AccountRequests';
import ManageDoctors from '@/pages/admin/ManageDoctors';
import ManageAdmins from '@/pages/admin/ManageAdmins';
import AdminTickets from '@/pages/admin/AdminTickets';
import AuditLogs from '@/pages/admin/AuditLogs';

const AuthenticatedApp = () => {
  const { isLoadingPublicSettings, authError } = useAuth();

  if (isLoadingPublicSettings) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError && authError.type === 'user_not_registered') {
    return <UserNotRegisteredError />;
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/request-account" element={<RequestAccount />} />

      {/* Doctor routes */}
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route element={<DoctorLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/new-analysis" element={<NewAnalysis />} />
          <Route path="/patients" element={<Patients />} />
          <Route path="/patients/:id" element={<PatientProfile />} />
          <Route path="/history" element={<History />} />
          <Route path="/history/:id" element={<AnalysisCase />} />
          <Route path="/guide" element={<Guide />} />
          <Route path="/support" element={<Support />} />
          <Route path="/settings" element={<DoctorSettings />} />
        </Route>

        {/* Admin routes */}
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<AdminOverview />} />
          <Route path="/admin/requests" element={<AccountRequests />} />
          <Route path="/admin/doctors" element={<ManageDoctors />} />
          <Route path="/admin/admins" element={<ManageAdmins />} />
          <Route path="/admin/tickets" element={<AdminTickets />} />
          <Route path="/admin/audit-logs" element={<AuditLogs />} />
        </Route>
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <AuthenticatedApp />
          </Router>
          <Toaster />
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;