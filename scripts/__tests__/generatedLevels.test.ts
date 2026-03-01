import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { validateBeatmap } from '../../src/shared/beatmapValidator';

const songsDir = path.resolve(__dirname, '..', '..', 'public', 'songs');

const levelDirs = fs.readdirSync(songsDir, { withFileTypes: true })
  .filter(e => e.isDirectory() && e.name.startsWith('level-'))
  .map(e => e.name)
  .sort();

describe('Generated Levels', () => {
  it('should have exactly 10 levels', () => {
    expect(levelDirs).toHaveLength(10);
  });

  it('levels are named in correct order', () => {
    expect(levelDirs).toEqual([
      'level-01-first-steps',
      'level-02-two-lanes',
      'level-03-together',
      'level-04-hold-steady',
      'level-05-quick-grip',
      'level-06-dual-focus',
      'level-07-syncopation',
      'level-08-cascade',
      'level-09-precision',
      'level-10-mastery',
    ]);
  });

  levelDirs.forEach(dir => {
    describe(dir, () => {
      const beatmapPath = path.join(songsDir, dir, 'beatmap.json');
      const audioPath = path.join(songsDir, dir, 'audio.mp3');

      it('has beatmap.json', () => {
        expect(fs.existsSync(beatmapPath)).toBe(true);
      });

      it('has audio.mp3', () => {
        expect(fs.existsSync(audioPath)).toBe(true);
      });

      it('has valid beatmap.json', () => {
        const data = JSON.parse(fs.readFileSync(beatmapPath, 'utf-8'));
        const result = validateBeatmap(data);
        expect(result.errors).toEqual([]);
        expect(result.valid).toBe(true);
      });

      it('notes are sorted by timestamp', () => {
        const data = JSON.parse(fs.readFileSync(beatmapPath, 'utf-8'));
        for (let i = 1; i < data.notes.length; i++) {
          expect(data.notes[i].timestamp).toBeGreaterThanOrEqual(data.notes[i - 1].timestamp);
        }
      });

      it('no same-lane overlaps', () => {
        const data = JSON.parse(fs.readFileSync(beatmapPath, 'utf-8'));
        const lastEnd: Record<string, number> = { left: -Infinity, right: -Infinity };
        for (const note of data.notes) {
          const gap = note.timestamp - lastEnd[note.lane];
          if (lastEnd[note.lane] !== -Infinity) {
            expect(gap).toBeGreaterThanOrEqual(0.2);
          }
          const end = note.type === 'hold' ? note.timestamp + note.duration : note.timestamp;
          lastEnd[note.lane] = end;
        }
      });

      it('all hold notes have duration', () => {
        const data = JSON.parse(fs.readFileSync(beatmapPath, 'utf-8'));
        for (const note of data.notes) {
          if (note.type === 'hold') {
            expect(note.duration).toBeGreaterThan(0);
          }
        }
      });

      it('first note has adequate buffer (>= 2s)', () => {
        const data = JSON.parse(fs.readFileSync(beatmapPath, 'utf-8'));
        if (data.notes.length > 0) {
          expect(data.notes[0].timestamp).toBeGreaterThanOrEqual(2);
        }
      });
    });
  });

  // Tier-specific checks
  describe('difficulty progression', () => {
    function getStats(dir: string) {
      const data = JSON.parse(
        fs.readFileSync(path.join(songsDir, dir, 'beatmap.json'), 'utf-8'),
      );
      const holdCount = data.notes.filter((n: { type: string }) => n.type === 'hold').length;
      return {
        noteCount: data.notes.length,
        holdCount,
        density: data.notes.length / data.duration,
      };
    }

    it('Tier 1 (levels 01-03) have tap notes only', () => {
      for (const dir of levelDirs.slice(0, 3)) {
        const stats = getStats(dir);
        expect(stats.holdCount).toBe(0);
      }
    });

    it('Tier 2 (levels 04-06) have hold notes', () => {
      for (const dir of levelDirs.slice(3, 6)) {
        const stats = getStats(dir);
        expect(stats.holdCount).toBeGreaterThan(0);
      }
    });

    it('note count increases across tiers', () => {
      const tier1Max = Math.max(...levelDirs.slice(0, 3).map(d => getStats(d).noteCount));
      const tier4Min = Math.min(...levelDirs.slice(8, 10).map(d => getStats(d).noteCount));
      expect(tier4Min).toBeGreaterThan(tier1Max);
    });

    it('density increases from tier 1 to tier 4', () => {
      const tier1Avg = levelDirs.slice(0, 3).reduce((s, d) => s + getStats(d).density, 0) / 3;
      const tier4Avg = levelDirs.slice(8, 10).reduce((s, d) => s + getStats(d).density, 0) / 2;
      expect(tier4Avg).toBeGreaterThan(tier1Avg);
    });
  });
});
