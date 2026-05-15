# WiFi Sensing Web App — Build Progress

## Status: ✅ All Phases Complete — App Running

---

## Company Policy (อ่านก่อนทำงาน)

| ข้อห้าม | เหตุผล |
|---------|--------|
| ❌ ห้ามใช้ Docker Desktop | บริษัทห้าม |
| ❌ ห้ามใช้ PowerShell | ผิด policy บริษัท |
| ❌ ห้ามแก้ network/DNS ใน WSL2 | เครื่อง domain บริษัท — security |
| ❌ ห้ามใช้ `wsl --shutdown` / `.wslconfig` | กระทบ network policy |

**วิธีรัน commands ทั้งหมด:** ใช้ Bash (Git Bash) หรือ cmd เท่านั้น

---

## Quick Start

```bash
# Terminal 1 — Backend
cd c:/Users/thannunt/Desktop/wifi_sensing/backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Terminal 2 — Frontend
cd c:/Users/thannunt/Desktop/wifi_sensing/frontend
pnpm dev
```

หรือดับเบิลคลิก:
- `start-backend.bat`
- `start-frontend.bat`

**URL:** http://localhost:3000 (frontend) | http://localhost:8000/docs (API)

---

## Phase Progress

| Phase | Status | Description |
|-------|--------|-------------|
| Phase 1 | ✅ Done | Project Setup (Next.js 16 + pnpm + FastAPI) |
| Phase 2 | ✅ Done | 2D Room View (canvas top-down) |
| Phase 3 | ✅ Done | 3D Pose View (Three.js skeleton + orbit) |
| Phase 4 | ✅ Done | CSI Signal Charts (Chart.js real-time) |
| Phase 5 | ✅ Done | Mock Data Generator (10Hz simulation) |
| Phase 6 | ✅ Done | Metrics Panel (detection status cards) |
| Phase 7 | ✅ Done | Polish (settings panel, animations, dark mode) |
| Phase 8 | ⏳ Future | ESP32 real hardware integration |

---

## Detailed Log

### 2026-04-30 — Session Start

