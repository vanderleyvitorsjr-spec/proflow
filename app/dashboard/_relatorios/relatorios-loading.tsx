export function RelatoriosLoading() {
  return (
    <div role="status" aria-label="Gerando relatórios" className="space-y-3">
      <div className="h-20 animate-pulse rounded-xl bg-muted" />
      <div className="grid gap-3 md:grid-cols-3">
        <div className="h-64 animate-pulse rounded-xl bg-muted" />
        <div className="h-64 animate-pulse rounded-xl bg-muted" />
        <div className="h-64 animate-pulse rounded-xl bg-muted" />
      </div>
    </div>
  );
}
