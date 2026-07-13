import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { supabase } from '@/lib/supabase'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // ── Auth check ──────────────────────────────────────────────
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const token = authHeader.slice(7)
    const { error } = await supabase.auth.getUser(token)
    if (error) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── Handler ─────────────────────────────────────────────────
  try {
    const { id } = await params

    const alert = await db.priceAlert.findUnique({ where: { id } })
    if (!alert) {
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