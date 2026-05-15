import type { SVGProps } from "react"

type IconProps = SVGProps<SVGSVGElement>

function Icon({ children, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      {children}
    </svg>
  )
}

export function ArrowLeft(props: IconProps) { return <Icon {...props}><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></Icon> }
export function ArrowRight(props: IconProps) { return <Icon {...props}><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></Icon> }
export function ArrowUpRight(props: IconProps) { return <Icon {...props}><path d="M7 17 17 7" /><path d="M7 7h10v10" /></Icon> }
export function Bath(props: IconProps) { return <Icon {...props}><path d="M9 6 7.5 7.5" /><path d="M4 12h16" /><path d="M5 12v4a4 4 0 0 0 4 4h6a4 4 0 0 0 4-4v-4" /><path d="M7 12V5a2 2 0 0 1 2-2h1" /></Icon> }
export function BedDouble(props: IconProps) { return <Icon {...props}><path d="M2 18V7a3 3 0 0 1 3-3h14a3 3 0 0 1 3 3v11" /><path d="M2 14h20" /><path d="M6 10h4" /><path d="M14 10h4" /><path d="M4 18v2" /><path d="M20 18v2" /></Icon> }
export function BookmarkPlus(props: IconProps) { return <Icon {...props}><path d="M19 21 12 17 5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /><path d="M12 7v6" /><path d="M9 10h6" /></Icon> }
export function Building2(props: IconProps) { return <Icon {...props}><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18" /><path d="M4 22h16" /><path d="M10 6h.01" /><path d="M14 6h.01" /><path d="M10 10h.01" /><path d="M14 10h.01" /><path d="M10 14h.01" /><path d="M14 14h.01" /></Icon> }
export function CalendarCheck2(props: IconProps) { return <Icon {...props}><path d="M8 2v4" /><path d="M16 2v4" /><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M3 10h18" /><path d="m9 16 2 2 4-5" /></Icon> }
export function CalendarDays(props: IconProps) { return <Icon {...props}><path d="M8 2v4" /><path d="M16 2v4" /><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M3 10h18" /><path d="M8 14h.01" /><path d="M12 14h.01" /><path d="M16 14h.01" /><path d="M8 18h.01" /><path d="M12 18h.01" /></Icon> }
export function Car(props: IconProps) { return <Icon {...props}><path d="M19 17h2v-5l-2-5H5l-2 5v5h2" /><path d="M7 17h10" /><circle cx="7" cy="17" r="2" /><circle cx="17" cy="17" r="2" /><path d="M5 12h14" /></Icon> }
export function CheckCircle2(props: IconProps) { return <Icon {...props}><circle cx="12" cy="12" r="9" /><path d="m9 12 2 2 4-5" /></Icon> }
export function Clock3(props: IconProps) { return <Icon {...props}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Icon> }
export function FileCheck2(props: IconProps) { return <Icon {...props}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="m9 15 2 2 4-5" /></Icon> }
export function Handshake(props: IconProps) { return <Icon {...props}><path d="m11 17 2 2a2 2 0 0 0 3-3" /><path d="m14 14 3 3a2 2 0 0 0 3-3l-3.5-3.5" /><path d="M9 12 7 14a2 2 0 1 1-3-3l4-4 3 3" /><path d="M14 7h3l4 4" /><path d="M3 7h4" /></Icon> }
export function Heart(props: IconProps) { return <Icon {...props}><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" /></Icon> }
export function Home(props: IconProps) { return <Icon {...props}><path d="m3 11 9-8 9 8" /><path d="M5 10v11h14V10" /><path d="M9 21v-7h6v7" /></Icon> }
export function ListChecks(props: IconProps) { return <Icon {...props}><path d="m3 7 2 2 4-4" /><path d="M11 7h10" /><path d="m3 17 2 2 4-4" /><path d="M11 17h10" /></Icon> }
export function Mail(props: IconProps) { return <Icon {...props}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></Icon> }
export function MapPin(props: IconProps) { return <Icon {...props}><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="3" /></Icon> }
export function Menu(props: IconProps) { return <Icon {...props}><path d="M4 6h16" /><path d="M4 12h16" /><path d="M4 18h16" /></Icon> }
export function Moon(props: IconProps) { return <Icon {...props}><path d="M21 12.8A8.5 8.5 0 1 1 11.2 3 6.7 6.7 0 0 0 21 12.8z" /></Icon> }
export function Phone(props: IconProps) { return <Icon {...props}><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.7.6 2.5a2 2 0 0 1-.5 2.1L8 9.5a16 16 0 0 0 6.5 6.5l1.2-1.2a2 2 0 0 1 2.1-.5c.8.3 1.6.5 2.5.6a2 2 0 0 1 1.7 2Z" /></Icon> }
export function Plus(props: IconProps) { return <Icon {...props}><path d="M12 5v14" /><path d="M5 12h14" /></Icon> }
export function Ruler(props: IconProps) { return <Icon {...props}><path d="m16 2 6 6L8 22l-6-6Z" /><path d="m7 15 2 2" /><path d="m10 12 2 2" /><path d="m13 9 2 2" /></Icon> }
export function Scale(props: IconProps) { return <Icon {...props}><path d="M12 3v18" /><path d="M5 6h14" /><path d="m5 6-3 7h6Z" /><path d="m19 6-3 7h6Z" /></Icon> }
export function Search(props: IconProps) { return <Icon {...props}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></Icon> }
export function SearchCheck(props: IconProps) { return <Icon {...props}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /><path d="m8 11 2 2 4-5" /></Icon> }
export function Send(props: IconProps) { return <Icon {...props}><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></Icon> }
export function ShieldCheck(props: IconProps) { return <Icon {...props}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /><path d="m9 12 2 2 4-5" /></Icon> }
export function SlidersHorizontal(props: IconProps) { return <Icon {...props}><path d="M3 6h18" /><path d="M3 12h18" /><path d="M3 18h18" /><path d="M8 6v.01" /><path d="M14 12v.01" /><path d="M18 18v.01" /></Icon> }
export function Sparkles(props: IconProps) { return <Icon {...props}><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8Z" /><path d="M5 3v4" /><path d="M3 5h4" /><path d="M19 17v4" /><path d="M17 19h4" /></Icon> }
export function Sun(props: IconProps) { return <Icon {...props}><circle cx="12" cy="12" r="4" /><path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.9 4.9 1.4 1.4" /><path d="m17.7 17.7 1.4 1.4" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="m6.3 17.7-1.4 1.4" /><path d="m19.1 4.9-1.4 1.4" /></Icon> }
export function Tag(props: IconProps) { return <Icon {...props}><path d="M20.6 13.6 13.7 20.5a2 2 0 0 1-2.8 0L3 12.6V3h9.6l8 8a2 2 0 0 1 0 2.8Z" /><circle cx="7.5" cy="7.5" r=".5" fill="currentColor" /></Icon> }
export function Target(props: IconProps) { return <Icon {...props}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" /></Icon> }
export function TrendingUp(props: IconProps) { return <Icon {...props}><path d="m3 17 6-6 4 4 8-8" /><path d="M14 7h7v7" /></Icon> }
export function X(props: IconProps) { return <Icon {...props}><path d="M18 6 6 18" /><path d="m6 6 12 12" /></Icon> }
