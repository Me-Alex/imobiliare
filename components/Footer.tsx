export default function Footer() {
  return (
    <footer className="bg-bg-primary border-t border-bg-surface py-8 px-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-lg font-bold">
          <span className="text-accent">HQS</span><span className="text-text-primary">imobiliare</span>
        </div>
        <p className="text-sm text-text-muted">© {new Date().getFullYear()} HQS Imobiliare. Toate drepturile rezervate.</p>
        <div className="flex gap-6 text-sm text-text-muted">
          <a href="#" className="hover:text-accent transition-colors">Termeni</a>
          <a href="#" className="hover:text-accent transition-colors">Confidențialitate</a>
          <a href="#contact" className="hover:text-accent transition-colors">Contact</a>
        </div>
      </div>
    </footer>
  )
}
