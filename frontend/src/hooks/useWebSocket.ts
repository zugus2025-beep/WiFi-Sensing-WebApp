'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { CSIFrame } from '@/types/csi'

interface Options {
  url: string
  reconnectInterval?: number
  maxReconnectAttempts?: number
  onFrame?: (frame: CSIFrame) => void
}

export function useWebSocket({
  url,
  reconnectInterval = 3000,
  maxReconnectAttempts = 10,
  onFrame,
}: Options) {
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const attemptsRef = useRef(0)
  const retryRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const connect = useCallback(() => {
    if (!url) return
    try {
      const ws = new WebSocket(url)

      ws.onopen = () => {
        setIsConnected(true)
        setError(null)
        attemptsRef.current = 0
      }

      ws.onmessage = (ev) => {
        try {
          const data: CSIFrame = JSON.parse(ev.data)
          onFrame?.(data)
        } catch {
          // malformed packet — ignore
        }
      }

      ws.onerror = () => setError('WebSocket error')

      ws.onclose = () => {
        setIsConnected(false)
        if (attemptsRef.current < maxReconnectAttempts) {
          attemptsRef.current++
          retryRef.current = setTimeout(connect, reconnectInterval)
        } else {
          setError('Max reconnect attempts reached')
        }
      }

      wsRef.current = ws
    } catch (e) {
      setError(`Connection failed: ${e}`)
    }
  }, [url, reconnectInterval, maxReconnectAttempts, onFrame])

  const disconnect = useCallback(() => {
    clearTimeout(retryRef.current)
    wsRef.current?.close()
    wsRef.current = null
  }, [])

  useEffect(() => {
    if (url) connect()
    return disconnect
  }, [url, connect, disconnect])

  return { isConnected, error, reconnect: connect, disconnect }
}
