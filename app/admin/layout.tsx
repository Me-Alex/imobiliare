export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ro">
      <body className="bg-bg-primary text-text-primary">{children}</body>
    </html>
  )
}
