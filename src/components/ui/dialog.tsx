import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import type { ReactNode, RefObject } from 'react'

interface ModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: ReactNode
  className?: string
  overlayClassName?: string
  closeIcon?: ReactNode
  headingContent?: ReactNode
  role?: 'dialog' | 'alertdialog'
  initialFocusRef?: RefObject<HTMLElement | null>
  onCloseAutoFocus?: (event: Event) => void
  onEscapeKeyDown?: (event: KeyboardEvent) => void
  closeDisabled?: boolean
}

export function Modal({ open, onOpenChange, title, description, children, className = '', overlayClassName = '', closeIcon, headingContent, role = 'dialog', initialFocusRef, onCloseAutoFocus, onEscapeKeyDown, closeDisabled = false }: ModalProps) {
  return <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}><DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className={`modal-overlay ${overlayClassName}`} />
    <DialogPrimitive.Content className={`modal ${className}`} role={role} onCloseAutoFocus={onCloseAutoFocus} onEscapeKeyDown={onEscapeKeyDown} onOpenAutoFocus={event => { if (initialFocusRef?.current) { event.preventDefault(); initialFocusRef.current.focus() } }}>
      <div className="modal-heading"><div><DialogPrimitive.Title>{title}</DialogPrimitive.Title>{description && <DialogPrimitive.Description>{description}</DialogPrimitive.Description>}{headingContent}</div><DialogPrimitive.Close className="close-button" aria-label="Close" disabled={closeDisabled}>{closeIcon ?? <X size={21} />}</DialogPrimitive.Close></div>
      {!description && <DialogPrimitive.Description className="sr-only">{title}</DialogPrimitive.Description>}
      {children}
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal></DialogPrimitive.Root>
}
