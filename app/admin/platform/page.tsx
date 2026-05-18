import { redirect } from "next/navigation"

export const metadata = {
  title: "Platform Console | HQS Admin",
}

export default function AdminPlatformPage() {
  redirect("/admin/dashboard")
}
