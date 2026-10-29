/**
 * Prompt architecture for the multi-stage blog generation pipeline:
 *   1. outline  — plan the article (angle, search intent, section-by-section brief)
 *   2. draft    — write the full article from the brief
 *   3. polish   — ruthless editor pass (only for pro/premium tiers)
 */

export interface BlogPromptInput {
  topic: string;
  language?: string; // ISO code, defaults to 'tr'
  tone?: string;
  length?: string; // short | medium | long
  targetAudience?: string;
  additionalContext?: string;
  seoMode?: boolean;
  keywords?: string[];
  outline?: string;
  /**
   * Other articles already published on the same site, for internal linking.
   * Resolved by the worker at generation time, so every generation path — the
   * dashboard, the partner API and autopilot — gets links without each one
   * having to pass them along.
   */
  relatedPosts?: Array<{ title: string; slug: string }>;
}

const LANGUAGE_NAMES: Record<string, string> = {
  tr: 'Turkish',
  en: 'English',
  de: 'German',
  fr: 'French',
  es: 'Spanish',
  it: 'Italian',
  pt: 'Portuguese',
  ru: 'Russian',
  ar: 'Arabic',
  ja: 'Japanese',
  ko: 'Korean',
  zh: 'Chinese',
  nl: 'Dutch',
  pl: 'Polish',
  sv: 'Swedish',
  da: 'Danish',
  no: 'Norwegian',
  fi: 'Finnish',
  cs: 'Czech',
  hu: 'Hungarian',
  ro: 'Romanian',
  el: 'Greek',
  he: 'Hebrew',
  hi: 'Hindi',
  th: 'Thai',
  vi: 'Vietnamese',
  id: 'Indonesian',
  ms: 'Malay',
  uk: 'Ukrainian',
  bg: 'Bulgarian',
  hr: 'Croatian',
  sk: 'Slovak',
  sl: 'Slovenian',
  et: 'Estonian',
  lv: 'Latvian',
  lt: 'Lithuanian',
};

export function resolveLanguageName(language?: unknown): string {
  let code = language;
  if (code && typeof code === 'object') {
    code = (code as any).value ?? code;
  }
  const normalized = typeof code === 'string' && code.trim() ? code.trim().toLowerCase() : 'tr';
  return LANGUAGE_NAMES[normalized] || LANGUAGE_NAMES.tr;
}

const LENGTH_TARGETS: Record<string, string> = {
  short: '600-900 words',
  medium: '1100-1500 words',
  long: '1800-2600 words',
};

export function resolveLengthTarget(length?: string): string {
  return LENGTH_TARGETS[(length || 'medium').toLowerCase()] || LENGTH_TARGETS.medium;
}

