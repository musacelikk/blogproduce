/**
 * Cursor-based pagination utilities
 * 
 * Cursor format: base64(JSON({ timestamp, id }))
 * This ensures stable pagination even when new items are added
 */

export interface CursorData {
  timestamp: string; // ISO 8601 timestamp
  id: string; // Post ID
}

/**
 * Encode cursor from timestamp and ID
 */
export function encodeCursor(timestamp: Date | string, id: string): string {
  const cursorData: CursorData = {
    timestamp: timestamp instanceof Date ? timestamp.toISOString() : timestamp,
    id,
  };
  return Buffer.from(JSON.stringify(cursorData)).toString('base64');
}

/**
 * Decode cursor to timestamp and ID
 */
export function decodeCursor(cursor: string): CursorData | null {
  try {
    const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
    const data = JSON.parse(decoded) as CursorData;
    
    // Validate cursor format
    if (!data.timestamp || !data.id) {
      return null;
    }
    
    return data;
  } catch (error) {
    return null;
  }
}

/**
 * Validate cursor format
 */
export function isValidCursor(cursor: string): boolean {
  return decodeCursor(cursor) !== null;
}

