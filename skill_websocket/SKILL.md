# WebSocket Real-time Data Skill

## Purpose
สำหรับ setup WebSocket connection เพื่อรับ real-time CSI data จาก ESP32 aggregator (เตรียมไว้สำหรับอนาคต)

## Key Concepts
- WebSocket for bidirectional real-time communication
- Auto-reconnection on disconnect
- Message parsing and validation
- React hooks for WebSocket state management

## Installation
```bash
npm install ws
npm install -D @types/ws
```

## Basic WebSocket Hook

```tsx
import { useEffect, useRef, useState, useCallback } from 'react'

interface UseWebSocketOptions {
  url: string
  reconnectInterval?: number
  maxReconnectAttempts?: number
  onMessage?: (data: any) => void
  onConnect?: () => void
  onDisconnect?: () => void
  onError?: (error: Event) => void
}

function useWebSocket({
  url,
  reconnectInterval = 3000,
  maxReconnectAttempts = 10,
  onMessage,
  onConnect,
  onDisconnect,
  onError
}: UseWebSocketOptions) {
  const [isConnected, setIsConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState<any>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()

  const connect = useCallback(() => {
    try {
      const ws = new WebSocket(url)
      
      ws.onopen = () => {
        console.log('WebSocket connected')
        setIsConnected(true)
        reconnectAttemptsRef.current = 0
        onConnect?.()
      }
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          setLastMessage(data)
          onMessage?.(data)
        } catch (error) {
          console.error('Failed to parse message:', error)
        }
      }
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        onError?.(error)
      }
      
      ws.onclose = () => {
        console.log('WebSocket disconnected')
        setIsConnected(false)
        onDisconnect?.()
        
        // Auto-reconnect
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++
          console.log(`Reconnect attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts}`)
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect()
          }, reconnectInterval)
        } else {
          console.error('Max reconnect attempts reached')
        }
      }
      
      wsRef.current = ws
    } catch (error) {
      console.error('Failed to create WebSocket:', error)
    }
  }, [url, reconnectInterval, maxReconnectAttempts, onMessage, onConnect, onDisconnect, onError])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
  }, [])

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message))
    } else {
      console.warn('WebSocket is not connected')
    }
  }, [])

  useEffect(() => {
    connect()
    return () => {
      disconnect()
    }
  }, [connect, disconnect])

  return {
    isConnected,
    lastMessage,
    sendMessage,
    reconnect: connect,
    disconnect
  }
}
```

## CSI Data Hook (ESP32-specific)

```tsx
interface CSIData {
  timestamp: number
  nodes: Array<{
    nodeId: 'A' | 'B' | 'C'
    csi_amplitude: number[] // 56 subcarriers
    csi_phase: number[]
  }>
  detection: {
    presence: boolean
    position: { x: number; y: number; z: number }
    keypoints?: Array<{
      x: number
      y: number
      z: number
      confidence: number
    }>
    breathing_bpm?: number
    heart_bpm?: number
  }
}

function useCSIData(wsUrl: string) {
  const [csiData, setCSIData] = useState<CSIData | null>(null)
  const [error, setError] = useState<string | null>(null)

  const { isConnected, lastMessage } = useWebSocket({
    url: wsUrl,
    onMessage: (data) => {
      // Validate message structure
      if (validateCSIData(data)) {
        setCSIData(data)
        setError(null)
      } else {
        setError('Invalid CSI data format')
      }
    },
    onError: () => {
      setError('WebSocket connection error')
    }
  })

  return {
    isConnected,
    csiData,
    error
  }
}

function validateCSIData(data: any): data is CSIData {
  return (
    data &&
    typeof data.timestamp === 'number' &&
    Array.isArray(data.nodes) &&
    data.detection &&
    typeof data.detection.presence === 'boolean'
  )
}
```

## Mock WebSocket Server (for Development)

```tsx
// mockWebSocketServer.ts
class MockWebSocketServer {
  private interval: NodeJS.Timeout | null = null
  private callbacks: Set<(data: CSIData) => void> = new Set()

  start() {
    this.interval = setInterval(() => {
      const mockData = this.generateMockData()
      this.callbacks.forEach(cb => cb(mockData))
    }, 100)
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = null
    }
  }

  subscribe(callback: (data: CSIData) => void) {
    this.callbacks.add(callback)
  }

  unsubscribe(callback: (data: CSIData) => void) {
    this.callbacks.delete(callback)
  }

  private generateMockData(): CSIData {
    const time = Date.now() / 1000
    
    // Simulate walking
    const x = 2.5 + Math.sin(time * 0.5) * 1.5
    const y = 2.5 + Math.cos(time * 0.5) * 1.5
    const z = 1.2

    // Mock CSI amplitude (changes when person present)
    const baseAmplitude = 42
    const csi_amplitude = Array.from({ length: 56 }, () => 
      baseAmplitude + (Math.random() - 0.5) * 20
    )

    // Mock breathing (0.3 Hz)
    const breathing_bpm = Math.round(
      16 + Math.sin(time * 0.3) * 2
    )

    // Mock heart rate (1.2 Hz)
    const heart_bpm = Math.round(
      72 + Math.sin(time * 1.2) * 5
    )

    return {
      timestamp: Date.now(),
      nodes: [
        {
          nodeId: 'A',
          csi_amplitude,
          csi_phase: Array.from({ length: 56 }, () => 
            Math.random() * Math.PI * 2 - Math.PI
          )
        },
        {
          nodeId: 'B',
          csi_amplitude,
          csi_phase: Array.from({ length: 56 }, () => 
            Math.random() * Math.PI * 2 - Math.PI
          )
        },
        {
          nodeId: 'C',
          csi_amplitude,
          csi_phase: Array.from({ length: 56 }, () => 
            Math.random() * Math.PI * 2 - Math.PI
          )
        }
      ],
      detection: {
        presence: true,
        position: { x, y, z },
        breathing_bpm,
        heart_bpm
      }
    }
  }
}

export const mockServer = new MockWebSocketServer()
```

