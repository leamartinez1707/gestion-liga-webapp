import { Plus, Trash2 } from "lucide-react"

import { getSessionProfile } from "@/lib/auth"
import { getUsers } from "@/lib/db/users"
import { getTeams } from "@/lib/db/teams"
import { deleteUserAction } from "@/lib/actions/users"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog"
import { CreateUserDialog, EditRoleDialog, ResetPasswordDialog, ROLE_LABELS } from "./user-dialogs"

export default async function UsuariosPage() {
  const [me, { data: users, error }, { data: teams }] = await Promise.all([getSessionProfile(), getUsers(), getTeams()])
  const canManageAdmins = me?.role === "superadmin"
  const teamOptions = (teams ?? []).map((t) => ({ id: t.id, name: t.name })).sort((a, b) => a.name.localeCompare(b.name))
  const configured = !!process.env.SUPABASE_SERVICE_ROLE_KEY

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Usuarios</h1>
          <p className="mt-1 text-sm text-muted-foreground">Administradores, delegados de cada equipo y árbitros</p>
        </div>
        <CreateUserDialog teams={teamOptions} canManageAdmins={canManageAdmins}>
          <Button className="gap-1.5" disabled={!configured}><Plus className="h-4 w-4" />Nueva cuenta</Button>
        </CreateUserDialog>
      </div>

      {!configured && (
        <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          Para crear cuentas falta configurar <span className="font-mono">SUPABASE_SERVICE_ROLE_KEY</span> en Vercel (la secret key de Supabase, sin NEXT_PUBLIC).
        </p>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Equipo</TableHead>
              <TableHead className="w-32 text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => {
              const isMe = u.id === me?.id
              const isAdmin = u.role === "superadmin" || u.role === "editor"
              const canEdit = !isMe && (canManageAdmins || !isAdmin)
              return (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">
                    {u.email}
                    {isMe && <span className="ml-2 text-xs text-muted-foreground">(vos)</span>}
                  </TableCell>
                  <TableCell>
                    <Badge variant={isAdmin ? "default" : "outline"} className="text-xs">{ROLE_LABELS[u.role]}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {u.role === "delegate" ? u.teamName ?? <span className="text-amber-700">Sin equipo</span> : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    {canEdit && configured && (
                      <div className="flex items-center justify-end gap-1">
                        <EditRoleDialog user={u} teams={teamOptions} canManageAdmins={canManageAdmins} />
                        <ResetPasswordDialog user={u} />
                        <DeleteConfirmDialog
                          itemName={`la cuenta de ${u.email}`}
                          onConfirm={deleteUserAction.bind(null, u.id)}
                        >
                          <Button variant="ghost" size="icon-sm" className="text-destructive" aria-label="Eliminar cuenta">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </DeleteConfirmDialog>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
