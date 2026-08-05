import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitize HTML before it reaches dangerouslySetInnerHTML.
 *
 * Blog content is AI-generated and user-editable, and revisions can store raw HTML,
 * so every render path is an untrusted-input path — the model can be steered into
 * emitting markup by anything that lands in its prompt.
 */
export function sanitizeHtml(html: string | null | undefined): string {
  if (!html) return '';
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    ADD_ATTR: ['target', 'rel'],
    FORBID_TAGS: ['style', 'form', 'input', 'button'],
    FORBID_ATTR: ['style', 'srcset', 'formaction'],
  });
}

/** Escape a string for safe interpolation into an HTML template. */
export function escapeHtml(value: string | null | undefined): string {
  if (!value) return '';
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
