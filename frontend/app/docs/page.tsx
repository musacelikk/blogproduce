'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  BookOpen, Zap, Key, Code2, AlertCircle, BarChart2,
  Terminal, MessageCircle, ArrowRight, Copy, Check, ExternalLink,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.blogproduce.com';

const navItems = [
  { id: 'genel-bakis',      label: 'Genel Bakış',       icon: BookOpen },
  { id: 'hizli-baslangic',  label: 'Hızlı Başlangıç',   icon: Zap },
  { id: 'kimlik-dogrulama', label: 'Kimlik Doğrulama',  icon: Key },
  { id: 'api-referansi',    label: 'API Referansı',      icon: Code2 },
  { id: 'hata-yonetimi',    label: 'Hata Yönetimi',     icon: AlertCircle },
  { id: 'limitler',         label: 'Limitler ve Kota',   icon: BarChart2 },
  { id: 'kod-ornekleri',    label: 'Kod Örnekleri',      icon: Terminal },
  { id: 'destek',           label: 'Destek',             icon: MessageCircle },
];

/* ── Inline components ── */

function CodeBlock({ children, lang = 'text' }: { children: string; lang?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="my-4 overflow-hidden rounded-xl border border-border bg-secondary">
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <span className="font-mono text-xs text-muted-foreground">{lang}</span>
        <button
          type="button"
          onClick={copy}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-card hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Kopyala"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? 'Kopyalandı' : 'Kopyala'}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-[13px] leading-relaxed text-foreground">
        <code>{children}</code>
      </pre>
    </div>
  );
}

function DocTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="my-4">
      <Table>
        <TableHeader>
          <TableRow>
            {headers.map((h) => (
              <TableHead key={h}>{h}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row[0]}>
              {row.map((cell, ci) => (
                <TableCell key={ci} className={ci === 0 ? 'font-medium' : 'text-muted-foreground'}>
                  {cell}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function SectionHeading({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) {
  return (
    <h2 className="mb-4 flex items-center gap-2.5 text-xl font-semibold tracking-tight text-foreground">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent">
        <Icon className="h-4 w-4 text-accent-foreground" />
      </span>
      {children}
    </h2>
  );
}

function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded-md bg-secondary px-1.5 py-0.5 font-mono text-[13px] text-foreground">
      {children}
    </code>
  );
}

/* ── Main ── */

export default function DocsPage() {
  const [activeId, setActiveId] = useState<string>(navItems[0].id);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) { setActiveId(entry.target.id); break; }
        }
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0 }
    );
    navItems.forEach(({ id }) => { const el = document.getElementById(id); if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="border-b border-border bg-card">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="mx-auto max-w-7xl px-4 pb-12 pt-28 sm:px-6 sm:pb-16 sm:pt-36 lg:px-8"
        >
          <Badge className="mb-5 uppercase tracking-wide">
            <Code2 className="h-3.5 w-3.5" />
            API Dokümantasyonu
          </Badge>
          <h1 className="mb-4 text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            BlogProduce API
          </h1>
          <p className="mb-6 max-w-2xl text-base text-muted-foreground sm:text-lg">
            Yayınlanmış blog yazılarınızı listeleyin, tekil içerik çekin ve uygulamanıza entegre edin.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium text-foreground">
              Base URL: <InlineCode>{API_BASE}</InlineCode>
            </span>
            <Badge variant="outline">v1</Badge>
            <Badge variant="outline">Bearer Token</Badge>
          </div>
        </motion.div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="flex flex-col gap-10 lg:flex-row lg:gap-14">

          {/* Sidebar */}
          <aside className="shrink-0 self-start lg:sticky lg:top-24 lg:w-56 xl:w-60">
            <nav className="space-y-0.5">
              {navItems.map(({ id, label, icon: Icon }) => (
                <a
                  key={id}
                  href={`#${id}`}
                  className={
                    activeId === id
                      ? 'flex items-center gap-2.5 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-foreground'
                      : 'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground'
                  }
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </a>
              ))}
            </nav>

            {/* API Key CTA */}
            <div className="mt-8 rounded-xl border border-border bg-card p-5 shadow-card">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-accent">
                <Key className="h-4 w-4 text-accent-foreground" />
              </div>
              <p className="mb-1 text-sm font-semibold text-foreground">API anahtarı gerekli</p>
              <p className="mb-4 text-xs leading-relaxed text-muted-foreground">
                Giriş yapıp dashboard üzerinden API anahtarı oluşturun.
              </p>
              <Button asChild size="sm" className="w-full">
                <Link href="/login">
                  Giriş Yap
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </aside>

          {/* Content */}
          <article className="min-w-0 max-w-3xl flex-1">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >

              {/* Genel Bakış */}
              <section id="genel-bakis" className="mb-14 scroll-mt-28 border-b border-border pb-14">
                <SectionHeading icon={BookOpen}>Genel Bakış</SectionHeading>
                <p className="mb-4 leading-relaxed text-muted-foreground">
                  BlogProduce API, yayınladığınız blog yazılarını programatik olarak almanızı sağlar.
                  REST API ile içerikleri uygulamanıza, sitenize veya otomasyon sistemlerinize entegre edebilirsiniz.
                </p>
                <ul className="mb-4 space-y-2">
                  {[
                    'İçerik teslimi: Yayınlanmış blog yazılarını REST API ile çekin',
                    'Esnek sorgulama: Durum, dil veya slug ile filtreleme',
                    'Zengin metadata: SEO verisi, etiketler, yazar bilgisi',
                    'Güvenli erişim: API anahtarı ile kimlik doğrulama',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary">
                        <Check className="h-3 w-3 text-primary-foreground" strokeWidth={3} />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                  <span><strong className="text-foreground">Base URL:</strong> <InlineCode>{API_BASE}</InlineCode></span>
                  <span><strong className="text-foreground">Önerilen:</strong> <InlineCode>/v1/api/blog</InlineCode></span>
                </div>
              </section>

              {/* Hızlı Başlangıç */}
              <section id="hizli-baslangic" className="mb-14 scroll-mt-28 border-b border-border pb-14">
                <SectionHeading icon={Zap}>Hızlı Başlangıç</SectionHeading>
                <ol className="mb-4 space-y-3">
                  {[
                    <>Dashboard&apos;a giriş yapın ve <strong className="font-semibold text-foreground">API Docs</strong> bölümünden çalışma alanınız için API anahtarı oluşturun.</>,
                    <>İsteklerde <InlineCode>Authorization: Bearer YOUR_API_KEY</InlineCode> header&apos;ını kullanın.</>,
                    <>Yayınlanmış yazıları listelemek için <InlineCode>GET /v1/api/blog?status=published</InlineCode> endpoint&apos;ini çağırın.</>,
                  ].map((step, i) => (
                    <li key={i} className="flex gap-3 text-sm text-muted-foreground">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                        {i + 1}
                      </span>
                      <span className="pt-0.5">{step}</span>
                    </li>
                  ))}
                </ol>
                <CodeBlock lang="bash">{`curl -X GET "${API_BASE}/v1/api/blog?status=published&limit=10" \\
  -H "Authorization: Bearer YOUR_API_KEY"`}</CodeBlock>
                <p className="mt-2 text-sm text-muted-foreground">
                  Başarılı yanıt: <InlineCode>{'{ "success": true, "data": [...], "meta": { "next_cursor": "...", "has_more": true } }'}</InlineCode>
                </p>
              </section>

              {/* Kimlik Doğrulama */}
              <section id="kimlik-dogrulama" className="mb-14 scroll-mt-28 border-b border-border pb-14">
                <SectionHeading icon={Key}>Kimlik Doğrulama</SectionHeading>
                <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
                  API anahtarı çalışma alanına özeldir; ilgili çalışma alanındaki içeriklere erişim sağlar.
                  Anahtar formatı: <InlineCode>bg_&lt;64-karakter-hex&gt;</InlineCode>
                </p>
                <p className="mb-2 text-sm font-semibold text-foreground">Önerilen: Bearer token</p>
                <CodeBlock lang="http">Authorization: Bearer bg_your_api_key_here</CodeBlock>
                <p className="mt-2 text-sm text-muted-foreground">
                  Alternatif: <InlineCode>X-API-Key: bg_your_api_key_here</InlineCode> header&apos;ı da kullanılabilir.
                  Anahtarı asla URL query parametresi olarak göndermeyin.
                </p>
              </section>

              {/* API Referansı */}
              <section id="api-referansi" className="mb-14 scroll-mt-28 border-b border-border pb-14">
                <SectionHeading icon={Code2}>API Referansı</SectionHeading>
                <div className="space-y-8">
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <Badge variant="success" className="font-bold tracking-wide">GET</Badge>
                      <h3 className="text-base font-semibold text-foreground">Blog listeleme</h3>
                    </div>
                    <p className="mb-3 text-sm text-muted-foreground">
                      <InlineCode>GET /v1/api/blog</InlineCode> — Cursor tabanlı sayfalama (önerilen).
                    </p>
                    <DocTable
                      headers={['Parametre', 'Tip', 'Açıklama']}
                      rows={[
                        ['status', 'string', 'draft, generated, review, published'],
                        ['limit', 'number', 'Varsayılan 50, max 100'],
                        ['cursor', 'string', 'Önceki yanıttan meta.next_cursor'],
                      ]}
                    />
                  </div>
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <Badge variant="success" className="font-bold tracking-wide">GET</Badge>
                      <h3 className="text-base font-semibold text-foreground">Tekil yazı (ID)</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      <InlineCode>GET /v1/api/blog/:id</InlineCode> — Tam içerik (HTML, markdown, SEO, TOC, FAQ).
                    </p>
                  </div>
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <Badge variant="success" className="font-bold tracking-wide">GET</Badge>
                      <h3 className="text-base font-semibold text-foreground">Tekil yazı (slug)</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      <InlineCode>GET /v1/api/blog/slug/:slug</InlineCode> — Slug ile tam içerik.
                    </p>
                  </div>
                </div>
                <p className="mt-6 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <ExternalLink className="h-4 w-4 shrink-0 text-accent-foreground" />
                  Dashboard&apos;taki{' '}
                  <Link href="/dashboard/api-docs" className="font-medium text-accent-foreground hover:underline">
                    API Docs
                  </Link>{' '}
                  sayfasında tüm endpoint detayları ve anahtar yönetimi bulunur.
                </p>
              </section>

              {/* Hata Yönetimi */}
              <section id="hata-yonetimi" className="mb-14 scroll-mt-28 border-b border-border pb-14">
                <SectionHeading icon={AlertCircle}>Hata Yönetimi</SectionHeading>
                <p className="mb-4 text-sm leading-relaxed text-muted-foreground">Tüm hata yanıtları aynı yapıdadır:</p>
                <CodeBlock lang="json">{`{
  "success": false,
  "message": "Hata mesajı",
  "error": "Detaylı açıklama"
}`}</CodeBlock>
                <DocTable
                  headers={['Kod', 'Anlam', 'Açıklama']}
                  rows={[
                    ['200', 'OK', 'Başarılı'],
                    ['400', 'Bad Request', 'Geçersiz parametre'],
                    ['401', 'Unauthorized', 'Eksik veya geçersiz API anahtarı'],
                    ['404', 'Not Found', 'Kaynak bulunamadı'],
                    ['429', 'Too Many Requests', 'Rate limit aşıldı'],
                    ['500', 'Internal Server Error', 'Sunucu hatası'],
                  ]}
                />
              </section>

              {/* Limitler */}
              <section id="limitler" className="mb-14 scroll-mt-28 border-b border-border pb-14">
                <SectionHeading icon={BarChart2}>Limitler ve Kota</SectionHeading>
                <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
                  Planınıza göre dakikalık/günlük istek limitleri uygulanır. Yanıt header&apos;larında limit bilgisi döner:
                </p>
                <CodeBlock lang="http">{`X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1641024000`}</CodeBlock>
                <p className="mt-3 text-sm text-muted-foreground">
                  Limit aşımında <InlineCode>429 Too Many Requests</InlineCode> döner.
                  Üstel geri çekilme (exponential backoff) ve önbellek kullanımı önerilir.
                </p>
              </section>

              {/* Kod Örnekleri */}
              <section id="kod-ornekleri" className="mb-14 scroll-mt-28 border-b border-border pb-14">
                <SectionHeading icon={Terminal}>Kod Örnekleri</SectionHeading>
                <p className="mb-2 text-sm text-muted-foreground">JavaScript (cursor ile sayfalama):</p>
                <CodeBlock lang="javascript">{`const API_BASE = '${API_BASE}';
const API_KEY = process.env.BLOG_API_KEY;

async function listPosts(cursor = null) {
  const params = new URLSearchParams({ status: 'published', limit: '50' });
  if (cursor) params.append('cursor', cursor);

  const res = await fetch(\`\${API_BASE}/v1/api/blog?\${params}\`, {
    headers: { 'Authorization': \`Bearer \${API_KEY}\` }
  });
  const data = await res.json();
  return { posts: data.data || [], meta: data.meta || {} };
}

// Tüm sayfaları çek
async function getAllPosts() {
  const all = [];
  let cursor = null;
  let hasMore = true;
  while (hasMore) {
    const { posts, meta } = await listPosts(cursor);
    all.push(...posts);
    hasMore = meta.has_more ?? false;
    cursor = meta.next_cursor;
    if (!cursor && !hasMore) break;
  }
  return all;
}`}</CodeBlock>
              </section>

              {/* Destek */}
              <section id="destek" className="mb-4 scroll-mt-28">
                <SectionHeading icon={MessageCircle}>Destek</SectionHeading>
                <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
                  Teknik sorularınız veya entegrasyon desteği için iletişim sayfamızdan bize ulaşabilirsiniz.
                  Dashboard içindeki API Docs sayfasında canlı örnekler ve API anahtar yönetimi bulunur.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button asChild variant="outline">
                    <Link href="/contact">İletişim</Link>
                  </Button>
                  <Button asChild>
                    <Link href="/dashboard/api-docs">
                      Dashboard API Docs
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </section>

            </motion.div>
          </article>

        </div>
      </div>
    </div>
  );
}
