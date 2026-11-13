'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  Braces,
  FileJson,
  Gauge,
  Globe,
  KeyRound,
  Layers,
  ListOrdered,
  Plug,
  Rocket,
  ShieldCheck,
  Workflow,
  Bot,
} from 'lucide-react';
import { auth } from '@/lib/auth';
import { CodeBlock, CodeTabs, Endpoint, ParamTable, Callout } from './_components/CodeBlock';
import { ApiKeysPanel } from './_components/ApiKeysPanel';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.blogproduce.com';

const NAV = [
  { id: 'overview', label: 'Overview', icon: BookOpen },
  { id: 'api-keys', label: 'API Keys', icon: KeyRound },
  { id: 'authentication', label: 'Authentication', icon: ShieldCheck },
  { id: 'quickstart', label: 'Quickstart', icon: Rocket },
  { id: 'generate', label: 'Generate Content', icon: Workflow },
  { id: 'jobs', label: 'Job Status', icon: Gauge },
  { id: 'posts', label: 'Posts', icon: ListOrdered },
  { id: 'autopilot', label: 'Autopilot', icon: Bot },
  { id: 'published', label: 'Published Content', icon: Globe },
  { id: 'public-api', label: 'Public API (No Auth)', icon: Plug },
  { id: 'formats', label: 'Content Formats', icon: FileJson },
  { id: 'errors', label: 'Errors', icon: Braces },
  { id: 'rate-limits', label: 'Rate Limits', icon: Layers },
];

