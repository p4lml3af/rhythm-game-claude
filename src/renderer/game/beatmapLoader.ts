import type { Beatmap } from '../../shared/types';
import { BeatmapError } from '../../shared/types';
import { validateBeatmap } from '../../shared/beatmapValidator';

export async function loadBeatmap(beatmapPath: string): Promise<Beatmap> {
  const response = await fetch(beatmapPath);
  if (!response.ok) {
    throw new BeatmapError(
      `Failed to load beatmap file: ${response.status} ${response.statusText}`,
      [`HTTP ${response.status}: ${response.statusText}`],
      []
    );
  }

  let beatmap: unknown;
  try {
    beatmap = await response.json();
  } catch {
    throw new BeatmapError('Invalid JSON in beatmap file', ['Failed to parse JSON'], []);
  }

  const result = validateBeatmap(beatmap);

  if (!result.valid) {
    throw new BeatmapError(
      `Invalid beatmap: ${result.errors[0]}`,
      result.errors,
      result.warnings
    );
  }

  if (result.warnings.length > 0) {
    console.warn('Beatmap warnings:', result.warnings);
  }

  return beatmap as Beatmap;
}
