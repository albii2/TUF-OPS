import { Navigate, Route, Routes } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { AppShell } from './components/AppShell';
import { getStoredUser } from './auth';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ForgePage } from './pages/ForgePage';
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
  TerritoryPage,
  TerritoryMapPage,
  TerritoryMapView,
  MyOpportunitiesPage,
  TeamOpportunitiesPage,
  TeamPerformancePage,
  EarningsPage,
  UsersPage,
  EcosystemPipelinePage,
  ChangeCredentialPage,
} from './pages/CrudPages';
import AcademyPage from './pages/AcademyPage';
import AdminCertificationPage from './pages/AdminCertificationPage';
import type { AppUser, Role } from './types';
import { roleConfig } from './config/roles';

// Routes that are always accessible regardless of certification status
const UNCERTIFIED_ACCESSIBLE_PATHS = new Set([
  '/academy',
  '/login',
  '/change-credential',
  '/admin/certification',
]);

function Protected({ user, children }: { user: AppUser | null; children: JSX.Element }) {
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function RoleProtected({ user, allowedRoles, children }: { user: AppUser | null; allowedRoles: Role[]; children: JSX.Element }) {
  if (!user) return <Navigate to="/login" replace />;
  if (user.mustChangeCredential) return <Navigate to="/change-credential" replace />;
  if (!allowedRoles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
}

function PageProtected({ user, path, children }: { user: AppUser | null; path: string; children: JSX.Element }) {
  if (!user) return <Navigate to="/login" replace />;
  if (user.mustChangeCredential && path !== '/change-credential') return <Navigate to="/change-credential" replace />;
  if (!roleConfig[user.role].visiblePages.includes(path) && path !== '/academy' && path !== '/admin/certification') return <Navigate to="/dashboard" replace />;
  return children;
}

/**
 * Certification gate: uncertified REP users are redirected to the Academy.
 * Non-REP roles (ADMIN, DIRECTOR, REGIONAL_DIRECTOR) bypass this gate.
 * Training, login, change-credential, and dashboard paths are always accessible.
 */
function CertificationProtected({ user, path, children }: { user: AppUser | null; path: string; children: JSX.Element }) {
  if (!user) return <Navigate to="/login" replace />;
  if (user.mustChangeCredential && path !== '/change-credential') return <Navigate to="/change-credential" replace />;

  // ADMIN bypasses certification gate
  if (user.role === 'ADMIN') return children;

  // Allow access to Academy and cert review
  if (UNCERTIFIED_ACCESSIBLE_PATHS.has(path)) return children;

  // REP and DIRECTOR: gate CRM access behind full certification + Director approval
  if (!user.isCertified) return <Navigate to="/academy" replace />;

  return children;
}

export default function App() {
  const [user, setUser] = useState<AppUser | null>(() => getStoredUser());
  const dashboard = useMemo(() => <DashboardPage role={user?.role ?? 'ADMIN'} />, [user?.role]);

  useEffect(() => {
    const syncUser = () => setUser(getStoredUser());
    window.addEventListener('tuf:user-updated', syncUser);
    window.addEventListener('storage', syncUser);
    return () => {
      window.removeEventListener('tuf:user-updated', syncUser);
      window.removeEventListener('storage', syncUser);
    };
  }, []);

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
        <Route path="/change-credential" element={<Protected user={user}><ChangeCredentialPage setUser={setUser} /></Protected>} />
        <Route path="/dashboard" element={<CertificationProtected user={user} path="/dashboard"><PageProtected user={user} path="/dashboard">{dashboard}</PageProtected></CertificationProtected>} />
        <Route path="/forge" element={<CertificationProtected user={user} path="/forge"><PageProtected user={user} path="/forge"><ForgePage /></PageProtected></CertificationProtected>} />
        <Route path="/academy" element={<PageProtected user={user} path="/academy"><AcademyPage /></PageProtected>} />
        <Route path="/admin/certification" element={<RoleProtected user={user} allowedRoles={['DIRECTOR', 'REGIONAL_DIRECTOR', 'ADMIN']}><AdminCertificationPage /></RoleProtected>} />
        <Route path="/orders" element={<PageProtected user={user} path="/orders"><OrdersPage /></PageProtected>} />
        <Route path="/organizations" element={<CertificationProtected user={user} path="/organizations"><PageProtected user={user} path="/organizations"><OrganizationsPage /></PageProtected></CertificationProtected>} />
        <Route path="/organizations/new" element={<CertificationProtected user={user} path="/organizations"><PageProtected user={user} path="/organizations"><OrganizationNewPage /></PageProtected></CertificationProtected>} />
        <Route path="/organizations/:id" element={<CertificationProtected user={user} path="/organizations"><PageProtected user={user} path="/organizations"><OrganizationDetailPage /></PageProtected></CertificationProtected>} />
        <Route path="/ecosystem-pipeline" element={<CertificationProtected user={user} path="/ecosystem-pipeline"><PageProtected user={user} path="/ecosystem-pipeline"><EcosystemPipelinePage /></PageProtected></CertificationProtected>} />
        <Route path="/opportunities" element={<CertificationProtected user={user} path="/opportunities"><PageProtected user={user} path="/opportunities"><OpportunitiesPage /></PageProtected></CertificationProtected>} />
        <Route path="/opportunities/new" element={<CertificationProtected user={user} path="/opportunities"><PageProtected user={user} path="/opportunities"><OpportunityNewPage /></PageProtected></CertificationProtected>} />
        <Route path="/opportunities/:id" element={<CertificationProtected user={user} path="/opportunities"><PageProtected user={user} path="/opportunities"><OpportunityDetailPage /></PageProtected></CertificationProtected>} />
        <Route path="/my-opportunities" element={<CertificationProtected user={user} path="/my-opportunities"><PageProtected user={user} path="/my-opportunities"><MyOpportunitiesPage /></PageProtected></CertificationProtected>} />
        <Route path="/team-opportunities" element={<CertificationProtected user={user} path="/team-opportunities"><PageProtected user={user} path="/team-opportunities"><TeamOpportunitiesPage /></PageProtected></CertificationProtected>} />
        <Route path="/team-performance" element={<CertificationProtected user={user} path="/team-performance"><PageProtected user={user} path="/team-performance"><TeamPerformancePage /></PageProtected></CertificationProtected>} />
        <Route path="/orders" element={<CertificationProtected user={user} path="/orders"><PageProtected user={user} path="/orders"><OrdersPage /></PageProtected></CertificationProtected>} />
        <Route path="/orders/:id" element={<CertificationProtected user={user} path="/orders"><PageProtected user={user} path="/orders"><OrderDetailPage /></PageProtected></CertificationProtected>} />
        <Route
          path="/ops-workspace"
          element={
            <RoleProtected user={user} allowedRoles={['ADMIN', 'REGIONAL_DIRECTOR']}>
              <OpsWorkspacePage />
            </RoleProtected>
          }
        />
        <Route path="/reports" element={<CertificationProtected user={user} path="/reports"><PageProtected user={user} path="/reports"><ReportsPage /></PageProtected></CertificationProtected>} />
        <Route path="/earnings" element={<CertificationProtected user={user} path="/earnings"><PageProtected user={user} path="/earnings"><EarningsPage /></PageProtected></CertificationProtected>} />
        <Route path="/territory" element={<CertificationProtected user={user} path="/territory"><PageProtected user={user} path="/territory"><TerritoryMapView /></PageProtected></CertificationProtected>} />
        <Route path="/territory/static" element={<CertificationProtected user={user} path="/territory"><PageProtected user={user} path="/territory"><TerritoryPage /></PageProtected></CertificationProtected>} />
        <Route path="/settings" element={<CertificationProtected user={user} path="/settings"><PageProtected user={user} path="/settings"><SettingsPage /></PageProtected></CertificationProtected>} />
        <Route path="/users" element={<CertificationProtected user={user} path="/users"><PageProtected user={user} path="/users"><UsersPage /></PageProtected></CertificationProtected>} />
      </Route>
      <Route path="*" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
    </Routes>
  );
}
