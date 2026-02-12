"use client";

import { useEffect, useState } from "react";
import { Btn, Card, Input, SectionLabel } from "./ui";

const STORAGE_KEY_OPENAI_API_KEY = "sims_openai_api_key";

export function loadOpenAIApiKey() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(STORAGE_KEY_OPENAI_API_KEY) || "";
}

export function saveOpenAIApiKey(value) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY_OPENAI_API_KEY, value || "");
}

export function clearOpenAIApiKey() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY_OPENAI_API_KEY);
}

export default function Settings({ onBack, openAIApiKey, setOpenAIApiKey }) {
  const [showKey, setShowKey] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    setStatus("");
  }, [openAIApiKey]);

  const save = () => {
    saveOpenAIApiKey(openAIApiKey?.trim() || "");
    setStatus("Saved");
    setTimeout(() => setStatus(""), 1200);
  };

  const clear = () => {
    if (!confirm("Clear the saved OpenAI API key from this browser?")) return;
    clearOpenAIApiKey();
    setOpenAIApiKey("");
    setStatus("Cleared");
    setTimeout(() => setStatus(""), 1200);
  };

  return (
    <div style={{ maxWidth: 820, margin: "0 auto" }} className="fade-in">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: 18,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 11,
              letterSpacing: 4,
              color: "#3b82f6",
              fontWeight: 700,
              marginBottom: 8,
              textTransform: "uppercase",
            }}
          >
            Settings
          </div>
          <h2
            style={{
              fontSize: 28,
              fontWeight: 800,
              color: "#f8fafc",
              margin: 0,
              fontFamily: "var(--font-display)",
            }}
          >
            OpenAI
          </h2>
          <p style={{ color: "#64748b", marginTop: 8, fontSize: 14 }}>
            Your API key is stored only in this browser (localStorage). If you
            deploy this app publicly, do not put private API keys in the
            browser.
          </p>
        </div>
        <Btn variant="secondary" onClick={onBack}>
          ← Back
        </Btn>
      </div>

      <Card style={{ background: "#0b1120" }}>
        <SectionLabel>OpenAI API Key</SectionLabel>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 280 }}>
            <Input
              value={openAIApiKey || ""}
              onChange={setOpenAIApiKey}
              placeholder="sk-..."
              type={showKey ? "text" : "password"}
            />
          </div>
          <Btn variant="secondary" onClick={() => setShowKey((v) => !v)} style={{ fontSize: 12 }}>
            {showKey ? "Hide" : "Show"}
          </Btn>
          <Btn variant="accent" onClick={save} disabled={!openAIApiKey?.trim()}>
            Save
          </Btn>
          <Btn variant="ghost" onClick={clear} disabled={!openAIApiKey?.trim()} style={{ fontSize: 12 }}>
            Clear
          </Btn>
          {status && (
            <span style={{ fontSize: 12, color: "#10b981", fontWeight: 700 }}>
              {status}
            </span>
          )}
        </div>
      </Card>
    </div>
  );
}

