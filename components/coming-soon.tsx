export function ComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-5 sm:px-6 lg:px-8">
      <h1 className="mb-5 text-lg font-semibold text-slate-900">{title}</h1>
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
        <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-400">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
          </svg>
        </span>
        <p className="mt-4 text-sm font-semibold text-slate-700">Coming soon</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-slate-400">{description}</p>
      </div>
    </div>
  )
}
