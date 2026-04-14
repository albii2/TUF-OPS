import { PageHeader } from "@/components/ui/page-header";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage your account and application settings."
      />
      <div className="p-4 border rounded-lg">
        <p>Settings page content goes here.</p>
      </div>
    </div>
  );
}
