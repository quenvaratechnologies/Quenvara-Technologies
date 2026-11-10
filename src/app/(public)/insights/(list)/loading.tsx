export default function Loading() {
  return <div role="status" aria-label="Loading" className="mx-auto max-w-[1240px] animate-pulse px-4 py-24"><div className="h-10 w-2/3 rounded bg-slate-200" /><div className="mt-6 h-4 w-1/2 rounded bg-slate-200" /><div className="mt-12 grid gap-5 md:grid-cols-3">{[0, 1, 2].map((i) => <div key={i} className="h-40 rounded-xl bg-slate-200" />)}</div></div>;
}
