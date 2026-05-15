from pydantic import BaseModel
from typing import Optional


class NodeData(BaseModel):
    nodeId: str
    csi_amplitude: list[float]
    csi_phase: list[float]
    rssi: Optional[float] = None


class Position(BaseModel):
    x: float
    y: float
    z: float


class Keypoint(BaseModel):
    x: float
    y: float
    z: float
    confidence: float


class Detection(BaseModel):
    presence: bool
    position: Position
    keypoints: Optional[list[Keypoint]] = None
    breathing_bpm: Optional[int] = None
    heart_bpm: Optional[int] = None
    confidence: Optional[float] = None


class CSIFrame(BaseModel):
    timestamp: int
    nodes: list[NodeData]
    detection: Detection


class CalibrationRequest(BaseModel):
    action: str
    value: Optional[float] = None
