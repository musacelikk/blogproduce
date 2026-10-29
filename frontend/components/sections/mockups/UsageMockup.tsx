import { BrowserFrame } from './BrowserFrame';

/** Relative bar heights, in percent. Shaped like a real month, not a smooth ramp. */
const BARS = [42, 58, 35, 71, 64, 88, 52, 76];

const TILES = [
  { label: 'Bu ay üretilen', value: '18' },
  { label: 'Harcanan token', value: '164K' },
  { label: 'Maliyet', value: '$1.24' },
];

/** Usage and cost: the screen that answers "what is this costing me". */
export function UsageMockup({ className }: { className?: string }) {
  return (
    <BrowserFrame
      url="blogproduce.com/dashboard/usage"
      label="BlogProduce kullanım ekranı: aylık üretim grafiği ile token ve maliyet özetleri"
      className={className}
    >
      <div className="p-4">
        <div className="grid grid-cols-3 gap-2">
          {TILES.map((tile) => (
            <div key={tile.label} className="rounded-lg border border-border bg-card p-2.5">
              <p className="text-[9px] leading-tight text-muted-foreground">{tile.label}</p>
              <p className="mt-1 text-sm font-semibold tabular-nums text-foreground-strong">
                {tile.value}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-3 rounded-lg border border-border bg-card p-3">
          <div className="flex items-baseline justify-between">
            <span className="text-[10px] font-medium text-foreground">Günlük üretim</span>
            <span className="text-[9px] text-muted-foreground">Son 8 gün</span>
          </div>
          <div className="mt-3 flex h-20 items-end gap-1.5">
            {BARS.map((height, i) => (
              <div
                key={i}
                style={{ height: `${height}%` }}
                className={`flex-1 rounded-sm ${
                  i === BARS.length - 1 ? 'bg-primary' : 'bg-primary/35'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="mt-2.5 flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2">
          <span className="text-[10px] text-muted-foreground">Aylık kota</span>
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-20 overflow-hidden rounded-full bg-secondary">
              <div className="h-full w-[62%] rounded-full bg-success" />
            </div>
            <span className="text-[9px] tabular-nums text-muted-foreground">62%</span>
          </div>
        </div>
      </div>
    </BrowserFrame>
  );
}
