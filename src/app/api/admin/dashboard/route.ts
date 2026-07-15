import { NextRequest, NextResponse } from 'next/server'
import { getSafeDb } from '@/lib/edge-db'
import { createAuthenticatedSupabaseClient, supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  // ── Auth check ──────────────────────────────────────────────
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const token = authHeader.slice(7)
    const { data: authData, error } = await supabase.auth.getUser(token)
    if (error || !authData.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const authenticatedSupabase = createAuthenticatedSupabaseClient(token)
    const { data: profile, error: profileError } = await authenticatedSupabase
      .from('profiles')
      .select('role,is_active')
      .eq('id', authData.user.id)
      .maybeSingle()

    if (profileError || !profile || profile.is_active === false || profile.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── Handler ─────────────────────────────────────────────────
  const db = await getSafeDb()
  if (!db) {
    // Edge / demo mode — return empty dashboard
    return NextResponse.json({
      contacts: [],
      newsletters: [],
      alerts: [],
      properties: [],
      stats: {
        totalContacts: 0,
        totalNewsletters: 0,
        totalAlerts: 0,
        totalProperties: 0,
        activeProperties: 0,
        soldProperties: 0,
      },
    })
  }

  try {
    const [contacts, newsletters, alerts, properties] = await Promise.all([
      db.contactSubmission.findMany({ orderBy: { createdAt: 'desc' }, take: 50 }),
      db.newsletterSubscription.findMany({ orderBy: { createdAt: 'desc' }, take: 50 }),
      db.priceAlert.findMany({ orderBy: { createdAt: 'desc' }, take: 50 }),
      db.property.findMany({ select: { id: true, title: true, slug: true, price: true, type: true, transaction: true, status: true, zone: true, createdAt: true } }),
    ])

    return NextResponse.json({
      contacts,
      newsletters,
      alerts,
      properties,
      stats: {
        totalContacts: contacts.length,
        totalNewsletters: newsletters.length,
        totalAlerts: alerts.filter((a) => a.active).length,
        totalProperties: properties.length,
        activeProperties: properties.filter((p) => p.status === 'ACTIVE').length,
        soldProperties: properties.filter((p) => p.status === 'SOLD').length,
      },
    })
  } catch (error) {
    console.error('Admin dashboard error:', error)
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 })
  }
}
