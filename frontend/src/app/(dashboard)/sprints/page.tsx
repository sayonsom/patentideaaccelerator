import { EmptyState } from "@/components/ui";

export default function SprintsPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-bold text-text-primary">Invention Sprints</h1>
      </div>
      <EmptyState
        icon={
          <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
          </svg>
        }
        title="No sprints yet"
        description="Run structured invention sprints with your team. 72-hour sessions to go from concepts to filings."
      />
    </div>
  );
}
