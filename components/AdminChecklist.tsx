export default function AdminChecklist() {
  const items = [
    'Bulk actions pentru lead-uri',
    'Filtre rapide pentru proprietăți',
    'Audit real din DB',
    'Accesibilitate bazică verificată',
  ]
  return (
    <section className="rounded-2xl border border-bg-surface bg-bg-secondary p-5 mb-8">
      <p className="text-xs uppercase tracking-widest text-accent font-semibold mb-3">Checklist admin</p>
      <ul className="space-y-2 text-sm text-text-muted">
        {items.map(item => <li key={item} className="flex items-start gap-2"><span className="text-accent">•</span><span>{item}</span></li>)}
      </ul>
    </section>
  )
}
