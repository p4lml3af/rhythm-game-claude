import { describe, it, expect } from 'vitest';
import { xToTimestamp, timestampToX, yToLane, snapToGrid, getRulerHeight } from '../editorRenderer';

describe('editorRenderer', () => {
  describe('xToTimestamp / timestampToX round-trip', () => {
    it('converts correctly at default zoom', () => {
      const zoom = 100;
      const scroll = 0;
      const timestamp = xToTimestamp(250, scroll, zoom);
      expect(timestamp).toBe(2.5);
      const x = timestampToX(timestamp, scroll, zoom);
      expect(x).toBe(250);
    });

    it('accounts for scroll position', () => {
      const zoom = 100;
      const scroll = 5; // scrolled 5 seconds
      const timestamp = xToTimestamp(200, scroll, zoom);
      expect(timestamp).toBe(7); // 5 + 200/100
      const x = timestampToX(7, scroll, zoom);
      expect(x).toBe(200);
    });

    it('round-trips at various zoom levels', () => {
      for (const zoom of [50, 100, 200, 300]) {
        for (const scroll of [0, 3, 10]) {
          const originalX = 150;
          const ts = xToTimestamp(originalX, scroll, zoom);
          const roundTrip = timestampToX(ts, scroll, zoom);
          expect(roundTrip).toBeCloseTo(originalX, 10);
        }
      }
    });
  });

  describe('yToLane', () => {
    const canvasHeight = 500; // ruler=30, each lane=(500-30)/2=235
    const rulerHeight = getRulerHeight();

    it('returns null for ruler area', () => {
      expect(yToLane(10, canvasHeight)).toBeNull();
      expect(yToLane(0, canvasHeight)).toBeNull();
    });

    it('returns left for upper lane area', () => {
      expect(yToLane(rulerHeight + 10, canvasHeight)).toBe('left');
      expect(yToLane(rulerHeight + 100, canvasHeight)).toBe('left');
    });

    it('returns right for lower lane area', () => {
      const laneHeight = (canvasHeight - rulerHeight) / 2;
      expect(yToLane(rulerHeight + laneHeight + 10, canvasHeight)).toBe('right');
      expect(yToLane(canvasHeight - 10, canvasHeight)).toBe('right');
    });

    it('boundary: exactly at lane divider goes to right', () => {
      const laneHeight = (canvasHeight - rulerHeight) / 2;
      expect(yToLane(rulerHeight + laneHeight, canvasHeight)).toBe('right');
    });
  });

  describe('snapToGrid', () => {
    it('snaps to nearest beat at 120 BPM (0.5s beats)', () => {
      // 120 BPM = 0.5s per beat
      expect(snapToGrid(0.48, 120)).toBeCloseTo(0.5, 10);
      expect(snapToGrid(0.52, 120)).toBeCloseTo(0.5, 10);
      expect(snapToGrid(0.74, 120)).toBeCloseTo(0.75, 10); // 1/4 subdivisions = 0.125s
    });

    it('snaps to nearest beat at 60 BPM (1s beats)', () => {
      expect(snapToGrid(0.9, 60)).toBeCloseTo(1.0, 10);
      expect(snapToGrid(1.1, 60)).toBeCloseTo(1.0, 10);
    });

    it('snaps to zero correctly', () => {
      expect(snapToGrid(0.05, 120)).toBeCloseTo(0, 10);
    });

    it('uses quarter-beat subdivision by default', () => {
      // 120 BPM: beat=0.5s, quarter=0.125s
      expect(snapToGrid(0.13, 120)).toBeCloseTo(0.125, 10);
      expect(snapToGrid(0.06, 120)).toBeCloseTo(0.0, 10);
    });
  });
});
