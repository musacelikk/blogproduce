'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface CodeBlockProps {
  code: string;
  language?: string;
  title?: string;
}

/** Dark, Stripe-style code block with a copy button. */
export function CodeBlock({ code, language, title }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard unavailable — ignore
    }
  };

  return (
    <div className="group relative overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/80 px-4 py-2">
        <span className="text-xs font-medium text-slate-400">
          {title || language || 'code'}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copy code"
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-[13px] leading-relaxed text-slate-200">
        <code>{code}</code>
      </pre>
    </div>
  );
}

interface CodeTabsProps {
  tabs: Array<{ label: string; code: string; language?: string }>;
}

/** Tabbed code samples (cURL / JavaScript / Python ...). */
export function CodeTabs({ tabs }: CodeTabsProps) {
  const [active, setActive] = useState(0);
  const current = tabs[active];

  return (
    <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
      <div className="flex items-center gap-1 border-b border-slate-800 bg-slate-900/80 px-2 pt-1">
        {tabs.map((tab, index) => (
          <button
            key={tab.label}
            type="button"
            onClick={() => setActive(index)}
            className={
              index === active
                ? 'rounded-t-md border-b-2 border-[#00d4ff] px-3 py-2 text-xs font-semibold text-white'
                : 'rounded-t-md border-b-2 border-transparent px-3 py-2 text-xs font-medium text-slate-400 transition-colors hover:text-slate-200'
            }
          >
            {tab.label}
          </button>
        ))}
        <CopyButton code={current.code} />
      </div>
      <pre className="overflow-x-auto p-4 text-[13px] leading-relaxed text-slate-200">
        <code>{current.code}</code>
      </pre>
    </div>
  );
}

function CopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // ignore
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label="Copy code"
      className="ml-auto mb-1 flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

const METHOD_STYLES: Record<string, string> = {
  GET: 'bg-success-muted text-success',
  POST: 'bg-accent text-accent-foreground',
  PATCH: 'bg-warning-muted text-warning',
  DELETE: 'bg-[var(--destructive-muted)] text-destructive',
};

/** `GET /api/v1/posts` style endpoint signature chip. */
export function Endpoint({ method, path }: { method: string; path: string }) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-secondary/60 px-3 py-2">
      <span
        className={`rounded-md px-2 py-0.5 text-xs font-bold tracking-wide ${METHOD_STYLES[method] || 'bg-secondary text-foreground'}`}
      >
        {method}
      </span>
      <code className="break-all text-[13px] font-medium text-foreground">{path}</code>
    </div>
  );
}

interface ParamRow {
  name: string;
  type: string;
  required?: boolean;
  description: string;
}

/** Parameter reference table. */
export function ParamTable({ rows, title }: { rows: ParamRow[]; title?: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border">
      {title && (
        <div className="border-b border-border bg-secondary/60 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <tbody>
            {rows.map((row) => (
              <tr key={row.name} className="border-b border-border last:border-0">
                <td className="whitespace-nowrap px-4 py-3 align-top">
                  <code className="text-[13px] font-semibold text-foreground">{row.name}</code>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {row.type}
                    {row.required ? (
                      <span className="ml-1.5 font-medium text-warning">required</span>
                    ) : (
                      <span className="ml-1.5">optional</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 align-top text-muted-foreground">{row.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Callout box: note / warning. */
export function Callout({
  variant = 'info',
  children,
}: {
  variant?: 'info' | 'warning';
  children: React.ReactNode;
}) {
  const styles =
    variant === 'warning'
      ? 'border-warning/30 bg-warning-muted text-foreground'
      : 'border-info/30 bg-info-muted text-foreground';
  return <div className={`rounded-xl border px-4 py-3 text-sm leading-relaxed ${styles}`}>{children}</div>;
}
