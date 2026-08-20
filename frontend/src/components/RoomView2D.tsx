'use client'

import { useCallback, useEffect, useMemo, useRef } from 'react'
import type { Detection } from '@/types/csi'
import { DOOR_WIDTH, NODES, OBSTACLES, MATERIAL_PROPERTIES, ROOM_SIZE, type Obstacle } from '@/utils/obstacles'
import { buildSignalGrid, renderSignalGridToCanvas } from '@/utils/signalField'
import { simToCanvas, simScale } from '@/utils/triangulation'

function drawObstacleSilhouette(
  ctx: CanvasRenderingContext2D,
  o: Obstacle,
  W: number,
  scale: number
) {
  const { cx, cy } = simToCanvas(o.x, o.y, W)
  const mat = MATERIAL_PROPERTIES[o.material]

  ctx.save()
  ctx.translate(cx, cy)
  if (o.shape === 'rect') {
    ctx.rotate(o.rot ?? 0)
    const w = (o.w ?? 0) * scale
    const h = (o.h ?? 0) * scale
    ctx.strokeStyle = mat.color
    ctx.lineWidth = 1.2
    ctx.setLineDash(o.material === 'metal' ? [] : [3, 3])
    ctx.strokeRect(-w / 2, -h / 2, w, h)
  } else {
    const r = (o.r ?? 0) * scale
    ctx.strokeStyle = mat.color
    ctx.lineWidth = 1.2
    ctx.setLineDash(o.material === 'metal' ? [] : [3, 3])
    ctx.beginPath()
    ctx.arc(0, 0, r, 0, Math.PI * 2)
    ctx.stroke()
  }
  ctx.setLineDash([])
  ctx.restore()
}

function drawReflectionRipples(
  ctx: CanvasRenderingContext2D,
  o: Obstacle,
  W: number,
  scale: number,
  t: number
) {
  const { cx, cy } = simToCanvas(o.x, o.y, W)
  const base = (o.shape === 'circle' ? (o.r ?? 0) : Math.max(o.w ?? 0, o.h ?? 0) / 2) * scale
  for (let i = 0; i < 3; i++) {
    const phase = ((t * 0.35 + i / 3) % 1)
    const radius = base + phase * base * 2.2
    const alpha = (1 - phase) * 0.35
    ctx.beginPath()
    ctx.arc(cx, cy, radius, 0, Math.PI * 2)
    ctx.strokeStyle = `rgba(169,189,208,${alpha.toFixed(3)})`
    ctx.lineWidth = 1
    ctx.stroke()
  }
}

interface Props {
  detection: Detection | null
  showTriangulation?: boolean
}

