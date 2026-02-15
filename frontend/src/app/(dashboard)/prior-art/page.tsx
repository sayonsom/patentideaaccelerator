import { EmptyState } from "@/components/ui";

export default function PriorArtPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-bold text-text-primary">Prior Art Search</h1>
      </div>
      <EmptyState
        icon={
          <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
        }
        title="Search patents and prior art"
        description="Search USPTO and Google Patents to validate novelty of your ideas. Coming in the next build."
      />
    </div>
  );
}
