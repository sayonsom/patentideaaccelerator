"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { useSettingsStore } from "@/lib/store";
import { Button, Card, Input, Spinner } from "@/components/ui";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { toast } from "@/components/ui/Toast";
import type { AIProvider, InfraPreferences, DataRegion, AIDataCenter } from "@/lib/types";
import {
  JURISDICTION_OPTIONS,
  CLAIM_STYLE_OPTIONS,
  TECHNICAL_DEPTH_OPTIONS,
  TONE_OPTIONS,
  DOMAIN_FOCUS_OPTIONS,
  DEFAULT_INFRA_PREFERENCES,
  CLOUD_PROVIDER_OPTIONS,
  DATA_REGION_OPTIONS,
  AI_DATA_CENTER_OPTIONS,
} from "@/lib/types";
import { updateInfraPreferences, getInfraPreferences } from "@/lib/actions/users";

const PROVIDERS: { key: AIProvider; label: string; description: string; placeholder: string }[] = [
  {
    key: "anthropic",
    label: "Anthropic",
    description: "Claude Sonnet 4 -- patent-grade reasoning",
    placeholder: "sk-ant-...",
  },
  {
    key: "openai",
    label: "OpenAI",
    description: "GPT-4o -- broad general capability",
    placeholder: "sk-...",
  },
  {
    key: "google",
    label: "Google",
    description: "Gemini 2.0 Flash -- fast and efficient",
    placeholder: "AIza...",
  },
];

