/**
 * Tolerant JSON extraction from a model response.
 *
 * Even with strict structured outputs a provider can wrap the object in a code
 * fence or a sentence of prose, so a bare `JSON.parse` is not enough on its own.
 */
export function extractJson<T = any>(raw: string): T | null {
  if (!raw) return null;

  const cleaned = raw.replace(/```(?:json)?/gi, '').trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start !== -1 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1)) as T;
      } catch {
        return null;
      }
    }
    return null;
  }
}
