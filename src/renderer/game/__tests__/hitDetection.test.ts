import { describe, it, expect } from 'vitest';
import { checkHit, findNoteInHitZone, calculateAccuracy } from '../hitDetection';
import type { Note } from '../../../shared/types';

const makeNote = (timestamp: number, lane: 'left' | 'right' = 'left'): Note => ({
  timestamp,
  lane,
  type: 'tap',
});

// Suite 1: checkHit — Timing Window Classification (Property 1)
describe('checkHit', () => {
  it('returns perfect for exact hit (0ms offset)', () => {
    expect(checkHit(makeNote(5.0), 5.0)).toBe('perfect');
  });

  it('returns perfect at -49ms (early perfect)', () => {
    expect(checkHit(makeNote(5.0), 4.951)).toBe('perfect');
  });

  it('returns perfect at +49ms (late perfect)', () => {
    expect(checkHit(makeNote(5.0), 5.049)).toBe('perfect');
  });

  it('returns perfect at +50ms boundary (exact)', () => {
    expect(checkHit(makeNote(5.0), 5.05)).toBe('perfect');
  });

  it('returns perfect at -50ms boundary (exact)', () => {
    expect(checkHit(makeNote(5.0), 4.95)).toBe('perfect');
  });

  it('returns good at -51ms (early good)', () => {
    expect(checkHit(makeNote(5.0), 4.949)).toBe('good');
  });

  it('returns good at +51ms (late good)', () => {
    expect(checkHit(makeNote(5.0), 5.051)).toBe('good');
  });

  it('returns good at +100ms boundary (exact)', () => {
    expect(checkHit(makeNote(5.0), 5.1)).toBe('good');
  });

  it('returns good at -100ms boundary (exact)', () => {
    expect(checkHit(makeNote(5.0), 4.9)).toBe('good');
  });

  it('returns miss at -101ms (early miss)', () => {
    expect(checkHit(makeNote(5.0), 4.899)).toBe('miss');
  });

  it('returns miss at +101ms (late miss)', () => {
    expect(checkHit(makeNote(5.0), 5.101)).toBe('miss');
  });

  it('returns miss at +500ms (far miss)', () => {
    expect(checkHit(makeNote(5.0), 5.5)).toBe('miss');
  });

  it('returns miss at -1000ms (very far miss)', () => {
    expect(checkHit(makeNote(5.0), 4.0)).toBe('miss');
  });
});

// Suite 2: findNoteInHitZone — Note Discovery
describe('findNoteInHitZone', () => {
  it('returns note when in range and correct lane', () => {
    const note = makeNote(5.0, 'left');
    expect(findNoteInHitZone([note], 'left', 5.0)).toBe(note);
  });

  it('returns null when note is in wrong lane', () => {
    const note = makeNote(5.0, 'left');
    expect(findNoteInHitZone([note], 'right', 5.0)).toBeNull();
  });

  it('returns null when no notes exist', () => {
    expect(findNoteInHitZone([], 'left', 5.0)).toBeNull();
  });

  it('returns null when note is out of range', () => {
    const note = makeNote(5.0, 'left');
    expect(findNoteInHitZone([note], 'left', 6.0)).toBeNull();
  });

  it('returns first matching note when multiple notes in range', () => {
    const note1 = makeNote(5.0, 'left');
    const note2 = makeNote(5.05, 'left');
    expect(findNoteInHitZone([note1, note2], 'left', 5.0)).toBe(note1);
  });

  it('returns correct lane note when simultaneous notes in different lanes', () => {
    const leftNote = makeNote(5.0, 'left');
    const rightNote = makeNote(5.0, 'right');
    expect(findNoteInHitZone([leftNote, rightNote], 'left', 5.0)).toBe(leftNote);
    expect(findNoteInHitZone([leftNote, rightNote], 'right', 5.0)).toBe(rightNote);
  });
});

// Suite 3: calculateAccuracy — Accuracy Percentage (Property 6)
describe('calculateAccuracy', () => {
  it('returns 100 for perfect score (10 hits, 0 misses)', () => {
    expect(calculateAccuracy(10, 0)).toBe(100);
  });

  it('returns 0 for all misses (0 hits, 10 misses)', () => {
    expect(calculateAccuracy(0, 10)).toBe(0);
  });

  it('returns 80 for 8 hits and 2 misses', () => {
    expect(calculateAccuracy(8, 2)).toBe(80);
  });

  it('returns ~77.78 for 7 hits and 2 misses', () => {
    expect(calculateAccuracy(7, 2)).toBeCloseTo(77.778, 1);
  });

  it('returns 100 for single hit', () => {
    expect(calculateAccuracy(1, 0)).toBe(100);
  });

  it('returns 0 for single miss', () => {
    expect(calculateAccuracy(0, 1)).toBe(0);
  });

  it('returns 100 when no notes processed yet', () => {
    expect(calculateAccuracy(0, 0)).toBe(100);
  });

  it('returns 99.9 for large numbers (999 hits, 1 miss)', () => {
    expect(calculateAccuracy(999, 1)).toBe(99.9);
  });
});

// Suite 9: Simultaneous Notes (Property 8)
describe('simultaneous notes', () => {
  const leftNote = makeNote(5.0, 'left');
  const rightNote = makeNote(5.0, 'right');
  const notes = [leftNote, rightNote];

  it('finds left note when querying left lane', () => {
    expect(findNoteInHitZone(notes, 'left', 5.0)).toBe(leftNote);
  });

  it('finds right note when querying right lane', () => {
    expect(findNoteInHitZone(notes, 'right', 5.0)).toBe(rightNote);
  });

  it('both notes are independently hittable as perfect', () => {
    expect(checkHit(leftNote, 5.0)).toBe('perfect');
    expect(checkHit(rightNote, 5.0)).toBe('perfect');
  });

  it('handles slightly offset simultaneous notes (±100ms apart)', () => {
    const leftAt5 = makeNote(5.0, 'left');
    const rightAt508 = makeNote(5.08, 'right');
    const offsetNotes = [leftAt5, rightAt508];

    expect(findNoteInHitZone(offsetNotes, 'left', 5.0)).toBe(leftAt5);
    expect(findNoteInHitZone(offsetNotes, 'right', 5.08)).toBe(rightAt508);
  });
});
