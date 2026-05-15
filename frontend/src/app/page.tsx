'use client'

import dynamic from 'next/dynamic'
import { useState } from 'react'
import RoomView2D from '@/components/RoomView2D'
import CSIChart from '@/components/CSIChart'
import MetricsPanel from '@/components/MetricsPanel'
import SettingsPanel from '@/components/SettingsPanel'
import { useMockData, useMockChartData } from '@/hooks/useMockData'

// Three.js must not run SSR
const PoseView3D = dynamic(() => import('@/components/PoseView3D'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-slate-900 rounded-lg text-slate-500 text-sm">
      Loading 3D scene…
    </div>
  ),
})

interface AppSettings {
  useMockData: boolean
  showTriangulation: boolean
  updateRateMs: number
}

const DEFAULT_SETTINGS: AppSettings = {
  useMockData: true,
  showTriangulation: true,
  updateRateMs: 100,
}

export default function DashboardPage() {
  const [showSettings, setShowSettings] = useState(false)
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)

  // Mock data hooks
  const frame = useMockData(settings.updateRateMs)
  const { amplitude, breathing, heartrate } = useMockChartData()

  const detection = frame?.detection ?? null

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-slate-100 flex flex-col">
      {/* ─── Header ───────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-[#0a0e1a]/90 backdrop-blur border-b border-slate-800 px-4 py-3">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_2px_rgba(52,211,153,0.5)]" />
            <h1 className="text-base font-semibold tracking-tight">
              WiFi Sensing{' '}
              <span className="text-slate-400 font-normal">RuView</span>
            </h1>
            <span className="hidden sm:inline text-xs bg-slate-800 text-slate-400 border border-slate-700 px-2 py-0.5 rounded-full">
              ESP32-S3 ×3
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500">
              {frame ? new Date(frame.timestamp).toLocaleTimeString() : '—'}
            </span>
            <button
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm text-slate-300 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 0 1 1.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.559.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.894.149c-.424.07-.764.383-.929.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 0 1-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.398.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 0 1-.12-1.45l.527-.737c.25-.35.272-.806.108-1.204-.165-.397-.506-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.764-.383.929-.78.165-.398.143-.854-.108-1.204l-.526-.738a1.125 1.125 0 0 1 .12-1.45l.773-.773a1.125 1.125 0 0 1 1.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              </svg>
              Settings
            </button>
          </div>
        </div>
      </header>

      {/* ─── Main grid ────────────────────────────────────── */}
      <main className="flex-1 px-4 py-4 max-w-[1600px] mx-auto w-full flex flex-col gap-4">

        {/* Row 1: 2D Room + 3D Pose */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4" style={{ minHeight: '420px' }}>
          {/* 2D Room View */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                2D Room View
              </h2>
              <span className="text-xs text-slate-600">5 m × 5 m</span>
            </div>
            <div className="flex-1 min-h-[380px]">
              <RoomView2D
                detection={detection}
                showTriangulation={settings.showTriangulation}
              />
            </div>
          </div>

          {/* 3D Pose View */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                3D Pose View
              </h2>
              <span className="text-xs text-slate-600">Drag to rotate · Scroll to zoom</span>
            </div>
            <div className="flex-1 min-h-[380px]">
              <PoseView3D keypoints={detection?.keypoints} />
            </div>
          </div>
        </div>

        {/* Row 2: CSI Charts */}
        <CSIChart
          amplitude={amplitude}
          breathing={breathing}
          heartrate={heartrate}
        />

        {/* Row 3: Metrics */}
        <MetricsPanel detection={detection} isConnected={false} />
      </main>

      {/* ─── Settings modal ───────────────────────────────── */}
      {showSettings && (
        <SettingsPanel
          settings={settings}
          onChange={setSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  )
}
