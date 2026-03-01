import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useEditorStore } from '../../stores/editorStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { EditorToolbar } from './EditorToolbar';
import { EditorSidePanel } from './EditorSidePanel';
import { EditorTimeline } from './EditorTimeline';
import { EditorTransport } from './EditorTransport';
import { AudioManager } from '../../game/audioManager';
import { validateBeatmap } from '../../../shared/beatmapValidator';

interface EditorScreenProps {
  onBack: () => void;
  onPreview: () => void;
}

export const EditorScreen: React.FC<EditorScreenProps> = ({ onBack, onPreview }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const audioManagerRef = useRef<AudioManager | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const store = useEditorStore();
  const { settings } = useSettingsStore();

  // Validate on every note/metadata change
  useEffect(() => {
    const beatmap = store.toBeatmap();
    const result = validateBeatmap(beatmap);
    setValidationErrors(result.errors);
  }, [store.notes, store.songTitle, store.bpm, store.duration]);

  // Load audio when audioSourcePath is set
  useEffect(() => {
    const loadAudio = async () => {
      if (!store.audioSourcePath) return;

      const manager = new AudioManager();
      try {
        // For editing an existing level, audioSourcePath will be an absolute file path
        // For new levels, it will also be a file path from the dialog
        // Convert to a URL the AudioManager can fetch
        let audioUrl = store.audioSourcePath;
        if (!audioUrl.startsWith('http') && !audioUrl.startsWith('/')) {
          // Windows absolute path — use file:// protocol
          audioUrl = 'file:///' + audioUrl.replace(/\\/g, '/');
        }
        await manager.loadAudio(audioUrl);
        manager.setVolume(settings.volume);
        audioManagerRef.current = manager;

        // Set duration from audio if not already set
        const audioDuration = manager.getDuration();
        if (audioDuration > 0 && store.duration === 0) {
          useEditorStore.setState({ duration: audioDuration });
        }
      } catch (err) {
        console.error('Failed to load editor audio:', err);
      }
    };
    loadAudio();

    return () => {
      if (audioManagerRef.current?.getIsPlaying()) {
        audioManagerRef.current.stop();
      }
    };
  }, [store.audioSourcePath]);

  // Volume sync
  useEffect(() => {
    audioManagerRef.current?.setVolume(settings.volume);
  }, [settings.volume]);

  const handleSave = useCallback(async () => {
    const beatmap = store.toBeatmap();
    const validation = validateBeatmap(beatmap);
    if (!validation.valid) {
      setValidationErrors(validation.errors);
      return;
    }

    if (store.sourceLevelId) {
      // Update existing
      const result = await window.electronAPI?.updateBeatmap({
        levelId: store.sourceLevelId,
        beatmap,
      });
      if (result?.success) {
        useEditorStore.setState({ isModified: false });
      } else {
        alert(`Save failed: ${result?.error || 'Unknown error'}`);
      }
    } else {
      // Save new level
      const levelName = store.songTitle || 'untitled';
      const result = await window.electronAPI?.saveLevel({
        levelName,
        audioSourcePath: store.audioSourcePath!,
        beatmap,
      });
      if (result?.success) {
        useEditorStore.setState({
          isModified: false,
          sourceLevelId: result.levelId || null,
        });
      } else {
        alert(`Save failed: ${result?.error || 'Unknown error'}`);
      }
    }
  }, [store.sourceLevelId, store.songTitle, store.audioSourcePath]);

  const handleBack = useCallback(() => {
    if (store.isModified) {
      if (!confirm('You have unsaved changes. Discard changes?')) return;
    }
    // Stop audio
    if (audioManagerRef.current?.getIsPlaying()) {
      audioManagerRef.current.stop();
    }
    store.resetEditor();
    onBack();
  }, [store.isModified, onBack]);

  const handlePreview = useCallback(() => {
    if (audioManagerRef.current?.getIsPlaying()) {
      audioManagerRef.current.stop();
      store.setIsPlaying(false);
    }
    onPreview();
  }, [onPreview]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't handle if user is typing in an input
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') return;

      switch (e.key) {
        case '1':
          store.setTool('tap');
          break;
        case '2':
          store.setTool('hold');
          break;
        case '3':
          store.setTool('erase');
          break;
        case ' ':
          e.preventDefault();
          if (audioManagerRef.current) {
            if (store.isPlaying) {
              audioManagerRef.current.stop();
              store.setIsPlaying(false);
            } else {
              audioManagerRef.current.playFrom(store.playheadTime, () => {
                store.setIsPlaying(false);
              });
              store.setIsPlaying(true);
            }
          }
          break;
        case 'Delete':
        case 'Backspace':
          if (store.selectedNoteId) {
            store.removeNote(store.selectedNoteId);
          }
          break;
        case 'Home':
          e.preventDefault();
          store.setPlayheadTime(0);
          store.setScrollPosition(0);
          if (store.isPlaying && audioManagerRef.current) {
            audioManagerRef.current.playFrom(0);
          }
          break;
        case 'End':
          e.preventDefault();
          store.setPlayheadTime(store.duration);
          if (store.isPlaying && audioManagerRef.current) {
            audioManagerRef.current.stop();
            store.setIsPlaying(false);
          }
          break;
        case 'ArrowLeft':
          e.preventDefault();
          {
            const beatInterval = 60 / store.bpm;
            const newTime = Math.max(0, store.playheadTime - beatInterval);
            store.setPlayheadTime(newTime);
            if (store.isPlaying && audioManagerRef.current) {
              audioManagerRef.current.playFrom(newTime);
            }
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          {
            const beatInterval = 60 / store.bpm;
            const newTime = Math.min(store.duration, store.playheadTime + beatInterval);
            store.setPlayheadTime(newTime);
            if (store.isPlaying && audioManagerRef.current) {
              audioManagerRef.current.playFrom(newTime);
            }
          }
          break;
        case 'Escape':
          store.selectNote(null);
          break;
        case 's':
          if (e.ctrlKey) {
            e.preventDefault();
            handleSave();
          }
          break;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [store.isPlaying, store.playheadTime, store.selectedNoteId, store.bpm, store.duration, handleSave]);

  // Focus container on mount
  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  return (
    <div
      ref={containerRef}
      data-testid="screen-editor"
      tabIndex={0}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        backgroundColor: '#000000',
        color: '#CCCCCC',
        fontFamily: 'sans-serif',
        outline: 'none',
      }}
    >
      <EditorToolbar
        onBack={handleBack}
        onSave={handleSave}
        onPreview={handlePreview}
        validationErrors={validationErrors}
      />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <EditorSidePanel />
        <EditorTimeline />
      </div>
      <EditorTransport audioManager={audioManagerRef.current} />
    </div>
  );
};
