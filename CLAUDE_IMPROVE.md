# WiFi Sensing Project - Improvement Guide

**For:** Claude Code  
**Goal:** Upgrade to 10/10 score (ยกระดับเป็น 10/10)  
**Action:** Execute all 11 tasks once, then delete this file (ทำครั้งเดียว แล้วลบ)

---

## Part 1: Documentation (5 tasks)

### Task 1: Create README.md

**File:** `README.md` (project root)

```markdown
# WiFi Sensing - Real-time Human Detection

Camera-free sensing system using ESP32-S3 WiFi CSI (ระบบตรวจจับคนด้วย WiFi ไม่ใช้กล้อง)

## Quick Start

```bash
# Backend
cd backend && python -m uvicorn app.main:app --reload

# Frontend
cd frontend && pnpm dev
```

Open http://localhost:3000

## Docs (เอกสาร)

**Start:** README → CLAUDE.md → progress.md  
**Dev:** SKILL.md files → Code

## Features

✅ 2D/3D visualization  
✅ Real-time charts (10Hz)  
✅ Mock data simulation  
⏳ ESP32 hardware (Phase 8)

## Stack

Next.js 16 + FastAPI + Three.js + Chart.js

See `CLAUDE.md` for full architecture (ดูสถาปัตยกรรมเต็มใน CLAUDE.md)
```

---

### Task 2: Add to CLAUDE.md

**File:** `CLAUDE.md`

**Insert after line 1 (before "Project Overview"):**

```markdown
## Executive Summary (สรุปสำหรับผู้บริหาร)

**What:** WiFi human detection without cameras  
**How:** ESP32-S3 nodes analyze signal reflections  
**Status:** Frontend ✅ | Hardware ⏳  
**Stack:** Next.js + FastAPI + Three.js

---

## Math Foundation (รากฐานคณิตศาสตร์)

```
1. H(f,t) = I(f,t) + jQ(f,t)        [Complex CSI]
2. |H| = √(I² + Q²)                  [Amplitude]
3. φ = atan2(Q, I)                   [Phase]
4. [x,y,z] = Triangulation(d_A,d_B,d_C)  [Position]
5. BPM = FFT(0.1-0.5Hz) × 60        [Breathing]
```

Used in `backend/app/` signal processing (ใช้ในการประมวลผลสัญญาณ)

---
```

**Insert before end (new section):**

```markdown
---

## Troubleshooting (แก้ปัญหา)

| Issue | Fix |
|-------|-----|
| `pnpm dev` fails | Node.js 24+ required |
| Blank page | Run `pnpm build`, check errors |
| No charts update | Check console for `useMockData` errors |
| 3D black | Already fixed with `dynamic(..., {ssr:false})` |
| Port conflict | Backend :8000, Frontend :3000 |
| Python error | `pip install -r requirements.txt` |
| WebSocket fail | Start backend before frontend |

**Debug:**
```bash
netstat -an | findstr "3000 8000"
curl http://localhost:8000/api/status
cd frontend && pnpm build
```
```

---

### Task 3: Add to progress.md

**File:** `progress.md`

**Insert after Phase 7 section:**

```markdown
### Phase 8: ESP32 Hardware ⏳

**Setup (การติดตั้ง):**
- ESP32-S3-DevKitC-1-N16R8 × 3
- WiFi router 2.4GHz
- Positions: A(0.5,0.5,0.2), B(4.5,0.5,0.2), C(2.5,4.5,0.2) meters

**Firmware:** See `for_esp32/CLAUDE_ESP32S3_CODE.md`

**Changes needed (ต้องแก้):**
- [ ] Backend: Parse UDP binary from ESP32
- [ ] Frontend: Replace `useMockData` with `useWebSocket`
- [ ] Add connection status indicator
- [ ] Add ESP32 node health display

**Test:**
- [ ] Flash 3 nodes
- [ ] Verify UDP port 5005
- [ ] Check real CSI data
- [ ] Validate position accuracy
```

**Insert before "Testing Checklist":**

```markdown
## Known Issues (ปัญหาที่ทราบ)

| Issue | Impact | Status |
|-------|--------|--------|
| WSL2 no internet | Docker blocked | Use Windows-native ✅ |
| PowerShell forbidden | Policy | Use .bat files ✅ |
| Mock data only | No real sensing | Phase 8 pending |
| Single person | No multi-track | Future feature |
| Keypoint confidence=1.0 | Mock value | Real ESP32 varies |
```

