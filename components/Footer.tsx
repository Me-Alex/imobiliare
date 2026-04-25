export default function Footer() {
  return (
    <footer className="bg-[#0d2137] text-blue-200 py-10 px-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-xl font-bold">
          <span className="text-[#c9a84c]">HQS</span> Imobiliare
        </div>
        <p className="text-sm text-blue-300">© {new Date().getFullYear()} HQS Imobiliare. Toate drepturile rezervate.</p>
        <div className="flex gap-6 text-sm">
          <a href="#" className="hover:text-white transition-colors">Termeni</a>
          <a href="#" className="hover:text-white transition-colors">Confidențialitate</a>
          <a href="#contact" className="hover:text-white transition-colors">Contact</a>
        </div>
      </div>
    </footer>
  )
}
