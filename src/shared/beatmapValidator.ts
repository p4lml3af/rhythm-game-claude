import type { Beatmap, Note } from './types';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    totalNotes: number;
    tapNotes: number;
    holdNotes: number;
    leftNotes: number;
    rightNotes: number;
    avgNotesPerSecond: number;
    minNoteSpacing: number;
  };
}

const VALID_LANES = ['left', 'right'] as const;
const VALID_TYPES = ['tap', 'hold'] as const;
const MIN_SAME_LANE_SPACING = 0.2; // 200ms
const HIGH_DENSITY_THRESHOLD = 8; // notes per second
const MIN_FIRST_NOTE_BUFFER = 2; // seconds

export function validateBeatmap(beatmap: unknown): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const stats = {
    totalNotes: 0,
    tapNotes: 0,
    holdNotes: 0,
    leftNotes: 0,
    rightNotes: 0,
    avgNotesPerSecond: 0,
    minNoteSpacing: Infinity,
  };

  if (!beatmap || typeof beatmap !== 'object') {
    return { valid: false, errors: ['Beatmap must be a non-null object'], warnings, stats };
  }

  const b = beatmap as Record<string, unknown>;

  // Required fields
  if (typeof b.songTitle !== 'string' || b.songTitle.length === 0) {
    errors.push('Missing or invalid "songTitle" (must be a non-empty string)');
  }
  if (typeof b.audioFile !== 'string' || b.audioFile.length === 0) {
    errors.push('Missing or invalid "audioFile" (must be a non-empty string)');
  }
  if (typeof b.bpm !== 'number' || b.bpm <= 0) {
    errors.push('Missing or invalid "bpm" (must be a positive number)');
  }
  if (typeof b.duration !== 'number' || b.duration <= 0) {
    errors.push('Missing or invalid "duration" (must be a positive number)');
  }
  if (!Array.isArray(b.notes)) {
    errors.push('Missing or invalid "notes" (must be an array)');
    return { valid: false, errors, warnings, stats };
  }

  const notes = b.notes as unknown[];
  const duration = typeof b.duration === 'number' ? b.duration : 0;

  // Track last note end time per lane for overlap detection
  const lastNoteEnd: Record<string, number> = { left: -Infinity, right: -Infinity };
  let prevTimestamp = -Infinity;

  for (let i = 0; i < notes.length; i++) {
    const note = notes[i];
    if (!note || typeof note !== 'object') {
      errors.push(`Note ${i}: must be a non-null object`);
      continue;
    }

    const n = note as Record<string, unknown>;

    // Validate timestamp
    if (typeof n.timestamp !== 'number' || n.timestamp < 0) {
      errors.push(`Note ${i}: invalid "timestamp" (must be a non-negative number)`);
      continue;
    }

    // Check sort order
    if (n.timestamp < prevTimestamp) {
      errors.push(`Note ${i}: timestamps not sorted ascending (${n.timestamp} < ${prevTimestamp})`);
    }
    prevTimestamp = n.timestamp;

    // Validate lane
    if (!VALID_LANES.includes(n.lane as typeof VALID_LANES[number])) {
      errors.push(`Note ${i}: invalid "lane" (must be "left" or "right", got "${n.lane}")`);
      continue;
    }

    // Validate type
    if (!VALID_TYPES.includes(n.type as typeof VALID_TYPES[number])) {
      errors.push(`Note ${i}: invalid "type" (must be "tap" or "hold", got "${n.type}")`);
      continue;
    }

    const lane = n.lane as string;
    const type = n.type as string;
    const timestamp = n.timestamp as number;

    // Validate hold duration
    if (type === 'hold') {
      if (typeof n.duration !== 'number' || n.duration <= 0) {
        errors.push(`Note ${i}: hold note missing or invalid "duration" (must be a positive number)`);
        continue;
      }
    }

    // Check timestamp within song duration
    if (timestamp > duration) {
      errors.push(`Note ${i}: timestamp ${timestamp} exceeds song duration ${duration}`);
    }

    // Check hold end within duration
    if (type === 'hold' && typeof n.duration === 'number') {
      const holdEnd = timestamp + n.duration;
      if (holdEnd > duration) {
        errors.push(`Note ${i}: hold note ends at ${holdEnd} which exceeds song duration ${duration}`);
      }
    }

    // Check same-lane overlap
    const noteEnd = type === 'hold' && typeof n.duration === 'number'
      ? timestamp + n.duration
      : timestamp;
    const spacing = timestamp - lastNoteEnd[lane];

    if (spacing < MIN_SAME_LANE_SPACING && lastNoteEnd[lane] !== -Infinity) {
      errors.push(`Note ${i}: same-lane spacing too small (${(spacing * 1000).toFixed(0)}ms < ${MIN_SAME_LANE_SPACING * 1000}ms in "${lane}" lane)`);
    }

    if (lastNoteEnd[lane] !== -Infinity && spacing < stats.minNoteSpacing) {
      stats.minNoteSpacing = spacing;
    }

    lastNoteEnd[lane] = noteEnd;

    // Update stats
    stats.totalNotes++;
    if (type === 'tap') stats.tapNotes++;
    if (type === 'hold') stats.holdNotes++;
    if (lane === 'left') stats.leftNotes++;
    if (lane === 'right') stats.rightNotes++;
  }

  // Calculate average density
  if (duration > 0 && stats.totalNotes > 0) {
    stats.avgNotesPerSecond = stats.totalNotes / duration;
  }

  // Fix minNoteSpacing for edge cases
  if (stats.minNoteSpacing === Infinity) {
    stats.minNoteSpacing = 0;
  }

  // Warnings
  if (stats.avgNotesPerSecond > HIGH_DENSITY_THRESHOLD) {
    warnings.push(`High note density: ${stats.avgNotesPerSecond.toFixed(1)} notes/second (threshold: ${HIGH_DENSITY_THRESHOLD})`);
  }

  if (notes.length > 0) {
    const firstNote = notes[0] as Record<string, unknown>;
    if (typeof firstNote.timestamp === 'number' && firstNote.timestamp < MIN_FIRST_NOTE_BUFFER) {
      warnings.push(`First note at ${firstNote.timestamp}s has less than ${MIN_FIRST_NOTE_BUFFER}s buffer`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    stats,
  };
}
