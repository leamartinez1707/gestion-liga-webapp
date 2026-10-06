"use client"

import { useState } from "react"
import { Trash2 } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface DeleteConfirmDialogProps {
  children: React.ReactElement
  itemName: string
  onConfirm: () => Promise<{ error?: string }>
  /** Override the texts for confirmations that aren't a delete (e.g. a team withdrawal) */
  title?: string
  description?: React.ReactNode
  confirmLabel?: string
  pendingLabel?: string
}

export function DeleteConfirmDialog({
  children,
  itemName,
  onConfirm,
  title = "Confirmar eliminación",
  description,
  confirmLabel = "Eliminar",
  pendingLabel = "Eliminando…",
}: DeleteConfirmDialogProps) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const handleConfirm = async () => {
    setPending(true)
    setError(null)
    const result = await onConfirm()
    setPending(false)
    if (result.error) {
      setError(result.error)
    } else {
      setOpen(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={children} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {description ?? (
              <>
                ¿Estás seguro de que querés eliminar <strong>{itemName}</strong>?
                Esta acción no se puede deshacer.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        <div className="flex justify-end gap-2">
          <DialogClose render={<Button variant="outline">Cancelar</Button>} />
          <Button
            variant="destructive"
            disabled={pending}
            onClick={handleConfirm}
            className="gap-1.5"
          >
            <Trash2 className="h-4 w-4" />
            {pending ? pendingLabel : confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
