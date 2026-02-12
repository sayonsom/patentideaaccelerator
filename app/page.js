"use client";

import { useEffect, useState } from "react";
import MemberSetup from "../components/MemberSetup";
import TeamReview from "../components/TeamReview";
import Workspace from "../components/Workspace";
import AdminDashboard from "../components/AdminDashboard";
import Settings, { loadOpenAIApiKey } from "../components/Settings";
import { Btn } from "../components/ui";
import { autoFormTeams } from "../lib/teamFormation";

export default function Home() {
  const [phase, setPhase] = useState(1);
  const [view, setView] = useState("flow"); // flow | admin | settings
  const [members, setMembers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [openAIApiKey, setOpenAIApiKey] = useState("");

  useEffect(() => {
    setOpenAIApiKey(loadOpenAIApiKey());
  }, []);

  // Auto-form teams when transitioning from phase 1 → 2
  const handlePhase1Next = () => {
    const result = autoFormTeams(members, 3);
    setTeams(result.teams);
    setPhase(2);
  };

  // Export
  const exportData = () => {
    const data = JSON.stringify(
      { members, teams, exportedAt: new Date().toISOString() },
      null,
      2
    );
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sims-accelerator-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import
  const importData = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target.result);
          if (data.members) setMembers(data.members);
          if (data.teams) {
            setTeams(data.teams);
            setPhase(3);
          } else if (data.members?.length > 0) {
            setPhase(2);
          }
        } catch {
          alert("Invalid file format");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <header
        style={{
          borderBottom: "1px solid #1e293b",
          padding: "14px 28px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "#020617ee",
          position: "sticky",
          top: 0,
          zIndex: 100,
          backdropFilter: "blur(12px)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              background: "linear-gradient(135deg, #f59e0b, #ef4444)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
              fontWeight: 900,
              color: "#fff",
            }}
          >
            △
          </div>
          <div>
            <div
              style={{
                fontSize: 15,
                fontWeight: 800,
                color: "#f8fafc",
                letterSpacing: -0.3,
              }}
            >
              SIMS
            </div>
            <div
              style={{
                fontSize: 9,
                color: "#64748b",
                letterSpacing: 2,
                fontWeight: 600,
              }}
            >
              SYSTEMATIC INNOVATION · TRIZ · SIT · C-K
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {/* Phase dots */}
          <div style={{ display: "flex", gap: 2, marginRight: 12 }}>
            {[1, 2, 3].map((p) => (
              <div
                key={p}
                style={{
                  width: p === phase ? 24 : 8,
                  height: 8,
                  borderRadius: 4,
                  background:
                    p === phase
                      ? "#f59e0b"
                      : p < phase
                      ? "#10b981"
                      : "#334155",
                  transition: "all 0.3s",
                }}
              />
            ))}
          </div>
          <Btn variant="ghost" onClick={importData} style={{ fontSize: 12 }}>
            Import
          </Btn>
          <Btn variant="secondary" onClick={exportData} style={{ fontSize: 12 }}>
            Export JSON
          </Btn>
          <Btn
            variant={view === "admin" ? "accent" : "secondary"}
            onClick={() => setView(view === "admin" ? "flow" : "admin")}
            style={{ fontSize: 12 }}
          >
            {view === "admin" ? "Exit Admin" : "Admin"}
          </Btn>
          <Btn
            variant={view === "settings" ? "accent" : "secondary"}
            onClick={() => setView(view === "settings" ? "flow" : "settings")}
            style={{ fontSize: 12 }}
          >
            {view === "settings" ? "Exit Settings" : "Settings"}
          </Btn>
        </div>
      </header>

      {/* Main content */}
      <main
        style={{
          flex: 1,
          padding: "40px 28px",
          maxWidth: 1000,
          margin: "0 auto",
          width: "100%",
        }}
      >
        {view === "admin" ? (
          <AdminDashboard
            members={members}
            teams={teams}
            onBack={() => setView("flow")}
          />
        ) : view === "settings" ? (
          <Settings
            onBack={() => setView("flow")}
            openAIApiKey={openAIApiKey}
            setOpenAIApiKey={setOpenAIApiKey}
          />
        ) : (
          <>
            {phase === 1 && (
              <MemberSetup
                members={members}
                setMembers={setMembers}
                onNext={handlePhase1Next}
              />
            )}
            {phase === 2 && (
              <TeamReview
                members={members}
                teams={teams}
                setTeams={setTeams}
                onNext={() => setPhase(3)}
                onBack={() => setPhase(1)}
              />
            )}
            {phase === 3 && (
              <Workspace
                teams={teams}
                setTeams={setTeams}
                onBack={() => setPhase(2)}
                openAIApiKey={openAIApiKey}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer
        style={{
          borderTop: "1px solid #1e293b",
          padding: "16px 28px",
          textAlign: "center",
        }}
      >
        <p
          style={{
            color: "#334155",
            fontSize: 11,
            margin: 0,
            letterSpacing: 0.5,
          }}
        >
          100% Local · No Data Leaves Your Machine · Export/Import JSON to Save
          · Based on TRIZ + SIT + C-K Theory
        </p>
      </footer>
    </div>
  );
}
