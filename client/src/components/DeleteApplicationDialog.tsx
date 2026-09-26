import { CircleAlert } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface DeleteApplicationDialogProps {
  isOpen: boolean
  applicantName: string
  isPending: boolean
  errorMessage: string | null
  onConfirm: () => void
  onCancel: () => void
}

export const DeleteApplicationDialog = ({
  isOpen,
  applicantName,
  isPending,
  errorMessage,
  onConfirm,
  onCancel,
}: DeleteApplicationDialogProps) => {
  // Escape and "Отказ" both land here — ignored while the request is in
  // flight so the dialog can't be dismissed mid-delete.
  const handleOpenChange = (isNextOpen: boolean) => {
    if (!isNextOpen && !isPending) {
      onCancel()
    }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-terracotta-50 text-terracotta-600">
            <CircleAlert aria-hidden="true" />
          </AlertDialogMedia>
          <AlertDialogTitle>Изтриване на кандидатура</AlertDialogTitle>
          <AlertDialogDescription>
            Сигурни ли сте, че искате да изтриете кандидатурата на{' '}
            <span className="font-medium text-foreground">{applicantName}</span>? Това действие е
            необратимо.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {errorMessage && (
          <p role="alert" className="text-sm font-medium text-destructive">
            {errorMessage}
          </p>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending} className="h-11 sm:h-9">
            Отказ
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isPending}
            onClick={onConfirm}
            className="h-11 sm:h-9"
          >
            {isPending ? 'Изтриване...' : 'Да, изтрий'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
