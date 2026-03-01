import * as fs from 'fs';
import * as path from 'path';

export interface Note {
  timestamp: number;
  lane: 'left' | 'right';
  type: 'tap' | 'hold';
  duration?: number;
}

export interface PatternConfig {
  startTime: number;
  endTime: number;
  type:
    | 'single-left'
    | 'single-right'
    | 'alternate'
    | 'both'
    | 'hold-left'
    | 'hold-right'
    | 'hold-both'
    | 'hold-tap-combo'
    | 'stream'
    | 'rest';
  notesPerBeat: number; // 1 = quarter, 2 = eighth, 4 = sixteenth
  holdDuration?: number;
}

export interface BeatmapConfig {
  songTitle: string;
  folderName: string;
  bpm: number;
  duration: number;
  firstNote?: number; // default 3.0
  lastNoteBuffer?: number; // default 2.0
  patterns: PatternConfig[];
}

const MIN_SAME_LANE_SPACING = 0.2; // 200ms

export function generateBeatmap(config: BeatmapConfig): {
  songTitle: string;
  audioFile: string;
  bpm: number;
  duration: number;
  notes: Note[];
} {
  const firstNote = config.firstNote ?? 3.0;
  const lastNoteBuffer = config.lastNoteBuffer ?? 2.0;
  const lastAllowed = config.duration - lastNoteBuffer;
  const beatInterval = 60 / config.bpm;
  const notes: Note[] = [];

  for (const pattern of config.patterns) {
    if (pattern.type === 'rest') continue;

    const interval = beatInterval / pattern.notesPerBeat;
    let t = pattern.startTime;

    while (t < pattern.endTime && t <= lastAllowed) {
      if (t < firstNote) {
        t += interval;
        continue;
      }

      const timestamp = Math.round(t * 1000) / 1000; // round to ms

      switch (pattern.type) {
        case 'single-left':
          notes.push({ timestamp, lane: 'left', type: 'tap' });
          break;

        case 'single-right':
          notes.push({ timestamp, lane: 'right', type: 'tap' });
          break;

        case 'alternate': {
          const idx = Math.round((t - pattern.startTime) / interval);
          const lane = idx % 2 === 0 ? 'left' : 'right';
          notes.push({ timestamp, lane, type: 'tap' });
          break;
        }

        case 'both':
          notes.push({ timestamp, lane: 'left', type: 'tap' });
          notes.push({ timestamp, lane: 'right', type: 'tap' });
          break;

        case 'hold-left': {
          const dur = pattern.holdDuration ?? 1.0;
          if (timestamp + dur <= lastAllowed + lastNoteBuffer) {
            notes.push({ timestamp, lane: 'left', type: 'hold', duration: dur });
          }
          break;
        }

        case 'hold-right': {
          const dur = pattern.holdDuration ?? 1.0;
          if (timestamp + dur <= lastAllowed + lastNoteBuffer) {
            notes.push({ timestamp, lane: 'right', type: 'hold', duration: dur });
          }
          break;
        }

        case 'hold-both': {
          const dur = pattern.holdDuration ?? 1.0;
          if (timestamp + dur <= lastAllowed + lastNoteBuffer) {
            notes.push({ timestamp, lane: 'left', type: 'hold', duration: dur });
            notes.push({ timestamp, lane: 'right', type: 'hold', duration: dur });
          }
          break;
        }

        case 'hold-tap-combo': {
          const dur = pattern.holdDuration ?? 1.5;
          const idx = Math.round((t - pattern.startTime) / interval);
          if (idx % 4 === 0 && timestamp + dur <= lastAllowed + lastNoteBuffer) {
            // Start a hold on left, taps on right during hold
            notes.push({ timestamp, lane: 'left', type: 'hold', duration: dur });
          } else if (idx % 4 === 2 && timestamp + dur <= lastAllowed + lastNoteBuffer) {
            // Start a hold on right, taps on left during hold
            notes.push({ timestamp, lane: 'right', type: 'hold', duration: dur });
          } else {
            // Tap on the opposite lane of what's being held
            const lane = idx % 4 < 2 ? 'right' : 'left';
            notes.push({ timestamp, lane, type: 'tap' });
          }
          break;
        }

        case 'stream': {
          const idx = Math.round((t - pattern.startTime) / interval);
          const lane = idx % 2 === 0 ? 'left' : 'right';
          notes.push({ timestamp, lane, type: 'tap' });
          break;
        }
      }

      t += interval;
    }
  }

  // Sort by timestamp
  notes.sort((a, b) => a.timestamp - b.timestamp);

  // Remove same-lane overlaps (keep first)
  const cleaned: Note[] = [];
  const lastEnd: Record<string, number> = { left: -Infinity, right: -Infinity };

  for (const note of notes) {
    const noteEnd = note.type === 'hold' && note.duration
      ? note.timestamp + note.duration
      : note.timestamp;

    if (note.timestamp - lastEnd[note.lane] >= MIN_SAME_LANE_SPACING) {
      cleaned.push(note);
      lastEnd[note.lane] = noteEnd;
    }
  }

  return {
    songTitle: config.songTitle,
    audioFile: 'audio.mp3',
    bpm: config.bpm,
    duration: config.duration,
    notes: cleaned,
  };
}

export function writeBeatmap(
  config: BeatmapConfig,
  outputDir: string,
): void {
  const beatmap = generateBeatmap(config);
  const levelDir = path.join(outputDir, config.folderName);

  if (!fs.existsSync(levelDir)) {
    fs.mkdirSync(levelDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(levelDir, 'beatmap.json'),
    JSON.stringify(beatmap, null, 2) + '\n',
  );

  console.log(
    `  ${config.folderName}: ${beatmap.notes.length} notes, ` +
    `${beatmap.bpm} BPM, ${beatmap.duration}s`,
  );
}
