'use client'

import { useState } from 'react'

interface Settings {
  useMockData: boolean
  showTriangulation: boolean
  updateRateMs: number
}

interface Props {
  settings: Settings
  onChange: (s: Settings) => void
  onClose: () => void
}

export default function SettingsPanel({ settings, onChange, onClose }: Props) {
  const [local, setLocal] = useState<Settings>(settings)

  const apply = () => {
    onChange(local)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-white">Settings</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors text-xl leading-none"
          >
            ✕
          </button>
        </div>

        <div className="space-y-5">
          {/* Data source */}
          <div>
            <label className="text-sm font-medium text-slate-300 mb-3 block">Data Source</label>
            <div className="flex gap-3">
              {[
                { label: 'Simulation', value: true },
                { label: 'ESP32 (disabled)', value: false },
              ].map(opt => (
                <button
                  key={String(opt.value)}
                  onClick={() => opt.value !== false && setLocal(p => ({ ...p, useMockData: opt.value }))}
                  disabled={opt.value === false}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm border transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                    local.useMockData === opt.value
                      ? 'bg-blue-600 border-blue-500 text-white'
                      : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Update rate */}
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium text-slate-300">Update Rate</label>
              <span className="text-sm text-blue-400 font-mono">{local.updateRateMs} ms</span>
            </div>
            <input
              type="range"
              min={50}
              max={500}
              step={50}
              value={local.updateRateMs}
              onChange={e => setLocal(p => ({ ...p, updateRateMs: Number(e.target.value) }))}
              className="w-full accent-blue-500"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>50 ms (20 Hz)</span>
              <span>500 ms (2 Hz)</span>
            </div>
          </div>

          {/* Triangulation lines */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-300">Triangulation Lines</p>
              <p className="text-xs text-slate-500">Show lines from nodes to person</p>
            </div>
            <button
              onClick={() => setLocal(p => ({ ...p, showTriangulation: !p.showTriangulation }))}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                local.showTriangulation ? 'bg-blue-600' : 'bg-slate-600'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  local.showTriangulation ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* ESP32 connect placeholder */}
          <div className="bg-slate-700/50 border border-slate-600/50 rounded-lg p-3">
            <p className="text-xs text-slate-400 mb-2">ESP32 Aggregator</p>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="ws://192.168.1.x:5005"
                disabled
                className="flex-1 bg-slate-700 border border-slate-600 rounded px-3 py-1.5 text-sm text-slate-400 disabled:opacity-50 cursor-not-allowed"
              />
              <button
                disabled
                className="px-3 py-1.5 bg-slate-600 text-slate-400 text-sm rounded disabled:opacity-50 cursor-not-allowed"
              >
                Connect
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-1.5">Available in Phase 8 (ESP32 integration)</p>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700 transition-colors text-sm"
          >
            Cancel
          </button>
          <button
            onClick={apply}
            className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors text-sm font-medium"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  )
}
