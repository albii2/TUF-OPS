export function NoResultsState({ 
  title = "No results found", 
  description = "Try adjusting your filters or search terms.", 
}: { 
  title?: string; 
  description?: string; 
}) {
  return (
    <div className="rounded-2xl border border-dashed bg-card/50 p-6 text-center">
      <div className="space-y-1">
        <h3 className="text-base font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
