export function FormSection({
  title,
  description,
  children,
}: {
  title?: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-4">
      {title && <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>}
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
      <div className="grid gap-4">{children}</div>
    </div>
  )
}
