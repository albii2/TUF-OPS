import type { FormEventHandler, ReactNode } from 'react'

export function FormShell({
  children,
  onSubmit,
  title,
  description,
}: {
  children: ReactNode
  onSubmit?: FormEventHandler<HTMLFormElement>
  title?: string
  description?: string
}) {
  return (
    <div className="space-y-8">
      {title && <h2 className="text-xl font-semibold">{title}</h2>}
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
      {children}
    </div>
  )
}