---

### Task 4: Update SKILL.md files

**All 3 SKILL.md files**

**Add at top:**

```markdown
---
**Navigation (นำทาง):**  
[Three.js] [Chart.js] [WebSocket] ← This file  
See also: CLAUDE.md, progress.md
---
```

**Add at bottom:**

```markdown
---

## Related (เกี่ยวข้อง)

- Other SKILL.md: Different implementations  
- CLAUDE.md: Architecture  
- Code: `frontend/src/components/`, `frontend/src/hooks/`
```

---

### Task 5: Create QUICKREF.md

**File:** `QUICKREF.md` (project root)

```markdown
# Quick Reference (อ้างอิงด่วน)

## Commands

```bash
# Start
cd backend && python -m uvicorn app.main:app --reload
cd frontend && pnpm dev

# Test
curl http://localhost:8000/api/status
cd frontend && pnpm build

# Clean
cd frontend && rm -rf .next
```

## URLs

- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- Docs: http://localhost:8000/docs

## Data Format

```typescript
CSIFrame {
  timestamp: number
  nodes: [{nodeId, csi_amplitude[], csi_phase[]}]
  detection: {
    presence: boolean
    position: {x,y,z}
    keypoints: [{x,y,z,confidence}]
    breathing_bpm, heart_bpm
  }
}
```

## Stack

Node.js 24 | pnpm 10 | Python 3.13 | Next.js 16 | FastAPI 0.136
```

---

## Part 2: Code Quality (5 tasks)

### Task 6: TypeScript Validation

**File:** `frontend/src/types/csi.ts`

**Add:**

```typescript
export function validateCSIFrame(data: unknown): data is CSIFrame {
  if (!data || typeof data !== 'object') return false
  const f = data as any
  return (
    typeof f.timestamp === 'number' &&
    Array.isArray(f.nodes) &&
    f.nodes.length > 0 &&
    f.detection?.presence !== undefined
  )
}

export function validateKeypoint(kp: unknown): kp is Keypoint {
  if (!kp || typeof kp !== 'object') return false
  const p = kp as any
  return (
    typeof p.x === 'number' &&
    typeof p.y === 'number' &&
    typeof p.z === 'number' &&
    typeof p.confidence === 'number' &&
    p.confidence >= 0 && p.confidence <= 1
  )
}

export class CSIDataError extends Error {
  constructor(msg: string, public data?: unknown) {
    super(msg)
    this.name = 'CSIDataError'
  }
}
```

---

### Task 7: Error Handling

**Files:** All components using data

**Pattern (รูปแบบ):**

```typescript
// In each component
const [error, setError] = useState<string | null>(null)

useEffect(() => {
  try {
    if (!data) throw new Error('No data')
    if (!validateCSIFrame(data)) throw new CSIDataError('Invalid')
    
    // ... existing code ...
    setError(null)
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Unknown')
    console.error('Component error:', err)
  }
}, [data])

if (error) return (
  <div className="flex items-center justify-center h-full bg-gray-900 text-red-400">
    <div className="text-center">
      <div className="text-lg font-semibold">Error</div>
      <div className="text-sm">{error}</div>
    </div>
  </div>
)
```

Apply to: `RoomView2D.tsx`, `PoseView3D.tsx`, `CSIChart.tsx`, `MetricsPanel.tsx`

---

### Task 8: Performance Monitor

**File:** `frontend/src/hooks/usePerformanceMonitor.ts`

```typescript
import { useEffect, useRef, useState } from 'react'

interface Stats {
  fps: number
  avgFrameTime: number
  droppedFrames: number
}

export function usePerformanceMonitor(enabled = true) {
  const [stats, setStats] = useState<Stats>({fps: 0, avgFrameTime: 0, droppedFrames: 0})
  const times = useRef<number[]>([])
  const last = useRef(performance.now())
  const dropped = useRef(0)
  
  useEffect(() => {
    if (!enabled) return
    let id: number
    
    const measure = () => {
      const now = performance.now()
      const delta = now - last.current
      
      if (delta > 33) dropped.current++
      
      times.current.push(delta)
      if (times.current.length > 60) times.current.shift()
      
      if (times.current.length >= 60) {
        const avg = times.current.reduce((a,b)=>a+b) / times.current.length
        setStats({
          fps: Math.round(1000/avg),
          avgFrameTime: Math.round(avg*100)/100,
          droppedFrames: dropped.current
        })
      }
      
      last.current = now
      id = requestAnimationFrame(measure)
    }
    
    id = requestAnimationFrame(measure)
    return () => cancelAnimationFrame(id)
  }, [enabled])
  
  return stats
}
```

