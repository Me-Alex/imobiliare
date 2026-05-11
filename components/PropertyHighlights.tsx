const metrics = [
  ["2+", "oferte publice", "Portofoliul ramane selectiv, usor de verificat si de discutat."],
  ["24h", "raspuns rapid", "Cererea ta intra direct in fluxul echipei, nu intr-un inbox uitat."],
  ["1:1", "consiliere", "Vorbesti cu un consultant care intelege criteriile tale reale."],
  ["0", "presiune inutila", "Vizionari si recomandari intr-un ritm normal, fara insistente."],
]

export default function PropertyHighlights() {
  return (
    <section className="px-4 py-16 bg-bg-primary border-y border-bg-surface">
      <div className="max-w-7xl mx-auto">
        <div className="grid gap-4 md:grid-cols-4">
          {metrics.map(([value, label, text]) => (
            <div key={label} className="border border-bg-surface bg-bg-card rounded-lg p-5">
              <div className="text-3xl font-bold text-accent">{value}</div>
              <div className="text-text-primary font-semibold mt-2">{label}</div>
              <p className="text-text-muted text-sm leading-relaxed mt-2">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
