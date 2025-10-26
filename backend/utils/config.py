"""
설정 관리
"""
import os
from pathlib import Path


class Settings:
    """애플리케이션 설정"""
    
    # Path Configuration
    BASE_DIR = Path(__file__).parent.parent.parent
    GT_JSONL_PATH = BASE_DIR / "data" / "gt" / "gt.jsonl"
    IMG_GT_PATH = BASE_DIR / "data" / "gt" / "img_gt"
    
    # API Server Configuration
    API_HOST = os.getenv("API_HOST", "0.0.0.0")
    API_PORT = int(os.getenv("API_PORT", "8000"))
    CORS_ORIGINS = [
        "http://localhost:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "http://localhost:8001",
        "http://127.0.0.1:8001"
    ]


settings = Settings()

