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
