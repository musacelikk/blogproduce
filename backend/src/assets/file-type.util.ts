/**
 * Content-type detection from magic bytes.
 *
 * The `Content-Type` on a multipart upload is supplied by the client and can say
 * anything. Storing a file under a claimed type is how an HTML or SVG payload
 * ends up served from our own asset domain, where it executes with that origin's
 * privileges — stored XSS. So the bytes decide, and the claimed header is only
 * used as a cheap first filter.
 *
 * Written by hand rather than pulled from `file-type`: that package is ESM-only
 * in current versions and would fail `require()` under this CommonJS build, the
 * same trap that made `marked` v18 crash the backend at startup.
 */

export interface DetectedType {
  mime: string;
  ext: string;
}

/**
 * SVG is deliberately absent. It is an XML document that may carry <script> and
 * event handlers, so a "safe image" upload of an SVG is a stored XSS primitive.
 * Accept it only behind sanitisation and a separate serving origin.
 */
export const ALLOWED_UPLOAD_MIMES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
  'video/mp4',
  'video/webm',
  'application/pdf',
];

export function isAllowedUpload(mime: string): boolean {
  return ALLOWED_UPLOAD_MIMES.includes(mime);
}

function startsWith(buffer: Buffer, bytes: number[], offset = 0): boolean {
  if (buffer.length < offset + bytes.length) return false;
  return bytes.every((byte, i) => buffer[offset + i] === byte);
}

export function detectFileType(buffer: Buffer): DetectedType | null {
  if (!buffer || buffer.length < 12) return null;

  // JPEG — FF D8 FF
  if (startsWith(buffer, [0xff, 0xd8, 0xff])) return { mime: 'image/jpeg', ext: 'jpg' };

  // PNG — 89 50 4E 47 0D 0A 1A 0A
  if (startsWith(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return { mime: 'image/png', ext: 'png' };
  }

  // GIF — "GIF87a" / "GIF89a"
  if (startsWith(buffer, [0x47, 0x49, 0x46, 0x38])) return { mime: 'image/gif', ext: 'gif' };

  // PDF — "%PDF"
  if (startsWith(buffer, [0x25, 0x50, 0x44, 0x46])) {
    return { mime: 'application/pdf', ext: 'pdf' };
  }

  // RIFF container: "RIFF" then a 4-byte size then the form type at offset 8.
  if (startsWith(buffer, [0x52, 0x49, 0x46, 0x46])) {
    if (startsWith(buffer, [0x57, 0x45, 0x42, 0x50], 8)) {
      return { mime: 'image/webp', ext: 'webp' };
    }
    return null;
  }

  // ISO base media (MP4/AVIF/HEIF): a 4-byte box size, then "ftyp", then a brand.
  if (startsWith(buffer, [0x66, 0x74, 0x79, 0x70], 4)) {
    const brand = buffer.subarray(8, 12).toString('latin1');
    if (brand === 'avif' || brand === 'avis') return { mime: 'image/avif', ext: 'avif' };
    // isom/mp41/mp42/M4V/dash all describe MP4 video.
    if (/^(isom|mp4[12]|M4V |dash|avc1|iso[2456])$/.test(brand)) {
      return { mime: 'video/mp4', ext: 'mp4' };
    }
    return null;
  }

  // Matroska/WebM — EBML header 1A 45 DF A3. Both share it, so look for the
  // "webm" doctype in the header region rather than assuming.
  if (startsWith(buffer, [0x1a, 0x45, 0xdf, 0xa3])) {
    const header = buffer.subarray(0, Math.min(buffer.length, 64)).toString('latin1');
    if (header.includes('webm')) return { mime: 'video/webm', ext: 'webm' };
    return null;
  }

  return null;
}