/** Shared writer persona + quality bar. Used in the draft and polish stages. */
export function buildWriterSystemPrompt(input: BlogPromptInput): string {
  const languageName = resolveLanguageName(input.language);
  const tone = input.tone || 'professional';

  const parts: string[] = [];

  parts.push(
    'You are a senior content writer and editor at a top-tier publication, with deep expertise in ' +
      'SEO and conversion-focused writing. Your articles are known for being genuinely useful: ' +
      'specific, concrete, and written for humans first.',
  );

  parts.push(
    `LANGUAGE: Write the ENTIRE output in ${languageName} — every heading, paragraph, FAQ entry, and metadata field. ` +
      'Keep proper nouns and established technical terms in their conventional form.',
  );

  parts.push(
    `TONE: ${tone}. Keep it consistent throughout, but never robotic — vary sentence length and rhythm.`,
  );

  parts.push(
    'QUALITY BAR:\n' +
      '- Open with a hook that earns attention in the first two sentences: a surprising fact, a sharp question, a concrete scenario, or a bold claim. Never open with generic filler ("In today\'s fast-paced world...", "Günümüzde...", "Teknolojinin gelişmesiyle...").\n' +
      '- Every section must deliver something the reader can use: a concrete example, a number, a step-by-step, a comparison, or a decision rule. If a paragraph could appear in any article on any topic, delete it.\n' +
      '- Use specific details over abstractions. "%40 daha hızlı" beats "çok daha hızlı"; a named scenario beats "birçok durumda". When you use figures, keep them plausible and clearly framed as typical/illustrative — never fabricate precise statistics attributed to a named study or institution.\n' +
      '- Avoid AI clichés and filler in every language: "delve", "unlock the power", "game-changer", "in the ever-evolving landscape", "önemli bir rol oynamaktadır", "büyük önem taşımaktadır", "sonuç olarak diyebiliriz ki". Say the thing directly instead.\n' +
      '- Short paragraphs (2-4 sentences). Use bulleted or numbered lists where they genuinely aid scanning, and Markdown tables for comparisons.\n' +
      '- Close with a conclusion that synthesizes (not summarizes) and gives the reader a clear next step.',
  );

  parts.push(
    'STRUCTURE:\n' +
      '- Exactly one H1 (the title). Logical H2 sections; H3 subsections only where needed.\n' +
      '- Headings are informative and specific, not generic ("Neden Önemli?" → name the actual benefit).\n' +
      '- The article must be complete and self-contained — no placeholders, no "[örnek ekleyin]", no TODO markers.',
  );

  if (input.seoMode) {
    parts.push(
      'SEO REQUIREMENTS:\n' +
        '- Identify the primary keyword from the topic and use it naturally in the H1, the first 100 words, and at least one H2. No keyword stuffing — semantic variants are better than repetition.\n' +
        '- metaTitle: max ~60 characters, primary keyword near the front, compelling.\n' +
        '- metaDescription: 140-160 characters with a concrete reason to click.\n' +
        '- FAQ answers long-tail questions searchers actually type — each answer is 2-4 sentences and standalone.\n' +
        '- The slug is short, ASCII kebab-case, in the article language (transliterate Turkish characters: ı→i, ş→s, ğ→g, ü→u, ö→o, ç→c).',
    );
  }

  if (input.relatedPosts?.length) {
    parts.push(
      'INTERNAL LINKS: You will be given other articles already published on this site. ' +
        'Link to two or three of them from the body, in Markdown, where the sentence genuinely ' +
        'calls for it — a reader following the link should find what the sentence promised. ' +
        'Write the anchor text as part of the prose; never append a "related posts" list, never ' +
        'link the same article twice, and never force a link into a section it does not belong in. ' +
        'Use the exact paths given; do not invent slugs. If none of them fit, link none.',
    );
  }

  parts.push(
    'OUTPUT CONTRACT: Return a single JSON object matching the provided schema. ' +
      '"content" holds the complete article in Markdown starting with exactly one H1 line. ' +
      '"metadata.toc" mirrors the H2/H3 headings with kebab-case ids. ' +
      'Return nothing outside the JSON object.',
  );

  return parts.join('\n\n');
}

