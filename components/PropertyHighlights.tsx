export default function PropertyHighlights(){
 const items=[['2+','Propuneri active'],['24h','Timp de răspuns'],['100%','Prezentare clară'],['1:1','Consultanță dedicată']]
 return <section className="py-16 px-4 bg-bg-primary"><div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">{items.map(([a,b])=><div key={b} className="bg-bg-card border border-bg-surface rounded-2xl p-5 text-center"><div className="text-2xl md:text-3xl font-bold text-accent">{a}</div><div className="text-text-muted text-sm mt-1">{b}</div></div>)}</div></section>
}