## Usage in Component

```tsx
import { useCSIData } from './hooks/useCSIData'
import { mockServer } from './utils/mockWebSocketServer'
import { useEffect } from 'react'

function Dashboard() {
  const USE_MOCK_DATA = true // Toggle for development
  
  // For real ESP32 connection (future)
  const { isConnected, csiData, error } = useCSIData(
    USE_MOCK_DATA ? '' : 'ws://localhost:5005'
  )
  
  // Mock data for development
  useEffect(() => {
    if (USE_MOCK_DATA) {
      mockServer.start()
      return () => mockServer.stop()
    }
  }, [])

  if (USE_MOCK_DATA) {
    // Use mock data generator hook instead
    // (implement in separate file)
  }

  return (
    <div>
      <div>
        Status: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
      </div>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {csiData && (
        <div>
          <div>Position: ({csiData.detection.position.x.toFixed(2)}, {csiData.detection.position.y.toFixed(2)})</div>
          <div>Breathing: {csiData.detection.breathing_bpm} BPM</div>
          <div>Heart Rate: {csiData.detection.heart_bpm} BPM</div>
        </div>
      )}
    </div>
  )
}
```

## Message Protocol

### From ESP32 → Web App
```json
{
  "type": "csi_update",
  "timestamp": 1640000000000,
  "nodes": [
    {
      "nodeId": "A",
      "rssi": -45,
      "csi_amplitude": [42.5, 41.2, ...],
      "csi_phase": [1.23, -0.45, ...]
    }
  ],
  "detection": {
    "presence": true,
    "confidence": 0.95,
    "position": { "x": 2.3, "y": 1.8, "z": 1.2 },
    "breathing_bpm": 16,
    "heart_bpm": 72
  }
}
```

### From Web App → ESP32 (Commands)
```json
{
  "type": "command",
  "action": "calibrate"
}

{
  "type": "command",
  "action": "set_sampling_rate",
  "value": 20
}

{
  "type": "command",
  "action": "reset_baseline"
}
```

## Connection Status Component

```tsx
function ConnectionStatus({ 
  isConnected, 
  onReconnect 
}: { 
  isConnected: boolean
  onReconnect: () => void 
}) {
  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: '8px',
      padding: '8px 12px',
      background: isConnected ? '#1D9E7522' : '#E24B4A22',
      border: `1px solid ${isConnected ? '#1D9E75' : '#E24B4A'}`,
      borderRadius: '6px',
      fontSize: '13px'
    }}>
      <div style={{ 
        width: '8px', 
        height: '8px', 
        borderRadius: '50%',
        background: isConnected ? '#1D9E75' : '#E24B4A'
      }} />
      <span style={{ color: isConnected ? '#1D9E75' : '#E24B4A' }}>
        {isConnected ? 'Connected' : 'Disconnected'}
      </span>
      {!isConnected && (
        <button 
          onClick={onReconnect}
          style={{
            marginLeft: 'auto',
            padding: '4px 12px',
            background: '#E24B4A',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          Reconnect
        </button>
      )}
    </div>
  )
}
```

## Error Handling

```tsx
function useCSIDataWithRetry(wsUrl: string, maxRetries = 3) {
  const [retryCount, setRetryCount] = useState(0)
  const [lastError, setLastError] = useState<string | null>(null)

  const { isConnected, csiData, error } = useWebSocket({
    url: wsUrl,
    onError: (err) => {
      setLastError(err.toString())
      if (retryCount < maxRetries) {
        setRetryCount(prev => prev + 1)
      }
    },
    onConnect: () => {
      setRetryCount(0)
      setLastError(null)
    }
  })

  return {
    isConnected,
    csiData,
    error: lastError,
    retryCount,
    hasExceededRetries: retryCount >= maxRetries
  }
}
```

## Performance Considerations

1. **Throttle updates** if receiving data faster than 60 FPS
```tsx
const throttle = (fn: Function, delay: number) => {
  let lastCall = 0
  return (...args: any[]) => {
    const now = Date.now()
    if (now - lastCall >= delay) {
      lastCall = now
      fn(...args)
    }
  }
}

const handleMessage = throttle((data) => {
  setCSIData(data)
}, 16) // ~60 FPS
```

2. **Use web workers** for heavy processing
```tsx
// csiWorker.ts
self.onmessage = (e) => {
  const processed = processCSI(e.data)
  self.postMessage(processed)
}

// In component
const worker = new Worker('./csiWorker.ts')
worker.onmessage = (e) => setProcessedData(e.data)
```

## Resources
- [WebSocket API MDN](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [ESP32 WebSocket Server](https://github.com/espressif/esp-idf/tree/master/examples/protocols/websocket)
