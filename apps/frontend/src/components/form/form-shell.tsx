export function FormShell({ 
  children,
}: { 
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-8">
      {children}
    </div>
  );
}
