export function AuthShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="grid min-h-screen place-items-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-8 shadow-sm">
        <p className="t-label text-brand">Quenvara Admin</p>
        <h1 className="mt-2 text-2xl font-semibold">{title}</h1>
        <div className="mt-6">{children}</div>
      </div>
    </main>
  );
}
