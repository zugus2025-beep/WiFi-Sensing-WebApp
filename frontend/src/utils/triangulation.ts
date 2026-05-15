import type { ESP32Node, Position } from '@/types/csi'

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
