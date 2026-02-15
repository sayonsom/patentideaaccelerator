"use client";

import { useState } from "react";
import { Tabs, TabPanel } from "@/components/ui";
import { TRIZWorksheet } from "@/components/frameworks/TRIZWorksheet";
import { SITWorksheet } from "@/components/frameworks/SITWorksheet";
import { CKWorksheet } from "@/components/frameworks/CKWorksheet";
import { FMEAInversion } from "@/components/frameworks/FMEAInversion";

const FRAMEWORK_TABS = [
  { id: "matrix", label: "Contradiction Matrix" },
  { id: "triz", label: "TRIZ" },
  { id: "sit", label: "SIT" },
  { id: "ck", label: "C-K Theory" },
  { id: "fmea", label: "FMEA" },
];

export default function FrameworksPage() {
  const [activeTab, setActiveTab] = useState("matrix");

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-bold text-text-primary">Frameworks</h1>
      </div>

      <Tabs tabs={FRAMEWORK_TABS} activeTab={activeTab} onChange={setActiveTab}>
        <TabPanel id="matrix" activeTab={activeTab}>
          <div className="py-8 text-center">
            <div className="text-4xl mb-4">{"\u26A1"}</div>
            <h2 className="text-lg font-display font-bold text-text-primary mb-2">Software Contradiction Matrix</h2>
            <p className="text-sm text-text-secondary max-w-md mx-auto">
              The interactive contradiction matrix will be built in the next commit.
              Select improving and worsening parameters to discover inventive principles.
            </p>
          </div>
        </TabPanel>

        <TabPanel id="triz" activeTab={activeTab}>
          <TRIZWorksheet />
        </TabPanel>

        <TabPanel id="sit" activeTab={activeTab}>
          <SITWorksheet />
        </TabPanel>

        <TabPanel id="ck" activeTab={activeTab}>
          <CKWorksheet />
        </TabPanel>

        <TabPanel id="fmea" activeTab={activeTab}>
          <FMEAInversion />
        </TabPanel>
      </Tabs>
    </div>
  );
}
