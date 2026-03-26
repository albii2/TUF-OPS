export function FormField({ 
  label, 
  error, 
  children, 
}: { 
  label: string; 
  error?: string; 
  children: React.ReactNode; 
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      {children}
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}
