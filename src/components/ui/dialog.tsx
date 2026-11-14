import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'

export function Modal({ open, onOpenChange, title, description, children, className = '', closeIcon, headingContent }: { open: boolean; onOpenChange: (open: boolean) => void; title: string; description?: string; children: ReactNode; className?: string; closeIcon?: ReactNode; headingContent?: ReactNode }) {
  return <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}><DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="modal-overlay" />
    <DialogPrimitive.Content className={`modal ${className}`}>
      <div className="modal-heading"><div><DialogPrimitive.Title>{title}</DialogPrimitive.Title>{description && <DialogPrimitive.Description>{description}</DialogPrimitive.Description>}{headingContent}</div><DialogPrimitive.Close className="close-button" aria-label="Close">{closeIcon ?? <X size={21} />}</DialogPrimitive.Close></div>
      {!description && <DialogPrimitive.Description className="sr-only">{title}</DialogPrimitive.Description>}
      {children}
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal></DialogPrimitive.Root>
}
