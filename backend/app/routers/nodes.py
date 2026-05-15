from fastapi import APIRouter

router = APIRouter()

ESP32_NODES = [
    {"nodeId": "A", "position": {"x": 0.5, "y": 0.5}, "status": "online", "rssi": -42},
    {"nodeId": "B", "position": {"x": 4.5, "y": 0.5}, "status": "online", "rssi": -45},
    {"nodeId": "C", "position": {"x": 2.5, "y": 4.5}, "status": "online", "rssi": -48},
]


@router.get("/nodes")
def get_nodes():
    return ESP32_NODES


@router.post("/calibrate")
def calibrate():
    return {"status": "calibration_started", "message": "Baseline calibration initiated"}
