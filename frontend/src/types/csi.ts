export interface NodeData {
  nodeId: 'A' | 'B' | 'C'
  csi_amplitude: number[]  // 56 subcarriers
  csi_phase: number[]
  rssi?: number
}

export interface Position {
  x: number
  y: number
  z: number
}

export interface Keypoint {
  x: number
  y: number
  z: number
  confidence: number
}

export interface Detection {
  presence: boolean
  position: Position
  keypoints?: Keypoint[]
  breathing_bpm?: number
  heart_bpm?: number
  confidence?: number
}

export interface CSIFrame {
  timestamp: number
  nodes: NodeData[]
  detection: Detection
}

export interface ESP32Node {
  nodeId: 'A' | 'B' | 'C'
  position: { x: number; y: number }
  status: 'online' | 'offline'
  rssi?: number
}

// COCO-format keypoint indices
export const KEYPOINT_NAMES = [
  'nose', 'left_eye', 'right_eye', 'left_ear', 'right_ear',
  'left_shoulder', 'right_shoulder', 'left_elbow', 'right_elbow',
  'left_wrist', 'right_wrist', 'left_hip', 'right_hip',
  'left_knee', 'right_knee', 'left_ankle', 'right_ankle',
] as const

// Bone connections: [from_index, to_index]
export const SKELETON_CONNECTIONS: [number, number][] = [
  [0, 1], [0, 2],        // nose → eyes
  [1, 3], [2, 4],        // eyes → ears
  [0, 5], [0, 6],        // nose → shoulders
  [5, 6],                // shoulder bar
  [5, 7], [7, 9],        // left arm
  [6, 8], [8, 10],       // right arm
  [5, 11], [6, 12],      // torso sides
  [11, 12],              // hip bar
  [11, 13], [13, 15],    // left leg
  [12, 14], [14, 16],    // right leg
]
