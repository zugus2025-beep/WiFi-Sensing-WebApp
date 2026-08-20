import type { ESP32Node } from '@/types/csi'
import {
  DOOR_WIDTH, MATERIAL_PROPERTIES, NODE_HEIGHT, NODES, OBSTACLES, ROOM_MARGIN,
  ROOM_SIZE, WALL_ATTENUATION_DB, WALL_HEIGHT, type Obstacle,
} from './obstacles'

// Simple log-distance path-loss model, tuned for a 2.4GHz ESP32 node in a
// small room. Not a certified RF model — good enough that "closer to a
// node", "behind an obstacle" and "through the wall" behave the way they
// physically should on a coverage map.
const TX_POWER_DBM = 20
const REF_DISTANCE = 1
const REF_LOSS_DB = 40
const PATH_LOSS_EXPONENT = 2.4
const REFLECTION_BAND_M = 0.35
const REFLECTION_BOOST_DB = 6

// The four room walls as line segments, with a gap left open for the door.
const DOOR_X0 = ROOM_SIZE / 2 - DOOR_WIDTH / 2
const DOOR_X1 = ROOM_SIZE / 2 + DOOR_WIDTH / 2
const WALL_SEGMENTS: [number, number, number, number][] = [
  [0, 0, ROOM_SIZE, 0],                 // north
  [0, 0, 0, ROOM_SIZE],                 // west
  [ROOM_SIZE, 0, ROOM_SIZE, ROOM_SIZE], // east
  [0, ROOM_SIZE, DOOR_X0, ROOM_SIZE],   // south, left of door
  [DOOR_X1, ROOM_SIZE, ROOM_SIZE, ROOM_SIZE], // south, right of door
]

function segmentsIntersect(
  ax: number, ay: number, bx: number, by: number,
  cx: number, cy: number, dx: number, dy: number
): boolean {
  const d1x = bx - ax, d1y = by - ay
  const d2x = dx - cx, d2y = dy - cy
  const denom = d1x * d2y - d1y * d2x
  if (Math.abs(denom) < 1e-9) return false
  const t = ((cx - ax) * d2y - (cy - ay) * d2x) / denom
  const u = ((cx - ax) * d1y - (cy - ay) * d1x) / denom
  return t > 0.001 && t < 0.999 && u > 0.001 && u < 0.999
}

function pointInObstacleFootprint(px: number, py: number, o: Obstacle): boolean {
  if (o.shape === 'circle') {
    return Math.hypot(px - o.x, py - o.y) <= (o.r ?? 0)
  }
  const rot = o.rot ?? 0
  const dx = px - o.x
  const dy = py - o.y
  const cos = Math.cos(-rot)
  const sin = Math.sin(-rot)
  const lx = dx * cos - dy * sin
  const ly = dx * sin + dy * cos
  return Math.abs(lx) <= (o.w ?? 0) / 2 && Math.abs(ly) <= (o.h ?? 0) / 2
}

/** Distance from (px,py) to an obstacle's footprint edge — 0 if inside. */
function distanceToObstacleSurface(px: number, py: number, o: Obstacle): number {
  if (o.shape === 'circle') {
    return Math.max(0, Math.hypot(px - o.x, py - o.y) - (o.r ?? 0))
  }
  const rot = o.rot ?? 0
  const dx = px - o.x
  const dy = py - o.y
  const cos = Math.cos(-rot)
  const sin = Math.sin(-rot)
  const lx = dx * cos - dy * sin
  const ly = dx * sin + dy * cos
  const ex = Math.max(Math.abs(lx) - (o.w ?? 0) / 2, 0)
  const ey = Math.max(Math.abs(ly) - (o.h ?? 0) / 2, 0)
  return Math.hypot(ex, ey)
}

/** Sum of material attenuation for every obstacle a 3D path crosses (height-aware). */
function obstacleAttenuationDb(
  x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, obstacles: Obstacle[]
): number {
  const SAMPLES = 16
  let total = 0
  for (const o of obstacles) {
    for (let s = 1; s < SAMPLES; s++) {
      const t = s / SAMPLES
      const px = x0 + (x1 - x0) * t
      const py = y0 + (y1 - y0) * t
      const pz = z0 + (z1 - z0) * t
      if (pz <= o.height && pointInObstacleFootprint(px, py, o)) {
        total += MATERIAL_PROPERTIES[o.material].attenuationDb
        break
      }
    }
  }
  return total
}

/** Attenuation from crossing room walls — the open door counts as free space. */
function wallAttenuationDb(x0: number, y0: number, x1: number, y1: number): number {
  let total = 0
  for (const [wx0, wy0, wx1, wy1] of WALL_SEGMENTS) {
    if (segmentsIntersect(x0, y0, x1, y1, wx0, wy0, wx1, wy1)) total += WALL_ATTENUATION_DB
  }
  return total
}

