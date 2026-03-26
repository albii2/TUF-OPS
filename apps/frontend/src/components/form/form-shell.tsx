export function FormShell({ 
  children,
  onSubmit,
}: { 
  children: React.ReactNode;
  onSubmit: () => void;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-8">
      {children}
    </form>
  );
}
