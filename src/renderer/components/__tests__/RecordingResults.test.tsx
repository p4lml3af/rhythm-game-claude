import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RecordingResults } from '../RecordingResults';
import { useRecordingStore } from '../../stores/recordingStore';

describe('RecordingResults', () => {
  const defaultProps = {
    onSave: vi.fn(),
    onEditInEditor: vi.fn(),
    onReRecord: vi.fn(),
    onDiscard: vi.fn(),
  };

  beforeEach(() => {
    useRecordingStore.getState().reset();
    vi.clearAllMocks();
  });

  it('renders recording results screen', () => {
    render(<RecordingResults {...defaultProps} />);
    expect(screen.getByTestId('screen-recording-results')).toBeTruthy();
    expect(screen.getByText('Recording Complete')).toBeTruthy();
  });

  it('shows note stats', () => {
    const store = useRecordingStore.getState();
    store.startRecording('/path/audio.mp3', 'Test Song', 60);

    // Record 2 taps and 1 hold
    useRecordingStore.getState().recordKeyDown('left', 1.0);
    useRecordingStore.getState().recordKeyUp('left', 1.1);
    useRecordingStore.getState().recordKeyDown('right', 2.0);
    useRecordingStore.getState().recordKeyUp('right', 2.1);
    useRecordingStore.getState().recordKeyDown('left', 3.0);
    useRecordingStore.getState().recordKeyUp('left', 3.5); // hold
    useRecordingStore.getState().finishRecording();

    render(<RecordingResults {...defaultProps} />);
    expect(screen.getByText('3')).toBeTruthy(); // total
    expect(screen.getByText('2')).toBeTruthy(); // taps
    expect(screen.getByText('1')).toBeTruthy(); // holds
  });

  it('shows no-notes warning when no notes recorded', () => {
    const store = useRecordingStore.getState();
    store.startRecording('/path/audio.mp3', 'Test Song', 60);
    store.finishRecording();

    render(<RecordingResults {...defaultProps} />);
    expect(screen.getByTestId('no-notes-warning')).toBeTruthy();
  });

  it('save button is disabled when no notes recorded', () => {
    const store = useRecordingStore.getState();
    store.startRecording('/path/audio.mp3', 'Test Song', 60);
    store.finishRecording();

    render(<RecordingResults {...defaultProps} />);
    const saveBtn = screen.getByTestId('button-save-recording');
    expect(saveBtn).toHaveProperty('disabled', true);
  });

  it('calls onEditInEditor when edit button clicked', () => {
    const onEditInEditor = vi.fn();
    render(<RecordingResults {...defaultProps} onEditInEditor={onEditInEditor} />);
    fireEvent.click(screen.getByTestId('button-edit-in-editor'));
    expect(onEditInEditor).toHaveBeenCalledOnce();
  });

  it('calls onReRecord when re-record button clicked', () => {
    const onReRecord = vi.fn();
    render(<RecordingResults {...defaultProps} onReRecord={onReRecord} />);
    fireEvent.click(screen.getByTestId('button-re-record'));
    expect(onReRecord).toHaveBeenCalledOnce();
  });

  it('requires double-click to discard', () => {
    const onDiscard = vi.fn();
    render(<RecordingResults {...defaultProps} onDiscard={onDiscard} />);

    // First click shows confirmation
    fireEvent.click(screen.getByTestId('button-discard-recording'));
    expect(onDiscard).not.toHaveBeenCalled();
    expect(screen.getByText(/Discard recorded notes/)).toBeTruthy();

    // Second click confirms
    fireEvent.click(screen.getByTestId('button-discard-recording'));
    expect(onDiscard).toHaveBeenCalledOnce();
  });

  it('allows editing song title', () => {
    const store = useRecordingStore.getState();
    store.startRecording('/path/audio.mp3', 'Original Title', 60);

    render(<RecordingResults {...defaultProps} />);
    const input = screen.getByTestId('input-song-title') as HTMLInputElement;
    expect(input.value).toBe('Original Title');

    fireEvent.change(input, { target: { value: 'New Title' } });
    expect(useRecordingStore.getState().songTitle).toBe('New Title');
  });

  it('allows editing BPM', () => {
    render(<RecordingResults {...defaultProps} />);
    const input = screen.getByTestId('input-bpm') as HTMLInputElement;
    expect(input.value).toBe('120');

    fireEvent.change(input, { target: { value: '140' } });
    expect(useRecordingStore.getState().bpm).toBe(140);
  });
});
