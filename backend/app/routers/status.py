from fastapi import APIRouter
import time

router = APIRouter()
_start_time = time.time()


@router.get("/status")
def get_status():
    return {
        "status": "online",
        "mode": "simulation",
        "nodes_connected": 3,
        "uptime_seconds": int(time.time() - _start_time),
        "version": "1.0.0",
    }
