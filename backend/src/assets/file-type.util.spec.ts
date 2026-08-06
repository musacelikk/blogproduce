import { detectFileType, isAllowedUpload } from './file-type.util';

/** Builds a buffer from magic bytes plus filler, so length checks are satisfied. */
function withMagic(bytes: number[], length = 64): Buffer {
  const buf = Buffer.alloc(length);
  bytes.forEach((b, i) => (buf[i] = b));
  return buf;
}

function isoBmff(brand: string): Buffer {
  const buf = Buffer.alloc(64);
  buf.write('ftyp', 4, 'latin1');
  buf.write(brand, 8, 'latin1');
  return buf;
}

describe('detectFileType', () => {
  it('identifies the image formats we accept', () => {
    expect(detectFileType(withMagic([0xff, 0xd8, 0xff]))?.mime).toBe('image/jpeg');
    expect(
      detectFileType(withMagic([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))?.mime,
    ).toBe('image/png');
    expect(detectFileType(withMagic([0x47, 0x49, 0x46, 0x38]))?.mime).toBe('image/gif');
    expect(detectFileType(isoBmff('avif'))?.mime).toBe('image/avif');
  });

  it('distinguishes WebP from other RIFF containers', () => {
    const webp = Buffer.alloc(64);
    webp.write('RIFF', 0, 'latin1');
    webp.write('WEBP', 8, 'latin1');
    expect(detectFileType(webp)?.mime).toBe('image/webp');

    // A RIFF WAVE is not an upload we accept, and must not pass as WebP.
    const wave = Buffer.alloc(64);
    wave.write('RIFF', 0, 'latin1');
    wave.write('WAVE', 8, 'latin1');
    expect(detectFileType(wave)).toBeNull();
  });

  it('distinguishes WebM from Matroska, which share an EBML header', () => {
    const webm = Buffer.alloc(64);
    [0x1a, 0x45, 0xdf, 0xa3].forEach((b, i) => (webm[i] = b));
    webm.write('webm', 30, 'latin1');
    expect(detectFileType(webm)?.mime).toBe('video/webm');

    const mkv = Buffer.alloc(64);
    [0x1a, 0x45, 0xdf, 0xa3].forEach((b, i) => (mkv[i] = b));
    mkv.write('matroska', 30, 'latin1');
    expect(detectFileType(mkv)).toBeNull();
  });

  /**
   * The attack this exists to stop: a script-bearing SVG or HTML file uploaded
   * with `Content-Type: image/png`. Served back from our asset domain it would
   * execute in that origin, so detection must refuse it on content alone.
   */
  it('refuses SVG and HTML however they are labelled', () => {
    const svg = Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
    );
    expect(detectFileType(svg)).toBeNull();
    expect(isAllowedUpload('image/svg+xml')).toBe(false);

    const html = Buffer.from('<!DOCTYPE html><html><script>alert(1)</script></html>');
    expect(detectFileType(html)).toBeNull();
  });

  it('refuses a payload whose bytes do not match any accepted format', () => {
    expect(detectFileType(Buffer.from('#!/bin/sh\nrm -rf /\n'.padEnd(64)))).toBeNull();
    expect(detectFileType(Buffer.alloc(4))).toBeNull();
    expect(detectFileType(Buffer.alloc(0))).toBeNull();
  });

  it('does not treat a polyglot prefix as an accepted type', () => {
    // GIF magic followed by script content — accepted as a GIF by extension
    // checks, but detection reports GIF, which is what actually gets stored and
    // is inert when served as image/gif.
    const polyglot = Buffer.concat([
      Buffer.from([0x47, 0x49, 0x46, 0x38]),
      Buffer.from('<script>alert(1)</script>'.padEnd(60)),
    ]);
    expect(detectFileType(polyglot)?.mime).toBe('image/gif');
  });
});
