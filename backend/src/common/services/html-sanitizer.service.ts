import { Injectable } from '@nestjs/common';
import sanitizeHtml from 'sanitize-html';
import { decodeHTML } from 'entities';

/**
 * HTML sanitization for model-written content before it leaves the backend.
 *
 * **Parser-based, deliberately.** This was a chain of regex replacements, and
 * regexes cannot parse HTML. The event-handler rule required quoted values
 * (`/\s*on\w+\s*=\s*["'][^"']*["']/`), so every unquoted spelling walked
 * straight through — `<img src=x onerror=alert(1)>`, the backtick form, a
 * newline before the attribute name, uppercase. The attribute allowlist was
 * declared and never consulted. A test that only tried the quoted form passed,
 * which is how it survived.
 *
 * `sanitize-html` tokenises instead, so an attribute is an attribute however it
 * is written. Keep the configuration here, and don't add a regex "quick fix"
 * beside it.
 */

/** Safe subset. Anything not listed is dropped, its text content kept. */
const ALLOWED_TAGS = [
  'p',
  'br',
  'strong',
  'em',
  'u',
  'b',
  'i',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'ul',
  'ol',
  'li',
  'blockquote',
  'code',
  'pre',
  'a',
  'img',
  'table',
  'thead',
  'tbody',
  'tr',
  'th',
  'td',
  'div',
  'span',
];

const ALLOWED_ATTRIBUTES: Record<string, string[]> = {
  a: ['href', 'title', 'target', 'rel'],
  img: ['src', 'alt', 'title', 'width', 'height'],
  table: ['class'],
  // Heading ids are anchor targets for the generated table of contents.
  h1: ['id'],
  h2: ['id'],
  h3: ['id'],
  h4: ['id'],
  h5: ['id'],
  h6: ['id'],
  th: ['scope'],
  td: ['colspan', 'rowspan'],
};

/**
 * URL schemes permitted in `href`/`src`. An allowlist, so `javascript:`,
 * `vbscript:` and every `data:` payload are refused by omission rather than by
 * being enumerated — the previous code string-replaced `javascript:` out of the
 * value, which mangled the content and missed everything else.
 */
const ALLOWED_SCHEMES = ['http', 'https', 'mailto'];

/** Entity decoding is not guaranteed to converge on hostile input. */
const MAX_DECODE_PASSES = 4;

const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: ALLOWED_TAGS,
  allowedAttributes: ALLOWED_ATTRIBUTES,
  allowedSchemes: ALLOWED_SCHEMES,
  allowedSchemesAppliedToAttributes: ['href', 'src'],
  // Relative URLs carry no scheme and are fine.
  allowProtocolRelative: false,
  disallowedTagsMode: 'discard',
  // Script and style content is dropped with the tag rather than surfacing as
  // text, which `discard` alone would do.
  nonTextTags: ['script', 'style', 'textarea', 'noscript', 'option'],
  transformTags: {
    // A model-written link to another site opens in a context we do not
    // control; deny it access to ours.
    a: (tagName, attribs) => {
      if (attribs.target) {
        attribs.rel = attribs.rel ? `${attribs.rel} noopener noreferrer` : 'noopener noreferrer';
      }
      return { tagName, attribs };
    },
  },
};

const TEXT_ONLY_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [],
  allowedAttributes: {},
  nonTextTags: ['script', 'style', 'textarea', 'noscript', 'option'],
};

@Injectable()
export class HtmlSanitizerService {
  /**
   * @param html content to sanitize
   * @param allowHtml when false, strip every tag and return text
   */
  sanitize(html: string, allowHtml = true): string {
    if (!html || typeof html !== 'string') {
      return html || '';
    }

    return sanitizeHtml(html, allowHtml ? OPTIONS : TEXT_ONLY_OPTIONS);
  }

  /**
   * Strip all HTML and return genuinely plain text.
   *
   * Order matters, and getting it wrong is how this method briefly *produced*
   * markup. Decoding after stripping means `&lt;script&gt;` survives the strip
   * as inert text and then becomes `<script>` on the way out — the sanitizer
   * manufacturing the very thing it exists to remove.
   *
   * So: decode to a fixed point first, so multiply-encoded markup
   * (`&amp;lt;script&amp;gt;`) is unwrapped before anything judges it; then
   * strip; then undo only the escaping the stripper itself added, so "Kahve &
   * çay" does not come back as "Kahve &amp; çay"; then drop any angle bracket
   * still standing.
   *
   * That last step costs a literal `<` in text like "Fiyat < 100 TL". Worth it:
   * this is a short text field whose whole contract is that it cannot be
   * markup, and a consumer may well drop it into a page.
   */
  stripHtml(html: string): string {
    if (!html || typeof html !== 'string') {
      return html || '';
    }

    // Bounded: entity decoding is not guaranteed to converge on hostile input.
    let decoded = html;
    let converged = false;
    for (let i = 0; i < MAX_DECODE_PASSES; i++) {
      const next = decodeHTML(decoded);
      if (next === decoded) {
        converged = true;
        break;
      }
      decoded = next;
    }

    // Still unwrapping after four passes means the value was built to outrun
    // this loop. Real content converges in nought or one — "Kahve &amp; çay"
    // takes one. Returning the partially-decoded string would emit entity
    // syntax from a method whose contract is plain text, and leave a consumer
    // that decodes once more holding markup we thought we had removed. There
    // is nothing worth salvaging, so salvage nothing.
    if (!converged) {
      return '';
    }

    const stripped = sanitizeHtml(decoded, TEXT_ONLY_OPTIONS);

    // Safe to decode: every tag is already gone, so what is escaped here are
    // literal characters, not markup.
    return decodeHTML(stripped).replace(/[<>]/g, '');
  }

  /**
   * Whether sanitizing would change the content.
   *
   * Compares against the sanitizer rather than pattern-matching for danger:
   * the old list of regexes could only flag the shapes someone thought of,
   * and disagreed with what `sanitize()` actually removed.
   */
  isDangerous(html: string): boolean {
    if (!html || typeof html !== 'string') {
      return false;
    }

    return this.sanitize(html, true) !== html;
  }
}
