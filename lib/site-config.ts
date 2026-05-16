export const siteConfig = {
  name: "HQS Imobiliare",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://hqsimobiliare.ro",
  contact: {
    phoneLabel: process.env.NEXT_PUBLIC_CONTACT_PHONE_LABEL || "Solicita apel din formular",
    phoneHref: process.env.NEXT_PUBLIC_CONTACT_PHONE_HREF || "/contact",
    email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "hqs.imobiliare@gmail.com",
    office: process.env.NEXT_PUBLIC_CONTACT_OFFICE || "Bucuresti",
    hours: process.env.NEXT_PUBLIC_CONTACT_HOURS || "Luni - Vineri, 09:00 - 18:00",
  },
} as const
