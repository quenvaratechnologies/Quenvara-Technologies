"use client";
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 text-center">
      <h1 className="t-page">Something went wrong</h1>
      <p className="mt-3 text-muted">An unexpected error occurred. Please try again.</p>
      <button onClick={reset} className="mt-8 rounded-lg bg-brand px-5 py-2.5 text-sm font-medium text-white">Try again</button>
    </main>
  );
}