export default function ApiDocsPage() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState('overview');

  useEffect(() => {
    if (!auth.isAuthenticated()) {
      router.push('/login');
    }
  }, [router]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
            break;
          }
        }
      },
      { rootMargin: '-20% 0px -70% 0px' },
    );
    NAV.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  return (
    <div className="mx-auto max-w-7xl p-6 lg:p-8">
      {/* Page header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm font-medium text-accent-foreground">
          <BookOpen className="h-4 w-4" />
          Developer Documentation
        </div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
          BlogProduce API
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Generate AI-written, SEO-ready blog posts and serve them anywhere — your website, app or
          CMS. REST, JSON, cursor pagination, idempotent writes.
        </p>
        <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 shadow-card">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Base URL
          </span>
          <code className="text-[13px] font-medium text-foreground">{API_BASE_URL}</code>
        </div>
      </div>

      <div className="flex gap-10">
        {/* Sticky in-page nav */}
        <aside className="hidden w-56 shrink-0 lg:block">
          <nav className="sticky top-24 space-y-0.5">
            {NAV.map(({ id, label, icon: Icon }) => (
              <a
                key={id}
                href={`#${id}`}
                className={
                  activeSection === id
                    ? 'flex items-center gap-2.5 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-foreground'
                    : 'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground'
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </a>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <div className="min-w-0 flex-1 space-y-14 pb-24">
          <OverviewSection />
          <section id="api-keys" className="scroll-mt-24">
            <SectionTitle title="API Keys" subtitle="Create and manage the keys your integration uses." />
            <ApiKeysPanel />
          </section>
          <AuthSection />
          <QuickstartSection />
          <GenerateSection />
          <JobsSection />
          <PostsSection />
          <AutopilotSection />
          <PublishedSection />
          <PublicApiSection />
          <FormatsSection />
          <ErrorsSection />
          <RateLimitsSection />
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-5">
      <h2 className="text-xl font-semibold tracking-tight text-foreground">{title}</h2>
      {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
    </div>
  );
}

function SubTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-3 mt-8 text-base font-semibold text-foreground">{children}</h3>;
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="mb-4 text-sm leading-relaxed text-muted-foreground">{children}</p>;
}

/* ────────────────────────── Sections ────────────────────────── */

function OverviewSection() {
  return (
    <section id="overview" className="scroll-mt-24">
      <SectionTitle
        title="Overview"
        subtitle="How the BlogProduce API works and what you can build with it."
      />
      <P>
        The API is organized around REST. Every request and response is JSON. Successful responses
        share a single envelope:
      </P>
      <CodeBlock
        title="Response envelope"
        language="json"
        code={`{
  "success": true,
  "data": { ... }
}`}
      />
      <SubTitle>Asynchronous content generation</SubTitle>
      <P>
        Blog generation is asynchronous: you queue a job, poll its status, then publish and fetch
        the finished post. A typical integration is four calls:
      </P>
      <div className="grid gap-3 sm:grid-cols-2">
        {[
          { step: '1', title: 'Queue', text: 'POST /api/v1/posts:generate returns a jobId instantly.' },
          { step: '2', title: 'Poll', text: 'GET /api/v1/jobs/{jobId} until status is "succeeded".' },
          { step: '3', title: 'Publish', text: 'POST /api/v1/posts/{postId}/publish makes it live.' },
          { step: '4', title: 'Serve', text: 'GET /api/v1/published/{slug}?format=html on your site.' },
        ].map((item) => (
          <div key={item.step} className="rounded-xl border border-border bg-card p-4 shadow-card">
            <div className="mb-2 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              {item.step}
            </div>
            <p className="text-sm font-semibold text-foreground">{item.title}</p>
            <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{item.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function AuthSection() {
  return (
    <section id="authentication" className="scroll-mt-24">
      <SectionTitle
        title="Authentication"
        subtitle="Authenticate every request with your secret API key."
      />
      <P>
        Create a key from the panel above. The secret key (prefixed{' '}
        <code className="rounded bg-secondary px-1.5 py-0.5 text-[13px] text-foreground">bg_secret_</code>)
        is shown once at creation. Send it on every request — the recommended way is the{' '}
        <code className="rounded bg-secondary px-1.5 py-0.5 text-[13px] text-foreground">Authorization</code>{' '}
        header:
      </P>
      <CodeTabs
        tabs={[
          {
            label: 'Authorization header',
            code: `curl ${API_BASE_URL}/api/v1/posts \\
  -H "Authorization: Bearer bg_secret_YOUR_KEY"`,
          },
          {
            label: 'X-API-Key header',
            code: `curl ${API_BASE_URL}/api/v1/posts \\
  -H "X-API-Key: bg_secret_YOUR_KEY"`,
          },
        ]}
      />
      <div className="mt-4">
        <Callout variant="warning">
          <strong>Keep your secret key server-side.</strong> Never ship it in browser JavaScript or
          mobile apps — anyone can read it there. For rendering published posts directly from the
          browser, use the{' '}
          <a href="#public-api" className="font-medium text-accent-foreground underline">
            Public API
          </a>
          , which needs no key.
        </Callout>
      </div>
      <P>
        Keys are scoped to a workspace: every request only sees that workspace&apos;s posts.
        Revoking a key disables it immediately.
      </P>
    </section>
  );
}

function QuickstartSection() {
  const jsQuickstart = `const BASE_URL = '${API_BASE_URL}';
const API_KEY = process.env.BLOGPRODUCE_API_KEY; // bg_secret_...

async function api(path, options = {}) {
  const res = await fetch(BASE_URL + path, {
    ...options,
    headers: {
      'Authorization': 'Bearer ' + API_KEY,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  const body = await res.json();
  if (!res.ok || body.success === false) {
    throw new Error(body.message || 'Request failed: ' + res.status);
  }
  return body.data;
}

// 1) Queue a blog post
const { jobId } = await api('/api/v1/posts:generate', {
  method: 'POST',
  headers: { 'Idempotency-Key': 'first-post-001' },
  body: JSON.stringify({
    topic: 'How to choose a CRM for a small business',
    language: 'en',
    tone: 'professional',
    length: 'medium',
    model: 'pro',          // 'standard' | 'pro' | 'premium'
    seoMode: true,
  }),
});

// 2) Poll until the job finishes (typically 30-90 seconds)
let job;
do {
  await new Promise((r) => setTimeout(r, 4000));
  job = await api('/api/v1/jobs/' + jobId);
} while (job.status === 'queued' || job.status === 'running');

if (job.status !== 'succeeded') {
  throw new Error('Generation failed: ' + (job.error || 'unknown'));
}

// 3) Publish it
const published = await api('/api/v1/posts/' + job.postId + '/publish', {
  method: 'POST',
  body: JSON.stringify({}),
});

// 4) Fetch the finished article as HTML
const post = await api('/api/v1/published/' + published.slug + '?format=html');
console.log(post.title);
console.log(post.content_html);`;

  const curlQuickstart = `# 1) Queue a blog post
curl -X POST ${API_BASE_URL}/api/v1/posts:generate \\
  -H "Authorization: Bearer bg_secret_YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -H "Idempotency-Key: first-post-001" \\
  -d '{
    "topic": "How to choose a CRM for a small business",
    "language": "en",
    "tone": "professional",
    "length": "medium",
    "model": "pro",
    "seoMode": true
  }'
# -> { "success": true, "data": { "jobId": "...", "status": "queued" } }

# 2) Poll the job
curl ${API_BASE_URL}/api/v1/jobs/JOB_ID \\
  -H "Authorization: Bearer bg_secret_YOUR_KEY"
# -> { "success": true, "data": { "status": "succeeded", "postId": "..." } }

# 3) Publish
curl -X POST "${API_BASE_URL}/api/v1/posts/POST_ID/publish" \\
  -H "Authorization: Bearer bg_secret_YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{}'

# 4) Fetch as HTML
curl "${API_BASE_URL}/api/v1/published/POST_SLUG?format=html" \\
  -H "Authorization: Bearer bg_secret_YOUR_KEY"`;

  const phpQuickstart = `<?php
// WordPress / plain PHP integration
$baseUrl = '${API_BASE_URL}';
$apiKey  = getenv('BLOGPRODUCE_API_KEY'); // bg_secret_...

function bp_request($method, $path, $body = null) {
    global $baseUrl, $apiKey;
    $ch = curl_init($baseUrl . $path);
    $headers = [
        'Authorization: Bearer ' . $apiKey,
        'Content-Type: application/json',
    ];
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CUSTOMREQUEST  => $method,
        CURLOPT_HTTPHEADER     => $headers,
    ]);
    if ($body !== null) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
    }
    $response = json_decode(curl_exec($ch), true);
    curl_close($ch);
    return $response['data'] ?? null;
}

// List published posts and render them
$result = bp_request('GET', '/api/v1/published?limit=10');
foreach ($result['posts'] as $post) {
    echo '<h2>' . htmlspecialchars($post['title']) . '</h2>';
    echo '<p>'  . htmlspecialchars($post['excerpt'] ?? '') . '</p>';
}`;

  return (
    <section id="quickstart" className="scroll-mt-24">
      <SectionTitle
        title="Quickstart"
        subtitle="Generate, publish and fetch your first article in under five minutes."
      />
      <CodeTabs
        tabs={[
          { label: 'JavaScript / Node', code: jsQuickstart },
          { label: 'cURL', code: curlQuickstart },
          { label: 'PHP / WordPress', code: phpQuickstart },
        ]}
      />
    </section>
  );
}

function GenerateSection() {
  return (
    <section id="generate" className="scroll-mt-24">
      <SectionTitle
        title="Generate Content"
        subtitle="Queue an AI blog generation job. Returns immediately with a job id."
      />
      <Endpoint method="POST" path="/api/v1/posts:generate" />
      <div className="mt-4 space-y-4">
        <ParamTable
          title="Headers"
          rows={[
            {
              name: 'Authorization',
              type: 'string',
              required: true,
              description: 'Bearer bg_secret_... — your secret API key.',
            },
            {
              name: 'Idempotency-Key',
              type: 'string',
              description:
                'Recommended. Retrying with the same key and identical body within 24h returns the original response instead of creating a duplicate job.',
            },
          ]}
        />
        <ParamTable
          title="Body parameters"
          rows={[
            {
              name: 'topic',
              type: 'string (5-200 chars)',
              required: true,
              description: 'What the article should be about. The more specific, the better the result.',
            },
            {
              name: 'language',
              type: 'string',
              description: "ISO code: 'tr', 'en', 'de', 'fr', 'es' and 30+ more. Default: 'tr'.",
            },
            {
              name: 'tone',
              type: 'string (≤100 chars)',
              description: "Writing tone, e.g. 'professional', 'friendly', 'authoritative'. Default: 'professional'.",
            },
            {
              name: 'length',
              type: 'string',
              description: "'short' (~600-900 words), 'medium' (~1100-1500), 'long' (~1800-2600). Default: 'medium'.",
            },
            {
              name: 'model',
              type: 'string',
              description:
                "Quality tier: 'standard' (fast), 'pro' (higher quality), 'premium' (Claude Opus — best long-form quality). Default: 'standard'.",
            },
            {
              name: 'seoMode',
              type: 'boolean',
              description:
                'Adds SEO optimization: meta tags, FAQ targeting long-tail queries, keyword placement, JSON-LD schema.',
            },
            {
              name: 'additionalContext',
              type: 'string (≤1000 chars)',
              description: 'Brand facts, product details or angle instructions the writer must respect.',
            },
            {
              name: 'targetAudience',
              type: 'string (≤100 chars)',
              description: "Who the article is for, e.g. 'startup founders'.",
            },
            { name: 'keywords', type: 'string[]', description: 'Target keywords to weave in naturally.' },
            {
              name: 'outline',
              type: 'string',
              description: 'Optional outline to follow instead of letting the AI plan the structure.',
            },
            {
              name: 'coverImageUrl',
              type: 'string',
              description: 'Pre-selected cover image URL to attach to the post.',
            },
          ]}
        />
        <CodeBlock
          title="200 OK"
          language="json"
          code={`{
  "success": true,
  "data": {
    "jobId": "3f6b2c1e-8a4d-4c2f-9e1b-7d5a2c8f4e6a",
    "status": "queued"
  }
}`}
        />
        <Callout>
          Generation runs through a multi-stage pipeline (outline → draft → editorial pass) and
          typically completes in 30-90 seconds depending on length and tier.
        </Callout>
      </div>
    </section>
  );
}

function JobsSection() {
  return (
    <section id="jobs" className="scroll-mt-24">
      <SectionTitle title="Job Status" subtitle="Poll a generation job until it finishes." />
      <Endpoint method="GET" path="/api/v1/jobs/{jobId}" />
      <div className="mt-4 space-y-4">
        <CodeBlock
          title="200 OK"
          language="json"
          code={`{
  "success": true,
  "data": {
    "status": "succeeded",          // queued | running | succeeded | failed | cancelled
    "postId": "9c8d7e6f-...",       // present once the post exists
    "error": "..."                  // present only when status is "failed"
  }
}`}
        />
        <Callout>
          Poll every 3-5 seconds. When <code className="text-[13px]">status</code> is{' '}
          <code className="text-[13px]">succeeded</code>, use{' '}
          <code className="text-[13px]">postId</code> to review, update or publish the post.
        </Callout>
      </div>
    </section>
  );
}

function PostsSection() {
  return (
    <section id="posts" className="scroll-mt-24">
      <SectionTitle
        title="Posts"
        subtitle="List, read, edit and publish the posts in your workspace."
      />

      <SubTitle>List posts</SubTitle>
      <Endpoint method="GET" path="/api/v1/posts" />
      <div className="mt-4 space-y-4">
        <ParamTable
          title="Query parameters"
          rows={[
            {
              name: 'status',
              type: 'string',
              description: 'Filter by status: queued | generating | draft | review | published | failed.',
            },
            { name: 'limit', type: 'number', description: 'Items per page. Default 50, max 100.' },
            {
              name: 'cursor',
              type: 'string',
              description: 'Opaque cursor from the previous response for the next page.',
            },
          ]}
        />
        <CodeBlock
          title="200 OK"
          language="json"
          code={`{
  "success": true,
  "data": {
    "posts": [
      {
        "id": "9c8d7e6f-...",
        "title": "How to Choose a CRM for a Small Business",
        "slug": "how-to-choose-a-crm-for-a-small-business",
        "excerpt": "...",
        "status": "draft",
        "language": "en",
        "coverImageUrl": null,
        "publishedAt": null,
        "createdAt": "2026-08-04T10:12:00.000Z",
        "updatedAt": "2026-08-04T10:13:30.000Z",
        "author": { "name": "...", "email": "..." },
        "tags": []
      }
    ],
    "cursor": "MjAyNi0wOC0wNFQxMDoxMjowMC4wMDBa",
    "hasMore": true
  }
}`}
        />
        <Callout>
          Pass <code className="text-[13px]">data.cursor</code> back as{' '}
          <code className="text-[13px]">?cursor=</code> to fetch the next page. When{' '}
          <code className="text-[13px]">hasMore</code> is <code className="text-[13px]">false</code>{' '}
          you have everything.
        </Callout>
      </div>

      <SubTitle>Get a post</SubTitle>
      <Endpoint method="GET" path="/api/v1/posts/{id}?format=json|md|html" />
      <div className="mt-4">
        <CodeBlock
          title="200 OK (format=html)"
          language="json"
          code={`{
  "success": true,
  "data": {
    "id": "9c8d7e6f-...",
    "title": "...",
    "slug": "...",
    "excerpt": "...",
    "content": "<h1>...</h1><p>...</p>",     // in the requested format
    "contentFormat": "html",
    "content_html": "<h1>...</h1><p>...</p>", // always-available HTML rendering
    "status": "draft",
    "language": "en",
    "coverImageUrl": null,
    "publishedAt": null,
    "createdAt": "2026-08-04T10:12:00.000Z",
    "updatedAt": "2026-08-04T10:14:00.000Z",
    "author": { "name": "...", "email": "..." },
    "tags": [],
    "seo": {
      "metaTitle": "...",
      "metaDescription": "...",
      "ogTitle": "...",
      "ogDescription": "...",
      "schemaJsonld": { "@context": "https://schema.org" }
    }
  }
}`}
        />
      </div>

      <SubTitle>Update a post</SubTitle>
      <Endpoint method="PATCH" path="/api/v1/posts/{id}" />
      <div className="mt-4 space-y-4">
        <ParamTable
          title="Body parameters"
          rows={[
            { name: 'title', type: 'string (≤200)', description: 'New title.' },
            { name: 'excerpt', type: 'string (≤500)', description: 'New excerpt.' },
            { name: 'content', type: 'string', description: 'Replacement content (stored as a new revision).' },
            { name: 'slug', type: 'string', description: 'New slug — must be unique within the workspace.' },
          ]}
        />
        <Callout>
          Posts can only be updated while their status is <code className="text-[13px]">draft</code>,{' '}
          <code className="text-[13px]">generated</code> or <code className="text-[13px]">review</code>.
        </Callout>
      </div>

      <SubTitle>Delete a post</SubTitle>
      <Endpoint method="DELETE" path="/api/v1/posts/{id}" />
      <div className="mt-4 space-y-4">
        <CodeBlock
          title="Request / response"
          language="bash"
          code={`curl -X DELETE "${API_BASE_URL}/api/v1/posts/POST_ID" \\
  -H "Authorization: Bearer bg_secret_YOUR_KEY"

# 200 OK
# {
#   "success": true,
#   "data": { "id": "9c8d7e6f-...", "deleted": true }
# }`}
        />
        <Callout>
          Deletion is <strong>permanent</strong>: the post, all of its revisions and its SEO
          metadata are removed and cannot be recovered. Usage records are kept for billing.
          A post that belongs to another project returns <code className="text-[13px]">404</code>.
        </Callout>
      </div>

      <SubTitle>Publish a post</SubTitle>
      <Endpoint method="POST" path="/api/v1/posts/{id}/publish" />
      <div className="mt-4">
        <CodeBlock
          title="Request / response"
          language="bash"
          code={`curl -X POST "${API_BASE_URL}/api/v1/posts/POST_ID/publish" \\
  -H "Authorization: Bearer bg_secret_YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{ "slug": "optional-custom-slug" }'

# 200 OK
# {
#   "success": true,
#   "data": {
#     "id": "9c8d7e6f-...",
#     "status": "published",
#     "slug": "how-to-choose-a-crm-for-a-small-business",
#     "publishedAt": "2026-08-04T10:20:00.000Z",
#     "message": "Post published successfully"
#   }
# }`}
        />
      </div>
    </section>
  );
}

function AutopilotSection() {
  return (
    <section id="autopilot" className="scroll-mt-24">
      <SectionTitle
        title="Autopilot"
        subtitle="Let a site pick its own topics and publish on a schedule — no dashboard visit required."
      />
      <div className="space-y-3">
        <Endpoint method="GET" path="/api/v1/sites" />
        <Endpoint method="POST" path="/api/v1/sites" />
        <Endpoint method="GET" path="/api/v1/sites/{siteId}/autopilot" />
        <Endpoint method="PUT" path="/api/v1/sites/{siteId}/autopilot" />
        <Endpoint method="GET" path="/api/v1/sites/{siteId}/autopilot/topics" />
        <Endpoint method="POST" path="/api/v1/sites/{siteId}/autopilot/topics/plan" />
      </div>

      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        Your API key is scoped to one workspace, so <code>GET /api/v1/sites</code> returns only the
        sites it may drive. A <code>siteId</code> from another workspace is refused.
      </p>

      <div className="mt-4">
        <CodeBlock
          title="Turn a site into a daily blog"
          language="js"
          code={`// 1) Find (or create) the site autopilot will write for
let { data: sites } = await api('/api/v1/sites');
if (sites.length === 0) {
  const created = await api('/api/v1/sites', {
    method: 'POST',
    body: JSON.stringify({ name: 'Acme Store', domain: 'acme.com' }),
  });
  sites = [created];
}
const siteId = sites[0].id;

// 2) Configure it. Every field is optional — this is a partial update, so you
//    can flip 'enabled' later without resending the rest.
await api('/api/v1/sites/' + siteId + '/autopilot', {
  method: 'PUT',
  body: JSON.stringify({
    enabled: true,
    postsPerWeek: 7,          // 7 = one a day, 14 = twice a day
    maxPostsPerMonth: 30,     // hard ceiling, independent of the cadence
    tier: 'standard',         // 'standard' | 'pro' | 'premium'
    autoPublish: true,        // false leaves each article as a draft for review
    language: 'tr',
    niche: "KOBİ'ler için e-ticaret yazılımı",
    targetAudience: 'teknik olmayan mağaza sahipleri',
    keywords: 'e-ticaret seo, ürün açıklaması, kargo entegrasyonu',
    excludedTopics: 'kripto, rakip markalar',
  }),
});

// 3) Optional: fill the topic queue now instead of waiting for the first run
const { added } = await api('/api/v1/sites/' + siteId + '/autopilot/topics/plan', {
  method: 'POST',
});
console.log(added + ' topics planned');

// 4) Inspect what it intends to write
const { data: topics } = await api('/api/v1/sites/' + siteId + '/autopilot/topics');
for (const t of topics) console.log(t.status, '-', t.title);

// From here autopilot runs on its own: it writes one article per cadence slot,
// attaches a cover image, and — with autoPublish — publishes it and fires your
// post.published webhook. Read the result from /api/v1/published as usual.`}
        />
      </div>

      <div className="mt-4 rounded-lg border border-border bg-surface-raised p-4">
        <p className="text-sm font-medium text-foreground-strong">Spend is bounded three ways</p>
        <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-muted-foreground">
          <li>
            <code>postsPerWeek</code> spaces the runs (7 / value = days between them).
          </li>
          <li>
            <code>maxPostsPerMonth</code> is a hard monthly ceiling that the cadence cannot exceed.
          </li>
          <li>
            Generation still passes your plan&apos;s own quota check, so autopilot can never spend
            past the allowance and token balance you already have.
          </li>
        </ul>
      </div>
    </section>
  );
}

function PublishedSection() {
  return (
    <section id="published" className="scroll-mt-24">
      <SectionTitle
        title="Published Content"
        subtitle="Fetch only live content — ideal for rendering your blog."
      />
      <div className="space-y-3">
        <Endpoint method="GET" path="/api/v1/published?limit=50&cursor=..." />
        <Endpoint method="GET" path="/api/v1/published/{slug}?format=json|md|html" />
      </div>
      <div className="mt-4">
        <CodeBlock
          title="Next.js App Router example"
          language="tsx"
          code={`// npm i isomorphic-dompurify
import DOMPurify from 'isomorphic-dompurify';

// app/blog/page.tsx — list published posts (server component)
export default async function BlogPage() {
  const res = await fetch('${API_BASE_URL}/api/v1/published?limit=20', {
    headers: { Authorization: \`Bearer \${process.env.BLOGPRODUCE_API_KEY}\` },
    next: { revalidate: 300 }, // ISR: refresh every 5 minutes
  });
  const { data } = await res.json();
  const posts = data.posts; // data also carries { cursor, hasMore }

  return (
    <main>
      {posts.map((post) => (
        <a key={post.id} href={\`/blog/\${post.slug}\`}>
          <h2>{post.title}</h2>
          <p>{post.excerpt}</p>
        </a>
      ))}
    </main>
  );
}

// app/blog/[slug]/page.tsx — render a single post
export default async function PostPage({ params }) {
  const res = await fetch(
    \`${API_BASE_URL}/api/v1/published/\${params.slug}?format=html\`,
    {
      headers: { Authorization: \`Bearer \${process.env.BLOGPRODUCE_API_KEY}\` },
      next: { revalidate: 300 },
    },
  );
  const { data: post } = await res.json();

  // content_html is sanitized server-side, but sanitize again at the render
  // boundary — it is the one place that protects you regardless of what
  // reaches the content upstream.
  const html = DOMPurify.sanitize(post.content_html);

  return (
    <article>
      <h1>{post.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </article>
  );
}`}
        />
      </div>
      <div className="mt-4">
        <Callout>
          <code className="text-[13px]">content_html</code> is sanitized server-side before delivery.
          The <code className="text-[13px]">seo</code> object contains ready-to-use meta tags and
          JSON-LD — wire them into your page <code className="text-[13px]">&lt;head&gt;</code> for
          full SEO benefit.
        </Callout>
      </div>
    </section>
  );
}

function PublicApiSection() {
  return (
    <section id="public-api" className="scroll-mt-24">
      <SectionTitle
        title="Public API (No Auth)"
        subtitle="Read-only endpoints for client-side rendering — no API key required."
      />
      <P>
        Safe to call directly from the browser: they expose only <em>published</em> posts of a
        project, addressed by its public project slug (shown in your workspace settings).
      </P>
      <div className="space-y-3">
        <Endpoint method="GET" path="/api/v1/public/projects/{projectSlug}/posts?limit=50&cursor=..." />
        <Endpoint method="GET" path="/api/v1/public/projects/{projectSlug}/posts/{slug}?format=html" />
      </div>
      <div className="mt-4">
        <CodeBlock
          title="Browser example"
          language="js"
          code={`// No key needed — safe for client-side code
const res = await fetch(
  '${API_BASE_URL}/api/v1/public/projects/YOUR_PROJECT_SLUG/posts?limit=10',
);
const { data } = await res.json();

for (const post of data.posts) {
  console.log(post.title, post.slug, post.publishedAt);
}
// data.cursor + data.hasMore -> cursor pagination, same as the Posts API`}
        />
      </div>
    </section>
  );
}

function FormatsSection() {
  return (
    <section id="formats" className="scroll-mt-24">
      <SectionTitle
        title="Content Formats"
        subtitle="Every post is stored canonically and converted on demand."
      />
      <P>
        Endpoints that return full content accept a{' '}
        <code className="rounded bg-secondary px-1.5 py-0.5 text-[13px] text-foreground">?format=</code>{' '}
        query parameter:
      </P>
      <ParamTable
        rows={[
          {
            name: 'json',
            type: 'default',
            description:
              'Canonical structure: { "content": "<markdown>", "metadata": { "toc": [...], "faq": [...], "seo": {...} } }. Best when you want structured access to FAQ, table of contents and SEO fields.',
          },
          {
            name: 'md',
            type: 'markdown',
            description:
              'The article as plain Markdown — ideal for static site generators or storing in your own CMS.',
          },
          {
            name: 'html',
            type: 'html',
            description:
              'Sanitized, render-ready HTML. Responses also always include content_html regardless of the requested format.',
          },
        ]}
      />
    </section>
  );
}

function ErrorsSection() {
  return (
    <section id="errors" className="scroll-mt-24">
      <SectionTitle title="Errors" subtitle="Standard HTTP status codes with a JSON body." />
      <CodeBlock
        title="Error response"
        language="json"
        code={`{
  "statusCode": 400,
  "message": "topic must be longer than or equal to 5 characters",
  "error": "Bad Request"
}`}
      />
      <div className="mt-4">
        <ParamTable
          rows={[
            {
              name: '400',
              type: 'Bad Request',
              description:
                'Validation failed — the message field lists what is wrong. Unknown body fields are also rejected.',
            },
            { name: '401', type: 'Unauthorized', description: 'Missing, invalid, expired or revoked API key.' },
            { name: '403', type: 'Forbidden', description: 'The key is valid but not allowed to perform this action.' },
            { name: '404', type: 'Not Found', description: 'Resource does not exist or belongs to another workspace.' },
            {
              name: '429',
              type: 'Too Many Requests',
              description: 'Rate limit exceeded — check the rate limit headers and retry with backoff.',
            },
            {
              name: '500',
              type: 'Server Error',
              description: 'Something went wrong on our side. Safe to retry with the same Idempotency-Key.',
            },
          ]}
        />
      </div>
    </section>
  );
}

function RateLimitsSection() {
  return (
    <section id="rate-limits" className="scroll-mt-24">
      <SectionTitle title="Rate Limits" subtitle="Per-key limits keep the platform fast for everyone." />
      <P>
        Requests are rate-limited per API key. Current usage is reported on responses via headers:
      </P>
      <CodeBlock
        title="Response headers"
        language="http"
        code={`X-RateLimit-Limit: 150
X-RateLimit-Remaining: 149`}
      />
      <div className="mt-4">
        <Callout>
          When you receive <code className="text-[13px]">429</code>, wait and retry with exponential
          backoff. Generation calls also count against your plan&apos;s monthly content quota — see
          the{' '}
          <a href="/dashboard/usage" className="font-medium text-accent-foreground underline">
            Usage
          </a>{' '}
          page.
        </Callout>
      </div>
    </section>
  );
}
