# Real-time Chart Visualization Skill

## Purpose
สำหรับสร้าง real-time charts แสดง CSI signals, vital signs, และ time-series data ด้วย Chart.js ใน React

## Key Libraries
- `chart.js` — Core charting library
- `react-chartjs-2` — React wrapper
- `chartjs-plugin-streaming` — Real-time scrolling (optional)

## Installation
```bash
npm install chart.js react-chartjs-2
```

## Basic Setup

### 1. Chart Component Wrapper

```tsx
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Line } from 'react-chartjs-2'

// Register components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

function CSIChart() {
  const data = {
    labels: ['0', '1', '2', '3', '4', '5'],
    datasets: [{
      label: 'CSI Amplitude',
      data: [42, 41, 43, 42, 41, 42],
      borderColor: '#185FA5',
      backgroundColor: 'rgba(24, 95, 165, 0.1)',
      tension: 0.4,
      fill: true
    }]
  }
  
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    },
    scales: {
      x: { display: true },
      y: { display: true }
    }
  }
  
  return (
    <div style={{ height: '200px' }}>
      <Line data={data} options={options} />
    </div>
  )
}
```

## CSI Amplitude Timeline (Room Empty vs Person Present)

```tsx
import { Line } from 'react-chartjs-2'
import { useRef, useEffect, useState } from 'react'

function CSIAmplitudeChart() {
  const [data, setData] = useState<number[]>([])
  const [labels, setLabels] = useState<number[]>([])
  
  useEffect(() => {
    const interval = setInterval(() => {
      setLabels(prev => {
        const newLabels = [...prev, prev.length]
        return newLabels.slice(-100) // Keep last 100 points
      })
      
      setData(prev => {
        const time = prev.length
        let value: number
        
        // Room empty (0-50s): flat ~42
        if (time < 50) {
          value = 42 + (Math.random() - 0.5) * 2
        } 
        // Person enters (50s+): wild fluctuation
        else {
          value = 42 + (Math.random() - 0.5) * 30
        }
        
        const newData = [...prev, value]
        return newData.slice(-100)
      })
    }, 100)
    
    return () => clearInterval(interval)
  }, [])
  
  const chartData = {
    labels,
    datasets: [
      {
        label: 'CSI Amplitude',
        data,
        borderColor: (context: any) => {
          const index = context.dataIndex
          return index < 50 ? '#888780' : '#185FA5'
        },
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.1
      }
    ]
  }
  
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false, // Disable for better performance
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: 'CSI Amplitude Over Time',
        color: '#e2e8f0',
        font: { size: 14, weight: '500' }
      },
      annotation: {
        annotations: {
          line1: {
            type: 'line',
            xMin: 50,
            xMax: 50,
            borderColor: '#E24B4A',
            borderWidth: 2,
            borderDash: [6, 4],
            label: {
              content: 'Person enters',
              enabled: true,
              position: 'top'
            }
          }
        }
      }
    },
    scales: {
      x: {
        display: true,
        title: { display: true, text: 'Time (s)', color: '#94a3b8' },
        ticks: { color: '#64748b' },
        grid: { color: 'rgba(148, 163, 176, 0.1)' }
      },
      y: {
        display: true,
        title: { display: true, text: '|H|', color: '#94a3b8' },
        ticks: { color: '#64748b' },
        grid: { color: 'rgba(148, 163, 176, 0.1)' }
      }
    }
  }
  
  return (
    <div style={{ 
      height: '300px', 
      background: '#0f172a', 
      padding: '16px',
      borderRadius: '8px'
    }}>
      <Line data={chartData} options={options} />
    </div>
  )
}
```

## Breathing Waveform (Sinusoidal)

```tsx
function BreathingChart() {
  const [data, setData] = useState<number[]>([])
  const timeRef = useRef(0)
  
  useEffect(() => {
    const interval = setInterval(() => {
      timeRef.current += 0.1 // 100ms interval
      
      setData(prev => {
        const t = timeRef.current
        // Breathing at 0.3 Hz (18 BPM)
        const value = Math.sin(2 * Math.PI * 0.3 * t) * 10 + 42
        
        const newData = [...prev, value]
        return newData.slice(-100) // Last 10 seconds at 10Hz
      })
    }, 100)
    
    return () => clearInterval(interval)
  }, [])
  
  const chartData = {
    labels: data.map((_, i) => i * 0.1),
    datasets: [
      {
        label: 'Breathing',
        data,
        borderColor: '#1D9E75',
        backgroundColor: 'rgba(29, 158, 117, 0.1)',
        borderWidth: 2.5,
        pointRadius: 0,
        tension: 0.4,
        fill: true
      }
    ]
  }
  
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: 'Breathing (0.1–0.5 Hz)',
        color: '#1D9E75'
      }
    },
    scales: {
      x: {
        display: true,
        title: { display: true, text: 'Time (s)' },
        ticks: { color: '#64748b' }
      },
      y: {
        display: true,
        ticks: { color: '#64748b' }
      }
    }
  }
  
  return (
    <div style={{ height: '200px' }}>
      <Line data={chartData} options={options} />
    </div>
  )
}
```

## Heart Rate Waveform

