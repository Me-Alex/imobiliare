type CmsEntry = {
  title: string
  section: string
  content: { headline?: string; body?: string }
}

export default function CmsContentBand({ entry }: { entry?: CmsEntry | null }) {
  if (!entry) return null

  return (
    <section className="border-y border-bg-surface bg-bg-card px-4 py-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-accent">CMS live</span>
          <h2 className="mt-2 text-2xl font-black text-text-primary">{entry.content?.headline || entry.title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-text-muted">{entry.content?.body || "Text editabil din admin."}</p>
        </div>
        <span className="rounded-lg border border-bg-surface px-4 py-2 text-sm font-bold text-text-muted">{entry.section}</span>
      </div>
    </section>
  )
}
