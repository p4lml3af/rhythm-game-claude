import { describe, it, expect, beforeEach } from 'vitest';
import { useRecordingStore } from '../recordingStore';
import { useEditorStore } from '../editorStore';
import { validateBeatmap } from '../../../shared/beatmapValidator';

describe('Recording Integration', () => {
  beforeEach(() => {
    useRecordingStore.getState().reset();
    useEditorStore.getState().resetEditor();
  });

  it('recording → save flow produces valid beatmap', () => {
    const store = useRecordingStore.getState();
    store.startRecording('/path/to/song.mp3', 'Integration Test Song', 60);
    store.setBpm(128);

    // Simulate recording session
    useRecordingStore.getState().recordKeyDown('left', 2.5);
    useRecordingStore.getState().recordKeyUp('left', 2.6);
    useRecordingStore.getState().recordKeyDown('right', 3.0);
    useRecordingStore.getState().recordKeyUp('right', 3.1);
    useRecordingStore.getState().recordKeyDown('left', 4.0);
    useRecordingStore.getState().recordKeyUp('left', 4.6); // hold: 600ms
    useRecordingStore.getState().recordKeyDown('right', 5.0);
    useRecordingStore.getState().recordKeyUp('right', 5.05);

    useRecordingStore.getState().finishRecording();

    const beatmap = useRecordingStore.getState().toBeatmap();

    // Verify structure
    expect(beatmap.songTitle).toBe('Integration Test Song');
    expect(beatmap.audioFile).toBe('audio.mp3');
    expect(beatmap.bpm).toBe(128);
    expect(beatmap.duration).toBe(60);
    expect(beatmap.notes).toHaveLength(4);

    // Verify sort order
    expect(beatmap.notes[0].timestamp).toBe(2.5);
    expect(beatmap.notes[1].timestamp).toBe(3.0);
    expect(beatmap.notes[2].timestamp).toBe(4.0);
    expect(beatmap.notes[3].timestamp).toBe(5.0);

    // Verify hold detection
    expect(beatmap.notes[2].type).toBe('hold');
    expect(beatmap.notes[2].duration).toBeCloseTo(0.6);

    // Verify taps don't have duration
    expect(beatmap.notes[0].type).toBe('tap');
    expect(beatmap.notes[0].duration).toBeUndefined();

    // Validate using existing validator
    const result = validateBeatmap(beatmap, true);
    expect(result.errors).toEqual([]);
  });

  it('recording → edit in visual editor flow loads into editor store', () => {
    const store = useRecordingStore.getState();
    store.startRecording('/path/to/song.mp3', 'Editor Flow Test', 90);
    store.setBpm(100);

    useRecordingStore.getState().recordKeyDown('left', 3.0);
    useRecordingStore.getState().recordKeyUp('left', 3.1);
    useRecordingStore.getState().recordKeyDown('right', 4.0);
    useRecordingStore.getState().recordKeyUp('right', 4.8); // hold

    useRecordingStore.getState().finishRecording();

    // Convert and load into editor
    const beatmap = useRecordingStore.getState().toBeatmap();
    const audioPath = useRecordingStore.getState().audioSourcePath;
    useEditorStore.getState().loadBeatmap(beatmap, null, audioPath);

    const editorState = useEditorStore.getState();
    expect(editorState.songTitle).toBe('Editor Flow Test');
    expect(editorState.bpm).toBe(100);
    expect(editorState.duration).toBe(90);
    expect(editorState.audioSourcePath).toBe('/path/to/song.mp3');
    expect(editorState.notes).toHaveLength(2);
    expect(editorState.notes[0].lane).toBe('left');
    expect(editorState.notes[0].type).toBe('tap');
    expect(editorState.notes[1].lane).toBe('right');
    expect(editorState.notes[1].type).toBe('hold');
    expect(editorState.notes[1].duration).toBeCloseTo(0.8);

    // All notes should have IDs (editor adds them)
    expect(editorState.notes.every((n) => n.id)).toBe(true);
  });

  it('hold note precision: durations are accurate', () => {
    const store = useRecordingStore.getState();
    store.startRecording('/path/to/song.mp3', 'Precision Test', 60);

    // Record holds at precise durations
    useRecordingStore.getState().recordKeyDown('left', 1.000);
    useRecordingStore.getState().recordKeyUp('left', 1.350); // 350ms
    useRecordingStore.getState().recordKeyDown('right', 2.000);
    useRecordingStore.getState().recordKeyUp('right', 3.500); // 1500ms

    useRecordingStore.getState().finishRecording();
    const beatmap = useRecordingStore.getState().toBeatmap();

    expect(beatmap.notes[0].duration).toBeCloseTo(0.350, 2);
    expect(beatmap.notes[1].duration).toBeCloseTo(1.500, 2);
  });

  it('empty recording: toBeatmap returns zero notes', () => {
    const store = useRecordingStore.getState();
    store.startRecording('/path/to/song.mp3', 'Empty Recording', 30);
    store.finishRecording();

    const beatmap = useRecordingStore.getState().toBeatmap();
    expect(beatmap.notes).toEqual([]);
    expect(beatmap.songTitle).toBe('Empty Recording');
    expect(beatmap.duration).toBe(30);
  });

  it('re-record resets state for fresh recording', () => {
    const store = useRecordingStore.getState();
    store.startRecording('/path/to/song.mp3', 'First Take', 60);

    useRecordingStore.getState().recordKeyDown('left', 1.0);
    useRecordingStore.getState().recordKeyUp('left', 1.1);
    useRecordingStore.getState().finishRecording();

    expect(useRecordingStore.getState().keypresses).toHaveLength(1);

    // Reset for re-record
    useRecordingStore.getState().reset();

    expect(useRecordingStore.getState().keypresses).toHaveLength(0);
    expect(useRecordingStore.getState().isRecording).toBe(false);
    expect(useRecordingStore.getState().audioSourcePath).toBeNull();

    // Start fresh
    useRecordingStore.getState().startRecording('/path/to/song.mp3', 'Second Take', 60);
    useRecordingStore.getState().recordKeyDown('right', 5.0);
    useRecordingStore.getState().recordKeyUp('right', 5.1);
    useRecordingStore.getState().finishRecording();

    expect(useRecordingStore.getState().keypresses).toHaveLength(1);
    expect(useRecordingStore.getState().keypresses[0].lane).toBe('right');
  });
});
