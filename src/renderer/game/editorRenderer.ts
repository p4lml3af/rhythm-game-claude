import type { Note } from '../../shared/types';

const RULER_HEIGHT = 30;
const LANE_LABEL_WIDTH = 0;

export function getRulerHeight(): number {
  return RULER_HEIGHT;
}

export function xToTimestamp(x: number, scrollPosition: number, zoom: number): number {
  return scrollPosition + x / zoom;
}

export function timestampToX(timestamp: number, scrollPosition: number, zoom: number): number {
  return (timestamp - scrollPosition) * zoom;
}

export function yToLane(
  y: number,
  canvasHeight: number,
): 'left' | 'right' | null {
  const laneAreaY = y - RULER_HEIGHT;
  const laneHeight = (canvasHeight - RULER_HEIGHT) / 2;
  if (laneAreaY < 0) return null;
  return laneAreaY < laneHeight ? 'left' : 'right';
}

export function snapToGrid(timestamp: number, bpm: number, subdivision: number = 4): number {
  const beatInterval = 60 / bpm;
  const gridInterval = beatInterval / subdivision;
  return Math.round(timestamp / gridInterval) * gridInterval;
}

export function drawTimeRuler(
  ctx: CanvasRenderingContext2D,
  scrollPosition: number,
  zoom: number,
  duration: number,
  bpm: number,
  width: number,
): void {
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(0, 0, width, RULER_HEIGHT);
  ctx.strokeStyle = '#333333';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, RULER_HEIGHT);
  ctx.lineTo(width, RULER_HEIGHT);
  ctx.stroke();

  const beatInterval = 60 / bpm;
  const startBeat = Math.floor(scrollPosition / beatInterval);
  const endTime = scrollPosition + width / zoom;

  ctx.fillStyle = '#888888';
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'center';

  for (let beat = startBeat; beat * beatInterval <= endTime && beat * beatInterval <= duration; beat++) {
    const time = beat * beatInterval;
    const x = timestampToX(time, scrollPosition, zoom);
    if (x < 0) continue;

    const isMeasure = beat % 4 === 0;
    ctx.strokeStyle = isMeasure ? '#666666' : '#444444';
    ctx.beginPath();
    ctx.moveTo(x, isMeasure ? 0 : RULER_HEIGHT * 0.5);
    ctx.lineTo(x, RULER_HEIGHT);
    ctx.stroke();

    if (isMeasure) {
      const seconds = Math.floor(time);
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      ctx.fillText(`${m}:${s.toString().padStart(2, '0')}`, x, 12);
    }
  }
}

export function drawLanes(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
): void {
  const laneHeight = (height - RULER_HEIGHT) / 2;
  const midY = RULER_HEIGHT + laneHeight;

  // Lane backgrounds
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, RULER_HEIGHT, width, laneHeight);
  ctx.fillStyle = '#080808';
  ctx.fillRect(0, midY, width, laneHeight);

  // Lane divider
  ctx.strokeStyle = '#333333';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, midY);
  ctx.lineTo(width, midY);
  ctx.stroke();

  // Lane labels
  ctx.fillStyle = '#444444';
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('L', 4, RULER_HEIGHT + 16);
  ctx.fillText('R', 4, midY + 16);
}

export function drawBPMGrid(
  ctx: CanvasRenderingContext2D,
  scrollPosition: number,
  zoom: number,
  bpm: number,
  duration: number,
  height: number,
  width: number,
): void {
  const beatInterval = 60 / bpm;
  const startBeat = Math.floor(scrollPosition / beatInterval);
  const endTime = scrollPosition + width / zoom;

  for (let beat = startBeat; beat * beatInterval <= endTime && beat * beatInterval <= duration; beat++) {
    const time = beat * beatInterval;
    const x = timestampToX(time, scrollPosition, zoom);
    if (x < 0) continue;

    const isMeasure = beat % 4 === 0;
    ctx.strokeStyle = isMeasure ? '#2a2a2a' : '#1a1a1a';
    ctx.lineWidth = isMeasure ? 1 : 0.5;
    ctx.beginPath();
    ctx.moveTo(x, RULER_HEIGHT);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
}

export function drawNotes(
  ctx: CanvasRenderingContext2D,
  notes: Note[],
  scrollPosition: number,
  zoom: number,
  canvasHeight: number,
  canvasWidth: number,
  selectedNoteId: string | null,
  colors: { tap: string; hold: string },
): void {
  const laneHeight = (canvasHeight - RULER_HEIGHT) / 2;
  const noteHeight = laneHeight * 0.6;
  const noteMarginTop = (laneHeight - noteHeight) / 2;

  for (const note of notes) {
    const x = timestampToX(note.timestamp, scrollPosition, zoom);

    // Cull notes outside viewport
    const noteEndX = note.type === 'hold' && note.duration
      ? timestampToX(note.timestamp + note.duration, scrollPosition, zoom)
      : x + 12;
    if (noteEndX < 0 || x > canvasWidth) continue;

    const laneY = note.lane === 'left'
      ? RULER_HEIGHT + noteMarginTop
      : RULER_HEIGHT + laneHeight + noteMarginTop;

    const isSelected = note.id === selectedNoteId;

    if (note.type === 'hold' && note.duration) {
      const width = Math.max(note.duration * zoom, 4);
      ctx.fillStyle = colors.hold;
      ctx.globalAlpha = isSelected ? 1.0 : 0.7;
      ctx.fillRect(x, laneY, width, noteHeight);
      if (isSelected) {
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, laneY, width, noteHeight);
      }
    } else {
      const tapWidth = 12;
      ctx.fillStyle = colors.tap;
      ctx.globalAlpha = isSelected ? 1.0 : 0.7;
      ctx.fillRect(x - tapWidth / 2, laneY, tapWidth, noteHeight);
      if (isSelected) {
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.strokeRect(x - tapWidth / 2, laneY, tapWidth, noteHeight);
      }
    }
    ctx.globalAlpha = 1.0;
  }
}

export function drawPlayhead(
  ctx: CanvasRenderingContext2D,
  playheadTime: number,
  scrollPosition: number,
  zoom: number,
  height: number,
): void {
  const x = timestampToX(playheadTime, scrollPosition, zoom);
  if (x < 0) return;

  ctx.strokeStyle = '#FF3333';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, 0);
  ctx.lineTo(x, height);
  ctx.stroke();

  // Playhead triangle at top
  ctx.fillStyle = '#FF3333';
  ctx.beginPath();
  ctx.moveTo(x, 0);
  ctx.lineTo(x - 5, 0);
  ctx.lineTo(x, 10);
  ctx.lineTo(x + 5, 0);
  ctx.closePath();
  ctx.fill();
}

export function drawHoldNotePreview(
  ctx: CanvasRenderingContext2D,
  startX: number,
  currentX: number,
  lane: 'left' | 'right',
  canvasHeight: number,
): void {
  const laneHeight = (canvasHeight - RULER_HEIGHT) / 2;
  const noteHeight = laneHeight * 0.6;
  const noteMarginTop = (laneHeight - noteHeight) / 2;
  const laneY = lane === 'left'
    ? RULER_HEIGHT + noteMarginTop
    : RULER_HEIGHT + laneHeight + noteMarginTop;

  const width = Math.max(currentX - startX, 4);

  ctx.fillStyle = '#FF0000';
  ctx.globalAlpha = 0.4;
  ctx.fillRect(startX, laneY, width, noteHeight);
  ctx.strokeStyle = '#FF4444';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.strokeRect(startX, laneY, width, noteHeight);
  ctx.setLineDash([]);
  ctx.globalAlpha = 1.0;
}
