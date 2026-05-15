# WiFi Sensing RuView — Web Visualization App

## Project Overview
สร้าง web application สำหรับแสดงผลระบบ WiFi Sensing ที่ใช้ ESP32-S3 3 ตัวตรวจจับตำแหน่งและท่าทางของคนในพื้นที่

**ขณะนี้:** สร้างเฉพาะ frontend web app พร้อม simulated data (ยังไม่ต่อ ESP32 จริง)  
**ภายหลัง:** เตรียม API endpoint ไว้รอรับ real CSI data จาก ESP32-S3

---

## IMPORTANT: Company Policy Constraints

### ข้อห้ามและข้อจำกัดของเครื่องบริษัท
1. **ห้ามใช้ Docker Desktop** — ใช้ Docker Engine ใน WSL2 เท่านั้น
2. **ห้ามใช้ PowerShell** — ใช้ Bash (Git Bash / WSL2 / cmd) เท่านั้น
3. **ห้ามแก้ไข network/DNS settings** — ไม่สร้าง `.wslconfig`, ไม่เปลี่ยน `/etc/resolv.conf`
4. **WSL2 ไม่มีอินเตอร์เน็ต** — corporate firewall block Docker Hub จาก WSL2

### Development Setup ปัจจุบัน (Windows-native)
เนื่องจาก WSL2 ไม่สามารถดึง Docker images ได้ **ใช้ Node.js + Python บน Windows โดยตรง**:

```bash
# รัน backend (Git Bash หรือ cmd)
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# รัน frontend (Git Bash หรือ cmd)
cd frontend
pnpm dev
```

หรือดับเบิลคลิก `.bat` files ที่สร้างไว้:
- `start-backend.bat` — เปิด FastAPI server
- `start-frontend.bat` — เปิด Next.js dev server

### Access URLs
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs
- **WebSocket:** ws://localhost:8000/ws/csi

### Docker (สำหรับอนาคต — เมื่อ IT อนุญาต)
Docker Engine ใน WSL2 พร้อมใช้งาน (v29.4.1) และ `docker-compose.yml` เตรียมไว้แล้ว
เมื่อ IT เปิดให้ WSL2 ออก internet หรือมี internal registry:
```bash
# ผ่าน Git Bash (ไม่ใช้ PowerShell)
wsl -d Ubuntu -- bash -c "cd /mnt/c/Users/thannunt/Desktop/wifi_sensing && docker compose up -d"
```

---

## Architecture

```
wifi_sensing/
├── frontend/              # Next.js 15 + TypeScript + Tailwind
│   ├── src/
│   │   ├── app/           # Next.js App Router
│   │   ├── components/    # React components
│   │   ├── hooks/         # useMockData, useWebSocket
│   │   ├── types/         # TypeScript interfaces
│   │   └── utils/         # triangulation, signalProcessing
│   ├── package.json       # pnpm dependencies
│   └── Dockerfile
├── backend/               # FastAPI (Python 3.12)
│   ├── app/
│   │   ├── main.py        # FastAPI app + WebSocket /ws/csi
│   │   ├── models/        # Pydantic models
│   │   └── routers/       # /api/status, /api/nodes, /api/calibrate
│   ├── requirements.txt
│   └── Dockerfile
├── docker-compose.yml     # Orchestrates frontend + backend
├── CLAUDE.md              # This file
└── progress.md            # Build progress tracker
```

---

## Core Requirements

### 1. Technology Stack
- **Frontend Framework:** Next.js 15 + TypeScript
- **Package Manager:** pnpm
- **3D Visualization:** Three.js (@react-three/fiber + @react-three/drei)
- **UI Components:** Tailwind CSS
- **Real-time Updates:** WebSocket (mock client-side สำหรับตอนนี้)
- **Charts:** Chart.js + react-chartjs-2
- **Backend:** FastAPI (Python 3.12) + uvicorn
- **Container:** Docker Engine (WSL2 Ubuntu)

### 2. Main Features

#### Feature 1: Room Layout (2D Top View)
- แสดงห้องมุมมองบนลง (top-down view) ขนาด 5m × 5m
- แสดงตำแหน่ง ESP32-S3 ทั้ง 3 nodes (A, B, C) บนแผนผัง
- แสดงตำแหน่งคนที่ตรวจจับได้ (X, Y) เป็น dot หรือ silhouette
- แสดง triangulation lines จาก 3 nodes มาบรรจบที่ตำแหน่งคน (optional)
- Update ตำแหน่งแบบ real-time (smooth animation)

#### Feature 2: 3D Pose Visualization
- แสดง 3D skeleton ของคนที่ตรวจจับได้
- ใช้ 17 keypoints ตาม COCO format: nose, eyes, ears, shoulders, elbows, wrists, hips, knees, ankles
- Skeleton เคลื่อนไหวตาม pose ที่ detect ได้
- สามารถหมุนมุมมอง (orbit controls)
- แสดงความสูง (Z-axis) ของ keypoints

