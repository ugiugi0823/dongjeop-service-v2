"""
FastAPI 메인 애플리케이션
"""
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from pathlib import Path
from typing import Optional
import glob

from backend.utils.config import settings
from backend.utils.logger import setup_logger
from backend.processor.data_manager import DataManager

logger = setup_logger(__name__)

# FastAPI 앱 생성
app = FastAPI(
    title="접근성 분석 서비스 API",
    description="매장 이미지 접근성 분석 데모 API",
    version="1.0.0"
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Data Manager 초기화
data_manager = DataManager(settings.GT_JSONL_PATH)

# 이미지 파일 서빙
img_gt_path = settings.IMG_GT_PATH
if img_gt_path.exists():
    app.mount("/images", StaticFiles(directory=str(img_gt_path)), name="images")

# Spider 이미지 파일 서빙
spider_path = settings.BASE_DIR / "data" / "spider"
if spider_path.exists():
    app.mount("/spider-images", StaticFiles(directory=str(spider_path)), name="spider-images")

# 정적 파일 서빙 (프론트엔드)
frontend_path = settings.BASE_DIR / "frontend" / "dist"
if frontend_path.exists():
    app.mount("/assets", StaticFiles(directory=str(frontend_path / "assets")), name="assets")


@app.get("/")
async def root():
    """루트 경로 - 프론트엔드 서빙"""
    index_path = settings.BASE_DIR / "frontend" / "dist" / "index.html"
    if index_path.exists():
        return FileResponse(str(index_path))
    return {"message": "접근성 분석 서비스 API", "docs": "/docs"}


@app.get("/api/health")
async def health_check():
    """헬스 체크"""
    return {"status": "healthy", "version": "1.0.0"}


@app.get("/api/statistics")
async def get_statistics():
    """전체 통계"""
    try:
        stats = data_manager.get_statistics()
        
        # 추가 계산
        total = stats['total_images']
        if total > 0:
            stats['percentages'] = {
                'step_free': round((stats['has_step']['false'] / total) * 100, 1),
                'has_step': round((stats['has_step']['true'] / total) * 100, 1)
            }
        
        return stats
    except Exception as e:
        logger.error(f"Error getting statistics: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )


@app.get("/api/images")
async def get_images(
    skip: int = Query(0, ge=0, description="건너뛸 항목 수"),
    limit: int = Query(20, ge=1, le=100, description="가져올 항목 수"),
    has_step: Optional[bool] = Query(None, description="단차 유무 필터"),
    width_class: Optional[str] = Query(None, description="통로 너비 필터"),
    chair_type: Optional[str] = Query(None, description="의자 타입 필터"),
    needs_relabeling: Optional[bool] = Query(None, description="레이블링 필요 필터")
):
    """이미지 목록 조회"""
    try:
        result = data_manager.get_images(
            skip=skip,
            limit=limit,
            has_step=has_step,
            width_class=width_class,
            chair_type=chair_type,
            needs_relabeling=needs_relabeling
        )
        
        # 각 이미지에 점수 추가
        for item in result['items']:
            item['accessibility'] = data_manager.calculate_accessibility_score(item)
        
        return result
    except Exception as e:
        logger.error(f"Error getting images: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )


@app.get("/api/images/{file_path:path}")
async def get_image_detail(file_path: str):
    """이미지 상세 정보"""
    try:
        data = data_manager.load_all_data()
        
        # 파일 경로로 찾기
        for item in data:
            if item.get('file_path') == file_path:
                item['accessibility'] = data_manager.calculate_accessibility_score(item)
                
                # 개선 사항 추천
                recommendations = []
                
                if item.get('has_step'):
                    recommendations.append({
                        "priority": "high",
                        "category": "단차",
                        "title": "경사로 설치 권장",
                        "description": "휠체어 사용자를 위한 경사로 설치를 권장합니다."
                    })
                
                if 'narrow' in item.get('width_class', []) or 'not_passable' in item.get('width_class', []):
                    recommendations.append({
                        "priority": "high",
                        "category": "통로",
                        "title": "통로 확장 필요",
                        "description": "최소 0.9m 이상의 통로 너비 확보가 필요합니다."
                    })
                
                chair = item.get('chair', {})
                if not chair.get('has_movable_chair'):
                    recommendations.append({
                        "priority": "medium",
                        "category": "의자",
                        "title": "이동 가능한 의자 배치 권장",
                        "description": "다양한 신체 조건의 고객을 위해 이동 가능한 의자를 배치하는 것이 좋습니다."
                    })
                
                item['recommendations'] = recommendations
                
                return item
        
        return JSONResponse(
            status_code=404,
            content={"error": "이미지를 찾을 수 없습니다."}
        )
        
    except Exception as e:
        logger.error(f"Error getting image detail: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )


@app.get("/api/summary")
async def get_summary():
    """요약 대시보드 데이터"""
    try:
        stats = data_manager.get_statistics()
        data = data_manager.load_all_data()
        
        # 접근성 점수 평균 계산
        total_score = 0
        grade_counts = {'S': 0, 'A': 0, 'B': 0, 'C': 0, 'D': 0}
        
        for item in data:
            accessibility = data_manager.calculate_accessibility_score(item)
            total_score += accessibility['score']
            grade_counts[accessibility['grade']] += 1
        
        avg_score = round(total_score / len(data), 1) if data else 0
        
        # 평균 등급 계산
        if avg_score >= 90:
            avg_grade = 'S'
        elif avg_score >= 80:
            avg_grade = 'A'
        elif avg_score >= 70:
            avg_grade = 'B'
        elif avg_score >= 60:
            avg_grade = 'C'
        else:
            avg_grade = 'D'
        
        return {
            "total_images": stats['total_images'],
            "step_free_count": stats['has_step']['false'],
            "step_free_percentage": round((stats['has_step']['false'] / stats['total_images']) * 100, 1) if stats['total_images'] > 0 else 0,
            "average_score": avg_score,
            "average_grade": avg_grade,
            "grade_distribution": grade_counts,
            "width_distribution": stats['width_class'],
            "chair_types": stats['chair_types']
        }
        
    except Exception as e:
        logger.error(f"Error getting summary: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )

@app.get("/api/batches")
async def get_batches():
    """Spider 폴더의 배치 목록 조회"""
    try:
        spider_path = settings.BASE_DIR / "data" / "spider"
        if not spider_path.exists():
            return []
        
        # batch_* 폴더들 찾기
        batch_dirs = [d.name for d in spider_path.iterdir() if d.is_dir() and d.name.startswith('batch_')]
        batch_dirs.sort()
        
        return batch_dirs
    except Exception as e:
        logger.error(f"Error getting batches: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )

@app.get("/api/batches/{batch_name}/images")
async def get_batch_images(batch_name: str):
    """특정 배치의 이미지 목록 조회"""
    try:
        batch_path = settings.BASE_DIR / "data" / "spider" / batch_name
        if not batch_path.exists():
            raise HTTPException(status_code=404, detail="배치를 찾을 수 없습니다")
        
        # 이미지 파일들 찾기
        image_extensions = ['*.jpg', '*.jpeg', '*.png', '*.webp']
        images = []
        for ext in image_extensions:
            images.extend([f.name for f in batch_path.glob(ext)])
        
        return images
    except Exception as e:
        logger.error(f"Error getting batch images: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )

@app.post("/api/batches/{batch_name}/analyze")
async def start_batch_analysis(batch_name: str):
    """배치 분석 시작 (시뮬레이션)"""
    try:
        # 실제로는 여기서 GPT API를 호출하여 분석
        # 현재는 시뮬레이션만 수행
        return {
            "message": f"{batch_name} 배치 분석이 시작되었습니다",
            "batch_name": batch_name,
            "status": "started"
        }
    except Exception as e:
        logger.error(f"Error starting batch analysis: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "backend.api.main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=True
    )

