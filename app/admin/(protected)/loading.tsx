export default function Loading() {
  return (
    <div className="flex flex-col h-full">
      {/* Topbar skeleton */}
      <div
        className="h-14 px-6 flex items-center justify-between flex-shrink-0 bg-white"
        style={{ borderBottom: '0.5px solid var(--ds-border)' }}
      >
        <div className="flex flex-col gap-1.5">
          <div className="h-4 w-32 rounded-md bg-slate-100 animate-pulse" />
          <div className="h-3 w-48 rounded-md bg-slate-100 animate-pulse" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-8 w-28 rounded-lg bg-slate-100 animate-pulse" />
          <div className="h-9 w-9 rounded-lg bg-slate-100 animate-pulse" />
        </div>
      </div>

      {/* Content skeleton */}
      <main className="flex-1 overflow-y-auto p-6 bg-ds-page">
        <div className="flex flex-col gap-4">
          <div className="h-8 w-48 rounded-lg bg-slate-100 animate-pulse" />
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 rounded-xl bg-slate-100 animate-pulse" />
            ))}
          </div>
          <div className="h-64 rounded-xl bg-slate-100 animate-pulse" />
          <div className="h-48 rounded-xl bg-slate-100 animate-pulse" />
        </div>
      </main>
    </div>
  )
}
