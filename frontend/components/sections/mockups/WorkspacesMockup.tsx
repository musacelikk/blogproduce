import { BrowserFrame } from './BrowserFrame';

const WORKSPACES = [
  { name: 'Acme Mağaza', domain: 'acme.com', posts: 42, chart: 'chart-1', autopilot: true },
  { name: 'Nova Finans', domain: 'novafin.com.tr', posts: 28, chart: 'chart-2', autopilot: true },
  { name: 'Loop Ajans', domain: 'loop.agency', posts: 17, chart: 'chart-4', autopilot: false },
];

/**
 * Workspaces: one tenant per client, each with its own API key and content.
 *
 * The accent colours come from the chart token scale rather than ad-hoc values,
 * so they stay distinguishable in both themes.
 */
export function WorkspacesMockup({ className }: { className?: string }) {
  return (
    <BrowserFrame
      url="blogproduce.com/dashboard/workspaces"
      label="BlogProduce workspace listesi: her müşteri için ayrı alan, yazı sayısı ve otopilot durumu"
      className={className}
    >
      <div className="space-y-2 p-4">
        {WORKSPACES.map((ws) => (
          <div
            key={ws.name}
            className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
          >
            <span
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[11px] font-semibold text-background"
              style={{ backgroundColor: `var(--${ws.chart})` }}
            >
              {ws.name.charAt(0)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] font-medium text-foreground">{ws.name}</p>
              <p className="truncate text-[9px] text-muted-foreground">{ws.domain}</p>
            </div>
            <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">
              {ws.posts} yazı
            </span>
            <span
              className={`shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-medium ${
                ws.autopilot
                  ? 'bg-success-muted text-success'
                  : 'bg-secondary text-muted-foreground'
              }`}
            >
              {ws.autopilot ? 'Otopilot' : 'Manuel'}
            </span>
          </div>
        ))}

        <div className="flex items-center justify-center rounded-lg border border-dashed border-border py-2.5">
          <span className="text-[10px] text-muted-foreground">+ Yeni workspace</span>
        </div>
      </div>
    </BrowserFrame>
  );
}
