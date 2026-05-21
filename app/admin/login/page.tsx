import AdminLogin from "@/components/admin/AdminLogin"

export const metadata = {
  title: { absolute: "Admin Login | HQS Imobiliare" },
  description: "Autentificare securizata pentru panoul administrativ HQS Imobiliare.",
  robots: {
    index: false,
    follow: false,
  },
}

export default function AdminLoginPage() {
  return <AdminLogin />
}
