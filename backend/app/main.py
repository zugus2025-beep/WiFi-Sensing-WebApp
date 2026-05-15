import asyncio
import json
import math
import random
import time

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from .routers import nodes, status

app = FastAPI(title="WiFi Sensing API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(status.router, prefix="/api")
app.include_router(nodes.router, prefix="/api")


def _generate_keypoints(x: float, y: float, t: float) -> list[dict]:
    """Generate 17 COCO keypoints for a walking person at position (x, y)."""
    walk = math.sin(t * 3.0)
    arm_swing = 0.15
    leg_swing = 0.12

    # Heights relative to floor (z=0), person standing ~1.75m
    return [
        {"x": x,            "y": y,                            "z": 1.75, "confidence": 0.95},  # 0 nose
        {"x": x - 0.05,     "y": y - 0.05,                     "z": 1.78, "confidence": 0.90},  # 1 left_eye
        {"x": x + 0.05,     "y": y - 0.05,                     "z": 1.78, "confidence": 0.90},  # 2 right_eye
        {"x": x - 0.09,     "y": y,                            "z": 1.75, "confidence": 0.85},  # 3 left_ear
        {"x": x + 0.09,     "y": y,                            "z": 1.75, "confidence": 0.85},  # 4 right_ear
        {"x": x - 0.20,     "y": y,                            "z": 1.55, "confidence": 0.95},  # 5 left_shoulder
        {"x": x + 0.20,     "y": y,                            "z": 1.55, "confidence": 0.95},  # 6 right_shoulder
        {"x": x - 0.28,     "y": y + walk * arm_swing,         "z": 1.25, "confidence": 0.90},  # 7 left_elbow
        {"x": x + 0.28,     "y": y - walk * arm_swing,         "z": 1.25, "confidence": 0.90},  # 8 right_elbow
        {"x": x - 0.32,     "y": y + walk * arm_swing * 1.5,   "z": 0.95, "confidence": 0.85},  # 9 left_wrist
        {"x": x + 0.32,     "y": y - walk * arm_swing * 1.5,   "z": 0.95, "confidence": 0.85},  # 10 right_wrist
        {"x": x - 0.11,     "y": y,                            "z": 1.05, "confidence": 0.95},  # 11 left_hip
        {"x": x + 0.11,     "y": y,                            "z": 1.05, "confidence": 0.95},  # 12 right_hip
        {"x": x - 0.11,     "y": y + walk * leg_swing,         "z": 0.55, "confidence": 0.90},  # 13 left_knee
        {"x": x + 0.11,     "y": y - walk * leg_swing,         "z": 0.55, "confidence": 0.90},  # 14 right_knee
        {"x": x - 0.11,     "y": y + walk * leg_swing * 1.2,   "z": 0.05, "confidence": 0.85},  # 15 left_ankle
        {"x": x + 0.11,     "y": y - walk * leg_swing * 1.2,   "z": 0.05, "confidence": 0.85},  # 16 right_ankle
    ]


def _generate_frame(t: float) -> dict:
    """Generate one CSI data frame with simulated person walking."""
    # Circular walk path around center of 5x5 room
    x = 2.5 + math.sin(t * 0.4) * 1.5
    y = 2.5 + math.cos(t * 0.4) * 1.5

    base_amp = 42.0
    csi_amp = [base_amp + (random.random() - 0.5) * 20 for _ in range(56)]

    return {
        "timestamp": int(time.time() * 1000),
        "nodes": [
            {
                "nodeId": nid,
                "csi_amplitude": csi_amp,
                "csi_phase": [random.uniform(-math.pi, math.pi) for _ in range(56)],
            }
            for nid in ["A", "B", "C"]
        ],
        "detection": {
            "presence": True,
            "position": {"x": round(x, 3), "y": round(y, 3), "z": 1.2},
            "keypoints": _generate_keypoints(x, y, t),
            "breathing_bpm": round(16 + math.sin(t * 0.3) * 2),
            "heart_bpm": round(72 + math.sin(t * 1.2) * 5),
            "confidence": round(0.90 + math.sin(t * 0.1) * 0.05, 3),
        },
    }


@app.websocket("/ws/csi")
async def websocket_csi(websocket: WebSocket):
    await websocket.accept()
    t = 0.0
    try:
        while True:
            frame = _generate_frame(t)
            await websocket.send_text(json.dumps(frame))
            t += 0.1
            await asyncio.sleep(0.1)
    except WebSocketDisconnect:
        pass


@app.get("/")
def root():
    return {"message": "WiFi Sensing API", "docs": "/docs", "ws": "/ws/csi"}
