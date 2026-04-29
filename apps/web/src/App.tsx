import { Navigate, Route, Routes } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { AppShell } from './components/AppShell';
import { getStoredUser } from './auth';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import {
  OpportunitiesPage,
  OpportunityDetailPage,
  OpportunityNewPage,
  OrderDetailPage,
  OrdersPage,
  OrganizationDetailPage,
  OrganizationNewPage,
  OrganizationsPage,
  OpsWorkspacePage,
  ReportsPage,
  SettingsPage,
} from './pages/CrudPages';
import type { AppUser, Role } from './types';

function Protected({ user, children }: { user: AppUser | null; children: JSX.Element }) {
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function RoleProtected({ user, allowedRoles, children }: { user: AppUser | null; allowedRoles: Role[]; children: JSX.Element }) {
  if (!user) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  const [user, setUser] = useState<AppUser | null>(() => getStoredUser());
  const dashboard = useMemo(() => <DashboardPage role={user?.role ?? 'OWNER'} />, [user?.role]);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage setUser={setUser} />} />
      <Route
        element={
          <Protected user={user}>
            <AppShell user={user as AppUser} setUser={setUser} />
          </Protected>
        }
      >
        <Route path="/dashboard" element={dashboard} />
        <Route path="/organizations" element={<OrganizationsPage />} />
        <Route path="/organizations/new" element={<OrganizationNewPage />} />
        <Route path="/organizations/:id" element={<OrganizationDetailPage />} />
        <Route path="/opportunities" element={<OpportunitiesPage />} />
        <Route path="/opportunities/new" element={<OpportunityNewPage />} />
        <Route path="/opportunities/:id" element={<OpportunityDetailPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/orders/:id" element={<OrderDetailPage />} />
        <Route
          path="/ops-workspace"
          element={
            <RoleProtected user={user} allowedRoles={['OWNER', 'OPS']}>
              <OpsWorkspacePage />
            </RoleProtected>
          }
        />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
    </Routes>
  );
}
