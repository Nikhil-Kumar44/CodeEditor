/**
 * Room ID Generator
 * Generates unique 6-character Room IDs in ABC-123 format
 * - 3 uppercase letters + hyphen + 3 numbers
 * - Excludes confusing characters: O, I (letters), 0, 1 (numbers)
 */

// Safe character sets (excluding confusing characters)
const LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // No I, O
const NUMBERS = '23456789'; // No 0, 1

/**
 * Generate a random Room ID in ABC-123 format
 * @returns Room ID string (e.g., "XYZ-456")
 */
export function generateRoomId(): string {
    // Generate 3 random letters
    const letters = Array.from({ length: 3 }, () =>
        LETTERS[Math.floor(Math.random() * LETTERS.length)]
    ).join('');

    // Generate 3 random numbers
    const numbers = Array.from({ length: 3 }, () =>
        NUMBERS[Math.floor(Math.random() * NUMBERS.length)]
    ).join('');

    return `${letters}-${numbers}`;
}

/**
 * Validate Room ID format
 * Accepts both ABC-123 (new) and 12-character legacy formats
 * @param roomId - Room ID to validate
 * @returns true if valid format, false otherwise
 */
export function validateRoomIdFormat(roomId: string): boolean {
    if (!roomId || typeof roomId !== 'string') {
        return false;
    }

    // Accept new format, legacy format, ObjectIds, etc.
    // Basically just ensure it's a reasonably sized alphanumeric string to prevent abuse, but don't artificially block valid IDs
    const flexibleFormat = /^[a-zA-Z0-9_-]{3,36}$/;

    return flexibleFormat.test(roomId);
}

/**
 * Normalize Room ID (trim whitespace, preserve case for legacy IDs)
 * @param roomId - Room ID to normalize
 * @returns Normalized Room ID
 */
export function normalizeRoomId(roomId: string): string {
    return roomId.trim();
}

/**
 * Check if a Room ID contains confusing characters
 * @param roomId - Room ID to check
 * @returns true if contains confusing characters
 */
export function hasConfusingCharacters(roomId: string): boolean {
    const confusingChars = /[OI01]/i;
    return confusingChars.test(roomId);
}
