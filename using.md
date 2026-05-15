# WiFi Sensing RuView — คู่มือการใช้งาน

## Prerequisites (ต้องมีในเครื่องก่อน)

| Tool | Version | ติดตั้ง |
|------|---------|--------|
| Node.js | 18+ | https://nodejs.org |
| pnpm | any | `npm install -g pnpm` |
| Python | 3.11+ | https://python.org |
| Git | any | https://git-scm.com |

---

## Clone และ Setup ครั้งแรก

```bash
# 1. Clone repo
git clone https://github.com/zugus2025-beep/WiFi-Sensing-WebApp.git
cd WiFi-Sensing-WebApp

# 2. ติดตั้ง frontend dependencies
cd frontend
pnpm install

# 3. ติดตั้ง backend dependencies
cd ../backend
pip install -r requirements.txt
```

---

## รันโปรเจค

เปิด **2 terminal** แยกกัน:

**Terminal 1 — Backend (FastAPI)**
```bash
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Terminal 2 — Frontend (Next.js)**
```bash
cd frontend
pnpm dev
```

เปิด browser ที่ **http://localhost:3000**

| URL | คืออะไร |
|-----|--------|
| http://localhost:3000 | Dashboard หลัก |
| http://localhost:8000/docs | FastAPI Swagger UI |
| ws://localhost:8000/ws/csi | WebSocket stream |

---

## โครงสร้างโปรเจค

```
WiFi-Sensing-WebApp/
├── frontend/                  # Next.js 16 + TypeScript + Tailwind
│   └── src/
│       ├── app/               # หน้าหลัก (page.tsx, layout.tsx)
│       ├── components/        # UI components
│       │   ├── RoomView2D.tsx     # แผนที่ห้อง 2D (Canvas)
│       │   ├── PoseView3D.tsx     # โครงกระดูก 3D (Three.js)
│       │   ├── CSIChart.tsx       # กราฟ real-time (Chart.js)
│       │   ├── MetricsPanel.tsx   # แสดงค่า BPM, ตำแหน่ง
│       │   └── SettingsPanel.tsx  # ตั้งค่า simulation
│       ├── hooks/
│       │   ├── useMockData.ts     # สร้างข้อมูลจำลอง 10Hz
│       │   └── useWebSocket.ts    # เชื่อม ESP32 จริง (อนาคต)
│       ├── types/csi.ts           # TypeScript interfaces
│       └── utils/
│           ├── triangulation.ts   # คำนวณตำแหน่งจาก nodes
│           └── signalProcessing.ts# คำนวณ waveform
├── backend/                   # FastAPI (Python)
│   └── app/
│       ├── main.py            # API + WebSocket /ws/csi
│       ├── models/csi.py      # Pydantic models
│       └── routers/
│           ├── status.py      # GET /api/status
│           └── nodes.py       # GET /api/nodes, POST /api/calibrate
├── docker-compose.yml         # Docker (ใช้ได้เมื่อมี internet ใน WSL2)
├── start-backend.bat          # Windows: ดับเบิลคลิกรัน backend
├── start-frontend.bat         # Windows: ดับเบิลคลิกรัน frontend
└── using.md                   # ไฟล์นี้
```

---

## พัฒนาต่อ

### เพิ่ม component ใหม่
```bash
# สร้างไฟล์ใน frontend/src/components/
# แล้ว import เข้า frontend/src/app/page.tsx
```

### แก้ไข mock data
```
frontend/src/hooks/useMockData.ts
```

### เพิ่ม API endpoint ใหม่ (backend)
```
backend/app/routers/  ← สร้างไฟล์ใหม่
backend/app/main.py   ← เพิ่ม app.include_router(...)
```

### เชื่อมต่อ ESP32 จริง (Phase 8)
แก้ `frontend/src/app/page.tsx` บรรทัด `useMockData` → เปลี่ยนเป็น `useWebSocket`
```typescript
// เปลี่ยน URL ให้ตรงกับ ESP32 aggregator
const { isConnected } = useWebSocket({ url: 'ws://192.168.x.x:5005' })
```

---

## คำสั่งที่ใช้บ่อย

```bash
# Frontend
pnpm dev          # รัน dev server
pnpm build        # build production
pnpm lint         # ตรวจสอบ code

# Backend
uvicorn app.main:app --reload          # รัน dev
pip install -r requirements.txt        # ติดตั้ง deps ใหม่
pip freeze > requirements.txt          # อัปเดต deps

# Git
git pull                               # ดึง code ใหม่จาก GitHub
git add . && git commit -m "..."       # commit
git push                               # push ขึ้น GitHub
```

---

## Policy (เครื่องบริษัท SCG)

- ใช้ **Bash / cmd** เท่านั้น — ห้ามใช้ PowerShell
- ห้ามใช้ Docker Desktop — ใช้ Docker Engine ใน WSL2
- ห้ามแก้ไข network/DNS settings ของ WSL2
