import { decodeCursor, encodeCursor, isValidCursor } from './cursor.util';

describe('cursor.util', () => {
  const timestamp = new Date('2026-08-04T10:12:00.000Z');
  const id = '9c8d7e6f-1234-4321-abcd-000000000001';

  it('round-trips a timestamp and id', () => {
    const decoded = decodeCursor(encodeCursor(timestamp, id));
    expect(decoded).toEqual({ timestamp: timestamp.toISOString(), id });
  });

  it('rejects a malformed cursor instead of producing an Invalid Date', () => {
    // A bad cursor used to reach the query as `Invalid Date` and surface as a 500.
    expect(decodeCursor('not-a-cursor')).toBeNull();
    expect(decodeCursor('')).toBeNull();
    expect(isValidCursor('%%%')).toBe(false);
  });

  it('rejects a well-formed cursor carrying an unparseable timestamp', () => {
    const cursor = Buffer.from(JSON.stringify({ timestamp: 'yesterday', id })).toString('base64');
    expect(decodeCursor(cursor)).toBeNull();
  });

  it('rejects a cursor missing the id tiebreaker', () => {
    const cursor = Buffer.from(JSON.stringify({ timestamp: timestamp.toISOString() })).toString(
      'base64',
    );
    expect(decodeCursor(cursor)).toBeNull();
  });
});
