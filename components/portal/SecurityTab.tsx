"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { Card, Button, Input } from "@/components/admin/ui"
import { usePortal } from "./PortalContext"

/* ─────────────────── component ─────────────────── */

export default function SecurityTab() {
  const { user, setMessage } = usePortal()

  const [newPassword, setNewPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [changing, setChanging] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      setMessage("Parola trebuie să aibă minim 6 caractere.")
      return
    }
    if (newPassword !== confirm) {
      setMessage("Parolele nu coincid.")
      return
    }

    setChanging(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      setNewPassword("")
      setConfirm("")
      setMessage("Parola a fost schimbată cu succes.")
    } catch {
      setMessage("Nu s-a putut schimba parola.")
    } finally {
      setChanging(false)
    }
  }

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await supabase.auth.signOut()
      window.location.href = "/"
    } catch {
      setMessage("Nu s-a putut efectua deconectarea.")
      setLoggingOut(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* ── Password Change ── */}
      <Card title="Schimbă parola">
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-muted">
              Parolă nouă
            </label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minim 6 caractere"
              autoComplete="new-password"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-muted">
              Confirmă parola
            </label>
            <Input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Rescrie parola"
              autoComplete="new-password"
            />
          </div>

          <div className="flex justify-end">
            <Button variant="primary" onClick={handleChangePassword} disabled={changing}>
              {changing ? "Se schimbă..." : "Schimbă parola"}
            </Button>
          </div>
        </div>
      </Card>

      {/* ── Recovery Info ── */}
      <Card title="Recuperare parolă">
        <p className="text-sm text-text-muted">
          Dacă uiți parola, poți folosi linkul de recuperare trimis pe email-ul tău.
          Asigură-te că adresa de email asociată contului este validă.
        </p>
      </Card>

      {/* ── Danger Zone ── */}
      <Card title="Cont" className="border-rose-500/20">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-text-muted">
              {user?.email ?? "Email necunoscut"}
            </p>
          </div>
          <Button variant="secondary" onClick={handleLogout} disabled={loggingOut}>
            {loggingOut ? "..." : "Deconectare"}
          </Button>
        </div>
      </Card>
    </div>
  )
}
