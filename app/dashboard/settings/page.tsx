import AccessibilityControls from '@/components/settings/accessibility-controls';

export const dynamic = 'force-dynamic';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
        <h1 className="text-3xl font-semibold text-slate-900">Settings</h1>
        <p className="mt-2 text-slate-500">
          Use the profile dropdown to change theme. Additional account settings can be added here.
        </p>
      </div>
      <AccessibilityControls />
    </div>
  );
}
