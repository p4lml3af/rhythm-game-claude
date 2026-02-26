import type { Note } from '../../shared/types';
import { CANVAS_WIDTH, CANVAS_HEIGHT, LANE_WIDTH, HIT_ZONE_Y } from './rendering';

const NOTE_HEIGHT = 20;
const NOTE_SCROLL_SPEED = 200; // pixels per second
const SCROLL_DISTANCE = CANVAS_HEIGHT - HIT_ZONE_Y; // Distance from top to hit zone

export function calculateNoteY(noteTimestamp: number, currentTime: number): number {
  const timeUntilHit = noteTimestamp - currentTime;
  const distanceFromHitZone = timeUntilHit * NOTE_SCROLL_SPEED;
  return HIT_ZONE_Y - distanceFromHitZone;
}

export function drawNote(
  ctx: CanvasRenderingContext2D,
  note: Note,
  y: number
): void {
  const laneX = note.lane === 'left'
    ? CANVAS_WIDTH / 2 - LANE_WIDTH - 50
    : CANVAS_WIDTH / 2 + 50;

  const noteX = laneX + LANE_WIDTH / 2 - 25; // Center in lane

  if (note.type === 'hold' && note.duration) {
    // Hold note: red extended bar
    ctx.fillStyle = '#FF0000';
    const holdHeight = note.duration * NOTE_SCROLL_SPEED;
    // Bar extends upward from y (start) by holdHeight pixels
    ctx.fillRect(noteX, y - holdHeight, 50, holdHeight + NOTE_HEIGHT);
  } else {
    // Tap note: blue rectangle
    ctx.fillStyle = '#0000FF';
    ctx.fillRect(noteX, y, 50, NOTE_HEIGHT);
  }
}

export function calculateHoldNoteEndY(note: Note, currentTime: number): number {
  const endTimestamp = note.timestamp + (note.duration ?? 0);
  return calculateNoteY(endTimestamp, currentTime);
}

export function isNoteOnScreen(y: number, holdHeight: number = 0): boolean {
  return y >= -NOTE_HEIGHT && (y - holdHeight) <= CANVAS_HEIGHT;
}

export function isNoteInHitZone(y: number): boolean {
  const tolerance = 50; // Pixels of tolerance
  return Math.abs(y - HIT_ZONE_Y) <= tolerance;
}
