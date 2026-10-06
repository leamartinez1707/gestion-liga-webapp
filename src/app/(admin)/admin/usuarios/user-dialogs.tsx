"use client"

import { useActionState, useState } from "react"
import { useFormStatus } from "react-dom"
import { Copy, KeyRound, MessageCircle, Pencil } from "lucide-react"

import type { Role } from "@/lib/auth"
import type { LeagueUser } from "@/lib/db/users"
import { createUserAction, resetPasswordAction, updateUserRoleAction } from "@/lib/actions/users"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export const ROLE_LABELS: Record<Role, string> = {
  superadmin: "Superadmin",
  editor: "Administrador",
  delegate: "Delegado",
  referee: "Árbitro",
}

/** Easy to dictate or type on a phone: no 0/O or 1/l */
function generatePassword(): string {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789"
  const values = crypto.getRandomValues(new Uint32Array(10))
  return Array.from(values, (v) => chars[v % chars.length]).join("")
}

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus()
  return <Button type="submit" disabled={pending}>{pending ? pendingLabel : label}</Button>
}

interface TeamOption { id: string; name: string }

function RoleFields({
  role,
  setRole,
  teamId,
  setTeamId,
  teams,
  canManageAdmins,
}: {
  role: Role
  setRole: (r: Role) => void
  teamId: string
  setTeamId: (t: string) => void
  teams: TeamOption[]
  canManageAdmins: boolean
}) {
  const roleItems = (Object.keys(ROLE_LABELS) as Role[])
    .filter((r) => canManageAdmins || (r !== "superadmin" && r !== "editor"))
    .map((r) => ({ value: r, label: ROLE_LABELS[r] }))
  const teamItems = teams.map((t) => ({ value: t.id, label: t.name }))

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <Label>Rol</Label>
        <Select items={roleItems} value={role} onValueChange={(v) => v && setRole(v as Role)} name="role">
          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            {roleItems.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {role === "delegate" && "Gestiona el plantel y la lista de buena fe de su equipo (hasta 2 por equipo)."}
          {role === "referee" && "Carga goles y tarjetas de los partidos que le asignes."}
          {(role === "editor" || role === "superadmin") && "Gestiona toda la liga desde el panel."}
        </p>
      </div>
      {role === "delegate" && (
        <div className="flex flex-col gap-1.5">
          <Label>Equipo</Label>
          <Select items={teamItems} value={teamId} onValueChange={(v) => v && setTeamId(v)} name="teamId">
            <SelectTrigger className="w-full"><SelectValue placeholder="Elegí el equipo" /></SelectTrigger>
            <SelectContent>
              {teamItems.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}
    </>
  )
}

/** Shows the credentials once, ready to copy or send by WhatsApp. */
function Credentials({ email, password, onDone }: { email: string; password: string; onDone: () => void }) {
  const [copied, setCopied] = useState(false)
  const loginUrl = typeof window !== "undefined" ? `${window.location.origin}/login` : "/login"
  const text = `Tu acceso a la liga:\n${loginUrl}\nEmail: ${email}\nContraseña: ${password}`

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm">Cuenta lista. Pasale estos datos a la persona:</p>
      <pre className="whitespace-pre-wrap rounded-lg bg-muted-bg p-3 text-sm">{text}</pre>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          className="gap-1.5"
          onClick={async () => {
            await navigator.clipboard.writeText(text)
            setCopied(true)
          }}
        >
          <Copy className="h-4 w-4" />
          {copied ? "Copiado" : "Copiar"}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="gap-1.5"
          render={<a href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener" />}
        >
          <MessageCircle className="h-4 w-4" />
          Enviar por WhatsApp
        </Button>
        <Button type="button" onClick={onDone} className="ml-auto">Listo</Button>
      </div>
    </div>
  )
}

export function CreateUserDialog({
  children,
  teams,
  canManageAdmins,
  defaultRole = "delegate",
  defaultTeamId = "",
}: {
  children: React.ReactElement
  teams: TeamOption[]
  canManageAdmins: boolean
  defaultRole?: Role
  defaultTeamId?: string
}) {
  const [open, setOpen] = useState(false)
  const [role, setRole] = useState<Role>(defaultRole)
  const [teamId, setTeamId] = useState(defaultTeamId)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState(generatePassword)
  const [state, formAction] = useActionState(createUserAction, undefined)
  const [shown, setShown] = useState<object | undefined>(undefined)

  const created = state?.success && shown !== state

  const reset = () => {
    setShown(state)
    setEmail("")
    setPassword(generatePassword())
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : reset())}>
      <DialogTrigger render={children} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva cuenta</DialogTitle>
          <DialogDescription>La persona entra con este email y contraseña; después la puede cambiar.</DialogDescription>
        </DialogHeader>
        {created ? (
          <Credentials email={email} password={password} onDone={reset} />
        ) : (
          <form action={formAction} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Contraseña inicial</Label>
              <div className="flex gap-2">
                <Input id="password" name="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="font-mono" />
                <Button type="button" variant="outline" onClick={() => setPassword(generatePassword())}>Otra</Button>
              </div>
            </div>
            <RoleFields role={role} setRole={setRole} teamId={teamId} setTeamId={setTeamId} teams={teams} canManageAdmins={canManageAdmins} />
            {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
            <div className="flex justify-end pt-2">
              <SubmitButton label="Crear cuenta" pendingLabel="Creando…" />
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

export function EditRoleDialog({ user, teams, canManageAdmins }: { user: LeagueUser; teams: TeamOption[]; canManageAdmins: boolean }) {
  const [open, setOpen] = useState(false)
  const [role, setRole] = useState<Role>(user.role)
  const [teamId, setTeamId] = useState(user.teamId ?? "")
  const [state, formAction] = useActionState(updateUserRoleAction.bind(null, user.id), undefined)
  if (state?.success && open) setOpen(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="ghost" size="icon-sm" aria-label="Cambiar rol"><Pencil className="h-4 w-4" /></Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cambiar rol</DialogTitle>
          <DialogDescription>{user.email}</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <RoleFields role={role} setRole={setRole} teamId={teamId} setTeamId={setTeamId} teams={teams} canManageAdmins={canManageAdmins} />
          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
          <div className="flex justify-end pt-2"><SubmitButton label="Guardar" pendingLabel="Guardando…" /></div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function ResetPasswordDialog({ user }: { user: LeagueUser }) {
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState(generatePassword)
  const [state, formAction] = useActionState(resetPasswordAction.bind(null, user.id), undefined)

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (o) setPassword(generatePassword()) }}>
      <DialogTrigger render={<Button variant="ghost" size="icon-sm" aria-label="Nueva contraseña"><KeyRound className="h-4 w-4" /></Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva contraseña</DialogTitle>
          <DialogDescription>{user.email}</DialogDescription>
        </DialogHeader>
        {state?.success ? (
          <Credentials email={user.email} password={password} onDone={() => setOpen(false)} />
        ) : (
          <form action={formAction} className="flex flex-col gap-4">
            <div className="flex gap-2">
              <Input name="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="font-mono" />
              <Button type="button" variant="outline" onClick={() => setPassword(generatePassword())}>Otra</Button>
            </div>
            {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
            <div className="flex justify-end"><SubmitButton label="Cambiar contraseña" pendingLabel="Cambiando…" /></div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
