import { describe, it, expect } from 'vitest';
import { calculateNoteY } from '../noteRenderer';
import { checkHit } from '../hitDetection';
import { HIT_ZONE_Y } from '../rendering';
import type { Note } from '../../../shared/types';

const NOTE_SCROLL_SPEED = 200; // Must match noteRenderer.ts

// Suite 8: Audio-Visual Synchronization (Property 2, REQ-16)
describe('timing synchronization', () => {
  // Test 1: Metronome beatmap — 100 notes at 1-second intervals
  it('positions every note at HIT_ZONE_Y when audio time equals note timestamp (100 notes)', () => {
    for (let i = 1; i <= 100; i++) {
      const noteTimestamp = i;
      const y = calculateNoteY(noteTimestamp, noteTimestamp);
      expect(y).toBe(HIT_ZONE_Y);
    }
  });

  // Test 2: Sub-second note spacing (100ms apart)
  it('positions notes correctly at 100ms intervals', () => {
    for (let i = 1; i <= 50; i++) {
      const noteTimestamp = i * 0.1;
      const y = calculateNoteY(noteTimestamp, noteTimestamp);
      expect(y).toBe(HIT_ZONE_Y);
    }
  });

  // Test 3: Position-to-time roundtrip verification
  it('roundtrip: position at timestamp T yields HIT_ZONE_Y, reverse yields T within ±10ms', () => {
    const testTimestamps = [0.5, 1.0, 2.5, 5.0, 10.0, 30.0, 60.0, 120.0];

    for (const T of testTimestamps) {
      // Forward: calculate Y at time T
      const y = calculateNoteY(T, T);
      expect(y).toBe(HIT_ZONE_Y);

      // Reverse: given Y = HIT_ZONE_Y, calculate back to time
      // Y = HIT_ZONE_Y - (noteTimestamp - currentTime) * SPEED
      // HIT_ZONE_Y = HIT_ZONE_Y - (T - calculatedTime) * SPEED
      // 0 = -(T - calculatedTime) * SPEED
      // calculatedTime = T
      const calculatedTime = T - (HIT_ZONE_Y - y) / NOTE_SCROLL_SPEED;
      expect(Math.abs(calculatedTime - T)).toBeLessThanOrEqual(0.01); // ±10ms
    }
  });

  // Test 4: Continuous time progression — monotonic Y movement
  it('note Y position moves monotonically downward as time progresses', () => {
    const noteTimestamp = 10.0;
    let previousY = -Infinity;

    // Step through time from 0.0 to 20.0 in 1ms increments
    for (let t = 0; t <= 20.0; t += 0.001) {
      const y = calculateNoteY(noteTimestamp, t);

      // Y should always increase (move downward) as time progresses
      expect(y).toBeGreaterThanOrEqual(previousY);
      previousY = y;
    }

    // At time 10.0s, Y must be within ±2px of HIT_ZONE_Y (±10ms at 200px/s)
    const yAtExact = calculateNoteY(noteTimestamp, 10.0);
    expect(Math.abs(yAtExact - HIT_ZONE_Y)).toBeLessThanOrEqual(2);
  });

  // Test 5: Time-to-pixel precision check
  it('10ms of audio drift equals exactly 2px of visual movement', () => {
    const T = 5.0;

    // 10ms late: currentTime = T + 0.01
    const yLate = calculateNoteY(T, T + 0.01);
    expect(Math.abs(yLate - HIT_ZONE_Y)).toBeCloseTo(2, 5);

    // 10ms early: currentTime = T - 0.01
    const yEarly = calculateNoteY(T, T - 0.01);
    expect(Math.abs(yEarly - HIT_ZONE_Y)).toBeCloseTo(2, 5);
  });

  // Test 6: Hit detection timing matches visual position
  it('hit detection classification is consistent with visual note position', () => {
    const noteTimestamp = 5.0;
    const note: Note = { timestamp: noteTimestamp, lane: 'left', type: 'tap' };

    // At HIT_ZONE_Y (time = 5.0s): perfect
    const yExact = calculateNoteY(noteTimestamp, 5.0);
    expect(yExact).toBe(HIT_ZONE_Y);
    expect(checkHit(note, 5.0)).toBe('perfect');

    // 10px below hit zone (time = 5.05s, +50ms): still perfect
    const y50ms = calculateNoteY(noteTimestamp, 5.05);
    expect(y50ms).toBeCloseTo(HIT_ZONE_Y + 10, 5); // 0.05s * 200px/s = 10px
    expect(checkHit(note, 5.05)).toBe('perfect');

    // 20px below hit zone (time = 5.1s, +100ms): good
    const y100ms = calculateNoteY(noteTimestamp, 5.1);
    expect(y100ms).toBeCloseTo(HIT_ZONE_Y + 20, 5); // 0.1s * 200px/s = 20px
    expect(checkHit(note, 5.1)).toBe('good');

    // Just past good window (time = 5.101s, +101ms): miss
    expect(checkHit(note, 5.101)).toBe('miss');
  });
});
