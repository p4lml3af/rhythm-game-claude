import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loadBeatmap } from '../beatmapLoader';
import { BeatmapError } from '../../../shared/types';

// Valid beatmap fixture
const validBeatmap = {
  songTitle: 'Test Song',
  audioFile: 'audio.mp3',
  bpm: 120,
  duration: 30,
  notes: [
    { timestamp: 2, lane: 'left', type: 'tap' },
    { timestamp: 4, lane: 'right', type: 'tap' },
  ],
};

function mockFetch(data: unknown, ok = true, status = 200) {
  vi.stubGlobal('fetch', vi.fn(() =>
    Promise.resolve({
      ok,
      status,
      statusText: ok ? 'OK' : 'Not Found',
      json: () => Promise.resolve(data),
    })
  ));
}

function mockFetchBadJson() {
  vi.stubGlobal('fetch', vi.fn(() =>
    Promise.resolve({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: () => Promise.reject(new SyntaxError('Unexpected token')),
    })
  ));
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('beatmapLoader', () => {
  it('loads a valid beatmap successfully', async () => {
    mockFetch(validBeatmap);
    const result = await loadBeatmap('/songs/test/beatmap.json');
    expect(result.songTitle).toBe('Test Song');
    expect(result.notes).toHaveLength(2);
  });

  it('throws BeatmapError on HTTP failure', async () => {
    mockFetch(null, false, 404);
    await expect(loadBeatmap('/songs/test/beatmap.json')).rejects.toThrow(BeatmapError);
    await expect(loadBeatmap('/songs/test/beatmap.json')).rejects.toThrow(/404/);
  });

  it('throws BeatmapError on invalid JSON', async () => {
    mockFetchBadJson();
    await expect(loadBeatmap('/songs/test/beatmap.json')).rejects.toThrow(BeatmapError);
    await expect(loadBeatmap('/songs/test/beatmap.json')).rejects.toThrow(/Invalid JSON/);
  });

  it('throws BeatmapError when notes array is missing', async () => {
    mockFetch({ songTitle: 'No Notes', audioFile: 'a.mp3', bpm: 120, duration: 10 });
    await expect(loadBeatmap('/songs/test/beatmap.json')).rejects.toThrow(BeatmapError);
  });

  it('throws BeatmapError with specific message for unsorted timestamps', async () => {
    mockFetch({
      ...validBeatmap,
      notes: [
        { timestamp: 5, lane: 'left', type: 'tap' },
        { timestamp: 2, lane: 'right', type: 'tap' },
      ],
    });
    await expect(loadBeatmap('/songs/test/beatmap.json')).rejects.toThrow(/timestamps not sorted/);
  });

  it('throws BeatmapError for hold note without duration', async () => {
    mockFetch({
      ...validBeatmap,
      notes: [
        { timestamp: 2, lane: 'left', type: 'hold' },
      ],
    });
    await expect(loadBeatmap('/songs/test/beatmap.json')).rejects.toThrow(BeatmapError);
  });

  it('throws BeatmapError for missing required fields', async () => {
    mockFetch({ notes: [] });
    await expect(loadBeatmap('/songs/test/beatmap.json')).rejects.toThrow(BeatmapError);
  });

  it('loads beatmap with warnings and logs them', async () => {
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    mockFetch({
      ...validBeatmap,
      notes: [
        { timestamp: 0.5, lane: 'left', type: 'tap' }, // first note < 2s buffer
        { timestamp: 2, lane: 'right', type: 'tap' },
      ],
    });
    const result = await loadBeatmap('/songs/test/beatmap.json');
    expect(result.songTitle).toBe('Test Song');
    expect(consoleWarn).toHaveBeenCalledWith('Beatmap warnings:', expect.any(Array));
    consoleWarn.mockRestore();
  });
});
