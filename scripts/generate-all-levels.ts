import * as path from 'path';
import * as fs from 'fs';
import { BeatmapConfig, writeBeatmap } from './generate-beatmap';

// Using placeholder audio (30s, 120 BPM) for initial generation.
// Duration is capped at 30s. BPM in configs is the "design" BPM for pattern spacing.
// Once real audio is sourced, update durations and regenerate.

const PLACEHOLDER_DURATION = 30;

const levels: BeatmapConfig[] = [
  // ═══════════════════════════════════════════════
  // TIER 1: Beginner (Levels 01-03) — Tap Only
  // ═══════════════════════════════════════════════

  {
    songTitle: 'First Steps',
    folderName: 'level-01-first-steps',
    bpm: 70,
    duration: PLACEHOLDER_DURATION,
    patterns: [
      { startTime: 3, endTime: 12, type: 'single-left', notesPerBeat: 0.5 },
      { startTime: 13, endTime: 22, type: 'single-left', notesPerBeat: 1 },
      { startTime: 23, endTime: 28, type: 'single-left', notesPerBeat: 1 },
    ],
  },

  {
    songTitle: 'Two Lanes',
    folderName: 'level-02-two-lanes',
    bpm: 80,
    duration: PLACEHOLDER_DURATION,
    patterns: [
      { startTime: 3, endTime: 12, type: 'alternate', notesPerBeat: 0.5 },
      { startTime: 13, endTime: 22, type: 'alternate', notesPerBeat: 1 },
      { startTime: 23, endTime: 28, type: 'alternate', notesPerBeat: 1 },
    ],
  },

  {
    songTitle: 'Together',
    folderName: 'level-03-together',
    bpm: 90,
    duration: PLACEHOLDER_DURATION,
    patterns: [
      { startTime: 3, endTime: 10, type: 'alternate', notesPerBeat: 1 },
      { startTime: 11, endTime: 18, type: 'alternate', notesPerBeat: 1 },
      { startTime: 19, endTime: 22, type: 'both', notesPerBeat: 0.5 },
      { startTime: 23, endTime: 28, type: 'alternate', notesPerBeat: 1 },
    ],
  },

  // ═══════════════════════════════════════════════
  // TIER 2: Easy (Levels 04-06) — Introduce Holds
  // ═══════════════════════════════════════════════

  {
    songTitle: 'Hold Steady',
    folderName: 'level-04-hold-steady',
    bpm: 100,
    duration: PLACEHOLDER_DURATION,
    patterns: [
      { startTime: 3, endTime: 9, type: 'alternate', notesPerBeat: 1 },
      { startTime: 10, endTime: 14, type: 'hold-left', notesPerBeat: 0.25, holdDuration: 2.0 },
      { startTime: 15, endTime: 20, type: 'alternate', notesPerBeat: 1 },
      { startTime: 21, endTime: 25, type: 'hold-right', notesPerBeat: 0.25, holdDuration: 2.0 },
      { startTime: 26, endTime: 28, type: 'alternate', notesPerBeat: 1 },
    ],
  },

  {
    songTitle: 'Quick Grip',
    folderName: 'level-05-quick-grip',
    bpm: 110,
    duration: PLACEHOLDER_DURATION,
    patterns: [
      { startTime: 3, endTime: 8, type: 'alternate', notesPerBeat: 1 },
      { startTime: 9, endTime: 13, type: 'hold-left', notesPerBeat: 0.5, holdDuration: 0.8 },
      { startTime: 14, endTime: 18, type: 'hold-right', notesPerBeat: 0.5, holdDuration: 0.8 },
      { startTime: 19, endTime: 23, type: 'alternate', notesPerBeat: 1 },
      { startTime: 24, endTime: 28, type: 'hold-left', notesPerBeat: 0.5, holdDuration: 0.5 },
    ],
  },

  {
    songTitle: 'Dual Focus',
    folderName: 'level-06-dual-focus',
    bpm: 120,
    duration: PLACEHOLDER_DURATION,
    patterns: [
      { startTime: 3, endTime: 8, type: 'alternate', notesPerBeat: 1 },
      { startTime: 9, endTime: 14, type: 'hold-tap-combo', notesPerBeat: 1, holdDuration: 1.5 },
      { startTime: 15, endTime: 19, type: 'alternate', notesPerBeat: 1 },
      { startTime: 20, endTime: 25, type: 'hold-tap-combo', notesPerBeat: 1, holdDuration: 1.0 },
      { startTime: 26, endTime: 28, type: 'both', notesPerBeat: 0.5 },
    ],
  },

  // ═══════════════════════════════════════════════
  // TIER 3: Medium (Levels 07-08) — Complex Patterns
  // ═══════════════════════════════════════════════

  {
    songTitle: 'Syncopation',
    folderName: 'level-07-syncopation',
    bpm: 130,
    duration: PLACEHOLDER_DURATION,
    patterns: [
      { startTime: 3, endTime: 8, type: 'alternate', notesPerBeat: 2 },
      { startTime: 9, endTime: 13, type: 'hold-left', notesPerBeat: 0.5, holdDuration: 0.5 },
      { startTime: 14, endTime: 18, type: 'stream', notesPerBeat: 2 },
      { startTime: 18.5, endTime: 20, type: 'rest', notesPerBeat: 1 },
      { startTime: 20, endTime: 24, type: 'alternate', notesPerBeat: 2 },
      { startTime: 25, endTime: 28, type: 'hold-tap-combo', notesPerBeat: 1, holdDuration: 0.8 },
    ],
  },

  {
    songTitle: 'Cascade',
    folderName: 'level-08-cascade',
    bpm: 140,
    duration: PLACEHOLDER_DURATION,
    patterns: [
      { startTime: 3, endTime: 7, type: 'stream', notesPerBeat: 2 },
      { startTime: 7.5, endTime: 8.5, type: 'rest', notesPerBeat: 1 },
      { startTime: 9, endTime: 13, type: 'hold-tap-combo', notesPerBeat: 2, holdDuration: 0.8 },
      { startTime: 14, endTime: 18, type: 'stream', notesPerBeat: 2 },
      { startTime: 18.5, endTime: 19.5, type: 'rest', notesPerBeat: 1 },
      { startTime: 20, endTime: 24, type: 'alternate', notesPerBeat: 2 },
      { startTime: 25, endTime: 28, type: 'hold-both', notesPerBeat: 0.25, holdDuration: 0.5 },
    ],
  },

  // ═══════════════════════════════════════════════
  // TIER 4: Hard (Levels 09-10) — Advanced
  // ═══════════════════════════════════════════════

  {
    songTitle: 'Precision',
    folderName: 'level-09-precision',
    bpm: 150,
    duration: PLACEHOLDER_DURATION,
    patterns: [
      { startTime: 3, endTime: 7, type: 'stream', notesPerBeat: 2 },
      { startTime: 7.5, endTime: 10, type: 'hold-left', notesPerBeat: 0.5, holdDuration: 0.4 },
      { startTime: 10.5, endTime: 14, type: 'stream', notesPerBeat: 4 },
      { startTime: 14.5, endTime: 15.5, type: 'rest', notesPerBeat: 1 },
      { startTime: 16, endTime: 20, type: 'hold-tap-combo', notesPerBeat: 2, holdDuration: 0.5 },
      { startTime: 21, endTime: 25, type: 'stream', notesPerBeat: 2 },
      { startTime: 25.5, endTime: 28, type: 'hold-both', notesPerBeat: 0.5, holdDuration: 0.3 },
    ],
  },

  {
    songTitle: 'Mastery',
    folderName: 'level-10-mastery',
    bpm: 160,
    duration: PLACEHOLDER_DURATION,
    patterns: [
      { startTime: 3, endTime: 6, type: 'stream', notesPerBeat: 4 },
      { startTime: 6.5, endTime: 10, type: 'hold-tap-combo', notesPerBeat: 2, holdDuration: 0.5 },
      { startTime: 10.5, endTime: 14, type: 'stream', notesPerBeat: 4 },
      { startTime: 14.5, endTime: 15, type: 'rest', notesPerBeat: 1 },
      { startTime: 15, endTime: 18, type: 'alternate', notesPerBeat: 2 },
      { startTime: 18.5, endTime: 22, type: 'hold-tap-combo', notesPerBeat: 2, holdDuration: 0.3 },
      { startTime: 22.5, endTime: 26, type: 'stream', notesPerBeat: 4 },
      { startTime: 26.5, endTime: 28, type: 'both', notesPerBeat: 1 },
    ],
  },
];

// Generate all levels
const outputDir = path.resolve(__dirname, '..', 'public', 'songs');

console.log(`Generating ${levels.length} levels to ${outputDir}...\n`);

for (const level of levels) {
  writeBeatmap(level, outputDir);
}

console.log(`\nDone! Generated ${levels.length} levels.`);
