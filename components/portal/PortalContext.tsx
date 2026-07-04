"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { supabase } from "@/lib/supabase"
import { FAVORITES_KEY, readBuyerIntent, readStoredIds } from "@/lib/client-preferences"

export type Profile = {
  full_name: string
  phone: string
  budget: number
  preferred_zones: string[]
  rooms: number
  purpose: string
  financing_status: string
}

export type ClientDocument = {
  id: string
  title: string
  type: string
  url: string
  notes?: string
  status?: string
  signed_url?: string
  created_at?: string
}

export type ClientOffer = {
  id: string
  property_title?: string
  created_at?: string
  status?: string
  counter_offer?: number
  offer_price?: number
  negotiation_history?: any[]
}

export type FavoriteProperty = {
  id: string
  property_id?: string
  notes?: string
  created_at?: string
  property?: { id?: string; title?: string; city?: string; price?: number; [key: string]: any }
}

export type Recommendation = {
  property: { id: string; title: string; city?: string; price?: number; [key: string]: any }
  score: number
  reasons?: string[]
}

export type ActivityItem = {
  id: string
  title: string
  description?: string
  type?: string
  created_at?: string
}

export type ClientNotification = {
  id: string
  title: string
  body?: string
  status?: string
  due_at?: string
  created_at?: string
}

export type Appointment = {
  id: string
  property_title?: string | null
  client_email?: string | null
  starts_at?: string | null
  requested_at?: string | null
  status?: string | null
  agent_email?: string | null
  notes?: string | null
}

export type PortalData = {
  token: string
  user: { id?: string; email?: string } | null
  profile: Profile
  documents: ClientDocument[]
  offers: ClientOffer[]
  favorites: FavoriteProperty[]
  recommendations: Recommendation[]
  activity: ActivityItem[]
  notifications: ClientNotification[]
  appointments: Appointment[]
  loading: boolean
  message: string
  setMessage: (msg: string) => void
  refresh: () => Promise<void>
  headers: () => Record<string, string>
}

const PortalContext = createContext<PortalData | null>(null)

export function usePortal(): PortalData {
  const ctx = useContext(PortalContext)
  if (!ctx) throw new Error("usePortal must be used inside <PortalProvider>")
  return ctx
}

const emptyProfile: Profile = {
  full_name: "Client HQS",
  phone: "",
  budget: 250000,
  preferred_zones: ["Pipera"],
  rooms: 3,
  purpose: "locuire",
  financing_status: "neconfirmat",
}

export function PortalProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState("")
  const [user, setUser] = useState<{ id?: string; email?: string } | null>(null)
  const [profile, setProfile] = useState<Profile>(emptyProfile)
  const [documents, setDocuments] = useState<ClientDocument[]>([])
  const [offers, setOffers] = useState<ClientOffer[]>([])
  const [favorites, setFavorites] = useState<FavoriteProperty[]>([])
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [activity, setActivity] = useState<ActivityItem[]>([])
  const [notifications, setNotifications] = useState<ClientNotification[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(true)

  const headers = useCallback(
    (accessToken = token) => ({
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    }),
    [token],
  )

  const syncLocalFavorites = useCallback(
    async (accessToken: string) => {
      const ids = readStoredIds(FAVORITES_KEY)
      if (!ids.length || sessionStorage.getItem("hqs-local-favorites-synced") === "1") return
      await Promise.allSettled(
        ids.map((propertyId) =>
          fetch("/api/client/favorites", {
            method: "POST",
            headers: headers(accessToken),
            body: JSON.stringify({ property_id: propertyId, notes: "Sincronizat din lista locala dupa autentificare." }),
          }),
        ),
      )
      sessionStorage.setItem("hqs-local-favorites-synced", "1")
    },
    [headers],
  )

  const refresh = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      await syncLocalFavorites(token)
      const account = await fetch("/api/client/account", { headers: headers() })
        .then((r) => r.json())
        .catch(() => ({}))
      setUser(account.user || null)
      const localIntent = readBuyerIntent()
      const nextProfile: Profile = account.profile
        ? { ...emptyProfile, ...account.profile }
        : {
            ...emptyProfile,
            budget: localIntent.budget,
            preferred_zones: localIntent.area === "orice" ? emptyProfile.preferred_zones : [localIntent.area],
            rooms: localIntent.rooms,
            purpose: localIntent.purpose,
          }
      setProfile(nextProfile)
      const [docRes, offRes, favRes, actRes, recRes, aptRes] = await Promise.all([
        fetch("/api/client/documents", { headers: headers() }).then((r) => r.json()).catch(() => ({})),
        fetch("/api/client/offers", { headers: headers() }).then((r) => r.json()).catch(() => ({})),
        fetch("/api/client/favorites", { headers: headers() }).then((r) => r.json()).catch(() => ({})),
        fetch("/api/client/activity", { headers: headers() }).then((r) => r.json()).catch(() => ({})),
        fetch("/api/recommendations", { method: "POST", headers: headers(), body: JSON.stringify(nextProfile) })
          .then((r) => r.json())
          .catch(() => ({})),
        fetch("/api/client/appointments", { headers: headers() }).then((r) => r.json()).catch(() => ({})),
      ])
      setDocuments(docRes.documents || [])
      setOffers(offRes.offers || [])
      setFavorites(favRes.favorites || [])
      setActivity(actRes.activity || [])
      setNotifications(actRes.notifications || [])
      setRecommendations(recRes.recommendations || [])
      setAppointments(aptRes.appointments || [])
    } finally {
      setLoading(false)
    }
  }, [token, headers, syncLocalFavorites])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const accessToken = data.session?.access_token || ""
      setToken(accessToken)
      if (accessToken) { refresh() } else { setLoading(false) }
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const accessToken = session?.access_token || ""
      setToken(accessToken)
      if (accessToken) { refresh() } else {
        setUser(null); setProfile(emptyProfile)
        setDocuments([]); setOffers([]); setFavorites([])
        setRecommendations([]); setActivity([]); setNotifications([])
        setAppointments([]); setLoading(false)
      }
    })
    return () => listener.subscription.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!message) return
    const t = setTimeout(() => setMessage(""), 5000)
    return () => clearTimeout(t)
  }, [message])

  const value = useMemo<PortalData>(
    () => ({
      token, user, profile, documents, offers, favorites, loading,
      recommendations, activity, notifications, appointments,
      message, setMessage, refresh, headers,
    }),
    [token, user, profile, documents, offers, favorites, loading, recommendations, activity, notifications, appointments, message, refresh, headers],
  )

  return (
    <PortalContext.Provider value={value}>
      {loading && !token ? null : children}
    </PortalContext.Provider>
  )
}
