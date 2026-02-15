export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <div className="text-center animate-fade-in">
        <h1 className="font-display text-5xl font-bold text-text-primary mb-4">
          <span className="text-accent-gold">Volt</span>
          <span>Edge</span>
        </h1>
        <p className="text-text-muted text-lg max-w-md mx-auto">
          AI-powered patent ideation platform for software engineering teams.
        </p>
        <div className="mt-8 flex gap-4 justify-center">
          <a
            href="/ideas"
            className="px-6 py-3 bg-accent-gold text-surface-deep font-semibold rounded-lg hover:opacity-90 transition-opacity"
          >
            Get Started
          </a>
        </div>
      </div>
    </main>
  );
}
