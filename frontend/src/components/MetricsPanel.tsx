'use client'

import type { Detection } from '@/types/csi'

interface Props {
  detection: Detection | null
  isConnected: boolean
}

function MetricCard({
  label,
  value,
  unit,
  color = 'text-white',
  sub,
}: {
  label: string
  value: string | number
  unit?: string
  color?: string
  sub?: string
}) {
  return (
    <div className="bg-slate-800/60 border border-slate-700/50 rounded-lg px-4 py-3 flex flex-col gap-1">
      <span className="text-xs text-slate-400 uppercase tracking-wider">{label}</span>
      <div className="flex items-baseline gap-1">
        <span className={`text-2xl font-semibold ${color}`}>{value}</span>
        {unit && <span className="text-sm text-slate-400">{unit}</span>}
      </div>
      {sub && <span className="text-xs text-slate-500">{sub}</span>}
    </div>
  )
}

export default function MetricsPanel({ detection, isConnected }: Props) {
  const d = detection
  const presence = d?.presence ?? false
  const pos = d?.position
  const conf = d?.confidence ?? 0

  return (
    <div className="w-full bg-slate-900/80 border border-slate-700/50 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-slate-300 uppercase tracking-wider">
          Detection Metrics
        </h3>
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
              isConnected
                ? 'bg-emerald-900/30 border-emerald-700/50 text-emerald-400'
                : 'bg-amber-900/30 border-amber-700/50 text-amber-400'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            {isConnected ? 'ESP32 Connected' : 'Simulation'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Presence */}
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-lg px-4 py-3 flex flex-col gap-1">
          <span className="text-xs text-slate-400 uppercase tracking-wider">Presence</span>
          <div className="flex items-center gap-2 mt-1">
            <span
              className={`w-3 h-3 rounded-full ${
                presence ? 'bg-emerald-400 shadow-[0_0_8px_2px_rgba(52,211,153,0.5)]' : 'bg-slate-600'
              }`}
            />
            <span className={`text-lg font-semibold ${presence ? 'text-emerald-400' : 'text-slate-400'}`}>
              {presence ? 'Detected' : 'Empty'}
            </span>
          </div>
        </div>

        {/* Position */}
        <MetricCard
          label="Position"
          value={pos ? `${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}` : '—'}
          unit="m"
          color="text-blue-300"
          sub={pos ? `Z: ${pos.z.toFixed(1)} m` : undefined}
        />

        {/* Breathing */}
        <MetricCard
          label="Breathing"
          value={d?.breathing_bpm ?? '—'}
          unit="BPM"
          color="text-emerald-400"
          sub="0.1–0.5 Hz range"
        />

        {/* Heart Rate */}
        <MetricCard
          label="Heart Rate"
          value={d?.heart_bpm ?? '—'}
          unit="BPM"
          color="text-red-400"
          sub="0.8–2.0 Hz range"
        />

        {/* Confidence */}
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-lg px-4 py-3 flex flex-col gap-1">
          <span className="text-xs text-slate-400 uppercase tracking-wider">Confidence</span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-semibold text-purple-400">
              {d ? Math.round(conf * 100) : '—'}
            </span>
            {d && <span className="text-sm text-slate-400">%</span>}
          </div>
          {d && (
            <div className="w-full bg-slate-700 rounded-full h-1.5 mt-1">
              <div
                className="bg-purple-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${conf * 100}%` }}
              />
            </div>
          )}
        </div>

        {/* Persons */}
        <MetricCard
          label="Persons"
          value={presence ? 1 : 0}
          color="text-white"
          sub="Max: 4 (future)"
        />
      </div>
    </div>
  )
}