export default function SettingsPage() {
  const { data: session } = useSession();
  const {
    provider,
    keys,
    keyMeta,
    init: initSettings,
    setProvider,
    setKey,
    clearKey,
    promptPrefs,
    promptPrefsLoaded,
    initPromptPrefs,
    updatePromptPrefs,
    savePromptPrefs,
    resetPromptPrefs,
  } = useSettingsStore();

  const [keyInputs, setKeyInputs] = useState<Record<AIProvider, string>>({
    anthropic: "",
    openai: "",
    google: "",
  });
  const [showKeys, setShowKeys] = useState<Record<AIProvider, boolean>>({
    anthropic: false,
    openai: false,
    google: false,
  });
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<"success" | "error" | null>(null);
  const [saving, setSaving] = useState(false);

  // Infrastructure preferences
  const [infraPrefs, setInfraPrefs] = useState<InfraPreferences>({ ...DEFAULT_INFRA_PREFERENCES });
  const [infraLoaded, setInfraLoaded] = useState(false);
  const [infraSaving, setInfraSaving] = useState(false);
  const infraSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const userId = session?.user?.id;

  const prefsSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    initSettings(userId);
    initPromptPrefs();
  }, [initSettings, initPromptPrefs, userId]);

  // Load infrastructure preferences
  useEffect(() => {
    if (!userId) return;
    getInfraPreferences(userId).then((prefs) => {
      if (prefs) setInfraPrefs(prefs);
      setInfraLoaded(true);
    });
  }, [userId]);

  function handleInfraChange(updates: Partial<InfraPreferences>) {
    const next = { ...infraPrefs, ...updates };
    setInfraPrefs(next);
    if (infraSaveTimer.current) clearTimeout(infraSaveTimer.current);
    infraSaveTimer.current = setTimeout(async () => {
      if (!userId) return;
      setInfraSaving(true);
      await updateInfraPreferences(userId, next);
      setInfraSaving(false);
      toast("Infrastructure preferences saved.");
    }, 600);
  }

  // Sync store keys into local inputs
  useEffect(() => {
    setKeyInputs({
      anthropic: keys.anthropic ?? "",
      openai: keys.openai ?? "",
      google: keys.google ?? "",
    });
  }, [keys]);

  const handleSaveAll = useCallback(async () => {
    setSaving(true);
    try {
      for (const p of PROVIDERS) {
        const val = keyInputs[p.key].trim();
        if (val) {
          await setKey(p.key, val, userId);
        } else {
          await clearKey(p.key, userId);
        }
      }
      toast("Settings saved successfully.");
    } catch {
      toast("Failed to save settings.");
    } finally {
      setSaving(false);
    }
  }, [keyInputs, setKey, clearKey, userId]);

  const handleRevoke = useCallback(
    async (p: AIProvider) => {
      await clearKey(p, userId);
      setKeyInputs((prev) => ({ ...prev, [p]: "" }));
      toast(`${PROVIDERS.find((pr) => pr.key === p)?.label} key removed.`);
    },
    [clearKey, userId]
  );

  function toggleShowKey(p: AIProvider) {
    setShowKeys((prev) => ({ ...prev, [p]: !prev[p] }));
  }

  function handleKeyChange(p: AIProvider, value: string) {
    setKeyInputs((prev) => ({ ...prev, [p]: value }));
    setTestResult(null);
  }

  async function handleTestConnection() {
    const activeKey = keyInputs[provider].trim();
    if (!activeKey) return;
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/ai/refine", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": activeKey,
          "x-ai-provider": provider,
        },
        body: JSON.stringify({
          field: "test",
          value: "hello",
          context: "connection test",
        }),
      });
      setTestResult(res.ok ? "success" : "error");
    } catch {
      setTestResult("error");
    } finally {
      setTesting(false);
    }
  }

  function maskKey(key: string | null): string {
    if (!key) return "";
    if (key.length <= 11) return "*".repeat(key.length);
    return `${key.slice(0, 7)}${"*".repeat(Math.max(0, key.length - 11))}${key.slice(-4)}`;
  }

  function displayKeyHint(p: AIProvider): string | null {
    // Prefer showing from the actual key if in local state
    const localKey = keys[p];
    if (localKey) return maskKey(localKey);
    // Fallback: show from DB metadata
    const meta = keyMeta[p];
    if (meta) return `${meta.keyPrefix}${"*".repeat(20)}${meta.keySuffix}`;
    return null;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-serif font-bold text-ink">Settings</h1>
        <Button variant="accent" size="sm" onClick={handleSaveAll} disabled={saving}>
          {saving ? <Spinner size="sm" /> : "Save Changes"}
        </Button>
      </div>

      <div className="grid gap-6 max-w-2xl">
        {/* Profile */}
        <Card>
          <h2 className="text-lg font-medium text-ink mb-4">Profile</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Name</label>
              <Input value={session?.user?.name ?? ""} disabled placeholder="Managed by Cognito" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Email</label>
              <Input type="email" value={session?.user?.email ?? ""} disabled placeholder="Managed by Cognito" />
            </div>
            <p className="text-xs text-text-muted">Profile information is managed by your identity provider (AWS Cognito).</p>
          </div>
        </Card>

        {/* AI Provider Selection */}
        <Card>
          <h2 className="text-lg font-medium text-ink mb-4">AI Provider</h2>
          <p className="text-sm text-text-secondary mb-4">
            Choose which AI model powers ideation, scoring, and claim generation.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {PROVIDERS.map((p) => {
              const isActive = provider === p.key;
              const hasKey = !!keys[p.key] || !!keyMeta[p.key];
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setProvider(p.key)}
                  className={`relative text-left rounded-lg border-2 p-4 transition-all ${
                    isActive
                      ? "border-accent bg-accent/5"
                      : "border-border hover:border-text-muted"
                  }`}
                >
                  {/* Status dot */}
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm font-normal ${isActive ? "text-accent" : "text-ink"}`}>
                      {p.label}
                    </span>
                    <div
                      className={`w-2.5 h-2.5 rounded-full ${
                        hasKey ? "bg-green-500" : "bg-red-500"
                      }`}
                      title={hasKey ? "Key configured" : "No key set"}
                    />
                  </div>
                  <p className="text-xs text-text-muted leading-relaxed">{p.description}</p>
                  {isActive && (
                    <div className="absolute top-2 right-2">
                      <svg className="w-4 h-4 text-accent" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </Card>

        {/* API Keys */}
        <Card>
          <h2 className="text-lg font-medium text-ink mb-4">API Keys</h2>
          <p className="text-sm text-text-secondary mb-4">
            Enter your API keys below. Keys are encrypted and stored securely in your account, synced across all your devices.
          </p>
          <div className="space-y-5">
            {PROVIDERS.map((p) => {
              const isActive = provider === p.key;
              const hasKey = !!keys[p.key] || !!keyMeta[p.key];
              const hint = displayKeyHint(p.key);
              return (
                <div
                  key={p.key}
                  className={`rounded-lg border p-4 transition-colors ${
                    isActive ? "border-accent/40 bg-accent/5" : "border-border"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-normal text-ink">{p.label}</span>
                      {isActive && (
                        <span className="text-[10px] font-medium uppercase tracking-wider text-accent bg-accent/10 px-1.5 py-0.5 rounded">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          hasKey ? "bg-green-500" : "bg-red-500"
                        }`}
                      />
                      <span className="text-xs text-text-secondary">
                        {hasKey ? "Configured" : "Not set"}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        type={showKeys[p.key] ? "text" : "password"}
                        value={keyInputs[p.key]}
                        onChange={(e) => handleKeyChange(p.key, e.target.value)}
                        placeholder={p.placeholder}
                      />
                      <button
                        type="button"
                        onClick={() => toggleShowKey(p.key)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-ink transition-colors"
                      >
                        {showKeys[p.key] ? (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        )}
                      </button>
                    </div>
                    {isActive && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleTestConnection}
                        disabled={testing || !keyInputs[p.key].trim()}
                      >
                        {testing ? <Spinner size="sm" /> : "Test"}
                      </Button>
                    )}
                    {hasKey && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRevoke(p.key)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                      >
                        Revoke
                      </Button>
                    )}
                  </div>
                  {hasKey && hint && !showKeys[p.key] && (
                    <p className="text-[10px] text-text-muted font-mono mt-1.5">{hint}</p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Test result */}
          {testResult && (
            <div
              className={`text-xs px-3 py-2 rounded-lg mt-4 ${
                testResult === "success"
                  ? "bg-green-900/20 text-green-400 border border-green-800/30"
                  : "bg-red-900/20 text-red-400 border border-red-800/30"
              }`}
            >
              {testResult === "success"
                ? `Connection successful -- ${PROVIDERS.find((p) => p.key === provider)?.label} API key is valid.`
                : `Connection failed -- please check your ${PROVIDERS.find((p) => p.key === provider)?.label} API key.`}
            </div>
          )}
        </Card>

        {/* Prompt Preferences */}
        <Card>
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-lg font-medium text-ink">Prompt Preferences</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                resetPromptPrefs();
                toast("Preferences reset to defaults.");
              }}
            >
              Reset to Defaults
            </Button>
          </div>
          <p className="text-sm text-text-secondary mb-5">
            Customize how AI generates patent content across all features. Changes auto-save.
          </p>

          {!promptPrefsLoaded ? (
            <div className="flex justify-center py-6">
              <Spinner size="sm" />
            </div>
          ) : (
            <div className="space-y-5">
              {/* Row 1: Jurisdiction, Claim Style, Technical Depth */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Select
                  label="Jurisdiction"
                  options={JURISDICTION_OPTIONS}
                  value={promptPrefs.jurisdiction}
                  onChange={(v) => {
                    updatePromptPrefs({ jurisdiction: v as typeof promptPrefs.jurisdiction });
                    if (prefsSaveTimer.current) clearTimeout(prefsSaveTimer.current);
                    prefsSaveTimer.current = setTimeout(() => {
                      savePromptPrefs();
                      toast("Preferences saved.");
                    }, 600);
                  }}
                />
                <Select
                  label="Claim Style"
                  options={CLAIM_STYLE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                  value={promptPrefs.claimStyle}
                  onChange={(v) => {
                    updatePromptPrefs({ claimStyle: v as typeof promptPrefs.claimStyle });
                    if (prefsSaveTimer.current) clearTimeout(prefsSaveTimer.current);
                    prefsSaveTimer.current = setTimeout(() => {
                      savePromptPrefs();
                      toast("Preferences saved.");
                    }, 600);
                  }}
                />
                <Select
                  label="Technical Depth"
                  options={TECHNICAL_DEPTH_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                  value={promptPrefs.technicalDepth}
                  onChange={(v) => {
                    updatePromptPrefs({ technicalDepth: v as typeof promptPrefs.technicalDepth });
                    if (prefsSaveTimer.current) clearTimeout(prefsSaveTimer.current);
                    prefsSaveTimer.current = setTimeout(() => {
                      savePromptPrefs();
                      toast("Preferences saved.");
                    }, 600);
                  }}
                />
              </div>

              {/* Row 2: Tone, Domain Focus */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Tone"
                  options={TONE_OPTIONS}
                  value={promptPrefs.tone}
                  onChange={(v) => {
                    updatePromptPrefs({ tone: v as typeof promptPrefs.tone });
                    if (prefsSaveTimer.current) clearTimeout(prefsSaveTimer.current);
                    prefsSaveTimer.current = setTimeout(() => {
                      savePromptPrefs();
                      toast("Preferences saved.");
                    }, 600);
                  }}
                />
                <Select
                  label="Domain Focus"
                  options={DOMAIN_FOCUS_OPTIONS}
                  value={promptPrefs.domainFocus}
                  onChange={(v) => {
                    updatePromptPrefs({ domainFocus: v as typeof promptPrefs.domainFocus });
                    if (prefsSaveTimer.current) clearTimeout(prefsSaveTimer.current);
                    prefsSaveTimer.current = setTimeout(() => {
                      savePromptPrefs();
                      toast("Preferences saved.");
                    }, 600);
                  }}
                />
              </div>

              {/* Company Context */}
              <div>
                <Textarea
                  label="Company Context (optional)"
                  value={promptPrefs.companyContext}
                  maxLength={500}
                  placeholder="E.g., We are a fintech company focused on real-time payments using distributed ledger technology..."
                  autoExpand={false}
                  onChange={(e) => {
                    updatePromptPrefs({ companyContext: e.target.value });
                    if (prefsSaveTimer.current) clearTimeout(prefsSaveTimer.current);
                    prefsSaveTimer.current = setTimeout(() => {
                      savePromptPrefs();
                      toast("Preferences saved.");
                    }, 800);
                  }}
                />
                <p className="text-xs text-text-muted mt-1 text-right">
                  {promptPrefs.companyContext.length}/500
                </p>
              </div>
            </div>
          )}
        </Card>

        {/* Infrastructure Preferences */}
        <Card>
          <h2 className="text-lg font-medium text-ink mb-1">Infrastructure Preferences</h2>
          <p className="text-sm text-text-secondary mb-5">
            Choose where your data is stored and which cloud provider hosts your workloads. Changes auto-save.
          </p>

          {!infraLoaded ? (
            <div className="flex justify-center py-6">
              <Spinner size="sm" />
            </div>
          ) : (
            <div className="space-y-5">
              {/* Cloud Provider */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-3">Cloud Provider</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {CLOUD_PROVIDER_OPTIONS.map((opt) => {
                    const isActive = infraPrefs.cloudProvider === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleInfraChange({ cloudProvider: opt.value })}
                        className={`relative text-left rounded-lg border-2 p-4 transition-all ${
                          isActive
                            ? "border-accent bg-accent/5"
                            : "border-border hover:border-text-muted"
                        }`}
                      >
                        <span className={`text-sm font-normal ${isActive ? "text-accent" : "text-ink"}`}>
                          {opt.label}
                        </span>
                        <p className="text-xs text-text-muted mt-1">{opt.description}</p>
                        {isActive && (
                          <div className="absolute top-2 right-2">
                            <svg className="w-4 h-4 text-accent" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Data Region & AI Data Center */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Data Storage Region"
                  options={DATA_REGION_OPTIONS}
                  value={infraPrefs.dataRegion}
                  onChange={(v) => handleInfraChange({ dataRegion: v as DataRegion })}
                />
                <Select
                  label="AI Workload Data Center"
                  options={AI_DATA_CENTER_OPTIONS}
                  value={infraPrefs.aiDataCenter}
                  onChange={(v) => handleInfraChange({ aiDataCenter: v as AIDataCenter })}
                />
              </div>

              {infraSaving && (
                <p className="text-xs text-text-muted flex items-center gap-1">
                  <Spinner size="sm" /> Saving...
                </p>
              )}
            </div>
          )}
        </Card>

        {/* Usage */}
        <Card>
          <h2 className="text-lg font-medium text-ink mb-4">Usage</h2>
          <p className="text-sm text-text-secondary">Usage stats will appear here once connected to the backend.</p>
        </Card>

        {/* Data */}
        <Card>
          <h2 className="text-lg font-medium text-ink mb-4">Data</h2>
          <p className="text-sm text-text-secondary mb-3">
            Your ideas and sprint data are stored in PostgreSQL. API keys are encrypted and stored securely in your account.
          </p>
        </Card>
      </div>
    </div>
  );
}
