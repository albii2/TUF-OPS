# BETA BUSINESS LOGIC FUNCTION MAP

- User lifecycle: `apps/web/src/services/usersService.ts`
- Auth identity resolution: `apps/web/src/auth.ts`
- Role routing + page access: `apps/web/src/config/roles.ts`, `apps/web/src/App.tsx`
- Dashboard behavior states: `apps/web/src/pages/DashboardPage.tsx`, `apps/web/src/services/businessSelectors.ts`
- Lead import + assignment: `apps/web/src/components/OrganizationImportPanel.tsx`, `apps/web/src/services/organizationsService.ts`, `apps/web/src/pages/OrganizationsPage.tsx`
- Role-specific execution pages: `/my-opportunities`, `/team-opportunities`, `/orders`, `/territory`
