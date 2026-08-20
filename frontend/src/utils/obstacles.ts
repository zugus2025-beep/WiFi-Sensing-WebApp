import type { ESP32Node } from '@/types/csi'

export const ROOM_SIZE = 5
export const WALL_HEIGHT = 2.2
export const NODE_HEIGHT = 1.7      // wall-mounted, meters off the floor
export const DOOR_WIDTH = 0.9       // meters, centered on the south wall
export const WALL_ATTENUATION_DB = 10

// Signal is simulated (and drawn) this far past the walls in every
// direction, so the maps show WiFi actually leaking into the hallway —
// that's the whole premise of through-wall CSI sensing.
export const ROOM_MARGIN = 1.3
export const SIM_SIZE = ROOM_SIZE + ROOM_MARGIN * 2

// One node per corner — a rectangular room gets a rectangular array.
export const NODES: ESP32Node[] = [
  { nodeId: 'A', position: { x: 0.4, y: 0.4 }, status: 'online' },
  { nodeId: 'B', position: { x: 4.6, y: 0.4 }, status: 'online' },
  { nodeId: 'C', position: { x: 4.6, y: 4.6 }, status: 'online' },
  { nodeId: 'D', position: { x: 0.4, y: 4.6 }, status: 'online' },
]

export type Material = 'concrete' | 'wood' | 'metal'

export interface Obstacle {
  id: string
  label: string
  material: Material
  shape: 'rect' | 'circle'
  x: number       // room meters
  y: number       // room meters
  w?: number      // rect width, meters
  h?: number      // rect depth, meters
  r?: number      // circle radius, meters
  rot?: number    // rect rotation, radians
  height: number  // meters — used for 3D extrusion + rough size weighting
}

/**
 * Rough RF behavior per material at 2.4GHz through a construction-site
 * scale obstruction. Not a certified propagation model — enough to make
 * the coverage map react sensibly to what's actually in the room.
 */
export const MATERIAL_PROPERTIES: Record<Material, {
  attenuationDb: number
  reflective: boolean
  color: string
  metalness: number
  roughness: number
}> = {
  concrete: { attenuationDb: 9,  reflective: false, color: '#8a8478', metalness: 0.05, roughness: 0.9 },
  wood:     { attenuationDb: 3,  reflective: false, color: '#a9835a', metalness: 0.0,  roughness: 0.8 },
  metal:    { attenuationDb: 14, reflective: true,  color: '#a9bdd0', metalness: 0.85, roughness: 0.25 },
}

// A room mid-build: masonry stacked in two corners, a cement/sand pile,
// a steel scaffold frame, a coiled cable spool, an aluminium ladder and
// a metal toolbox. Positions chosen to stay clear of the person's mock
// walking path (radius 1.5m around the room center).
export const OBSTACLES: Obstacle[] = [
  { id: 'brick-1',   label: 'Brick stack',      material: 'concrete', shape: 'rect',   x: 1.15, y: 1.05, w: 0.9,  h: 0.55, rot: -0.04, height: 0.6 },
  { id: 'brick-2',   label: 'Brick stack',      material: 'concrete', shape: 'rect',   x: 3.75, y: 3.55, w: 0.75, h: 0.5,  rot: 0.08,  height: 0.55 },
  { id: 'cement',    label: 'Cement pile',      material: 'concrete', shape: 'rect',   x: 0.65, y: 3.95, w: 0.7,  h: 0.55, rot: 0,     height: 0.5 },
  { id: 'scaffold',  label: 'Steel scaffold',   material: 'metal',    shape: 'rect',   x: 4.3,  y: 1.55, w: 0.5,  h: 1.15, rot: 0,     height: 2.0 },
  { id: 'wire-coil', label: 'Cable spool',      material: 'metal',    shape: 'circle', x: 4.1,  y: 3.6,  r: 0.3,              height: 0.5 },
  { id: 'ladder',    label: 'Aluminium ladder', material: 'metal',    shape: 'rect',   x: 0.45, y: 2.55, w: 1.25, h: 0.12, rot: -0.3,  height: 1.8 },
  { id: 'toolbox',   label: 'Metal toolbox',    material: 'metal',    shape: 'rect',   x: 3.5,  y: 0.65, w: 0.32, h: 0.2,  rot: 0,     height: 0.25 },
]
