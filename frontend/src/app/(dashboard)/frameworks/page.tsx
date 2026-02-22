"use client";

import { useState } from "react";
import { Tabs, TabPanel } from "@/components/ui";
import { TRIZWorksheet } from "@/components/frameworks/TRIZWorksheet";
import { SITWorksheet } from "@/components/frameworks/SITWorksheet";
import { CKWorksheet } from "@/components/frameworks/CKWorksheet";
import { FMEAInversion } from "@/components/frameworks/FMEAInversion";
import { ContradictionMatrix } from "@/components/frameworks/ContradictionMatrix";

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
        <h1 className="text-2xl font-serif font-bold text-ink">Frameworks</h1>
      </div>

      <Tabs tabs={FRAMEWORK_TABS} activeTab={activeTab} onChange={setActiveTab}>
        <TabPanel id="matrix" activeTab={activeTab}>
          <ContradictionMatrix />
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
