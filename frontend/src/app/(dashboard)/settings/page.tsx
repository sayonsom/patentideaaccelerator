import { Card } from "@/components/ui";

export default function SettingsPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-bold text-text-primary">Settings</h1>
      </div>
      <div className="grid gap-6 max-w-2xl">
        <Card>
          <h2 className="text-lg font-semibold text-text-primary mb-4">Profile</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Name</label>
              <input
                type="text"
                className="w-full px-3 py-2 rounded-lg bg-surface-deep border border-border-default text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-gold/40"
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Email</label>
              <input
                type="email"
                className="w-full px-3 py-2 rounded-lg bg-surface-deep border border-border-default text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-gold/40"
                placeholder="you@company.com"
              />
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-text-primary mb-4">API Configuration</h2>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Anthropic API Key</label>
            <input
              type="password"
              className="w-full px-3 py-2 rounded-lg bg-surface-deep border border-border-default text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-gold/40"
              placeholder="sk-ant-..."
            />
            <p className="text-xs text-text-muted mt-1">Required for AI ideation, Alice scoring, and claim generation.</p>
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-text-primary mb-4">Usage</h2>
          <p className="text-sm text-text-secondary">Usage stats will appear here once you start creating ideas.</p>
        </Card>
      </div>
    </div>
  );
}
