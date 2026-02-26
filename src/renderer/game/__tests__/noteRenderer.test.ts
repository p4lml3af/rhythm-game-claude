import { describe, it, expect, vi } from 'vitest';
import { calculateNoteY, drawNote, isNoteOnScreen, isNoteInHitZone } from '../noteRenderer';
import { HIT_ZONE_Y, CANVAS_HEIGHT } from '../rendering';
import type { Note } from '../../../shared/types';

// Suite 4: calculateNoteY — Note Position from Audio Time
describe('calculateNoteY', () => {
  // HIT_ZONE_Y = 450 (CANVAS_HEIGHT * 0.75)
  // NOTE_SCROLL_SPEED = 200 px/s
  // Formula: Y = HIT_ZONE_Y - (noteTimestamp - currentTime) * 200

  it('returns HIT_ZONE_Y when note is at exact hit time', () => {
    expect(calculateNoteY(5.0, 5.0)).toBe(HIT_ZONE_Y); // 450
  });

  it('positions note 200px above hit zone when 1s away', () => {
    // timeUntilHit = 5.0 - 4.0 = 1.0s, distance = 200px
    // Y = 450 - 200 = 250
    expect(calculateNoteY(5.0, 4.0)).toBe(250);
  });

  it('positions note 400px above hit zone when 2s away', () => {
    // timeUntilHit = 5.0 - 3.0 = 2.0s, distance = 400px
    // Y = 450 - 400 = 50
    expect(calculateNoteY(5.0, 3.0)).toBe(50);
  });

  it('positions note 200px below hit zone when 1s past', () => {
    // timeUntilHit = 5.0 - 6.0 = -1.0s, distance = -200px
    // Y = 450 - (-200) = 650
    expect(calculateNoteY(5.0, 6.0)).toBe(650);
  });

  it('positions note at top of screen when 2.25s away', () => {
    // timeUntilHit = 5.0 - 2.75 = 2.25s, distance = 450px
    // Y = 450 - 450 = 0
    expect(calculateNoteY(5.0, 2.75)).toBe(0);
  });

  it('handles fractional timing correctly (0.5s away)', () => {
    // timeUntilHit = 5.5 - 5.0 = 0.5s, distance = 100px
    // Y = 450 - 100 = 350
    expect(calculateNoteY(5.5, 5.0)).toBe(350);
  });
});

// drawNote — Rendering (coverage for canvas drawing)
describe('drawNote', () => {
  const mockCtx = {
    fillStyle: '',
    fillRect: vi.fn(),
  } as unknown as CanvasRenderingContext2D;

  it('draws a left lane note', () => {
    const note: Note = { timestamp: 1, lane: 'left', type: 'tap' };
    drawNote(mockCtx, note, 100);
    expect(mockCtx.fillRect).toHaveBeenCalled();
    expect(mockCtx.fillStyle).toBe('#0000FF');
  });

  it('draws a right lane note', () => {
    const note: Note = { timestamp: 1, lane: 'right', type: 'tap' };
    drawNote(mockCtx, note, 200);
    expect(mockCtx.fillRect).toHaveBeenCalled();
  });
});

// Suite 5: isNoteOnScreen — Viewport Culling
describe('isNoteOnScreen', () => {
  it('returns true for note at top of screen (y=0)', () => {
    expect(isNoteOnScreen(0)).toBe(true);
  });

  it('returns true for note at bottom of screen', () => {
    expect(isNoteOnScreen(CANVAS_HEIGHT)).toBe(true);
  });

  it('returns false for note well above screen (y=-21)', () => {
    expect(isNoteOnScreen(-21)).toBe(false);
  });

  it('returns false for note below screen (y=601)', () => {
    expect(isNoteOnScreen(CANVAS_HEIGHT + 1)).toBe(false);
  });

  it('returns true for note at hit zone', () => {
    expect(isNoteOnScreen(HIT_ZONE_Y)).toBe(true);
  });

  it('returns true for partially visible note at top (y=-10)', () => {
    expect(isNoteOnScreen(-10)).toBe(true);
  });
});

// Suite 6: isNoteInHitZone — Visual Hit Zone Check
describe('isNoteInHitZone', () => {
  it('returns true at exact hit zone position', () => {
    expect(isNoteInHitZone(HIT_ZONE_Y)).toBe(true); // 450
  });

  it('returns true 50px above hit zone', () => {
    expect(isNoteInHitZone(HIT_ZONE_Y - 50)).toBe(true); // 400
  });

  it('returns true 50px below hit zone', () => {
    expect(isNoteInHitZone(HIT_ZONE_Y + 50)).toBe(true); // 500
  });

  it('returns false 51px above hit zone', () => {
    expect(isNoteInHitZone(HIT_ZONE_Y - 51)).toBe(false); // 399
  });

  it('returns false 51px below hit zone', () => {
    expect(isNoteInHitZone(HIT_ZONE_Y + 51)).toBe(false); // 501
  });
});
