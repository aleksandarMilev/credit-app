import { CircleCheck, CircleX } from 'lucide-react'
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
import { formatCurrency } from '@/lib/formatCurrency'
import { APPLICATION_DECISION, type ApplicationDecisionValue } from '@/types/application'

interface DecisionConfirmDialogProps {
  isOpen: boolean
  // Kept set while closing, so the text doesn't flip mid fade-out.
  decision: ApplicationDecisionValue
  applicantName: string
  requestedAmount: number
  requestedTermMonths: number
  isPending: boolean
  onConfirm: (decision: ApplicationDecisionValue) => void
  onCancel: () => void
}

// Both decisions are final, and ApplicationsService.UpdateStatus emails the
// applicant on every status change — the dialog text states both.
export const DecisionConfirmDialog = ({
  isOpen,
  decision,
  applicantName,
  requestedAmount,
  requestedTermMonths,
  isPending,
  onConfirm,
  onCancel,
}: DecisionConfirmDialogProps) => {
  const isRejection = decision === APPLICATION_DECISION.Rejected

  // Escape and "Отказ" both land here — ignored while the request is in
  // flight so the decision can't be dismissed half-way.
  const handleOpenChange = (isNextOpen: boolean) => {
    if (!isNextOpen && !isPending) {
      onCancel()
    }
  }

  const handleConfirm = () => {
    if (isPending) return
    onConfirm(decision)
  }

  const confirmLabel = isRejection ? 'Да, отхвърли' : 'Да, одобри'
  const pendingLabel = isRejection ? 'Отхвърляне...' : 'Одобряване...'

  return (
    <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia
            className={
              isRejection ? 'bg-terracotta-50 text-terracotta-600' : 'bg-pine-50 text-pine-700'
            }
          >
            {isRejection ? <CircleX aria-hidden="true" /> : <CircleCheck aria-hidden="true" />}
          </AlertDialogMedia>
          <AlertDialogTitle>
            {isRejection ? 'Отхвърляне на кандидатура' : 'Одобряване на кандидатура'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            Сигурни ли сте, че искате да {isRejection ? 'отхвърлите' : 'одобрите'} кандидатурата на{' '}
            <span className="font-medium text-foreground">{applicantName}</span> за{' '}
            {formatCurrency(requestedAmount)} за срок от {requestedTermMonths} месеца? Решението е
            окончателно и не може да бъде променено. Кандидатът ще бъде уведомен по имейл.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending} className="h-11 sm:h-9">
            Отказ
          </AlertDialogCancel>
          <AlertDialogAction
            variant={isRejection ? 'destructive' : 'default'}
            disabled={isPending}
            onClick={handleConfirm}
            className="h-11 sm:h-9"
          >
            {isPending ? pendingLabel : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
