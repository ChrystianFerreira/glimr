import { type KeyboardEvent, type ReactNode, useEffect, useEffectEvent, useId, useRef } from 'react'
import { pushOverlay } from '../utils/overlayStack'

type ConfirmDialogProps = {
  title: string
  children: ReactNode
  confirmLabel: string
  cancelLabel: string
  onConfirm: () => void
  onCancel: () => void
}

function trapTab(event: KeyboardEvent<HTMLDivElement>) {
  if (event.key !== 'Tab') return
  const buttons = [...event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled)')]
  const first = buttons[0]
  const last = buttons.at(-1)
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last?.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first?.focus()
  }
}

/**
 * @example
 * <ConfirmDialog title="Remove from shelf" confirmLabel="Remove" cancelLabel="Cancel" onConfirm={remove} onCancel={cancel}>
 *   <p>Remove this CD?</p>
 * </ConfirmDialog>
 */
export function ConfirmDialog({ title, children, confirmLabel, cancelLabel, onConfirm, onCancel }: ConfirmDialogProps) {
  const backdropRef = useRef<HTMLDivElement>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)
  const titleId = useId()
  const bodyId = useId()
  const cancel = useEffectEvent(() => onCancel())

  useEffect(() => {
    const backdrop = backdropRef.current
    if (!backdrop) return
    const pop = pushOverlay(backdrop, cancel)
    cancelRef.current?.focus()
    return pop
  }, [])

  return (
    <div
      ref={backdropRef}
      className="win-dialog-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) event.preventDefault()
      }}
    >
      <div
        className="win-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={bodyId}
        onKeyDown={trapTab}
      >
        <h2 id={titleId} className="win-dialog-title">
          {title}
        </h2>
        <div id={bodyId} className="win-dialog-body">
          {children}
        </div>
        <div className="win-dialog-actions">
          <button type="button" className="win-button" onClick={onConfirm}>
            {confirmLabel}
          </button>
          <button ref={cancelRef} type="button" className="win-button" onClick={onCancel}>
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