/** Stage 1 — outline/brief. Run on a fast model; output is a loose JSON brief. */
export function buildOutlinePrompt(input: BlogPromptInput): { system: string; user: string } {
  const languageName = resolveLanguageName(input.language);
  const lengthTarget = resolveLengthTarget(input.length);

  const system =
    'You are an editorial strategist planning a blog article. You think about search intent, ' +
    'what the reader actually needs, and what would make this article better than the top results. ' +
    'Respond with a single JSON object only — no prose, no code fences.';

  let user = `Plan a blog article about: "${input.topic}"\n\n`;
  user += `Article language: ${languageName} (write the plan itself in ${languageName})\n`;
  user += `Target length: ${lengthTarget}\n`;
  if (input.targetAudience) user += `Target audience: ${input.targetAudience}\n`;
  if (input.tone) user += `Tone: ${input.tone}\n`;
  if (input.additionalContext)
    user += `\nAdditional context from the client:\n${input.additionalContext}\n`;
  if (input.keywords?.length)
    user += `Target keywords to work in naturally: ${input.keywords.join(', ')}\n`;
  if (input.outline)
    user += `\nThe client supplied this outline — follow its structure:\n${input.outline}\n`;

  user +=
    '\nReturn a JSON object with exactly these fields:\n' +
    '{\n' +
    '  "workingTitle": "specific, curiosity-driving title",\n' +
    '  "angle": "the one-sentence unique angle that differentiates this article",\n' +
    '  "searchIntent": "what the reader is really trying to achieve",\n' +
    '  "primaryKeyword": "main keyword phrase",\n' +
    '  "secondaryKeywords": ["3-6 semantic variants"],\n' +
    '  "sections": [ { "heading": "H2 heading", "goal": "what this section must deliver", "keyPoints": ["2-4 concrete points, examples or data to include"] } ],\n' +
    '  "faqCandidates": ["4-6 long-tail questions searchers ask"],\n' +
    '  "pitfallsToAvoid": ["clichés or weak angles to avoid for this specific topic"]\n' +
    '}';

  return { system, user };
}

/** Stage 2 — full draft from the brief. */
export function buildDraftPrompt(
  input: BlogPromptInput,
  outlineJson: string | null,
): { system: string; user: string } {
  const system = buildWriterSystemPrompt(input);
  const lengthTarget = resolveLengthTarget(input.length);

  let user = `Write the complete blog article about: "${input.topic}"\n\n`;
  user += `Length target: ${lengthTarget} (respect this — do not under-deliver)\n`;
  if (input.targetAudience) user += `Target audience: ${input.targetAudience}\n`;
  if (input.additionalContext)
    user += `\nAdditional context from the client (respect any brand/product facts given here):\n${input.additionalContext}\n`;
  if (input.keywords?.length) {
    user += `Target keywords (use naturally, never stuff): ${input.keywords.join(', ')}\n`;
  }
  if (input.outline) {
    user += `\nThe client supplied this outline — follow its structure:\n${input.outline}\n`;
  }

  if (input.relatedPosts?.length) {
    user +=
      `\nAlready published on this site — link to the two or three that genuinely fit:\n` +
      input.relatedPosts.map((p) => `- ${p.title} → /blog/${p.slug}`).join('\n') +
      '\n';
  }

  if (outlineJson) {
    user +=
      `\nAn editorial brief was prepared for this article. Follow its angle and structure, ` +
      `but improve on it wherever you can write something stronger:\n${outlineJson}\n`;
  }

  user += '\nReturn the single JSON object now.';

  return { system, user };
}

/** Stage 3 — editor pass. Takes the draft JSON and returns an improved article in the same schema. */
export function buildPolishPrompt(
  input: BlogPromptInput,
  draftJson: string,
): { system: string; user: string } {
  const system = buildWriterSystemPrompt(input);

  let user =
    'You are now acting as a ruthless senior editor reviewing the draft below. ' +
    'Improve it decisively — do not change the topic, language, or core structure.\n\n';

  user +=
    'EDIT CHECKLIST:\n' +
    '1. Hook: does the intro earn attention in two sentences? If not, rewrite it.\n' +
    '2. Specificity: replace every vague claim with a concrete example, number, or scenario.\n' +
    '3. Cut: delete filler sentences, repeated ideas, and AI clichés. Tighter is better.\n' +
    '4. Flow: each section must connect to the next; fix abrupt transitions.\n' +
    '5. Headings: make generic headings specific and benefit-driven.\n' +
    '6. Conclusion: synthesize and end with a clear next step, not a summary of what was said.\n' +
    '7. Metadata: verify metaTitle ≤ 60 chars, metaDescription 140-160 chars, toc matches the final headings, FAQ answers are standalone.\n\n';

  user += `THE DRAFT (JSON):\n${draftJson}\n\n`;
  user +=
    'Return the improved article as a single JSON object in the same schema. Return nothing else.';

  return { system, user };
}
