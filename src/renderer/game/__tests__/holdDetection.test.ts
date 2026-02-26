import { describe, it, expect } from 'vitest';
import { checkHoldStart, checkHoldComplete, findHoldNoteInHitZone } from '../hitDetection';
import type { Note } from '../../../shared/types';

const makeHoldNote = (
  timestamp: number,
  duration: number,
  lane: 'left' | 'right' = 'left'
): Note => ({
  timestamp,
  lane,
  type: 'hold',
  duration,
});

const makeTapNote = (timestamp: number, lane: 'left' | 'right' = 'left'): Note => ({
  timestamp,
  lane,
  type: 'tap',
});

// Suite 1: checkHoldStart — Initial Press Timing
describe('checkHoldStart', () => {
  it('returns perfect for exact press at timestamp', () => {
    expect(checkHoldStart(makeHoldNote(5.0, 1.0), 5.0)).toBe('perfect');
  });

  it('returns perfect at +49ms', () => {
    expect(checkHoldStart(makeHoldNote(5.0, 1.0), 5.049)).toBe('perfect');
  });

  it('returns perfect at +50ms boundary', () => {
    expect(checkHoldStart(makeHoldNote(5.0, 1.0), 5.05)).toBe('perfect');
  });

  it('returns good at +51ms', () => {
    expect(checkHoldStart(makeHoldNote(5.0, 1.0), 5.051)).toBe('good');
  });

  it('returns good at +100ms boundary', () => {
    expect(checkHoldStart(makeHoldNote(5.0, 1.0), 5.1)).toBe('good');
  });

  it('returns miss at +101ms', () => {
    expect(checkHoldStart(makeHoldNote(5.0, 1.0), 5.101)).toBe('miss');
  });

  it('returns perfect at -50ms boundary', () => {
    expect(checkHoldStart(makeHoldNote(5.0, 1.0), 4.95)).toBe('perfect');
  });

  it('returns good at -51ms', () => {
    expect(checkHoldStart(makeHoldNote(5.0, 1.0), 4.949)).toBe('good');
  });
});

// Suite 2: checkHoldComplete — Duration Validation
describe('checkHoldComplete', () => {
  it('returns true when released exactly at timestamp + duration', () => {
    expect(checkHoldComplete(makeHoldNote(5.0, 1.0), 6.0)).toBe(true);
  });

  it('returns true when released 1ms after end', () => {
    expect(checkHoldComplete(makeHoldNote(5.0, 1.0), 6.001)).toBe(true);
  });

  it('returns true when held 100ms past end (no penalty)', () => {
    expect(checkHoldComplete(makeHoldNote(5.0, 1.0), 6.1)).toBe(true);
  });

  it('returns false when released 1ms before end', () => {
    expect(checkHoldComplete(makeHoldNote(5.0, 1.0), 5.999)).toBe(false);
  });

  it('returns false when released at start timestamp (0 hold time)', () => {
    expect(checkHoldComplete(makeHoldNote(5.0, 1.0), 5.0)).toBe(false);
  });

  it('returns true for hold note with 0 duration (completes immediately)', () => {
    expect(checkHoldComplete(makeHoldNote(5.0, 0), 5.0)).toBe(true);
  });

  it('handles long duration (2s hold)', () => {
    expect(checkHoldComplete(makeHoldNote(5.0, 2.0), 7.0)).toBe(true);
    expect(checkHoldComplete(makeHoldNote(5.0, 2.0), 6.999)).toBe(false);
  });

  it('handles fractional duration (1.5s hold)', () => {
    expect(checkHoldComplete(makeHoldNote(5.0, 1.5), 6.5)).toBe(true);
    expect(checkHoldComplete(makeHoldNote(5.0, 1.5), 6.499)).toBe(false);
  });
});

// Suite 3: findHoldNoteInHitZone — Hold Note Discovery
describe('findHoldNoteInHitZone', () => {
  it('returns hold note when in range and correct lane', () => {
    const note = makeHoldNote(5.0, 1.0, 'left');
    expect(findHoldNoteInHitZone([note], 'left', 5.0)).toBe(note);
  });

  it('returns null when note is tap type (not hold)', () => {
    const note = makeTapNote(5.0, 'left');
    expect(findHoldNoteInHitZone([note], 'left', 5.0)).toBeNull();
  });

  it('returns null when note is in wrong lane', () => {
    const note = makeHoldNote(5.0, 1.0, 'left');
    expect(findHoldNoteInHitZone([note], 'right', 5.0)).toBeNull();
  });

  it('returns null when no notes exist', () => {
    expect(findHoldNoteInHitZone([], 'left', 5.0)).toBeNull();
  });

  it('returns null when hold note is out of timing range', () => {
    const note = makeHoldNote(5.0, 1.0, 'left');
    expect(findHoldNoteInHitZone([note], 'left', 6.0)).toBeNull();
  });

  it('returns hold note at timing boundary (+100ms)', () => {
    const note = makeHoldNote(5.0, 1.0, 'left');
    expect(findHoldNoteInHitZone([note], 'left', 5.1)).toBe(note);
  });

  it('returns null just outside timing boundary (+101ms)', () => {
    const note = makeHoldNote(5.0, 1.0, 'left');
    expect(findHoldNoteInHitZone([note], 'left', 5.101)).toBeNull();
  });
});

// Suite 4: Hold Note Lifecycle Integration
describe('hold note lifecycle', () => {
  it('full lifecycle: press within window → hold → release after duration → success', () => {
    const note = makeHoldNote(5.0, 1.0, 'left');

    // Step 1: Find the note in hit zone
    const found = findHoldNoteInHitZone([note], 'left', 5.0);
    expect(found).toBe(note);

    // Step 2: Check initial press timing
    const startResult = checkHoldStart(note, 5.0);
    expect(startResult).toBe('perfect');

    // Step 3: Hold until duration ends → complete
    const isComplete = checkHoldComplete(note, 6.0);
    expect(isComplete).toBe(true);
  });

  it('early release: press → release before duration → miss', () => {
    const note = makeHoldNote(5.0, 1.0, 'left');

    const startResult = checkHoldStart(note, 5.0);
    expect(startResult).toBe('perfect');

    // Release too early
    const isComplete = checkHoldComplete(note, 5.5);
    expect(isComplete).toBe(false);
  });

  it('never pressed: hold note passes hit zone → not found', () => {
    const note = makeHoldNote(5.0, 1.0, 'left');

    // Note is far past hit zone
    const found = findHoldNoteInHitZone([note], 'left', 6.5);
    expect(found).toBeNull();
  });

  it('press timing: initial press classified correctly as good', () => {
    const note = makeHoldNote(5.0, 1.5, 'right');

    // Find at +80ms (within good window but not perfect)
    const found = findHoldNoteInHitZone([note], 'right', 5.08);
    expect(found).toBe(note);

    const startResult = checkHoldStart(note, 5.08);
    expect(startResult).toBe('good');

    // Still completes if held long enough
    const isComplete = checkHoldComplete(note, 6.5);
    expect(isComplete).toBe(true);
  });
});
