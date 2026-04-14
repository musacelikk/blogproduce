'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  BookOpen, Zap, Key, Code2, AlertCircle, BarChart2,
  Terminal, MessageCircle, ArrowRight, Copy, Check, ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

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
    <div className="relative rounded-xl overflow-hidden my-4" style={{ border: '1px solid #2a2a2a', background: '#111' }}>
      <div className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: '1px solid #2a2a2a', background: '#1a1a1a' }}>
        <span className="text-xs font-mono" style={{ color: '#888' }}>{lang}</span>
        <button
          type="button"
          onClick={copy}
          className="p-1.5 rounded-lg transition-colors"
          style={{ color: copied ? '#203eec' : '#888' }}
          aria-label="Kopyala"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-sm leading-relaxed" style={{ color: '#e5e5e5' }}>
        <code>{children}</code>
      </pre>
    </div>
  );
}

function DocTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto my-4 rounded-xl" style={{ border: '1px solid var(--border)' }}>
      <table className="w-full text-left text-sm">
        <thead>
          <tr style={{ background: 'var(--secondary)', borderBottom: '1px solid var(--border)' }}>
            {headers.map((h, i) => (
              <th key={i} className="px-4 py-3 font-semibold text-foreground">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className="transition-colors hover:bg-secondary/40" style={{ borderBottom: ri < rows.length - 1 ? '1px solid var(--border)' : 'none' }}>
              {row.map((cell, ci) => (
                <td key={ci} className="px-4 py-3 text-muted-foreground text-sm">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SectionHeading({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) {
  return (
    <h2 className="text-xl font-semibold tracking-tight text-foreground mb-4 flex items-center gap-2.5">
      <span className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg,#203eec18,#00d4ff18)' }}>
        <Icon className="w-4 h-4" style={{ color: '#203eec' }} />
      </span>
      {children}
    </h2>
  );
}

function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code className="px-1.5 py-0.5 rounded-md text-sm font-mono"
      style={{ background: 'var(--secondary)', color: 'var(--foreground)' }}>
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
      <div className="border-b" style={{ borderColor: 'var(--border)' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="max-w-[1280px] mx-auto px-6 md:px-12 pt-28 md:pt-36 pb-10 md:pb-14"
        >
          <span
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase mb-5"
            style={{ background: 'linear-gradient(135deg,#203eec18,#00d4ff18)', color: '#203eec' }}
          >
            <Code2 className="w-3.5 h-3.5" />
            API Dokümantasyonu
          </span>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-foreground mb-4 leading-tight">
            BlogGenerator API
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mb-6">
            Yayınlanmış blog yazılarınızı listeleyin, tekil içerik çekin ve uygulamanıza entegre edin.
          </p>
          <div className="flex flex-wrap gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
              style={{ background: 'var(--secondary)', color: 'var(--foreground)' }}>
              Base URL: <InlineCode>{API_BASE}</InlineCode>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
              style={{ background: 'var(--secondary)', color: 'var(--foreground)' }}>
              v1
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
              style={{ background: 'var(--secondary)', color: 'var(--foreground)' }}>
              Bearer Token
            </span>
          </div>
        </motion.div>
      </div>

      <div className="max-w-[1280px] mx-auto px-6 md:px-12 py-10 md:py-14">
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-14">

          {/* Sidebar */}
          <aside className="lg:w-56 xl:w-60 flex-shrink-0 lg:sticky lg:top-24 self-start">
            <nav className="space-y-0.5">
              {navItems.map(({ id, label, icon: Icon }) => (
                <a
                  key={id}
                  href={`#${id}`}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all duration-150"
                  style={activeId === id
                    ? { background: 'linear-gradient(135deg,#203eec18,#00d4ff18)', color: '#203eec', fontWeight: 600 }
                    : { color: 'var(--muted-foreground)' }
                  }
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {label}
                </a>
              ))}
            </nav>

            {/* API Key CTA */}
            <div className="mt-8 p-4 rounded-2xl" style={{ border: '1px solid var(--border)', background: 'var(--card)' }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3"
                style={{ background: 'linear-gradient(135deg,#203eec,#00d4ff)' }}>
                <Key className="w-4 h-4 text-white" />
              </div>
              <p className="text-xs font-semibold text-foreground mb-1">API anahtarı gerekli</p>
              <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                Giriş yapıp dashboard üzerinden API anahtarı oluşturun.
              </p>
              <Button asChild size="sm"
                className="w-full text-white rounded-full text-xs"
                style={{ background: 'linear-gradient(135deg,#203eec,#00d4ff)' }}>
                <Link href="/login">
                  Giriş Yap
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Link>
              </Button>
            </div>
          </aside>

          {/* Content */}
          <article className="flex-1 min-w-0 max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-0"
            >

              {/* Genel Bakış */}
              <section id="genel-bakis" className="scroll-mt-28 mb-14 pb-14" style={{ borderBottom: '1px solid var(--border)' }}>
                <SectionHeading icon={BookOpen}>Genel Bakış</SectionHeading>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  BlogGenerator API, yayınladığınız blog yazılarını programatik olarak almanızı sağlar.
                  REST API ile içerikleri uygulamanıza, sitenize veya otomasyon sistemlerinize entegre edebilirsiniz.
                </p>
                <ul className="space-y-2 mb-4">
                  {[
                    'İçerik teslimi: Yayınlanmış blog yazılarını REST API ile çekin',
                    'Esnek sorgulama: Durum, dil veya slug ile filtreleme',
                    'Zengin metadata: SEO verisi, etiketler, yazar bilgisi',
                    'Güvenli erişim: API anahtarı ile kimlik doğrulama',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5"
                        style={{ background: 'linear-gradient(135deg,#203eec,#00d4ff)' }}>
                        <Check className="w-3 h-3 text-white" strokeWidth={3} />
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
              <section id="hizli-baslangic" className="scroll-mt-28 mb-14 pb-14" style={{ borderBottom: '1px solid var(--border)' }}>
                <SectionHeading icon={Zap}>Hızlı Başlangıç</SectionHeading>
                <ol className="space-y-3 mb-4">
                  {[
                    <>Dashboard'a giriş yapın ve <strong>API Docs</strong> bölümünden çalışma alanınız için API anahtarı oluşturun.</>,
                    <>İsteklerde <InlineCode>Authorization: Bearer YOUR_API_KEY</InlineCode> header'ını kullanın.</>,
                    <>Yayınlanmış yazıları listelemek için <InlineCode>GET /v1/api/blog?status=published</InlineCode> endpoint'ini çağırın.</>,
                  ].map((step, i) => (
                    <li key={i} className="flex gap-3 text-sm text-muted-foreground">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                        style={{ background: 'linear-gradient(135deg,#203eec,#00d4ff)' }}>
                        {i + 1}
                      </span>
                      <span className="pt-0.5">{step}</span>
                    </li>
                  ))}
                </ol>
                <CodeBlock lang="bash">{`curl -X GET "${API_BASE}/v1/api/blog?status=published&limit=10" \\
  -H "Authorization: Bearer YOUR_API_KEY"`}</CodeBlock>
                <p className="text-sm text-muted-foreground mt-2">
                  Başarılı yanıt: <InlineCode>{'{ "success": true, "data": [...], "meta": { "next_cursor": "...", "has_more": true } }'}</InlineCode>
                </p>
              </section>

              {/* Kimlik Doğrulama */}
              <section id="kimlik-dogrulama" className="scroll-mt-28 mb-14 pb-14" style={{ borderBottom: '1px solid var(--border)' }}>
                <SectionHeading icon={Key}>Kimlik Doğrulama</SectionHeading>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  API anahtarı çalışma alanına özeldir; ilgili çalışma alanındaki içeriklere erişim sağlar.
                  Anahtar formatı: <InlineCode>bg_&lt;64-karakter-hex&gt;</InlineCode>
                </p>
                <p className="text-sm font-semibold text-foreground mb-2">Önerilen: Bearer token</p>
                <CodeBlock lang="http">Authorization: Bearer bg_your_api_key_here</CodeBlock>
                <p className="text-sm text-muted-foreground mt-2">
                  Alternatif: <InlineCode>X-API-Key: bg_your_api_key_here</InlineCode> header'ı da kullanılabilir.
                  Anahtarı asla URL query parametresi olarak göndermeyin.
                </p>
              </section>

              {/* API Referansı */}
              <section id="api-referansi" className="scroll-mt-28 mb-14 pb-14" style={{ borderBottom: '1px solid var(--border)' }}>
                <SectionHeading icon={Code2}>API Referansı</SectionHeading>
                <div className="space-y-8">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 rounded text-xs font-bold text-white" style={{ background: '#22c55e' }}>GET</span>
                      <h3 className="text-base font-semibold text-foreground">Blog listeleme</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
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
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 rounded text-xs font-bold text-white" style={{ background: '#22c55e' }}>GET</span>
                      <h3 className="text-base font-semibold text-foreground">Tekil yazı (ID)</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      <InlineCode>GET /v1/api/blog/:id</InlineCode> — Tam içerik (HTML, markdown, SEO, TOC, FAQ).
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 rounded text-xs font-bold text-white" style={{ background: '#22c55e' }}>GET</span>
                      <h3 className="text-base font-semibold text-foreground">Tekil yazı (slug)</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      <InlineCode>GET /v1/api/blog/slug/:slug</InlineCode> — Slug ile tam içerik.
                    </p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-6 flex items-center gap-1.5">
                  <ExternalLink className="w-4 h-4 flex-shrink-0" style={{ color: '#203eec' }} />
                  Dashboard'taki{' '}
                  <Link href="/dashboard/api-docs" className="hover:underline font-medium" style={{ color: '#203eec' }}>
                    API Docs
                  </Link>{' '}
                  sayfasında tüm endpoint detayları ve anahtar yönetimi bulunur.
                </p>
              </section>

              {/* Hata Yönetimi */}
              <section id="hata-yonetimi" className="scroll-mt-28 mb-14 pb-14" style={{ borderBottom: '1px solid var(--border)' }}>
                <SectionHeading icon={AlertCircle}>Hata Yönetimi</SectionHeading>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">Tüm hata yanıtları aynı yapıdadır:</p>
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
              <section id="limitler" className="scroll-mt-28 mb-14 pb-14" style={{ borderBottom: '1px solid var(--border)' }}>
                <SectionHeading icon={BarChart2}>Limitler ve Kota</SectionHeading>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  Planınıza göre dakikalık/günlük istek limitleri uygulanır. Yanıt header'larında limit bilgisi döner:
                </p>
                <CodeBlock lang="http">{`X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1641024000`}</CodeBlock>
                <p className="text-sm text-muted-foreground mt-3">
                  Limit aşımında <InlineCode>429 Too Many Requests</InlineCode> döner.
                  Üstel geri çekilme (exponential backoff) ve önbellek kullanımı önerilir.
                </p>
              </section>

              {/* Kod Örnekleri */}
              <section id="kod-ornekleri" className="scroll-mt-28 mb-14 pb-14" style={{ borderBottom: '1px solid var(--border)' }}>
                <SectionHeading icon={Terminal}>Kod Örnekleri</SectionHeading>
                <p className="text-sm text-muted-foreground mb-2">JavaScript (cursor ile sayfalama):</p>
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
              <section id="destek" className="scroll-mt-28 mb-4">
                <SectionHeading icon={MessageCircle}>Destek</SectionHeading>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                  Teknik sorularınız veya entegrasyon desteği için iletişim sayfamızdan bize ulaşabilirsiniz.
                  Dashboard içindeki API Docs sayfasında canlı örnekler ve API anahtar yönetimi bulunur.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button asChild variant="outline" size="sm" className="rounded-full">
                    <Link href="/contact">İletişim</Link>
                  </Button>
                  <Button asChild size="sm"
                    className="rounded-full text-white"
                    style={{ background: 'linear-gradient(135deg,#203eec,#00d4ff)' }}>
                    <Link href="/dashboard/api-docs">
                      Dashboard API Docs
                      <ArrowRight className="w-3.5 h-3.5 ml-1" />
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
