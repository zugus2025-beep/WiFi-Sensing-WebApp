'use client'

import { useEffect, useRef, useState } from 'react'
import type { CSIFrame, Keypoint } from '@/types/csi'
import { sineWave, heartbeatWave } from '@/utils/signalProcessing'

function generateKeypoints(x: number, y: number, t: number): Keypoint[] {
  const walk = Math.sin(t * 3.0)
  const arm = 0.15
  const leg = 0.12
  return [
    { x,         y,                    z: 1.75, confidence: 0.95 }, // 0 nose
    { x: x-0.05, y: y-0.05,            z: 1.78, confidence: 0.90 }, // 1 left_eye
    { x: x+0.05, y: y-0.05,            z: 1.78, confidence: 0.90 }, // 2 right_eye
    { x: x-0.09, y,                    z: 1.75, confidence: 0.85 }, // 3 left_ear
    { x: x+0.09, y,                    z: 1.75, confidence: 0.85 }, // 4 right_ear
    { x: x-0.20, y,                    z: 1.55, confidence: 0.95 }, // 5 left_shoulder
    { x: x+0.20, y,                    z: 1.55, confidence: 0.95 }, // 6 right_shoulder
    { x: x-0.28, y: y+walk*arm,        z: 1.25, confidence: 0.90 }, // 7 left_elbow
    { x: x+0.28, y: y-walk*arm,        z: 1.25, confidence: 0.90 }, // 8 right_elbow
    { x: x-0.32, y: y+walk*arm*1.5,    z: 0.95, confidence: 0.85 }, // 9 left_wrist
    { x: x+0.32, y: y-walk*arm*1.5,    z: 0.95, confidence: 0.85 }, // 10 right_wrist
    { x: x-0.11, y,                    z: 1.05, confidence: 0.95 }, // 11 left_hip
    { x: x+0.11, y,                    z: 1.05, confidence: 0.95 }, // 12 right_hip
    { x: x-0.11, y: y+walk*leg,        z: 0.55, confidence: 0.90 }, // 13 left_knee
    { x: x+0.11, y: y-walk*leg,        z: 0.55, confidence: 0.90 }, // 14 right_knee
    { x: x-0.11, y: y+walk*leg*1.2,    z: 0.05, confidence: 0.85 }, // 15 left_ankle
    { x: x+0.11, y: y-walk*leg*1.2,    z: 0.05, confidence: 0.85 }, // 16 right_ankle
  ]
}

export function useMockData(intervalMs = 100): CSIFrame | null {
  const [frame, setFrame] = useState<CSIFrame | null>(null)
  const tRef = useRef(0)

  useEffect(() => {
    const id = setInterval(() => {
      const t = tRef.current
      tRef.current += intervalMs / 1000

      const x = 2.5 + Math.sin(t * 0.4) * 1.5
      const y = 2.5 + Math.cos(t * 0.4) * 1.5
      const baseAmp = 42
      const csi_amplitude = Array.from({ length: 56 }, () =>
        baseAmp + (Math.random() - 0.5) * 20
      )

      const newFrame: CSIFrame = {
        timestamp: Date.now(),
        nodes: ['A', 'B', 'C', 'D'].map(nodeId => ({
          nodeId: nodeId as 'A' | 'B' | 'C' | 'D',
          csi_amplitude,
          csi_phase: Array.from({ length: 56 }, () =>
            Math.random() * Math.PI * 2 - Math.PI
          ),
        })),
        detection: {
          presence: true,
          position: {
            x: Math.round(x * 1000) / 1000,
            y: Math.round(y * 1000) / 1000,
            z: 1.2,
          },
          keypoints: generateKeypoints(x, y, t),
          breathing_bpm: Math.round(sineWave(t, 0.3, 2, 16)),
          heart_bpm: Math.round(sineWave(t, 1.2, 5, 72)),
          confidence: Math.round((0.9 + Math.sin(t * 0.1) * 0.05) * 1000) / 1000,
        },
      }
      setFrame(newFrame)
    }, intervalMs)

    return () => clearInterval(id)
  }, [intervalMs])

  return frame
}

/** Raw time-series values for charts — updated every tick */
export function useMockChartData(maxPoints = 100) {
  const tRef = useRef(0)
  const [amplitude, setAmplitude] = useState<number[]>([])
  const [breathing, setBreathing] = useState<number[]>([])
  const [heartrate, setHeartrate] = useState<number[]>([])

  useEffect(() => {
    const id = setInterval(() => {
      const t = tRef.current
      tRef.current += 0.1

      const amp = 42 + (Math.random() - 0.5) * 20
      const breath = sineWave(t, 0.3, 10, 42)
      const hr = heartbeatWave(t, 1.2, 15, 42)

      const push = (prev: number[], val: number) =>
        [...prev, val].slice(-maxPoints)

      setAmplitude(prev => push(prev, amp))
      setBreathing(prev => push(prev, breath))
      setHeartrate(prev => push(prev, hr))
    }, 100)

    return () => clearInterval(id)
  }, [maxPoints])

  return { amplitude, breathing, heartrate }
}
