import { BrowserFrame } from './BrowserFrame';

const ROWS = [
  { title: 'SEO uyumlu ürün açıklaması rehberi', date: '12 Mar', status: 'published' as const },
  { title: 'E-ticarette dönüşüm artırma taktikleri', date: '10 Mar', status: 'published' as const },
  { title: 'Kargo entegrasyonu nasıl kurulur', date: '08 Mar', status: 'scheduled' as const },
  { title: 'Marka sesi oluşturma kılavuzu', date: '07 Mar', status: 'draft' as const },
];

const STATUS = {
  published: { label: 'Yayında', className: 'bg-success-muted text-success' },
  scheduled: { label: 'Planlandı', className: 'bg-info-muted text-info' },
  draft: { label: 'Taslak', className: 'bg-secondary text-muted-foreground' },
};

/** The content library: one place for everything produced, whoever produced it. */
export function ContentListMockup({ className }: { className?: string }) {
  return (
    <BrowserFrame
      url="blogproduce.com/dashboard/blogs"
      label="BlogProduce içerik listesi: yayında, planlanmış ve taslak yazıların durum etiketleriyle listesi"
      className={className}
    >
      <div className="p-4">
        <div className="flex items-center justify-between pb-3">
          <span className="text-xs font-semibold text-foreground-strong">Bloglarım</span>
          <span className="rounded-md border border-border bg-card px-2 py-1 text-[10px] text-muted-foreground">
            Tümü
          </span>
        </div>

        <div className="overflow-hidden rounded-lg border border-border bg-card">
          {ROWS.map((row, i) => (
            <div
              key={row.title}
              className={`flex items-center gap-3 px-3 py-2.5 ${
                i > 0 ? 'border-t border-border' : ''
              }`}
            >
              <span className="min-w-0 flex-1 truncate text-[11px] text-foreground">
                {row.title}
              </span>
              <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">
                {row.date}
              </span>
              <span
                className={`shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-medium ${STATUS[row.status].className}`}
              >
                {STATUS[row.status].label}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-3 flex items-center gap-2 rounded-lg border border-border bg-accent px-3 py-2">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent-foreground" />
          <span className="text-[10px] text-accent-foreground">
            Otopilot bu hafta 2 yazı planladı
          </span>
        </div>
      </div>
    </BrowserFrame>
  );
}
