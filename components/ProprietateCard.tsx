import { Proprietate } from "@/lib/proprietati"
import Image from "next/image"

export default function ProprietateCard({ proprietate: p }: { proprietate: Proprietate }) {
  const pretFormatat = p.tranzactie === "inchiriere"
    ? `€${p.pret.toLocaleString("ro-RO")}/lună`
    : `€${p.pret.toLocaleString("ro-RO")}`

  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 group">
      <div className="relative h-52 overflow-hidden">
        <img
          src={p.imagineUrl}
          alt={p.titlu}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-3 left-3 flex gap-2">
          <span className={`text-xs font-bold px-3 py-1 rounded-full ${
            p.tranzactie === "vanzare" ? "bg-[#1a3c5e] text-white" : "bg-[#c9a84c] text-white"
          }`}>
            {p.tranzactie === "vanzare" ? "De vânzare" : "De închiriat"}
          </span>
          <span className="bg-white text-[#1a3c5e] text-xs font-bold px-3 py-1 rounded-full capitalize">
            {p.tip}
          </span>
        </div>
      </div>
      <div className="p-5">
        <h3 className="font-bold text-[#1a3c5e] text-lg mb-1 line-clamp-1">{p.titlu}</h3>
        <p className="text-gray-400 text-sm mb-3 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {p.zona}, București
        </p>
        <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            {p.camere} camere
          </span>
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
            {p.suprafata} mp
          </span>
        </div>
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <span className="text-2xl font-bold text-[#c9a84c]">{pretFormatat}</span>
          <a href="#contact" className="bg-[#1a3c5e] text-white text-sm px-4 py-2 rounded-xl hover:bg-[#0d2137] transition-colors font-medium">
            Detalii
          </a>
        </div>
      </div>
    </div>
  )
}
