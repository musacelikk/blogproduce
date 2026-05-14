/**
 * Converts a text string to a URL-friendly slug.
 * - Transliterates Turkish (and other common) characters to ASCII
 * - Lowercases everything
 * - Replaces non-alphanumeric sequences with a single hyphen
 * - Strips leading/trailing hyphens
 * - Truncates to maxLength
 */

const CHAR_MAP: Record<string, string> = {
  // Turkish
  ş: 's', Ş: 's',
  ğ: 'g', Ğ: 'g',
  ü: 'u', Ü: 'u',
  ı: 'i', İ: 'i',
  ö: 'o', Ö: 'o',
  ç: 'c', Ç: 'c',
  // German
  ä: 'a', Ä: 'a',
  ß: 'ss',
  // French / Spanish / Portuguese
  à: 'a', á: 'a', â: 'a', ã: 'a', å: 'a', æ: 'ae',
  è: 'e', é: 'e', ê: 'e', ë: 'e',
  ì: 'i', í: 'i', î: 'i', ï: 'i',
  ò: 'o', ó: 'o', ô: 'o', õ: 'o', ø: 'o',
  ù: 'u', ú: 'u', û: 'u',
  ý: 'y', ÿ: 'y',
  ñ: 'n',
};

export function toSlug(text: string, maxLength = 100): string {
  return text
    .split('')
    .map((ch) => CHAR_MAP[ch] ?? ch)
    .join('')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, maxLength);
}

/**
 * Returns a unique slug by appending an incrementing counter if the base slug
 * is already taken. Pass an `exists` callback that returns true when the given
 * candidate slug is already in use.
 *
 * e.g. "my-post" → "my-post-2" → "my-post-3" …
 */
export async function toUniqueSlug(
  base: string,
  exists: (candidate: string) => Promise<boolean>,
  maxLength = 100,
): Promise<string> {
  const candidate = base.substring(0, maxLength);
  if (!(await exists(candidate))) return candidate;

  for (let i = 2; i <= 999; i++) {
    const suffix = `-${i}`;
    const withSuffix = base.substring(0, maxLength - suffix.length) + suffix;
    if (!(await exists(withSuffix))) return withSuffix;
  }

  // Extremely rare fallback
  return `${base.substring(0, maxLength - 5)}-${Math.random().toString(36).slice(2, 6)}`;
}