export default function RoomView2D({ detection, showTriangulation = true }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const posRef = useRef({ x: 2.5, y: 2.5 })
  const heatmapRef = useRef<HTMLCanvasElement | null>(null)
  const startRef = useRef<number>(0)

  // Coverage field only depends on fixed node/obstacle geometry — compute once.
  const signalGrid = useMemo(() => buildSignalGrid(56, NODES, OBSTACLES), [])

  useEffect(() => {
    heatmapRef.current = renderSignalGridToCanvas(signalGrid)
    startRef.current = performance.now()
  }, [signalGrid])

  const draw = useCallback((now: number) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = canvas.width
    const H = canvas.height
    const scale = simScale(W)
    const simPad = W * 0.06 // must match the padding fraction inside simToCanvas
    const room0 = simToCanvas(0, 0, W)   // room's top-left corner in canvas px
    const room1 = simToCanvas(ROOM_SIZE, ROOM_SIZE, W)
    const wallT = 6
    const t = (now - startRef.current) / 1000

    // Smooth position interpolation
    if (detection?.presence && detection.position) {
      posRef.current.x += (detection.position.x - posRef.current.x) * 0.12
      posRef.current.y += (detection.position.y - posRef.current.y) * 0.12
    }

    ctx.clearRect(0, 0, W, H)
    ctx.fillStyle = '#0a0e1a'
    ctx.fillRect(0, 0, W, H)

    // ── WiFi coverage field — including the hallway just past the walls,
    // so it reads as signal actually leaking out, not stopping at a line.
    if (heatmapRef.current) {
      ctx.save()
      ctx.imageSmoothingEnabled = true
      ctx.filter = 'blur(2.5px)'
      ctx.drawImage(heatmapRef.current, simPad, simPad, W - simPad * 2, H - simPad * 2)
      ctx.filter = 'none'
      ctx.restore()

      // Dim the outside-the-room band slightly so the walls still read
      // as the primary space, without hiding the leaked signal there.
      ctx.save()
      ctx.beginPath()
      ctx.rect(0, 0, W, H)
      ctx.rect(room0.cx, room0.cy, room1.cx - room0.cx, room1.cy - room0.cy)
      ctx.clip('evenodd')
      ctx.fillStyle = 'rgba(10,14,26,0.4)'
      ctx.fillRect(0, 0, W, H)
      ctx.restore()
    }

    // Reference grid over the room interior
    ctx.strokeStyle = 'rgba(255,255,255,0.06)'
    ctx.lineWidth = 0.5
    for (let i = 0; i <= 5; i++) {
      const { cx: x } = simToCanvas(i, 0, W)
      const { cy: y } = simToCanvas(0, i, W)
      ctx.beginPath(); ctx.moveTo(x, room0.cy); ctx.lineTo(x, room1.cy); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(room0.cx, y); ctx.lineTo(room1.cx, y); ctx.stroke()
    }

    // Room walls — with a door gap that leaks signal freely
    ctx.strokeStyle = '#475569'
    ctx.lineWidth = wallT
    ctx.strokeRect(room0.cx, room0.cy, room1.cx - room0.cx, room1.cy - room0.cy)
    const doorPxW = DOOR_WIDTH * scale
    const doorCx = (room0.cx + room1.cx) / 2
    ctx.strokeStyle = '#0a0e1a'
    ctx.lineWidth = wallT + 2
    ctx.beginPath()
    ctx.moveTo(doorCx - doorPxW / 2, room1.cy)
    ctx.lineTo(doorCx + doorPxW / 2, room1.cy)
    ctx.stroke()
    ctx.strokeStyle = 'rgba(148,163,184,0.35)'
    ctx.lineWidth = 1.2
    ctx.beginPath()
    ctx.arc(doorCx - doorPxW / 2, room1.cy, doorPxW, -Math.PI / 2, 0)
    ctx.stroke()

    // Room label
    ctx.fillStyle = '#64748b'
    ctx.font = '11px Inter, sans-serif'
    ctx.fillText('5 m', (room0.cx + room1.cx) / 2 - 12, room1.cy + wallT + 12)
    ctx.save()
    ctx.translate(room0.cx - wallT - 8, (room0.cy + room1.cy) / 2)
    ctx.rotate(-Math.PI / 2)
    ctx.fillText('5 m', -12, 0)
    ctx.restore()

    // Obstacles: minimal silhouette + material-driven reflection ripples
    OBSTACLES.forEach(o => {
      drawObstacleSilhouette(ctx, o, W, scale)
      if (MATERIAL_PROPERTIES[o.material].reflective) {
        drawReflectionRipples(ctx, o, W, scale, t)
      }
    })

    // Triangulation lines
    if (showTriangulation && detection?.presence) {
      const { cx: px, cy: py } = simToCanvas(posRef.current.x, posRef.current.y, W)
      NODES.forEach(node => {
        const { cx: nx, cy: ny } = simToCanvas(node.position.x, node.position.y, W)
        ctx.beginPath()
        ctx.moveTo(nx, ny)
        ctx.lineTo(px, py)
        ctx.strokeStyle = 'rgba(29,158,117,0.3)'
        ctx.lineWidth = 1
        ctx.setLineDash([4, 4])
        ctx.stroke()
        ctx.setLineDash([])
      })
    }

    // ESP32 nodes
    NODES.forEach(node => {
      const { cx, cy } = simToCanvas(node.position.x, node.position.y, W)

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
      const { cx, cy } = simToCanvas(posRef.current.x, posRef.current.y, W)

      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 30)
      grad.addColorStop(0, 'rgba(24,95,165,0.35)')
      grad.addColorStop(1, 'rgba(24,95,165,0)')
      ctx.beginPath()
      ctx.arc(cx, cy, 30, 0, Math.PI * 2)
      ctx.fillStyle = grad
      ctx.fill()

      ctx.beginPath()
      ctx.arc(cx, cy, 10, 0, Math.PI * 2)
      ctx.fillStyle = '#185FA5'
      ctx.fill()
      ctx.strokeStyle = 'rgba(100,160,255,0.7)'
      ctx.lineWidth = 2
      ctx.stroke()

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