/** Estimated RSSI (dBm) at a 3D room point from the strongest visible node. */
export function rssiAt(
  x: number, y: number, z = 1.0,
  nodes: ESP32Node[] = NODES,
  obstacles: Obstacle[] = OBSTACLES
): number {
  let best = -120
  for (const n of nodes) {
    const d = Math.max(
      REF_DISTANCE,
      Math.hypot(x - n.position.x, y - n.position.y, z - NODE_HEIGHT)
    )
    const pathLoss = REF_LOSS_DB + 10 * PATH_LOSS_EXPONENT * Math.log10(d / REF_DISTANCE)
    const obstruction = obstacleAttenuationDb(n.position.x, n.position.y, NODE_HEIGHT, x, y, z, obstacles)
    const walls = wallAttenuationDb(n.position.x, n.position.y, x, y)
    const rssi = TX_POWER_DBM - pathLoss - obstruction - walls
    if (rssi > best) best = rssi
  }

  // Reflective (metal) surfaces create a near-field multipath hotspot
  // just outside the object, even while the direct path is shadowed.
  for (const o of obstacles) {
    if (!MATERIAL_PROPERTIES[o.material].reflective || z > o.height + 0.3) continue
    const d = distanceToObstacleSurface(x, y, o)
    if (d > 0 && d < REFLECTION_BAND_M) {
      best += (1 - d / REFLECTION_BAND_M) * REFLECTION_BOOST_DB
    }
  }

  return best
}

/** Map dBm to a 0..1 coverage strength for color scales. */
export function normalizedSignal(rssiDbm: number): number {
  return Math.max(0, Math.min(1, (rssiDbm + 88) / 58))
}

export interface SignalGrid {
  res: number
  minX: number
  minY: number
  span: number
  values: Float32Array // res*res, row-major, normalized 0..1
}

/**
 * Precompute a coverage grid once — nodes/obstacles are static per scene.
 * Covers the room plus its margin, at a fixed height, so the map shows
 * signal leaking past the walls the way real WiFi actually does.
 */
export function buildSignalGrid(
  res = 56,
  nodes: ESP32Node[] = NODES,
  obstacles: Obstacle[] = OBSTACLES,
  height = 1.0
): SignalGrid {
  const minX = -ROOM_MARGIN
  const minY = -ROOM_MARGIN
  const span = ROOM_SIZE + ROOM_MARGIN * 2
  const values = new Float32Array(res * res)
  const cell = span / res
  for (let j = 0; j < res; j++) {
    for (let i = 0; i < res; i++) {
      const x = minX + (i + 0.5) * cell
      const y = minY + (j + 0.5) * cell
      values[j * res + i] = normalizedSignal(rssiAt(x, y, height, nodes, obstacles))
    }
  }
  return { res, minX, minY, span, values }
}

export interface SignalPoint {
  x: number; y: number; z: number; strength: number
}

/**
 * Sparse volumetric sample of the coverage field — used by the 3D map so
 * the signal actually varies across x, y AND z instead of a flat texture.
 */
export function buildSignalPointCloud(
  resXY = 16,
  resZ = 7,
  nodes: ESP32Node[] = NODES,
  obstacles: Obstacle[] = OBSTACLES
): SignalPoint[] {
  const minX = -ROOM_MARGIN
  const minY = -ROOM_MARGIN
  const span = ROOM_SIZE + ROOM_MARGIN * 2
  const cell = span / resXY
  const zStep = WALL_HEIGHT / (resZ - 1)
  const points: SignalPoint[] = []
  for (let k = 0; k < resZ; k++) {
    const z = k * zStep
    for (let j = 0; j < resXY; j++) {
      const y = minY + (j + 0.5) * cell
      for (let i = 0; i < resXY; i++) {
        const x = minX + (i + 0.5) * cell
        const strength = normalizedSignal(rssiAt(x, y, z, nodes, obstacles))
        if (strength > 0.1) points.push({ x, y, z, strength })
      }
    }
  }
  return points
}

// Thermal-style coverage ramp: weak → strong.
const RAMP: [number, string][] = [
  [0.0, '#0b1220'],
  [0.28, '#185FA5'],
  [0.55, '#1D9E75'],
  [0.8, '#e8b23d'],
  [1.0, '#E24B4A'],
]

function hexToRgb(hex: string): [number, number, number] {
  const v = parseInt(hex.slice(1), 16)
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255]
}

export function signalColor(t: number): [number, number, number] {
  const c = Math.max(0, Math.min(1, t))
  for (let i = 1; i < RAMP.length; i++) {
    const [t0, c0] = RAMP[i - 1]
    const [t1, c1] = RAMP[i]
    if (c <= t1) {
      const localT = (c - t0) / (t1 - t0 || 1)
      const rgb0 = hexToRgb(c0)
      const rgb1 = hexToRgb(c1)
      return [
        Math.round(rgb0[0] + (rgb1[0] - rgb0[0]) * localT),
        Math.round(rgb0[1] + (rgb1[1] - rgb0[1]) * localT),
        Math.round(rgb0[2] + (rgb1[2] - rgb0[2]) * localT),
      ]
    }
  }
  return hexToRgb(RAMP[RAMP.length - 1][1])
}

/** Render a signal grid to an offscreen canvas — used by the 2D map. */
export function renderSignalGridToCanvas(grid: SignalGrid): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = grid.res
  canvas.height = grid.res
  const ctx = canvas.getContext('2d')!
  const img = ctx.createImageData(grid.res, grid.res)
  for (let idx = 0; idx < grid.values.length; idx++) {
    const [r, g, b] = signalColor(grid.values[idx])
    img.data[idx * 4] = r
    img.data[idx * 4 + 1] = g
    img.data[idx * 4 + 2] = b
    img.data[idx * 4 + 3] = 255
  }
  ctx.putImageData(img, 0, 0)
  return canvas
}
