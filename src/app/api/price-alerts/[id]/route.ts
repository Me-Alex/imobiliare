import { NextRequest, NextResponse } from 'next/server'
import { getSafeDb } from '@/lib/edge-db'
import { requireAuthenticatedAccount } from '@/lib/server-admin-auth'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const account = await requireAuthenticatedAccount(request)
  if ('response' in account) return account.response
  if (!account.email) {
    return NextResponse.json({ error: 'Contul nu are o adresa de email valida.' }, { status: 422 })
  }

  const db = await getSafeDb()
  if (!db) {
    return NextResponse.json({ error: 'Serviciul de alerte nu este disponibil.' }, { status: 503 })
  }

  try {
    const { id } = await params
    const alert = await db.priceAlert.findUnique({ where: { id } })

    // Return a uniform result for missing and foreign records to avoid exposing
    // which alert IDs belong to other accounts.
    if (!alert || alert.email.trim().toLowerCase() !== account.email) {
      return NextResponse.json({ error: 'Alerta nu a fost gasita.' }, { status: 404 })
    }

    await db.priceAlert.update({
      where: { id },
      data: { active: false },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Price alert delete error:', error)
    return NextResponse.json({ error: 'Eroare la dezactivarea alertei.' }, { status: 500 })
  }
}
