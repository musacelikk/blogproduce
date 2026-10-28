import { resolveLanguageName } from '../ai/blog-prompts';

export interface TopicPlanInput {
  /** Site identity — the "understand the project" inputs. */
  siteName: string;
  siteDomain?: string | null;
  siteDescription?: string | null;
  niche?: string | null;
  targetAudience?: string | null;
  /** Seed keywords to build coverage around. */
  keywords?: string[];
  /** Topics to stay away from. */
  excludedTopics?: string[];
  /** Titles already published or already planned — must not be repeated. */
  existingTitles?: string[];
  language?: string;
  count: number;
}

const MAX_EXISTING_TITLES_IN_PROMPT = 60;

/**
 * The planner is deliberately given the *entire* batch to produce in one call.
 * Asking for topics one at a time costs an order of magnitude more and produces
 * worse spread — the model cannot avoid overlap it cannot see.
 */
export function buildTopicPlanPrompt(input: TopicPlanInput): { system: string; user: string } {
  const languageName = resolveLanguageName(input.language);

  const system = [
    `You are a content strategist planning an editorial calendar for a specific website.`,
    `Write every title and angle in ${languageName}.`,
    '',
    'Rules:',
    `- Produce exactly ${input.count} topics. No more, no fewer.`,
    '- Each topic must be a concrete article someone would search for and click, not a category or a theme. "Nasıl X yapılır: 5 adımda rehber" is an article; "X hakkında" is not.',
    '- Spread the batch across the funnel: some beginner/definitional, some comparison or decision-stage, some advanced or opinionated. A batch of twenty beginner guides is a failed batch.',
    '- No two topics may substantially overlap. The `angle` field is where you prove they do not.',
    '- Titles must be plausible for THIS site, derived from its stated business and audience. Generic marketing filler that would fit any site is a failure.',
    '- Never reuse, rephrase, or pluralise a title from the "already covered" list.',
    '- No clickbait, no fabricated statistics in titles, no year numbers unless the topic is genuinely time-bound.',
    '- Titles stay under 90 characters.',
  ].join('\n');

  const lines: string[] = [];
  lines.push(`Site name: ${input.siteName}`);
  if (input.siteDomain) lines.push(`Domain: ${input.siteDomain}`);
  if (input.siteDescription) lines.push(`What the site does: ${input.siteDescription}`);
  if (input.niche) lines.push(`Niche / sector: ${input.niche}`);
  if (input.targetAudience) lines.push(`Target audience: ${input.targetAudience}`);

  if (input.keywords?.length) {
    lines.push(`Build coverage around these seed keywords: ${input.keywords.join(', ')}`);
  }
  if (input.excludedTopics?.length) {
    lines.push(`Stay away from these topics entirely: ${input.excludedTopics.join(', ')}`);
  }

  if (input.existingTitles?.length) {
    // Truncated deliberately: the list grows without bound as a site publishes,
    // and the newest titles are the ones a fresh batch is most likely to repeat.
    const shown = input.existingTitles.slice(0, MAX_EXISTING_TITLES_IN_PROMPT);
    lines.push('');
    lines.push('Already covered — do not propose these again, in any wording:');
    lines.push(...shown.map((t) => `- ${t}`));
    if (input.existingTitles.length > shown.length) {
      lines.push(`- …and ${input.existingTitles.length - shown.length} more older articles.`);
    }
  }

  lines.push('');
  lines.push(
    `Plan ${input.count} articles for this site. Order them most valuable first — the earlier a topic appears, the sooner it will be written.`,
  );

  return { system, user: lines.join('\n') };
}
