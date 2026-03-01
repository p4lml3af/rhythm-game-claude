import { describe, it, expect, beforeEach } from 'vitest';
import { useEditorStore } from '../editorStore';
import { validateBeatmap } from '../../../shared/beatmapValidator';

describe('editorStore', () => {
  beforeEach(() => {
    useEditorStore.getState().resetEditor();
  });

  it('starts with empty initial state', () => {
    const state = useEditorStore.getState();
    expect(state.notes).toEqual([]);
    expect(state.songTitle).toBe('');
    expect(state.bpm).toBe(120);
    expect(state.isModified).toBe(false);
    expect(state.selectedTool).toBe('tap');
  });

  it('addNote generates unique ID and sets isModified', () => {
    const { addNote } = useEditorStore.getState();
    addNote('left', 1.0, 'tap');

    const state = useEditorStore.getState();
    expect(state.notes).toHaveLength(1);
    expect(state.notes[0].id).toBeTruthy();
    expect(state.notes[0].lane).toBe('left');
    expect(state.notes[0].timestamp).toBe(1.0);
    expect(state.notes[0].type).toBe('tap');
    expect(state.isModified).toBe(true);
  });

  it('addNote creates hold notes with duration', () => {
    const { addNote } = useEditorStore.getState();
    addNote('right', 2.0, 'hold', 1.5);

    const state = useEditorStore.getState();
    expect(state.notes[0].type).toBe('hold');
    expect(state.notes[0].duration).toBe(1.5);
  });

  it('addNote keeps notes sorted by timestamp', () => {
    const { addNote } = useEditorStore.getState();
    addNote('left', 3.0, 'tap');
    addNote('right', 1.0, 'tap');
    addNote('left', 2.0, 'tap');

    const state = useEditorStore.getState();
    expect(state.notes.map((n) => n.timestamp)).toEqual([1.0, 2.0, 3.0]);
  });

  it('removeNote removes by ID and sets isModified', () => {
    const { addNote, removeNote } = useEditorStore.getState();
    addNote('left', 1.0, 'tap');
    addNote('right', 2.0, 'tap');

    const noteId = useEditorStore.getState().notes[0].id!;
    removeNote(noteId);

    const state = useEditorStore.getState();
    expect(state.notes).toHaveLength(1);
    expect(state.notes[0].timestamp).toBe(2.0);
  });

  it('removeNote clears selectedNoteId if selected note is removed', () => {
    const { addNote, selectNote, removeNote } = useEditorStore.getState();
    addNote('left', 1.0, 'tap');
    const noteId = useEditorStore.getState().notes[0].id!;
    selectNote(noteId);
    expect(useEditorStore.getState().selectedNoteId).toBe(noteId);

    removeNote(noteId);
    expect(useEditorStore.getState().selectedNoteId).toBeNull();
  });

  it('updateNote modifies note properties', () => {
    const { addNote, updateNote } = useEditorStore.getState();
    addNote('left', 1.0, 'tap');
    const noteId = useEditorStore.getState().notes[0].id!;

    updateNote(noteId, { lane: 'right', timestamp: 2.5 });

    const state = useEditorStore.getState();
    expect(state.notes[0].lane).toBe('right');
    expect(state.notes[0].timestamp).toBe(2.5);
    expect(state.isModified).toBe(true);
  });

  it('toBeatmap returns valid Beatmap with notes sorted', () => {
    const store = useEditorStore.getState();
    store.setBeatmapMetadata({ songTitle: 'Test Song', bpm: 120, duration: 30 });
    store.addNote('left', 5.0, 'tap');
    store.addNote('right', 2.0, 'tap');
    store.addNote('left', 10.0, 'hold', 2.0);

    const beatmap = useEditorStore.getState().toBeatmap();
    expect(beatmap.songTitle).toBe('Test Song');
    expect(beatmap.bpm).toBe(120);
    expect(beatmap.notes).toHaveLength(3);
    expect(beatmap.notes[0].timestamp).toBe(2.0);
    expect(beatmap.notes[1].timestamp).toBe(5.0);
    expect(beatmap.notes[2].timestamp).toBe(10.0);
    // IDs should be stripped
    expect(beatmap.notes[0]).not.toHaveProperty('id');
  });

  it('toBeatmap output passes validateBeatmap', () => {
    const store = useEditorStore.getState();
    store.setBeatmapMetadata({ songTitle: 'Test Song', bpm: 120, duration: 30 });
    store.addNote('left', 3.0, 'tap');
    store.addNote('right', 5.0, 'hold', 1.0);

    const beatmap = useEditorStore.getState().toBeatmap();
    const result = validateBeatmap(beatmap);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('resetEditor clears all state', () => {
    const store = useEditorStore.getState();
    store.setBeatmapMetadata({ songTitle: 'Test', bpm: 140, duration: 60 });
    store.addNote('left', 1.0, 'tap');
    store.setTool('erase');

    useEditorStore.getState().resetEditor();

    const state = useEditorStore.getState();
    expect(state.notes).toEqual([]);
    expect(state.songTitle).toBe('');
    expect(state.bpm).toBe(120);
    expect(state.selectedTool).toBe('tap');
    expect(state.isModified).toBe(false);
  });

  it('loadBeatmap populates state from existing beatmap', () => {
    const beatmap = {
      songTitle: 'Loaded Song',
      audioFile: 'audio.mp3',
      bpm: 140,
      duration: 45,
      notes: [
        { timestamp: 2.0, lane: 'left' as const, type: 'tap' as const },
        { timestamp: 4.0, lane: 'right' as const, type: 'hold' as const, duration: 1.0 },
      ],
    };

    useEditorStore.getState().loadBeatmap(beatmap, 'level-1', '/path/to/audio.mp3');

    const state = useEditorStore.getState();
    expect(state.songTitle).toBe('Loaded Song');
    expect(state.bpm).toBe(140);
    expect(state.duration).toBe(45);
    expect(state.notes).toHaveLength(2);
    expect(state.notes[0].id).toBeTruthy(); // IDs assigned
    expect(state.sourceLevelId).toBe('level-1');
    expect(state.audioSourcePath).toBe('/path/to/audio.mp3');
    expect(state.isModified).toBe(false);
  });

  it('setZoom clamps to min 50 and max 300', () => {
    const { setZoom } = useEditorStore.getState();

    setZoom(10);
    expect(useEditorStore.getState().zoom).toBe(50);

    setZoom(500);
    expect(useEditorStore.getState().zoom).toBe(300);

    setZoom(150);
    expect(useEditorStore.getState().zoom).toBe(150);
  });

  it('setTool updates selectedTool', () => {
    const { setTool } = useEditorStore.getState();

    setTool('hold');
    expect(useEditorStore.getState().selectedTool).toBe('hold');

    setTool('erase');
    expect(useEditorStore.getState().selectedTool).toBe('erase');

    setTool('tap');
    expect(useEditorStore.getState().selectedTool).toBe('tap');
  });
});
