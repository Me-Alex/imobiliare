"use client"

import { useEffect, useState, useCallback } from "react"
import { AppShell } from "@/components/admin/app-shell"
import {
  PageHeader,
  Card,
  DataTable,
  TableRow,
  Badge,
  Button,
  Input,
  Select,
  LoadingState,
} from "@/components/admin/ui"
import { apiJson, statusLabel, date } from "@/components/admin/admin-shared"
import { supabase } from "@/lib/supabase"

type AdminRole = {
  id: string
  email: string
  full_name: string | null
  role: string
  permissions: string[] | null
  status: string | null
  created_at: string
  updated_at: string
}

type Agent = {
  id: string
  name: string
  email: string
  phone?: string
  status?: string
  created_at: string
}

const ALL_PERMISSIONS = [
  "properties",
  "leads",
  "appointments",
  "clients",
  "reports",
  "settings",
  "content",
  "users",
  "analytics",
  "transactions",
]

const emptyForm = {
  email: "",
  password: "",
  full_name: "",
  role: "agent",
  permissions: [] as string[],
}

export default function AdminAgentiPage() {
  const [roles, setRoles] = useState<AdminRole[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [creating, setCreating] = useState(false)
  const [created, setCreated] = useState(false)
  const [error, setError] = useState("")
  const [propertyCounts, setPropertyCounts] = useState<Record<string, number>>({})
  const [leadCounts, setLeadCounts] = useState<Record<string, number>>({})

  const fetchData = useCallback(async () => {
    try {
      const [rolesRes, agentsRes] = await Promise.all([
        supabase.from("admin_roles").select("*").order("updated_at", { ascending: false }),
        supabase.from("agents").select("*").order("created_at", { ascending: false }),
      ])
      setRoles(rolesRes.data || [])
      setAgents(agentsRes.data || [])

      // Fetch property/lead counts per agent
      const [propsRes, leadsRes] = await Promise.all([
        supabase.from("properties").select("agent_id"),
        supabase.from("leads").select("agent_id"),
      ])
      const pc: Record<string, number> = {}
      ;(propsRes.data || []).forEach((p: any) => {
        if (p.agent_id) pc[p.agent_id] = (pc[p.agent_id] || 0) + 1
      })
      const lc: Record<string, number> = {}
      ;(leadsRes.data || []).forEach((l: any) => {
        if (l.agent_id) lc[l.agent_id] = (lc[l.agent_id] || 0) + 1
      })
      setPropertyCounts(pc)
      setLeadCounts(lc)
    } catch {
      setError("Nu s-au putut incarca datele.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  function togglePermission(perm: string) {
    setForm((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(perm)
        ? prev.permissions.filter((p) => p !== perm)
        : [...prev.permissions, perm],
    }))
  }

  async function createUser() {
    if (!form.email || !form.password) {
      setError("Email si parola sunt obligatorii.")
      return
    }
    setCreating(true)
    setError("")
    try {
      await apiJson("/api/admin/users", {
        method: "POST",
        body: JSON.stringify(form),
      })
      setCreated(true)
      setTimeout(() => {
        setCreated(false)
        setShowModal(false)
        setForm(emptyForm)
      }, 1500)
      fetchData()
    } catch (err: any) {
      setError(err.message || "Eroare la crearea utilizatorului.")
    } finally {
      setCreating(false)
    }
  }

  async function toggleStatus(userId: string, currentStatus: string | null) {
    const newStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE"
    try {
      await supabase.from("admin_roles").update({ status: newStatus }).eq("id", userId)
      fetchData()
    } catch {
      // silent fail
    }
  }

  async function deleteUser(userId: string, email: string) {
    if (!window.confirm(`Sigur vrei sa stergi utilizatorul ${email}?`)) return
    try {
      await supabase.from("admin_roles").delete().eq("id", userId)
      fetchData()
    } catch {
      // silent fail
    }
  }

  const roleVariant = (role: string) => {
    switch (role) {
      case "admin":
        return "danger"
      case "manager":
        return "warning"
      default:
        return "default"
    }
  }

  const statusVariant = (status: string | null) => {
    if (status === "ACTIVE") return "success"
    if (status === "INACTIVE") return "danger"
    return "default"
  }

  if (loading) return <AppShell><LoadingState message="Se incarca echipa..." /></AppShell>

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Agenti"
          title="Echipa si roluri"
          subtitle="Administreaza utilizatorii, rolurile si permisiunile platformei."
          actions={<Button onClick={() => setShowModal(true)}>+ Utilizator nou</Button>}
        />

        {error && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-500">
            {error}
          </div>
        )}

        {/* Admin Roles / Users Table */}
        <Card title="Utilizatori admin">
          {roles.length === 0 ? (
            <p className="py-10 text-center text-sm text-text-muted">Nu exista utilizatori admin.</p>
          ) : (
            <DataTable
              columns={[
                { label: "Nume / Email" },
                { label: "Rol" },
                { label: "Permisiuni" },
                { label: "Status" },
                { label: "Creat" },
                { label: "" },
              ]}
              minWidth={800}
            >
              {roles.map((user) => (
                <TableRow key={user.id}>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-semibold">
                        {user.full_name || user.email}
                      </p>
                      {user.full_name && (
                        <p className="text-xs text-text-muted">{user.email}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={roleVariant(user.role)}>{user.role}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(user.permissions || []).map((perm) => (
                        <Badge key={perm} variant="default">{perm}</Badge>
                      ))}
                      {(!user.permissions || user.permissions.length === 0) && (
                        <span className="text-xs text-text-muted">Fara permisiuni</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={statusVariant(user.status)}>
                      {statusLabel(user.status)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-text-muted">
                    {date(user.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button variant="ghost" onClick={() => toggleStatus(user.id, user.status)}>
                        {user.status === "ACTIVE" ? "Dezactiveaza" : "Activeaza"}
                      </Button>
                      <Button variant="ghost" onClick={() => deleteUser(user.id, user.email)}>
                        Sterge
                      </Button>
                    </div>
                  </td>
                </TableRow>
              ))}
            </DataTable>
          )}
        </Card>

        {/* Agents Table */}
        <Card title="Agenti (din tabelul agents)">
          {agents.length === 0 ? (
            <p className="py-10 text-center text-sm text-text-muted">Nu exista agenti inregistrati.</p>
          ) : (
            <DataTable
              columns={[
                { label: "Nume" },
                { label: "Email" },
                { label: "Proprietati" },
                { label: "Lead-uri" },
                { label: "Creat" },
              ]}
              minWidth={600}
            >
              {agents.map((agent) => (
                <TableRow key={agent.id}>
                  <td className="px-4 py-3 font-semibold">{agent.name}</td>
                  <td className="px-4 py-3 text-text-muted">{agent.email}</td>
                  <td className="px-4 py-3">
                    <Badge>{propertyCounts[agent.id] || 0}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge>{leadCounts[agent.id] || 0}</Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-text-muted">{date(agent.created_at)}</td>
                </TableRow>
              ))}
            </DataTable>
          )}
        </Card>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <Card className="w-full max-w-lg">
              <h2 className="mb-4 text-xl font-semibold">Utilizator nou</h2>

              {created ? (
                <div className="py-8 text-center">
                  <p className="text-emerald-500">✓ Utilizator creat cu succes!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-text-muted">
                      Nume complet
                    </label>
                    <Input
                      value={form.full_name}
                      onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))}
                      placeholder="Ion Popescu"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-text-muted">
                      Email
                    </label>
                    <Input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                      placeholder="email@exemplu.ro"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-text-muted">
                      Parola
                    </label>
                    <Input
                      type="password"
                      value={form.password}
                      onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                      placeholder="Parola secura"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-text-muted">
                      Rol
                    </label>
                    <Select
                      value={form.role}
                      onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
                      className="w-full"
                    >
                      <option value="agent">Agent</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                    </Select>
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-text-muted">
                      Permisiuni
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {ALL_PERMISSIONS.map((perm) => (
                        <button
                          key={perm}
                          onClick={() => togglePermission(perm)}
                          className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                            form.permissions.includes(perm)
                              ? "border-accent bg-accent/10 text-accent"
                              : "border-bg-surface text-text-muted hover:bg-bg-primary/50"
                          }`}
                        >
                          {perm}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button onClick={createUser} disabled={creating}>
                      {creating ? "Se creaza..." : "Creeaza utilizator"}
                    </Button>
                    <Button variant="secondary" onClick={() => setShowModal(false)}>
                      Anuleaza
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </AppShell>
  )
}
