export const dynamic = "force-static";
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
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