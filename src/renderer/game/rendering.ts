export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;
export const LANE_WIDTH = 100;
export const HIT_ZONE_HEIGHT = 10;
export const HIT_ZONE_Y = CANVAS_HEIGHT * 0.75; // 1/4 from bottom

export function drawLanes(ctx: CanvasRenderingContext2D): void {
  const leftLaneX = CANVAS_WIDTH / 2 - LANE_WIDTH - 50;
  const rightLaneX = CANVAS_WIDTH / 2 + 50;

  // Draw left lane border
  ctx.strokeStyle = '#333333';
  ctx.lineWidth = 2;
  ctx.strokeRect(leftLaneX, 0, LANE_WIDTH, CANVAS_HEIGHT);

  // Draw right lane border
  ctx.strokeRect(rightLaneX, 0, LANE_WIDTH, CANVAS_HEIGHT);
}

export function drawHitZones(ctx: CanvasRenderingContext2D): void {
  const leftLaneX = CANVAS_WIDTH / 2 - LANE_WIDTH - 50;
  const rightLaneX = CANVAS_WIDTH / 2 + 50;

  // Draw left hit zone
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(leftLaneX, HIT_ZONE_Y, LANE_WIDTH, HIT_ZONE_HEIGHT);

  // Draw right hit zone
  ctx.fillRect(rightLaneX, HIT_ZONE_Y, LANE_WIDTH, HIT_ZONE_HEIGHT);
}

export function drawAccuracy(
  ctx: CanvasRenderingContext2D,
  accuracy: number,
  textColor?: string
): void {
  ctx.fillStyle = textColor ?? '#CCCCCC';
  ctx.font = '24px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(
    `${accuracy.toFixed(1)}%`,
    CANVAS_WIDTH / 2,
    CANVAS_HEIGHT - 30
  );
}
