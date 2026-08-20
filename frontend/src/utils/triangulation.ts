import type { ESP32Node, Position } from '@/types/csi'
import { ROOM_MARGIN, ROOM_SIZE } from './obstacles'

/**
 * Estimate 2D position from RSSI values of 3 nodes using weighted centroid.
 * Used when real trilateration is not possible without distance calibration.
 */
export function estimatePositionFromRSSI(
  nodes: ESP32Node[],
  rssiValues: number[]
): { x: number; y: number } | null {
  if (nodes.length < 2 || rssiValues.length < 2) return null

  // Convert RSSI to weights (higher RSSI = closer = more weight)
  const weights = rssiValues.map(r => Math.pow(10, (r + 100) / 20))
  const totalWeight = weights.reduce((a, b) => a + b, 0)

  const x = nodes.reduce((sum, n, i) => sum + n.position.x * weights[i], 0) / totalWeight
  const y = nodes.reduce((sum, n, i) => sum + n.position.y * weights[i], 0) / totalWeight

  return { x: Math.max(0, Math.min(5, x)), y: Math.max(0, Math.min(5, y)) }
}

/**
 * Calculate triangulation lines from each node to the detected person position.
 * Returns line endpoints for rendering.
 */
export function getTriangulationLines(
  nodes: ESP32Node[],
  personPos: Position
): Array<{ x1: number; y1: number; x2: number; y2: number }> {
  return nodes.map(node => ({
    x1: node.position.x,
    y1: node.position.y,
    x2: personPos.x,
    y2: personPos.y,
  }))
}

/** Convert room coordinates (0–5m) to canvas pixels. */
export function roomToCanvas(
  roomX: number,
  roomY: number,
  canvasSize: number,
  roomSize = 5
): { cx: number; cy: number } {
  const padding = canvasSize * 0.08
  const scale = (canvasSize - padding * 2) / roomSize
  return {
    cx: padding + roomX * scale,
    cy: padding + roomY * scale,
  }
}

/**
 * Convert room-local coordinates (0–5m, same frame as NODES/OBSTACLES) to
 * canvas pixels, but scaled against the room *plus its margin* — so a
 * point just outside the walls still lands on the visible canvas. Use
 * this (instead of roomToCanvas) whenever the margin band is drawn.
 */
export function simToCanvas(
  roomX: number,
  roomY: number,
  canvasSize: number,
  margin = ROOM_MARGIN,
  roomSize = ROOM_SIZE
): { cx: number; cy: number } {
  const simSize = roomSize + margin * 2
  const padding = canvasSize * 0.06
  const scale = (canvasSize - padding * 2) / simSize
  return {
    cx: padding + (roomX + margin) * scale,
    cy: padding + (roomY + margin) * scale,
  }
}

export function simScale(canvasSize: number, margin = ROOM_MARGIN, roomSize = ROOM_SIZE): number {
  const simSize = roomSize + margin * 2
  const padding = canvasSize * 0.06
  return (canvasSize - padding * 2) / simSize
}
