import { describe, it, expect, beforeEach } from 'vitest';
import { useRecordingStore } from '../recordingStore';

describe('recordingStore', () => {
  beforeEach(() => {
    useRecordingStore.getState().reset();
  });

  it('starts with empty initial state', () => {
    const state = useRecordingStore.getState();
    expect(state.isRecording).toBe(false);
    expect(state.audioSourcePath).toBeNull();
    expect(state.songTitle).toBe('');
    expect(state.duration).toBe(0);
    expect(state.bpm).toBe(120);
    expect(state.keypresses).toEqual([]);
    expect(state.activeKeys.size).toBe(0);
  });

  it('startRecording initializes session state', () => {
    const { startRecording } = useRecordingStore.getState();
    startRecording('/path/to/song.mp3', 'My Song', 180);

    const state = useRecordingStore.getState();
    expect(state.isRecording).toBe(true);
    expect(state.audioSourcePath).toBe('/path/to/song.mp3');
    expect(state.songTitle).toBe('My Song');
    expect(state.duration).toBe(180);
    expect(state.keypresses).toEqual([]);
  });

  it('records a tap note (held <= 200ms)', () => {
    const store = useRecordingStore.getState();
    store.startRecording('/path/to/song.mp3', 'Song', 120);

    useRecordingStore.getState().recordKeyDown('left', 1.0);
    useRecordingStore.getState().recordKeyUp('left', 1.1); // 100ms hold

    const state = useRecordingStore.getState();
    expect(state.keypresses).toHaveLength(1);
    expect(state.keypresses[0].type).toBe('tap');
    expect(state.keypresses[0].timestamp).toBe(1.0);
    expect(state.keypresses[0].lane).toBe('left');
    expect(state.keypresses[0].duration).toBeUndefined();
  });

  it('auto-detects hold note (held > 200ms)', () => {
    const store = useRecordingStore.getState();
    store.startRecording('/path/to/song.mp3', 'Song', 120);

    useRecordingStore.getState().recordKeyDown('right', 2.0);
    useRecordingStore.getState().recordKeyUp('right', 2.5); // 500ms hold

    const state = useRecordingStore.getState();
    expect(state.keypresses).toHaveLength(1);
    expect(state.keypresses[0].type).toBe('hold');
    expect(state.keypresses[0].timestamp).toBe(2.0);
    expect(state.keypresses[0].duration).toBe(0.5);
  });

  it('hold threshold boundary: exactly 200ms stays as tap', () => {
    const store = useRecordingStore.getState();
    store.startRecording('/path/to/song.mp3', 'Song', 120);

    // 0.2 - 0 = exactly 0.2 in float, so > 0.2 is false → stays tap
    useRecordingStore.getState().recordKeyDown('left', 0);
    useRecordingStore.getState().recordKeyUp('left', 0.2);

    const state = useRecordingStore.getState();
    expect(state.keypresses[0].type).toBe('tap');
  });

  it('hold threshold boundary: 201ms becomes hold', () => {
    const store = useRecordingStore.getState();
    store.startRecording('/path/to/song.mp3', 'Song', 120);

    useRecordingStore.getState().recordKeyDown('left', 4.0);
    useRecordingStore.getState().recordKeyUp('left', 4.201); // 201ms

    const state = useRecordingStore.getState();
    expect(state.keypresses[0].type).toBe('hold');
    expect(state.keypresses[0].duration).toBeCloseTo(0.201);
  });

  it('records both lanes simultaneously', () => {
    const store = useRecordingStore.getState();
    store.startRecording('/path/to/song.mp3', 'Song', 120);

    useRecordingStore.getState().recordKeyDown('left', 1.0);
    useRecordingStore.getState().recordKeyDown('right', 1.0);
    useRecordingStore.getState().recordKeyUp('left', 1.1);
    useRecordingStore.getState().recordKeyUp('right', 1.1);

    const state = useRecordingStore.getState();
    expect(state.keypresses).toHaveLength(2);
    expect(state.keypresses.find((k) => k.lane === 'left')).toBeTruthy();
    expect(state.keypresses.find((k) => k.lane === 'right')).toBeTruthy();
  });

  it('finishRecording sorts keypresses and clears active keys', () => {
    const store = useRecordingStore.getState();
    store.startRecording('/path/to/song.mp3', 'Song', 120);

    // Record out of order
    useRecordingStore.getState().recordKeyDown('left', 3.0);
    useRecordingStore.getState().recordKeyUp('left', 3.1);
    useRecordingStore.getState().recordKeyDown('right', 1.0);
    useRecordingStore.getState().recordKeyUp('right', 1.1);
    useRecordingStore.getState().recordKeyDown('left', 2.0);
    useRecordingStore.getState().recordKeyUp('left', 2.1);

    useRecordingStore.getState().finishRecording();

    const state = useRecordingStore.getState();
    expect(state.isRecording).toBe(false);
    expect(state.keypresses.map((k) => k.timestamp)).toEqual([1.0, 2.0, 3.0]);
    expect(state.activeKeys.size).toBe(0);
  });

  it('toBeatmap produces valid Beatmap with sorted notes', () => {
    const store = useRecordingStore.getState();
    store.startRecording('/path/to/song.mp3', 'My Song', 180);
    store.setBpm(140);

    // Record notes out of order
    useRecordingStore.getState().recordKeyDown('left', 3.0);
    useRecordingStore.getState().recordKeyUp('left', 3.1);
    useRecordingStore.getState().recordKeyDown('right', 1.0);
    useRecordingStore.getState().recordKeyUp('right', 1.5); // hold
    useRecordingStore.getState().recordKeyDown('left', 2.0);
    useRecordingStore.getState().recordKeyUp('left', 2.1);

    useRecordingStore.getState().finishRecording();
    const beatmap = useRecordingStore.getState().toBeatmap();

    expect(beatmap.songTitle).toBe('My Song');
    expect(beatmap.audioFile).toBe('audio.mp3');
    expect(beatmap.bpm).toBe(140);
    expect(beatmap.duration).toBe(180);
    expect(beatmap.notes).toHaveLength(3);

    // Sorted by timestamp
    expect(beatmap.notes[0].timestamp).toBe(1.0);
    expect(beatmap.notes[0].type).toBe('hold');
    expect(beatmap.notes[0].duration).toBe(0.5);
    expect(beatmap.notes[1].timestamp).toBe(2.0);
    expect(beatmap.notes[1].type).toBe('tap');
    expect(beatmap.notes[2].timestamp).toBe(3.0);
    expect(beatmap.notes[2].type).toBe('tap');
  });

  it('toBeatmap omits duration for tap notes', () => {
    const store = useRecordingStore.getState();
    store.startRecording('/path/to/song.mp3', 'Song', 120);

    useRecordingStore.getState().recordKeyDown('left', 1.0);
    useRecordingStore.getState().recordKeyUp('left', 1.1);

    const beatmap = useRecordingStore.getState().toBeatmap();
    expect(beatmap.notes[0].duration).toBeUndefined();
  });

  it('reset clears all state', () => {
    const store = useRecordingStore.getState();
    store.startRecording('/path/to/song.mp3', 'Song', 120);

    useRecordingStore.getState().recordKeyDown('left', 1.0);
    useRecordingStore.getState().recordKeyUp('left', 1.1);

    useRecordingStore.getState().reset();

    const state = useRecordingStore.getState();
    expect(state.isRecording).toBe(false);
    expect(state.audioSourcePath).toBeNull();
    expect(state.songTitle).toBe('');
    expect(state.duration).toBe(0);
    expect(state.bpm).toBe(120);
    expect(state.keypresses).toEqual([]);
    expect(state.activeKeys.size).toBe(0);
  });

  it('setBpm updates BPM', () => {
    useRecordingStore.getState().setBpm(160);
    expect(useRecordingStore.getState().bpm).toBe(160);
  });

  it('setSongTitle updates title', () => {
    useRecordingStore.getState().setSongTitle('New Title');
    expect(useRecordingStore.getState().songTitle).toBe('New Title');
  });

  it('ignores duplicate keyDown for same lane', () => {
    const store = useRecordingStore.getState();
    store.startRecording('/path/to/song.mp3', 'Song', 120);

    useRecordingStore.getState().recordKeyDown('left', 1.0);
    useRecordingStore.getState().recordKeyDown('left', 1.05); // duplicate, ignored

    const state = useRecordingStore.getState();
    expect(state.keypresses).toHaveLength(1);
  });

  it('ignores keyUp without matching keyDown', () => {
    const store = useRecordingStore.getState();
    store.startRecording('/path/to/song.mp3', 'Song', 120);

    useRecordingStore.getState().recordKeyUp('left', 1.0); // no prior keyDown

    const state = useRecordingStore.getState();
    expect(state.keypresses).toEqual([]);
  });

  it('session lifecycle: start → record → finish', () => {
    const store = useRecordingStore.getState();

    // Start
    store.startRecording('/audio.mp3', 'Test', 60);
    expect(useRecordingStore.getState().isRecording).toBe(true);

    // Record
    useRecordingStore.getState().recordKeyDown('left', 1.0);
    useRecordingStore.getState().recordKeyUp('left', 1.05);
    useRecordingStore.getState().recordKeyDown('right', 2.0);
    useRecordingStore.getState().recordKeyUp('right', 2.8); // hold
    expect(useRecordingStore.getState().keypresses).toHaveLength(2);

    // Finish
    useRecordingStore.getState().finishRecording();
    expect(useRecordingStore.getState().isRecording).toBe(false);
    expect(useRecordingStore.getState().keypresses).toHaveLength(2);
    expect(useRecordingStore.getState().keypresses[0].type).toBe('tap');
    expect(useRecordingStore.getState().keypresses[1].type).toBe('hold');
    expect(useRecordingStore.getState().keypresses[1].duration).toBeCloseTo(0.8);
  });
});
