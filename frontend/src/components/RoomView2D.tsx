'use client'

import { useCallback, useEffect, useRef } from 'react'
import type { Detection, ESP32Node } from '@/types/csi'
import { roomToCanvas } from '@/utils/triangulation'

const NODES: ESP32Node[] = [
  { nodeId: 'A', position: { x: 0.5, y: 0.5 }, status: 'online' },
  { nodeId: 'B', position: { x: 4.5, y: 0.5 }, status: 'online' },
  { nodeId: 'C', position: { x: 2.5, y: 4.5 }, status: 'online' },
]

interface Props {
  detection: Detection | null
  showTriangulation?: boolean
}

export default function RoomView2D({ detection, showTriangulation = true }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const posRef = useRef({ x: 2.5, y: 2.5 })

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = canvas.width
    const H = canvas.height
    const pad = W * 0.08
    const scale = (W - pad * 2) / 5

    // Smooth position interpolation
    if (detection?.presence && detection.position) {
      posRef.current.x += (detection.position.x - posRef.current.x) * 0.12
      posRef.current.y += (detection.position.y - posRef.current.y) * 0.12
    }

    ctx.clearRect(0, 0, W, H)

    // Background
    ctx.fillStyle = '#0f172a'
    ctx.fillRect(0, 0, W, H)

    // Grid
    ctx.strokeStyle = 'rgba(100,116,139,0.15)'
    ctx.lineWidth = 0.5
    for (let i = 0; i <= 5; i++) {
      const x = pad + i * scale
      const y = pad + i * scale
      ctx.beginPath(); ctx.moveTo(x, pad); ctx.lineTo(x, H - pad); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(W - pad, y); ctx.stroke()
    }

    // Room boundary
    ctx.strokeStyle = '#475569'
    ctx.lineWidth = 2
    ctx.strokeRect(pad, pad, W - pad * 2, H - pad * 2)

    // Room label
    ctx.fillStyle = '#64748b'
    ctx.font = '11px Inter, sans-serif'
    ctx.fillText('5 m', W / 2 - 12, H - pad * 0.3)
    ctx.save()
    ctx.translate(pad * 0.4, H / 2)
    ctx.rotate(-Math.PI / 2)
    ctx.fillText('5 m', -12, 0)
    ctx.restore()

    // Triangulation lines
    if (showTriangulation && detection?.presence) {
      const { cx: px, cy: py } = roomToCanvas(posRef.current.x, posRef.current.y, W)
      NODES.forEach(node => {
        const { cx: nx, cy: ny } = roomToCanvas(node.position.x, node.position.y, W)
        ctx.beginPath()
        ctx.moveTo(nx, ny)
        ctx.lineTo(px, py)
        ctx.strokeStyle = 'rgba(29,158,117,0.25)'
        ctx.lineWidth = 1
        ctx.setLineDash([4, 4])
        ctx.stroke()
        ctx.setLineDash([])
      })
    }

    // ESP32 nodes
    NODES.forEach(node => {
      const { cx, cy } = roomToCanvas(node.position.x, node.position.y, W)

      ctx.beginPath()
      ctx.arc(cx, cy, 10, 0, Math.PI * 2)
      ctx.fillStyle = '#1D9E75'
      ctx.fill()
      ctx.strokeStyle = 'rgba(29,158,117,0.4)'
      ctx.lineWidth = 4
      ctx.stroke()

      ctx.fillStyle = '#fff'
      ctx.font = 'bold 11px Inter, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(node.nodeId, cx, cy)

      ctx.fillStyle = '#1D9E75'
      ctx.font = '10px Inter, sans-serif'
      ctx.fillText(`Node ${node.nodeId}`, cx, cy + 18)
      ctx.textAlign = 'start'
      ctx.textBaseline = 'alphabetic'
    })

    // Person position
    if (detection?.presence) {
      const { cx, cy } = roomToCanvas(posRef.current.x, posRef.current.y, W)

      // Outer glow ring
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 30)
      grad.addColorStop(0, 'rgba(24,95,165,0.35)')
      grad.addColorStop(1, 'rgba(24,95,165,0)')
      ctx.beginPath()
      ctx.arc(cx, cy, 30, 0, Math.PI * 2)
      ctx.fillStyle = grad
      ctx.fill()

      // Person dot
      ctx.beginPath()
      ctx.arc(cx, cy, 10, 0, Math.PI * 2)
      ctx.fillStyle = '#185FA5'
      ctx.fill()
      ctx.strokeStyle = 'rgba(100,160,255,0.7)'
      ctx.lineWidth = 2
      ctx.stroke()

      // Coordinates label
      ctx.fillStyle = '#93c5fd'
      ctx.font = '10px Inter, monospace'
      ctx.fillText(
        `(${posRef.current.x.toFixed(1)}, ${posRef.current.y.toFixed(1)})`,
        cx + 14, cy - 6
      )
    }

    animRef.current = requestAnimationFrame(draw)
  }, [detection, showTriangulation])

  useEffect(() => {
    animRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(animRef.current)
  }, [draw])

  return (
    <div className="w-full h-full flex items-center justify-center bg-slate-900 rounded-lg overflow-hidden">
      <canvas
        ref={canvasRef}
        width={420}
        height={420}
        className="max-w-full max-h-full"
      />
    </div>
  )
}
