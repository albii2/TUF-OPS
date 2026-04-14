export function FormSection({ 
  title, 
  children, 
}: { 
  title?: string; 
  children: React.ReactNode; 
}) {
  return (
    <div className="space-y-4">
      {title && (
        <h3 className="text-sm font-medium text-muted-foreground">
          {title}
        </h3>
      )}
      <div className="grid gap-4">{children}</div>
    </div>
  );
}
