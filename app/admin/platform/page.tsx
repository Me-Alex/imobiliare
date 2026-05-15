import AdminExecutiveReports from "@/components/AdminExecutiveReports"
import AdminScaleConsole from "@/components/AdminScaleConsole"


export const metadata = {
  title: "Platform Console | HQS Admin",
}

export default function AdminPlatformPage() {
  return (
    <main className="space-y-8">
      <AdminExecutiveReports />
      <AdminScaleConsole />
    </main>
  )
}
