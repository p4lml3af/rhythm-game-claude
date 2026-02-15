import type { Beatmap } from '../../shared/types';

export async function loadBeatmap(beatmapPath: string): Promise<Beatmap> {
  const response = await fetch(beatmapPath);
  const beatmap: Beatmap = await response.json();

  // Basic validation
  if (!beatmap.notes || !Array.isArray(beatmap.notes)) {
    throw new Error('Invalid beatmap: missing notes array');
  }

  return beatmap;
}