**Use in `page.tsx`:**

```typescript
const perf = usePerformanceMonitor(process.env.NODE_ENV === 'development')

// Add to JSX
{process.env.NODE_ENV === 'development' && (
  <div className="fixed bottom-4 right-4 bg-gray-800 text-white text-xs p-2 rounded">
    FPS: {perf.fps} | {perf.avgFrameTime}ms
  </div>
)}
```

---

### Task 9: Loading States

**Pattern for components:**

```typescript
import dynamic from 'next/dynamic'

const Component = dynamic(() => import('./ComponentInner'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-gray-900">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
      <div className="text-gray-400">Loading...</div>
    </div>
  )
})
```

Apply to: `PoseView3D.tsx`, `CSIChart.tsx`

---

### Task 10: JSDoc Comments

**Add to all exported functions:**

```typescript
/**
 * Component description (คำอธิบายคอมโพเนนต์)
 * 
 * @param data - CSI frame data
 * @param option - Configuration option
 * @returns React component
 * 
 * @example
 * <Component data={frame} option={true} />
 */
export default function Component({data, option}: Props) {
  // ...
}
```

Apply to: All components in `frontend/src/components/`, all hooks in `frontend/src/hooks/`

---

## Part 3: ESP32 Guide (1 task)

### Task 11: Create ESP32 Firmware Guide

**File:** `for_esp32/CLAUDE_ESP32S3_CODE.md`

**Content:** Complete firmware documentation (เอกสารเฟิร์มแวร์ฉบับสมบูรณ์)

```markdown
# ESP32-S3 Firmware - WiFi Sensing (3 Nodes)

**Target:** ESP32-S3-DevKitC-1-N16R8  
**Purpose:** CSI capture → UDP transmission  
**Language:** C (ESP-IDF v5.2+)

---

## Overview (ภาพรวม)

3 nodes capture WiFi CSI @ 20-100Hz → UDP binary (912 bytes) → Port 5005

Node positions (ตำแหน่ง):
- A: (0.5, 0.5, 0.2) m
- B: (4.5, 0.5, 0.2) m
- C: (2.5, 4.5, 0.2) m

---

## Project Structure (โครงสร้าง)

```
esp32-wifi-sensing/
├── main/
│   ├── main.c                 # Entry point
│   ├── config.h               # Node config (CHANGE NODE_ID!)
│   ├── csi_capture.c          # CSI callback
│   ├── udp_sender.c           # UDP transmit
│   ├── wifi_manager.c         # WiFi connect
│   └── CMakeLists.txt
├── components/
│   └── led_indicator/
│       ├── led_indicator.c    # WS2812 RGB
│       └── CMakeLists.txt
├── CMakeLists.txt
└── sdkconfig
```

---

## 1. config.h - **MUST CHANGE NODE_ID FOR EACH ESP32**

```c
#ifndef CONFIG_H
#define CONFIG_H

// ========== CHANGE THIS FOR EACH NODE ==========
#define NODE_ID        0           // 0=A, 1=B, 2=C
#define NODE_NAME      "Node_A"    // "Node_A", "Node_B", "Node_C"
// ===============================================

// WiFi (same for all 3 nodes - เหมือนกันทั้ง 3 บอร์ด)
#define WIFI_SSID      "YOUR_SSID"
#define WIFI_PASSWORD  "YOUR_PASSWORD"
#define WIFI_CHANNEL   6

// Server (same for all - เหมือนกันทั้ง 3)
#define SERVER_IP      "192.168.1.100"    // Backend IP
#define SERVER_PORT    5005

// Site (same for all - เหมือนกันทั้ง 3)
#define SITE_ID        1

// CSI
#define CSI_SAMPLE_RATE     20      // Hz
#define CSI_BUFFER_SIZE     1024

// Hardware
#define LED_GPIO       48           // WS2812 RGB
#define BUTTON_GPIO    0            // Boot button