```tsx
function HeartRateChart() {
  const [data, setData] = useState<number[]>([])
  const timeRef = useRef(0)
  
  useEffect(() => {
    const interval = setInterval(() => {
      timeRef.current += 0.1
      
      setData(prev => {
        const t = timeRef.current
        // Heart at 1.2 Hz (72 BPM) - sharper peaks
        const heartbeat = Math.sin(2 * Math.PI * 1.2 * t)
        const value = Math.pow(Math.max(0, heartbeat), 3) * 15 + 42
        
        const newData = [...prev, value]
        return newData.slice(-100)
      })
    }, 100)
    
    return () => clearInterval(interval)
  }, [])
  
  const chartData = {
    labels: data.map((_, i) => i * 0.1),
    datasets: [
      {
        label: 'Heart Rate',
        data,
        borderColor: '#E24B4A',
        backgroundColor: 'rgba(226, 75, 74, 0.1)',
        borderWidth: 1.5,
        pointRadius: 0,
        tension: 0.2,
        fill: true
      }
    ]
  }
  
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: 'Heart Rate (0.8–2.0 Hz)',
        color: '#E24B4A'
      }
    },
    scales: {
      x: {
        display: true,
        title: { display: true, text: 'Time (s)' },
        ticks: { color: '#64748b' }
      },
      y: {
        display: true,
        ticks: { color: '#64748b' }
      }
    }
  }
  
  return (
    <div style={{ height: '200px' }}>
      <Line data={chartData} options={options} />
    </div>
  )
}
```

## Multi-Subcarrier Bar Chart

```tsx
import { Bar } from 'react-chartjs-2'

function SubcarrierChart({ 
  amplitudes 
}: { 
  amplitudes: number[] // 56 values
}) {
  const data = {
    labels: amplitudes.map((_, i) => i),
    datasets: [
      {
        label: 'Amplitude',
        data: amplitudes,
        backgroundColor: amplitudes.map(val => 
          val > 45 ? '#185FA5' : '#888780'
        ),
        borderWidth: 0
      }
    ]
  }
  
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: 'CSI per Subcarrier'
      }
    },
    scales: {
      x: {
        title: { display: true, text: 'Subcarrier Index' }
      },
      y: {
        title: { display: true, text: '|H|' },
        min: 0,
        max: 60
      }
    }
  }
  
  return (
    <div style={{ height: '200px' }}>
      <Bar data={data} options={options} />
    </div>
  )
}
```

## Performance Optimization

### 1. Disable Animations for Real-time
```tsx
const options = {
  animation: false, // Critical for 10+ FPS updates
  // ...
}
```

### 2. Limit Data Points
```tsx
// Keep only last N points
setData(prev => [...prev, newValue].slice(-100))
```

### 3. Use Decimation
```tsx
const options = {
  parsing: false, // Faster
  normalized: true,
  plugins: {
    decimation: {
      enabled: true,
      algorithm: 'lttb', // Largest-Triangle-Three-Buckets
      samples: 50
    }
  }
}
```

### 4. Update Charts Efficiently
```tsx
// Update data reference, not recreate
chartRef.current.data.datasets[0].data.push(newValue)
chartRef.current.data.datasets[0].data.shift()
chartRef.current.update('none') // Skip animations
```

## Custom Plugin for Zone Highlighting

```tsx
const zonePlugin = {
  id: 'zoneHighlight',
  beforeDraw: (chart: any) => {
    const ctx = chart.ctx
    const chartArea = chart.chartArea
    
    // Room empty zone (gray)
    ctx.fillStyle = 'rgba(136, 135, 128, 0.05)'
    ctx.fillRect(
      chartArea.left, 
      chartArea.top, 
      chartArea.width / 2, 
      chartArea.height
    )
    
    // Person present zone (blue)
    ctx.fillStyle = 'rgba(24, 95, 165, 0.05)'
    ctx.fillRect(
      chartArea.left + chartArea.width / 2,
      chartArea.top,
      chartArea.width / 2,
      chartArea.height
    )
  }
}

// Register plugin
ChartJS.register(zonePlugin)
```

## Dark Mode Support

```tsx
const darkModeOptions = {
  scales: {
    x: {
      ticks: { color: '#94a3b8' },
      grid: { color: 'rgba(148, 163, 176, 0.1)' }
    },
    y: {
      ticks: { color: '#94a3b8' },
      grid: { color: 'rgba(148, 163, 176, 0.1)' }
    }
  },
  plugins: {
    title: { color: '#e2e8f0' },
    legend: { labels: { color: '#e2e8f0' } }
  }
}
```

## Complete Dashboard Example

```tsx
function SignalDashboard() {
  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(3, 1fr)', 
      gap: '16px',
      padding: '16px',
      background: '#0a0e1a'
    }}>
      <div>
        <h3 style={{ color: '#e2e8f0', marginBottom: '8px' }}>
          CSI Amplitude
        </h3>
        <CSIAmplitudeChart />
      </div>
      
      <div>
        <h3 style={{ color: '#1D9E75', marginBottom: '8px' }}>
          Breathing: 16 BPM
        </h3>
        <BreathingChart />
      </div>
      
      <div>
        <h3 style={{ color: '#E24B4A', marginBottom: '8px' }}>
          Heart Rate: 72 BPM
        </h3>
        <HeartRateChart />
      </div>
    </div>
  )
}
```

## Common Issues

1. **Chart not updating**: Check if data reference changes
   - Solution: Use `chart.update()` or recreate data object

2. **Performance lag**: Too many points or animations enabled
   - Solution: Limit points, disable animations, use decimation

3. **TypeScript errors**: Missing type definitions
   - Solution: `npm install -D @types/chart.js`

4. **Memory leak**: Interval not cleared
   - Solution: Always return cleanup function in useEffect

## Resources
- [Chart.js Docs](https://www.chartjs.org/docs/latest/)
- [react-chartjs-2 Guide](https://react-chartjs-2.js.org/)
