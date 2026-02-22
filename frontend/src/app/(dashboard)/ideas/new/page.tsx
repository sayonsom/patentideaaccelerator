"use client";

import { Suspense } from "react";
import { IdeaWizard } from "@/components/ideas/IdeaWizard";

export default function NewIdeaPage() {
  return (
    <div>
      <h1 className="text-2xl font-serif font-bold text-ink mb-8">New Idea</h1>
      <Suspense fallback={<div />}>
        <IdeaWizard />
      </Suspense>
    </div>
  );
}
