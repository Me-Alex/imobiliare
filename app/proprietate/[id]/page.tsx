"use client"
import { proprietati } from "@/lib/proprietati"
import { notFound } from "next/navigation"
import Header from "@/components/Header"
import Footer from "@/components/Footer"
import ContactDetaliu from "@/components/ContactDetaliu"
import { useState } from "react"
import Link from "next/link"

export default function PaginaProprietate({ params }: { params: { id: string } }) {
  const p = proprietati.find(x => x.id === params.id)
  if (!p) return notFound()

  const [imgActiva, setImgActiva] = useState(0)
  const pretFormatat = p.tranzactie === "inchiriere"
    ? `€${p.pret.toLocaleString("ro-RO")}/lună`
    : `€${p.pret.toLocaleString("ro-RO")}`

  return (
    <main>
      <Header />
      <div className="max-w-7xl mx-auto px-4 py-10">
        <Link href="/#proprietati" className="inline-flex items-center gap-2 text-text-muted text-sm hover:text-accent transition-colors mb-6">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Înapoi la proprietăți
        </Link>

        <div className="grid lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2">
            {/* Galerie */}
            <div className="relative rounded-2xl overflow-hidden h-80 md:h-[460px] mb-3 bg-bg-card">
              <img src={p.galerie[imgActiva]} alt={p.titlu} className="w-full h-full object-cover" />
              <div className="absolute top-4 left-4 flex gap-2">
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${p.tranzactie === "vanzare" ? "bg-accent text-bg-primary" : "bg-bg-surface text-text-primary border border-accent/30"}`}>
                  {p.tranzactie === "vanzare" ? "De vânzare" : "De închiriat"}
                </span>
                <span className="bg-bg-primary/80 text-text-muted text-xs font-medium px-3 py-1 rounded-full border border-bg-surface capitalize">{p.tip}</span>
              </div>
            </div>
            {p.galerie.length > 1 && (
              <div className="flex gap-2 mb-8">
                {p.galerie.map((img, i) => (
                  <button key={i} onClick={() => setImgActiva(i)}
                    className={`h-16 w-24 rounded-xl overflow-hidden border-2 transition-all ${i === imgActiva ? "border-accent" : "border-bg-surface opacity-60 hover:opacity-100"}`}>
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Info proprietate */}
            <h1 className="text-2xl md:text-3xl font-bold text-text-primary mb-2">{p.titlu}</h1>
            <p className="text-text-muted text-sm flex items-center gap-1 mb-6">
              <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              {p.adresa}
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
              {[
                { label: "Camere", val: p.camere },
                { label: "Suprafață", val: `${p.suprafata} mp` },
                { label: "Băi", val: p.bai },
                { label: "An construcție", val: p.anConstructie || "N/A" },
              ].map(item => (
                <div key={item.label} className="bg-bg-card border border-bg-surface rounded-xl p-4 text-center">
                  <div className="text-lg font-bold text-accent">{item.val}</div>
                  <div className="text-text-muted text-xs mt-1">{item.label}</div>
                </div>
              ))}
            </div>

            <div className="bg-bg-card border border-bg-surface rounded-2xl p-6 mb-6">
              <h2 className="text-lg font-semibold text-text-primary mb-3">Descriere</h2>
              <p className="text-text-muted leading-relaxed text-sm">{p.descriere}</p>
            </div>

            <div className="bg-bg-card border border-bg-surface rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-text-primary mb-4">Facilități</h2>
              <div className="flex flex-wrap gap-2">
                {p.facilitati.map(f => (
                  <span key={f} className="bg-accent/10 text-accent border border-accent/20 text-sm px-3 py-1 rounded-lg">{f}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar contact */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <div className="bg-bg-card border border-bg-surface rounded-2xl p-6 mb-4">
                <div className="text-3xl font-bold text-accent mb-1">{pretFormatat}</div>
                <div className="text-text-muted text-sm">{p.zona}, București</div>
              </div>
              <ContactDetaliu proprietate={p.titlu} />
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
}
