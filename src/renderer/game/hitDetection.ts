import type { Note, HitResult } from '../../shared/types';

const PERFECT_WINDOW = 0.05;  // ±50ms = 0.05 seconds
const GOOD_WINDOW = 0.1;       // ±100ms = 0.1 seconds

export function checkHit(
  note: Note,
  currentTime: number
): HitResult {
  const timeDifference = Math.abs(currentTime - note.timestamp);

  if (timeDifference <= PERFECT_WINDOW) {
    return 'perfect';
  } else if (timeDifference <= GOOD_WINDOW) {
    return 'good';
  } else {
    return 'miss';
  }
}

export function calculateAccuracy(hits: number, misses: number): number {
  const totalNotes = hits + misses;
  if (totalNotes === 0) return 100;
  return (hits / totalNotes) * 100;
}

// Check if a hold note's initial press is within timing window
// Uses same logic as checkHit (tap), returns perfect/good/miss for the initial press
export function checkHoldStart(note: Note, currentTime: number): HitResult {
  return checkHit(note, currentTime);
}

// Check if a hold note was held long enough
// Returns true if currentTime >= note.timestamp + note.duration
export function checkHoldComplete(note: Note, currentTime: number): boolean {
  const endTime = note.timestamp + (note.duration ?? 0);
  return currentTime >= endTime;
}

// Find a hold note in the hit zone that hasn't been activated yet
export function findHoldNoteInHitZone(
  notes: Note[],
  lane: 'left' | 'right',
  currentTime: number
): Note | null {
  return notes.find((note) => {
    return (
      note.type === 'hold' &&
      note.lane === lane &&
      Math.abs(currentTime - note.timestamp) <= GOOD_WINDOW
    );
  }) || null;
}

export function findNoteInHitZone(
  notes: Note[],
  lane: 'left' | 'right',
  currentTime: number
): Note | null {
  return notes.find((note) => {
    return (
      note.lane === lane &&
      Math.abs(currentTime - note.timestamp) <= GOOD_WINDOW
    );
  }) || null;
}