#### Feature 3: CSI Signal Dashboard
แสดงกราฟ real-time:
- **CSI Amplitude timeline**: แสดงความแรงสัญญาณตามเวลา
- **Breathing waveform** (0.1–0.5 Hz)
- **Heart rate waveform** (0.8–2.0 Hz)

#### Feature 4: Detection Metrics
- Presence: detected / not detected
- Position: (X, Y, Z) coordinates
- Breathing rate: X BPM
- Heart rate: X BPM
- Confidence score: percentage
- Number of persons detected

### 3. UI Layout

```
┌─────────────────────────────────────────────────────┐
│  WiFi Sensing Dashboard              [Settings]    │
├──────────────────┬──────────────────────────────────┤
│                  │                                  │
│   2D Room View   │      3D Pose View                │
│   (top-down)     │      (skeleton + orbit)          │
│   5m × 5m        │                                  │
│                  │                                  │
├──────────────────┴──────────────────────────────────┤
│  CSI Signal Charts (3 charts side by side)         │
│  [Amplitude] [Breathing] [Heart Rate]               │
├─────────────────────────────────────────────────────┤
│  Detection Metrics                                  │
│  Presence: ✓  |  Position: (2.3, 1.8, 1.2)         │
│  Breathing: 16 BPM  |  Heart: 72 BPM               │
└─────────────────────────────────────────────────────┘
```

---

## Technical Implementation

### Mock Data Generator (client-side)
ใช้ `useMockData` hook ใน `src/hooks/useMockData.ts`:
- Simulate 1 person walking around the room (circular path)
- Generate realistic CSI amplitude values (56 subcarriers)
- Generate breathing waveform (sinusoidal ~0.3 Hz)
- Generate heart rate waveform (faster sinusoidal ~1.2 Hz)
- Update at 10 Hz (100ms interval)
- Animate 17 COCO keypoints (walking motion)

### Backend WebSocket (for future ESP32)
```
WS  ws://localhost:8000/ws/csi    # Real-time CSI stream (mock data from server)
GET /api/status                   # System status
GET /api/nodes                    # ESP32 node list
POST /api/calibrate               # Trigger baseline calibration
```

### WebSocket Data Format
```typescript
interface CSIFrame {
  timestamp: number
  nodes: {
    nodeId: 'A' | 'B' | 'C'
    csi_amplitude: number[]  // 56 subcarriers
    csi_phase: number[]
  }[]
  detection: {
    presence: boolean
    position: { x: number; y: number; z: number }
    keypoints?: Array<{ x: number; y: number; z: number; confidence: number }>
    breathing_bpm?: number
    heart_bpm?: number
    confidence?: number
  }
}
```

---

## Build Phases

### Phase 1: Project Setup ✅
- Docker Engine setup (WSL2 Ubuntu)
- Next.js 15 + pnpm frontend scaffold
- FastAPI backend scaffold
- docker-compose.yml orchestration

### Phase 2: 2D Room View ✅
- `RoomView2D.tsx` — Canvas top-down view

### Phase 3: 3D Pose View ✅
- `PoseView3D.tsx` — Three.js skeleton with orbit controls

### Phase 4: CSI Signal Charts ✅
- `CSIChart.tsx` — 3 real-time Chart.js charts

### Phase 5: Mock Data Generator ✅
- `useMockData.ts` — 10Hz simulated data hook

### Phase 6: Metrics Panel ✅
- `MetricsPanel.tsx` — detection status cards

### Phase 7: Polish ✅
- `SettingsPanel.tsx` — simulation controls
- Smooth animations, dark theme
- Responsive layout

### Phase 8: ESP32 Integration (future)
- Replace mock with real WebSocket at `ws://ESP32_IP:5005`
- UDP → WebSocket aggregator server
- Real CSI packet parsing

---

## Visual Design Guidelines

### Colors
- ESP32 Nodes: Teal/Cyan (#1D9E75)
- Person detected: Blue (#185FA5)
- CSI signal: Gray (#888780) / Blue (#185FA5)
- Breathing: Green (#1D9E75)
- Heart rate: Red (#E24B4A)
- Background: Dark (#0a0e1a)

### Typography
- Font: Inter / system-ui
- Headers: 18–24px, medium weight
- Body: 14–16px
- Metrics: 20–32px for numbers

---

## Success Criteria
✅ Docker Engine (WSL2) only — no Docker Desktop  
✅ Frontend: Next.js 15 + pnpm + TypeScript + Tailwind  
✅ Backend: FastAPI + uvicorn  
✅ `docker compose up` starts both services  
✅ Web app at http://localhost:3000  
✅ Mock data shows realistic person movement  
✅ All 4 main views render correctly  
✅ Charts update smoothly without lag  
✅ 3D pose can be rotated with mouse  
✅ Code is well-structured for future ESP32 integration  