#endif
```

---

## 2. Binary Packet Format (912 bytes)

```c
typedef struct __attribute__((packed)) {
    // Header (16 bytes)
    uint32_t magic;         // 0xC5110001 (validation)
    uint32_t site_id;
    uint8_t  node_id;       // 0=A, 1=B, 2=C
    uint8_t  reserved1[3];
    uint32_t sequence;
    uint64_t timestamp_us;
    
    // CSI Data (896 bytes)
    double   csi_i[56];     // In-phase
    double   csi_q[56];     // Quadrature
} csi_packet_t;
```

---

## 3. main.c

```c
#include <stdio.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "esp_system.h"
#include "esp_wifi.h"
#include "esp_log.h"
#include "nvs_flash.h"

#include "config.h"
#include "wifi_manager.h"
#include "csi_capture.h"
#include "udp_sender.h"
#include "led_indicator.h"

static const char *TAG = "MAIN";

void app_main(void)
{
    ESP_LOGI(TAG, "WiFi Sensing - Site %d, %s (ID=%d)", SITE_ID, NODE_NAME, NODE_ID);

    // Init NVS
    esp_err_t ret = nvs_flash_init();
    if (ret == ESP_ERR_NVS_NO_FREE_PAGES || ret == ESP_ERR_NVS_NEW_VERSION_FOUND) {
        ESP_ERROR_CHECK(nvs_flash_erase());
        ret = nvs_flash_init();
    }
    ESP_ERROR_CHECK(ret);

    // LED: Red=Starting
    led_indicator_init();
    led_set_color(255, 0, 0);

    // WiFi: Yellow=Connecting
    led_set_color(255, 255, 0);
    wifi_manager_init();
    vTaskDelay(pdMS_TO_TICKS(5000));
    
    // Green=Connected
    ESP_LOGI(TAG, "WiFi connected");
    led_set_color(0, 255, 0);

    // UDP
    udp_sender_init(SERVER_IP, SERVER_PORT);

    // CSI: Blue=Running
    ESP_LOGI(TAG, "CSI @ %d Hz", CSI_SAMPLE_RATE);
    csi_capture_init();
    led_set_color(0, 0, 255);

    // Loop
    while (1) {
        vTaskDelay(pdMS_TO_TICKS(10000));
        ESP_LOGI(TAG, "[%s] Packets: %d", NODE_NAME, csi_capture_get_count());
    }
}
```

---

## 4. csi_capture.c

```c
#include "csi_capture.h"
#include "config.h"
#include "udp_sender.h"
#include "esp_wifi.h"
#include "esp_log.h"
#include <string.h>
#include <sys/time.h>

static const char *TAG = "CSI";
static uint32_t seq = 0;
static uint32_t count = 0;

static uint64_t get_timestamp_us(void) {
    struct timeval tv;
    gettimeofday(&tv, NULL);
    return (uint64_t)tv.tv_sec * 1000000ULL + tv.tv_usec;
}

static void csi_callback(void *ctx, wifi_csi_info_t *data)
{
    if (!data || !data->buf) return;

    csi_packet_t *pkt = malloc(sizeof(csi_packet_t));
    if (!pkt) return;

    pkt->magic = 0xC5110001;
    pkt->site_id = SITE_ID;
    pkt->node_id = NODE_ID;
    pkt->sequence = seq++;
    pkt->timestamp_us = get_timestamp_us();

    // Extract I/Q
    int8_t *csi = (int8_t*)data->buf;
    int n = data->len / 2;
    
    for (int i = 0; i < 56 && i < n; i++) {
        pkt->csi_i[i] = (double)csi[i*2];
        pkt->csi_q[i] = (double)csi[i*2+1];
    }
    for (int i = n; i < 56; i++) {
        pkt->csi_i[i] = 0.0;
        pkt->csi_q[i] = 0.0;
    }

    udp_sender_send(pkt, sizeof(csi_packet_t));
    count++;
    free(pkt);

    if (count % 100 == 0) {
        ESP_LOGI(TAG, "[%s] %d packets", NODE_NAME, count);
    }
}

void csi_capture_init(void)
{
    wifi_csi_config_t cfg = {
        .lltf_en = true,
        .htltf_en = true,
        .stbc_htltf2_en = true,
        .ltf_merge_en = true,
        .channel_filter_en = false,
        .manu_scale = false,
    };

    ESP_ERROR_CHECK(esp_wifi_set_csi_config(&cfg));
    ESP_ERROR_CHECK(esp_wifi_set_csi_rx_cb(csi_callback, NULL));
    ESP_ERROR_CHECK(esp_wifi_set_csi(true));
}