**Stack change (user request):**
- ~~Vite + React~~ → **Next.js 16 + pnpm**
- ~~Single app~~ → **Separated frontend/ + backend/**
- Backend: **FastAPI (Python 3.13)**
- Container: **Docker Engine (WSL2)** — planned, not yet active

**Policy constraints discovered:**
- WSL2 (Docker Engine) ไม่มีอินเตอร์เน็ต เพราะ corporate firewall block
- ห้ามใช้ PowerShell ตาม company policy
- ห้ามแก้ network settings ของเครื่อง domain
- **ใช้ Windows-native Node.js + Python แทน Docker ในการพัฒนา**

---

### Phase 1: Project Setup ✅

**Completed:**
- [x] `backend/` — FastAPI + uvicorn + pydantic + websockets
- [x] `frontend/` — Next.js 16.2.4 + pnpm + TypeScript + Tailwind CSS
- [x] `docker-compose.yml` — เตรียมไว้ (ใช้งานได้เมื่อ IT อนุญาต)
- [x] `start-backend.bat` + `start-frontend.bat` — สำหรับ Windows
- [x] pnpm install + pip install สำเร็จ
- [x] `pnpm build` ผ่านไม่มี TypeScript error

**Versions:**
- Node.js: 24.15.0
- Python: 3.13.13
- pnpm: 10.33.0
- Next.js: 16.2.4
- FastAPI: 0.136.0

---

### Phase 2: 2D Room View ✅

**File:** `frontend/src/components/RoomView2D.tsx`

**Features:**
- [x] Canvas 420×420px top-down room view (5m × 5m)
- [x] Grid overlay (1m cells)
- [x] ESP32 nodes A, B, C at fixed corners (teal dots)
- [x] Person position dot (blue) with glow effect
- [x] Triangulation lines (dashed, configurable on/off)
- [x] Smooth position interpolation (lerp 12%)
- [x] Real-time coordinate label
- [x] requestAnimationFrame loop

---

### Phase 3: 3D Pose View ✅

**File:** `frontend/src/components/PoseView3D.tsx`

**Features:**
- [x] Three.js scene via @react-three/fiber
- [x] OrbitControls (drag to rotate, scroll to zoom)
- [x] Grid floor 5m × 5m (green grid lines)
- [x] Room boundary lines
- [x] ESP32 node markers (green cubes with labels)
- [x] 17 COCO keypoints as spheres (blue, confidence-colored)
- [x] Skeleton bone connections as lines
- [x] Walking animation from mock data
- [x] `dynamic(() => import(...), { ssr: false })` — prevents SSR crash
- [x] Coordinate mapping: room (x, y, z) → Three.js (x, z, -y)

---

### Phase 4: CSI Signal Charts ✅

**File:** `frontend/src/components/CSIChart.tsx`

**Features:**
- [x] 3 real-time line charts side by side
- [x] CSI Amplitude (blue) — |H| values
- [x] Breathing waveform (green, 0.3 Hz sinusoidal)
- [x] Heart rate waveform (red, 1.2 Hz sharp peaks)
- [x] `animation: false` for 10Hz performance
- [x] Last 100 data points (10-second window)
- [x] Dark mode styled

---

### Phase 5: Mock Data Generator ✅

**Files:**
- `frontend/src/hooks/useMockData.ts` — main frame hook
- `frontend/src/utils/signalProcessing.ts` — waveform math

**Features:**
- [x] `useMockData(intervalMs)` hook — CSIFrame every 100ms
- [x] `useMockChartData()` hook — amplitude/breathing/heartrate arrays
- [x] Circular walk path (2.5±1.5m in 5m×5m room)
- [x] 17 COCO keypoints with walking animation (arm/leg swing)
- [x] Breathing: sineWave(t, 0.3 Hz, amp=10, offset=42)
- [x] Heart rate: heartbeatWave(t, 1.2 Hz, amp=15, offset=42)
- [x] CSI amplitude: 56 random values around base 42

---

### Phase 6: Metrics Panel ✅

**File:** `frontend/src/components/MetricsPanel.tsx`

**Features:**
- [x] Presence indicator (green dot + "Detected"/"Empty")
- [x] Position X, Y, Z coordinates
- [x] Breathing BPM (green)
- [x] Heart Rate BPM (red)
- [x] Confidence % with progress bar
- [x] Person count
- [x] Connection status badge (ESP32/Simulation)

---

### Phase 7: Polish ✅

**File:** `frontend/src/components/SettingsPanel.tsx`

**Features:**
- [x] Settings modal (Settings button in header)
- [x] Data source toggle: Simulation / ESP32 (ESP32 disabled)
- [x] Update rate slider (50ms–500ms)
- [x] Triangulation lines toggle
- [x] ESP32 URL input (disabled placeholder)
- [x] Dark theme throughout (#0a0e1a background)
- [x] Responsive grid layout (1col mobile / 2col desktop)
- [x] Sticky header with timestamp
- [x] Smooth animations via CSS

---

### Phase 8: ESP32 Integration ⏳ (Future)

**ยังไม่ทำ — รอ hardware:**
- [ ] Replace `useMockData` with `useWebSocket` hook
- [ ] Connect to `ws://ESP32_IP:5005` (UDP→WebSocket aggregator)
- [ ] Parse real CSI packets from ESP32-S3
- [ ] Add connection status + auto-reconnect
- [ ] Add calibration button (POST /api/calibrate)
- [ ] Test with real 3-node triangulation

---

## File Structure (Final)

```
wifi_sensing/
├── frontend/                    # Next.js 16 + TypeScript + Tailwind
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx       # Root layout (dark mode)
│   │   │   ├── page.tsx         # Main dashboard (all components)
│   │   │   └── globals.css      # Tailwind + base styles
│   │   ├── components/
│   │   │   ├── RoomView2D.tsx   # Canvas 2D top-down room
│   │   │   ├── PoseView3D.tsx   # Three.js 3D skeleton
│   │   │   ├── CSIChart.tsx     # Chart.js real-time charts
│   │   │   ├── MetricsPanel.tsx # Detection status cards
│   │   │   └── SettingsPanel.tsx# Settings modal
│   │   ├── hooks/
│   │   │   ├── useMockData.ts   # 10Hz simulated data
│   │   │   └── useWebSocket.ts  # Future ESP32 connection
│   │   ├── types/
│   │   │   └── csi.ts           # TypeScript interfaces
│   │   └── utils/
│   │       ├── triangulation.ts # Room↔Canvas coordinate math
│   │       └── signalProcessing.ts # Waveform generators
│   ├── package.json             # pnpm dependencies
│   ├── next.config.ts           # Next.js + Three.js transpile
│   ├── tailwind.config.ts       # Dark theme colors
│   └── Dockerfile               # For Docker (future)
├── backend/                     # FastAPI (Python 3.13)
│   ├── app/
│   │   ├── main.py              # FastAPI app + /ws/csi WebSocket
│   │   ├── models/csi.py        # Pydantic models
│   │   └── routers/
│   │       ├── status.py        # GET /api/status
│   │       └── nodes.py         # GET /api/nodes, POST /api/calibrate
│   ├── requirements.txt
│   └── Dockerfile               # For Docker (future)
├── docker-compose.yml           # Docker orchestration (future)
├── start-backend.bat            # Double-click to start backend
├── start-frontend.bat           # Double-click to start frontend
├── CLAUDE.md                    # Project spec + policy constraints
└── progress.md                  # This file
```

---

## Environment Versions

| Tool | Version |
|------|---------|
| Node.js | 24.15.0 (Windows) |
| pnpm | 10.33.0 |
| Python | 3.13.13 (Windows) |
| Next.js | 16.2.4 |
| FastAPI | 0.136.0 |
| Three.js | 0.176.0 |
| Chart.js | 4.5.1 |
| Docker Engine | 29.4.1 (WSL2 Ubuntu — standby) |

---

## Testing Checklist

- [ ] Open http://localhost:3000 and confirm dashboard loads
- [ ] 2D room view shows person moving in circular path
- [ ] 3D skeleton animates (walking pose)
- [ ] 3D scene rotates with mouse drag
- [ ] CSI charts update every 100ms
- [ ] Breathing chart shows sinusoidal wave
- [ ] Heart rate chart shows sharp peaks
- [ ] Metrics panel shows position, BPM, confidence
- [ ] Settings panel opens and toggles work
- [ ] No console errors

---

*Last updated: 2026-04-30*
