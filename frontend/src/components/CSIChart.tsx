'use client'

import { useEffect, useRef } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  type ChartOptions,
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale, LinearScale, PointElement,
  LineElement, Title, Tooltip, Legend, Filler
)

const BASE_OPTIONS: ChartOptions<'line'> = {
  responsive: true,
  maintainAspectRatio: false,
  animation: false,
  plugins: { legend: { display: false } },
  scales: {
    x: {
      display: true,
      ticks: { color: '#64748b', maxTicksLimit: 6, font: { size: 10 } },
      grid: { color: 'rgba(100,116,139,0.1)' },
    },
    y: {
      display: true,
      ticks: { color: '#64748b', font: { size: 10 } },
      grid: { color: 'rgba(100,116,139,0.1)' },
    },
  },
}

interface SingleChartProps {
  data: number[]
  color: string
  fillColor: string
  label: string
  yMin?: number
  yMax?: number
}

function SingleChart({ data, color, fillColor, label, yMin, yMax }: SingleChartProps) {
  const labels = data.map((_, i) => `${(i * 0.1).toFixed(1)}`)

  const chartData = {
    labels,
    datasets: [
      {
        label,
        data,
        borderColor: color,
        backgroundColor: fillColor,
        borderWidth: 1.8,
        pointRadius: 0,
        tension: 0.3,
        fill: true,
      },
    ],
  }

  const options: ChartOptions<'line'> = {
    ...BASE_OPTIONS,
    scales: {
      ...BASE_OPTIONS.scales,
      y: {
        ...BASE_OPTIONS.scales?.y,
        min: yMin,
        max: yMax,
      },
    },
  }

  return (
    <div style={{ height: '140px' }}>
      <Line data={chartData} options={options} />
    </div>
  )
}

interface Props {
  amplitude: number[]
  breathing: number[]
  heartrate: number[]
}

export default function CSIChart({ amplitude, breathing, heartrate }: Props) {
  return (
    <div className="w-full bg-slate-900/80 border border-slate-700/50 rounded-xl p-4">
      <h3 className="text-sm font-medium text-slate-300 uppercase tracking-wider mb-3">
        CSI Signal Charts
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* CSI Amplitude */}
        <div className="bg-slate-800/40 rounded-lg p-3">
          <p className="text-xs text-slate-400 mb-2 font-medium">
            CSI Amplitude <span className="text-slate-500">(|H|)</span>
          </p>
          <SingleChart
            data={amplitude}
            color="#185FA5"
            fillColor="rgba(24,95,165,0.1)"
            label="Amplitude"
            yMin={20}
            yMax={65}
          />
        </div>

        {/* Breathing */}
        <div className="bg-slate-800/40 rounded-lg p-3">
          <p className="text-xs text-[#1D9E75] mb-2 font-medium">
            Breathing <span className="text-slate-500">(0.1–0.5 Hz)</span>
          </p>
          <SingleChart
            data={breathing}
            color="#1D9E75"
            fillColor="rgba(29,158,117,0.1)"
            label="Breathing"
            yMin={25}
            yMax={60}
          />
        </div>

        {/* Heart Rate */}
        <div className="bg-slate-800/40 rounded-lg p-3">
          <p className="text-xs text-[#E24B4A] mb-2 font-medium">
            Heart Rate <span className="text-slate-500">(0.8–2.0 Hz)</span>
          </p>
          <SingleChart
            data={heartrate}
            color="#E24B4A"
            fillColor="rgba(226,75,74,0.1)"
            label="Heart Rate"
            yMin={35}
            yMax={65}
          />
        </div>
      </div>
    </div>
  )
}