uint32_t csi_capture_get_count(void) { return count; }
```

---

## 5. wifi_manager.c

```c
#include "wifi_manager.h"
#include "config.h"
#include "esp_wifi.h"
#include "esp_event.h"
#include "esp_log.h"

static const char *TAG = "WIFI";
static int retry = 0;
#define MAX_RETRY 5

static void event_handler(void* arg, esp_event_base_t base, int32_t id, void* data)
{
    if (base == WIFI_EVENT && id == WIFI_EVENT_STA_START) {
        ESP_LOGI(TAG, "Connecting to %s...", WIFI_SSID);
        esp_wifi_connect();
    }
    else if (base == WIFI_EVENT && id == WIFI_EVENT_STA_DISCONNECTED) {
        if (retry < MAX_RETRY) {
            esp_wifi_connect();
            retry++;
            ESP_LOGI(TAG, "Retry %d/%d", retry, MAX_RETRY);
        }
    }
    else if (base == IP_EVENT && id == IP_EVENT_STA_GOT_IP) {
        ip_event_got_ip_t* evt = (ip_event_got_ip_t*)data;
        ESP_LOGI(TAG, "Got IP: " IPSTR, IP2STR(&evt->ip_info.ip));
        retry = 0;
    }
}

void wifi_manager_init(void)
{
    ESP_ERROR_CHECK(esp_netif_init());
    ESP_ERROR_CHECK(esp_event_loop_create_default());
    esp_netif_create_default_wifi_sta();

    wifi_init_config_t cfg = WIFI_INIT_CONFIG_DEFAULT();
    ESP_ERROR_CHECK(esp_wifi_init(&cfg));

    esp_event_handler_instance_register(WIFI_EVENT, ESP_EVENT_ANY_ID, &event_handler, NULL, NULL);
    esp_event_handler_instance_register(IP_EVENT, IP_EVENT_STA_GOT_IP, &event_handler, NULL, NULL);

    wifi_config_t wcfg = {
        .sta = {
            .ssid = WIFI_SSID,
            .password = WIFI_PASSWORD,
            .threshold.authmode = WIFI_AUTH_WPA2_PSK,
        },
    };

    ESP_ERROR_CHECK(esp_wifi_set_mode(WIFI_MODE_STA));
    ESP_ERROR_CHECK(esp_wifi_set_config(WIFI_IF_STA, &wcfg));
    ESP_ERROR_CHECK(esp_wifi_start());
}
```

---

## 6. udp_sender.c

```c
#include "udp_sender.h"
#include "esp_log.h"
#include "lwip/sockets.h"

static const char *TAG = "UDP";
static int sock = -1;
static struct sockaddr_in dest;

void udp_sender_init(const char *ip, uint16_t port)
{
    sock = socket(AF_INET, SOCK_DGRAM, IPPROTO_UDP);
    if (sock < 0) {
        ESP_LOGE(TAG, "Socket failed");
        return;
    }

    dest.sin_family = AF_INET;
    dest.sin_port = htons(port);
    inet_pton(AF_INET, ip, &dest.sin_addr);

    ESP_LOGI(TAG, "UDP -> %s:%d", ip, port);
}

void udp_sender_send(const void *data, size_t len)
{
    if (sock < 0) return;
    
    int sent = sendto(sock, data, len, 0, (struct sockaddr*)&dest, sizeof(dest));
    if (sent < 0) ESP_LOGW(TAG, "Send failed");
}
```

---

## 7. led_indicator.c

```c
#include "led_indicator.h"
#include "config.h"
#include "driver/gpio.h"
#include "driver/rmt_tx.h"
#include "esp_log.h"

static const char *TAG = "LED";
static rmt_channel_handle_t chan = NULL;
static rmt_encoder_handle_t enc = NULL;

void led_indicator_init(void)
{
    rmt_tx_channel_config_t cfg = {
        .clk_src = RMT_CLK_SRC_DEFAULT,
        .gpio_num = LED_GPIO,
        .mem_block_symbols = 64,
        .resolution_hz = 10000000,
        .trans_queue_depth = 4,
    };
    
    ESP_ERROR_CHECK(rmt_new_tx_channel(&cfg, &chan));
    ESP_ERROR_CHECK(rmt_enable(chan));
    ESP_LOGI(TAG, "LED GPIO %d", LED_GPIO);
}

