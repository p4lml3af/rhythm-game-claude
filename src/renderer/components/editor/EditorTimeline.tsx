import React, { useRef, useEffect, useCallback } from 'react';
import { useEditorStore } from '../../stores/editorStore';
import { useSettingsStore } from '../../stores/settingsStore';
import {
  drawTimeRuler,
  drawLanes,
  drawBPMGrid,
  drawNotes,
  drawPlayhead,
  drawHoldNotePreview,
  xToTimestamp,
  timestampToX,
  yToLane,
  getRulerHeight,
  snapToGrid,
} from '../../game/editorRenderer';

export const EditorTimeline: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);
  const holdDragRef = useRef<{
    startX: number;
    lane: 'left' | 'right';
    startTimestamp: number;
  } | null>(null);

  const {
    notes,
    bpm,
    duration,
    scrollPosition,
    zoom,
    selectedTool,
    selectedNoteId,
    playheadTime,
    isPlaying,
    addNote,
    removeNote,
    selectNote,
    setScrollPosition,
    setZoom,
    setPlayheadTime,
  } = useEditorStore();

  const { settings } = useSettingsStore();

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // Clear
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, w, h);

    // Draw layers
    drawLanes(ctx, w, h);
    drawBPMGrid(ctx, scrollPosition, zoom, bpm, duration, h, w);
    drawNotes(ctx, notes, scrollPosition, zoom, h, w, selectedNoteId, {
      tap: settings.colors.tap,
      hold: settings.colors.hold,
    });
    drawTimeRuler(ctx, scrollPosition, zoom, duration, bpm, w);
    drawPlayhead(ctx, playheadTime, scrollPosition, zoom, h);

    // Hold note preview during drag
    if (holdDragRef.current) {
      // We'll redraw with preview in the mouse move handler
    }
  }, [notes, bpm, duration, scrollPosition, zoom, selectedNoteId, playheadTime, settings.colors]);

  // Render loop
  useEffect(() => {
    const loop = () => {
      draw();
      animFrameRef.current = requestAnimationFrame(loop);
    };
    animFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [draw]);

  // Resize canvas to container
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const observer = new ResizeObserver(() => {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    });
    observer.observe(container);
    // Initial size
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;

    return () => observer.disconnect();
  }, []);

  const findNoteAtPosition = (x: number, y: number): string | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const timestamp = xToTimestamp(x, scrollPosition, zoom);
    const lane = yToLane(y, canvas.height);
    if (!lane) return null;

    const laneHeight = (canvas.height - getRulerHeight()) / 2;
    const noteHeight = laneHeight * 0.6;

    // Search notes in reverse (top-most first)
    for (let i = notes.length - 1; i >= 0; i--) {
      const note = notes[i];
      if (note.lane !== lane) continue;

      if (note.type === 'hold' && note.duration) {
        if (timestamp >= note.timestamp && timestamp <= note.timestamp + note.duration) {
          return note.id || null;
        }
      } else {
        const tapHalfWidth = 6 / zoom; // 6px in time-space
        if (Math.abs(timestamp - note.timestamp) <= tapHalfWidth) {
          return note.id || null;
        }
      }
    }
    return null;
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Right-click: delete note
    if (e.button === 2) {
      const noteId = findNoteAtPosition(x, y);
      if (noteId) removeNote(noteId);
      return;
    }

    const lane = yToLane(y, canvas.height);
    if (!lane) {
      // Clicked on ruler — set playhead
      const time = xToTimestamp(x, scrollPosition, zoom);
      setPlayheadTime(Math.max(0, Math.min(duration, time)));
      return;
    }

    const noteId = findNoteAtPosition(x, y);

    if (selectedTool === 'erase') {
      if (noteId) removeNote(noteId);
      return;
    }

    if (noteId) {
      selectNote(noteId);
      return;
    }

    // Place new note
    const rawTimestamp = xToTimestamp(x, scrollPosition, zoom);
    const timestamp = snapToGrid(rawTimestamp, bpm);
    if (timestamp < 0 || timestamp > duration) return;

    if (selectedTool === 'tap') {
      addNote(lane, timestamp, 'tap');
    } else if (selectedTool === 'hold') {
      // Start hold drag
      holdDragRef.current = {
        startX: x,
        lane,
        startTimestamp: timestamp,
      };
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!holdDragRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const currentX = e.clientX - rect.left;

    // Redraw with hold preview
    draw();
    drawHoldNotePreview(
      ctx,
      holdDragRef.current.startX,
      currentX,
      holdDragRef.current.lane,
      canvas.height,
    );
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!holdDragRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const endX = e.clientX - rect.left;
    const rawEnd = xToTimestamp(endX, scrollPosition, zoom);
    const endTimestamp = snapToGrid(rawEnd, bpm);
    const dur = endTimestamp - holdDragRef.current.startTimestamp;

    if (dur > 0.05) {
      addNote(
        holdDragRef.current.lane,
        holdDragRef.current.startTimestamp,
        'hold',
        dur,
      );
    } else {
      // Too short — place as tap
      addNote(holdDragRef.current.lane, holdDragRef.current.startTimestamp, 'tap');
    }

    holdDragRef.current = null;
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (e.ctrlKey) {
      // Zoom
      const delta = e.deltaY > 0 ? -10 : 10;
      setZoom(zoom + delta);
    } else {
      // Scroll
      const scrollDelta = e.deltaY / zoom;
      setScrollPosition(Math.max(0, scrollPosition + scrollDelta));
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  return (
    <div
      ref={containerRef}
      style={{ flex: 1, overflow: 'hidden', position: 'relative' }}
    >
      <canvas
        ref={canvasRef}
        data-testid="canvas-editor-timeline"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        onContextMenu={handleContextMenu}
        style={{ display: 'block', cursor: 'crosshair' }}
      />
    </div>
  );
};
