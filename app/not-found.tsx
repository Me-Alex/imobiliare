import Link from 'next/link'
export default function NotFound(){
  return <main className="min-h-screen flex items-center justify-center bg-bg-primary text-text-primary px-4"><div className="text-center max-w-md"><h1 className="text-4xl font-bold mb-4">Pagina nu există</h1><p className="text-text-muted mb-8">Îți recomand să revii pe homepage și să cauți proprietatea potrivită.</p><Link className="inline-flex px-5 py-3 rounded-xl bg-accent text-bg-primary font-bold" href="/">Înapoi acasă</Link></div></main>
}
