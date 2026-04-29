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
import { roleConfig } from './config/roles';

function Protected({ user, children }: { user: AppUser | null; children: JSX.Element }) {
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function RoleProtected({ user, allowedRoles, children }: { user: AppUser | null; allowedRoles: Role[]; children: JSX.Element }) {
  if (!user) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
}

function PageProtected({ user, path, children }: { user: AppUser | null; path: string; children: JSX.Element }) {
  if (!user) return <Navigate to="/login" replace />;
  if (!roleConfig[user.role].visiblePages.includes(path)) return <Navigate to="/dashboard" replace />;
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
        <Route path="/organizations" element={<PageProtected user={user} path="/organizations"><OrganizationsPage /></PageProtected>} />
        <Route path="/organizations/new" element={<PageProtected user={user} path="/organizations"><OrganizationNewPage /></PageProtected>} />
        <Route path="/organizations/:id" element={<PageProtected user={user} path="/organizations"><OrganizationDetailPage /></PageProtected>} />
        <Route path="/opportunities" element={<PageProtected user={user} path="/opportunities"><OpportunitiesPage /></PageProtected>} />
        <Route path="/opportunities/new" element={<PageProtected user={user} path="/opportunities"><OpportunityNewPage /></PageProtected>} />
        <Route path="/opportunities/:id" element={<PageProtected user={user} path="/opportunities"><OpportunityDetailPage /></PageProtected>} />
        <Route path="/orders" element={<PageProtected user={user} path="/orders"><OrdersPage /></PageProtected>} />
        <Route path="/orders/:id" element={<PageProtected user={user} path="/orders"><OrderDetailPage /></PageProtected>} />
        <Route
          path="/ops-workspace"
          element={
            <RoleProtected user={user} allowedRoles={['OWNER', 'OPS']}>
              <OpsWorkspacePage />
            </RoleProtected>
          }
        />
        <Route path="/reports" element={<PageProtected user={user} path="/reports"><ReportsPage /></PageProtected>} />
        <Route path="/settings" element={<PageProtected user={user} path="/settings"><SettingsPage /></PageProtected>} />
      </Route>
      <Route path="*" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
    </Routes>
  );
}
