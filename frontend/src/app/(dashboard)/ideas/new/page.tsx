"use client";

import { IdeaWizard } from "@/components/ideas/IdeaWizard";

export default function NewIdeaPage() {
  return (
    <div>
      <h1 className="text-2xl font-display font-bold text-text-primary mb-8">New Idea</h1>
      <IdeaWizard />
    </div>
  );
}
