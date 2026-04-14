export function InlineErrorState({ 
  message = "Something went wrong. Please try again.", 
}: { 
  message?: string; 
}) {
  return (
    <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
      {message}
    </div>
  );
}