void led_set_color(uint8_t r, uint8_t g, uint8_t b)
{
    uint8_t data[3] = {g, r, b}; // WS2812=GRB
    rmt_transmit_config_t tx = {.loop_count = 0};
    rmt_transmit(chan, enc, data, sizeof(data), &tx);
}
```

---

## Build & Flash (การ build และอัปโหลด)

### Setup ESP-IDF

```bash
cd ~
mkdir esp && cd esp
git clone -b v5.2 --recursive https://github.com/espressif/esp-idf.git
cd esp-idf
./install.sh esp32s3
. $HOME/esp/esp-idf/export.sh
```

### Build Project

```bash
mkdir ~/esp32-wifi-sensing
cd ~/esp32-wifi-sensing

# Copy all files from this guide
# Edit config.h: Set NODE_ID (0,1,2) and WIFI_SSID

idf.py build
```

### Flash 3 Nodes

```bash
# Node A (NODE_ID=0 in config.h)
idf.py -p /dev/ttyUSB0 flash monitor

# Node B (Change config.h: NODE_ID=1)
idf.py -p /dev/ttyUSB1 flash monitor

# Node C (Change config.h: NODE_ID=2)
idf.py -p /dev/ttyUSB2 flash monitor
```

---

## LED Status (สถานะ LED)

- 🔴 Red: Starting (กำลังเริ่ม)
- 🟡 Yellow: WiFi connecting (กำลังต่อ WiFi)
- 🟢 Green: WiFi connected (ต่อ WiFi แล้ว)
- 🔵 Blue: Running (กำลังส่ง CSI)

---

## Troubleshooting (แก้ปัญหา)

| Issue | Fix |
|-------|-----|
| Build error | Run `. $HOME/esp/esp-idf/export.sh` |
| Flash fail | Check port `/dev/ttyUSB*` |
| No WiFi | Update SSID/password in config.h |
| No CSI | Enable in sdkconfig: `CONFIG_ESP32_WIFI_CSI_ENABLED=y` |
| No UDP | Update SERVER_IP in config.h |
| Same NODE_ID | **CRITICAL:** Must be unique (0,1,2)! |

---

## Integration (การเชื่อมต่อ)

**Backend changes:**
```python
# Parse magic number
magic = struct.unpack('<I', data[0:4])[0]
if magic != 0xC5110001:
    return None
```

**Frontend changes:**
```typescript
// Replace useMockData
const {data} = useWebSocket('ws://localhost:8000/ws/csi')
```

---

## Test Checklist (รายการทดสอบ)

- [ ] ESP-IDF v5.2 installed
- [ ] NODE_ID unique (0,1,2) in each node
- [ ] WIFI_SSID correct
- [ ] SERVER_IP = backend IP
- [ ] Built successfully
- [ ] Flashed all 3 nodes
- [ ] All show blue LED
- [ ] UDP packets received (port 5005)
- [ ] `tcpdump -i any udp port 5005` shows traffic
- [ ] Web app connected
- [ ] Real-time position updates

---

**END - Copy this file to new ESP32 project folder when ready**
```

---

## Execution Instructions (คำสั่งการทำงาน)

**Order (ลำดับ):**
1. Tasks 1-5: Documentation (เอกสาร)
2. Tasks 6-10: Code quality (คุณภาพโค้ด)
3. Task 11: ESP32 guide (คู่มือ ESP32)

**Verify (ตรวจสอบ):**
```bash
cd frontend && pnpm build    # Must succeed
python -m py_compile backend/app/main.py
```

**Completion (เสร็จสิ้น):**
- All 11 tasks done (ทำครบ 11 งาน)
- Build succeeds (build ผ่าน)
- No TypeScript errors (ไม่มี error)
- Delete this file (ลบไฟล์นี้)

---

## Success Criteria (เกณฑ์สำเร็จ)

✅ README.md clear for new users  
✅ CLAUDE.md has math + troubleshooting  
✅ progress.md has Phase 8 plan  
✅ SKILL.md files navigable  
✅ QUICKREF.md concise  
✅ Types validate data  
✅ Errors handled gracefully  
✅ Performance monitored  
✅ Loading states smooth  
✅ All functions documented  
✅ ESP32 guide complete in `for_esp32/`

**Target:** 10/10 Coverage, Detail, Clarity (เป้าหมาย: 10/10 ทุกด้าน)

---

**END - Execute once, then delete**