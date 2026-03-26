export function FormShell({ 
  title, 
  description, 
  children, 
}: { 
  title: string; 
  description?: string; 
  children: React.ReactNode; 
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">{title}</h2>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">
            {description}
          </p>
        )}
      </div>

      <div className="space-y-6">{children}</div>
    </div>
  );
}
