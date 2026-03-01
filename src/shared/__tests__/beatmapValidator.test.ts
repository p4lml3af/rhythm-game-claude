import { describe, it, expect } from 'vitest';
import { validateBeatmap } from '../beatmapValidator';

function makeBeatmap(overrides: Record<string, unknown> = {}) {
  return {
    songTitle: 'Test Song',
    audioFile: 'audio.mp3',
    bpm: 120,
    duration: 30,
    notes: [
      { timestamp: 3.0, lane: 'left', type: 'tap' },
      { timestamp: 5.0, lane: 'right', type: 'tap' },
    ],
    ...overrides,
  };
}

describe('beatmapValidator', () => {
  it('validates a valid beatmap with tap notes only', () => {
    const result = validateBeatmap(makeBeatmap());
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.stats.totalNotes).toBe(2);
    expect(result.stats.tapNotes).toBe(2);
    expect(result.stats.holdNotes).toBe(0);
  });

  it('validates a valid beatmap with mixed tap/hold', () => {
    const result = validateBeatmap(makeBeatmap({
      notes: [
        { timestamp: 3.0, lane: 'left', type: 'tap' },
        { timestamp: 5.0, lane: 'right', type: 'hold', duration: 1.5 },
        { timestamp: 7.0, lane: 'left', type: 'hold', duration: 1.0 },
        { timestamp: 9.0, lane: 'right', type: 'tap' },
      ],
    }));
    expect(result.valid).toBe(true);
    expect(result.stats.tapNotes).toBe(2);
    expect(result.stats.holdNotes).toBe(2);
  });

  it('rejects missing songTitle', () => {
    const result = validateBeatmap(makeBeatmap({ songTitle: undefined }));
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('songTitle'))).toBe(true);
  });

  it('rejects missing notes array', () => {
    const result = validateBeatmap(makeBeatmap({ notes: 'not an array' }));
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('notes'))).toBe(true);
  });

  it('accepts empty notes array', () => {
    const result = validateBeatmap(makeBeatmap({ notes: [] }));
    expect(result.valid).toBe(true);
    expect(result.stats.totalNotes).toBe(0);
  });

  it('rejects unsorted timestamps', () => {
    const result = validateBeatmap(makeBeatmap({
      notes: [
        { timestamp: 5.0, lane: 'left', type: 'tap' },
        { timestamp: 3.0, lane: 'right', type: 'tap' },
      ],
    }));
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('not sorted'))).toBe(true);
  });

  it('rejects same-lane overlap', () => {
    const result = validateBeatmap(makeBeatmap({
      notes: [
        { timestamp: 3.0, lane: 'left', type: 'tap' },
        { timestamp: 3.1, lane: 'left', type: 'tap' }, // 100ms < 200ms
      ],
    }));
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('same-lane spacing'))).toBe(true);
  });

  it('rejects hold note missing duration', () => {
    const result = validateBeatmap(makeBeatmap({
      notes: [
        { timestamp: 3.0, lane: 'left', type: 'hold' },
      ],
    }));
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('hold note missing'))).toBe(true);
  });

  it('rejects hold note with negative duration', () => {
    const result = validateBeatmap(makeBeatmap({
      notes: [
        { timestamp: 3.0, lane: 'left', type: 'hold', duration: -1 },
      ],
    }));
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('hold note missing or invalid'))).toBe(true);
  });

  it('rejects invalid lane value', () => {
    const result = validateBeatmap(makeBeatmap({
      notes: [
        { timestamp: 3.0, lane: 'center', type: 'tap' },
      ],
    }));
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('invalid "lane"'))).toBe(true);
  });

  it('rejects invalid note type', () => {
    const result = validateBeatmap(makeBeatmap({
      notes: [
        { timestamp: 3.0, lane: 'left', type: 'swipe' },
      ],
    }));
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('invalid "type"'))).toBe(true);
  });

  it('rejects timestamp exceeding song duration', () => {
    const result = validateBeatmap(makeBeatmap({
      duration: 10,
      notes: [
        { timestamp: 15.0, lane: 'left', type: 'tap' },
      ],
    }));
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('exceeds song duration'))).toBe(true);
  });

  it('warns on high density', () => {
    const notes = [];
    for (let i = 0; i < 100; i++) {
      notes.push({ timestamp: 3.0 + i * 0.25, lane: i % 2 === 0 ? 'left' : 'right', type: 'tap' });
    }
    const result = validateBeatmap(makeBeatmap({ duration: 10, notes }));
    expect(result.warnings.some(w => w.includes('High note density'))).toBe(true);
  });

  it('warns when first note has no buffer', () => {
    const result = validateBeatmap(makeBeatmap({
      notes: [
        { timestamp: 0.5, lane: 'left', type: 'tap' },
      ],
    }));
    expect(result.warnings.some(w => w.includes('buffer'))).toBe(true);
  });

  it('calculates stats correctly', () => {
    const result = validateBeatmap(makeBeatmap({
      duration: 20,
      notes: [
        { timestamp: 3.0, lane: 'left', type: 'tap' },
        { timestamp: 4.0, lane: 'right', type: 'hold', duration: 1.0 },
        { timestamp: 6.0, lane: 'left', type: 'tap' },
        { timestamp: 8.0, lane: 'right', type: 'tap' },
      ],
    }));
    expect(result.stats.totalNotes).toBe(4);
    expect(result.stats.tapNotes).toBe(3);
    expect(result.stats.holdNotes).toBe(1);
    expect(result.stats.leftNotes).toBe(2);
    expect(result.stats.rightNotes).toBe(2);
    expect(result.stats.avgNotesPerSecond).toBeCloseTo(0.2, 1);
  });

  it('rejects null beatmap', () => {
    const result = validateBeatmap(null);
    expect(result.valid).toBe(false);
  });

  it('rejects non-object beatmap', () => {
    const result = validateBeatmap('not an object');
    expect(result.valid).toBe(false);
  });

  it('allows simultaneous notes in different lanes', () => {
    const result = validateBeatmap(makeBeatmap({
      notes: [
        { timestamp: 3.0, lane: 'left', type: 'tap' },
        { timestamp: 3.0, lane: 'right', type: 'tap' },
      ],
    }));
    expect(result.valid).toBe(true);
  });

  it('rejects hold note ending past song duration', () => {
    const result = validateBeatmap(makeBeatmap({
      duration: 10,
      notes: [
        { timestamp: 9.0, lane: 'left', type: 'hold', duration: 2.0 },
      ],
    }));
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('hold note ends at'))).toBe(true);
  });
});
