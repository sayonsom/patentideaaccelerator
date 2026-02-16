"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useSettingsStore } from "@/lib/store";
import { Button, Card, Input, Spinner } from "@/components/ui";
import { toast } from "@/components/ui/Toast";

export default function SettingsPage() {
  const { data: session } = useSession();
  const { apiKey, init: initSettings, setApiKey, clearApiKey } = useSettingsStore();

  const [keyInput, setKeyInput] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<"success" | "error" | null>(null);

  useEffect(() => {
    initSettings();
  }, [initSettings]);

  useEffect(() => {
    setKeyInput(apiKey ?? "");
  }, [apiKey]);

  function handleSave() {
    if (keyInput.trim()) {
      setApiKey(keyInput.trim());
    } else {
      clearApiKey();
    }
    toast("Settings saved successfully.");
  }

  async function handleTestConnection() {
    if (!keyInput.trim()) return;
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/ai/refine", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": keyInput.trim(),
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

  const maskedKey = apiKey
    ? `${apiKey.slice(0, 7)}${"*".repeat(Math.max(0, apiKey.length - 11))}${apiKey.slice(-4)}`
    : "";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-bold text-text-primary">Settings</h1>
        <Button variant="accent" size="sm" onClick={handleSave}>
          Save Changes
        </Button>
      </div>

      <div className="grid gap-6 max-w-2xl">
        {/* Profile */}
        <Card>
          <h2 className="text-lg font-semibold text-text-primary mb-4">Profile</h2>
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

        {/* API Configuration */}
        <Card>
          <h2 className="text-lg font-semibold text-text-primary mb-4">API Configuration</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Anthropic API Key</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    type={showKey ? "text" : "password"}
                    value={keyInput}
                    onChange={(e) => {
                      setKeyInput(e.target.value);
                      setTestResult(null);
                    }}
                    placeholder="sk-ant-..."
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
                  >
                    {showKey ? (
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
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleTestConnection}
                  disabled={testing || !keyInput.trim()}
                >
                  {testing ? <Spinner size="sm" /> : "Test"}
                </Button>
              </div>
              <p className="text-xs text-text-muted mt-1">Required for AI ideation, Alice scoring, claim generation, and red team analysis.</p>
            </div>

            {/* Status indicator */}
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  apiKey ? "bg-green-500" : "bg-red-500"
                }`}
              />
              <span className="text-xs text-text-secondary">
                {apiKey ? "API key configured" : "API key not set"}
              </span>
              {apiKey && (
                <span className="text-[10px] text-text-muted font-mono ml-auto">{maskedKey}</span>
              )}
            </div>

            {/* Test result */}
            {testResult && (
              <div
                className={`text-xs px-3 py-2 rounded-lg ${
                  testResult === "success"
                    ? "bg-green-900/20 text-green-400 border border-green-800/30"
                    : "bg-red-900/20 text-red-400 border border-red-800/30"
                }`}
              >
                {testResult === "success"
                  ? "Connection successful — API key is valid."
                  : "Connection failed — please check your API key."}
              </div>
            )}
          </div>
        </Card>

        {/* Usage */}
        <Card>
          <h2 className="text-lg font-semibold text-text-primary mb-4">Usage</h2>
          <p className="text-sm text-text-secondary">Usage stats will appear here once connected to the backend.</p>
        </Card>

        {/* Data */}
        <Card>
          <h2 className="text-lg font-semibold text-text-primary mb-4">Data</h2>
          <p className="text-sm text-text-secondary mb-3">
            Your ideas and sprint data are stored in PostgreSQL. API key settings are stored locally in your browser.
          </p>
        </Card>
      </div>
    </div>
  );
}
