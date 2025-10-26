# 🏢 접근성 분석 서비스 - 상세 기획서

## 목차
1. [서비스 개요](#서비스-개요)
2. [시스템 아키텍처](#시스템-아키텍처)
3. [데이터 분석](#데이터-분석)
4. [기능 명세](#기능-명세)
5. [기술 스택](#기술-스택)
6. [구현 계획](#구현-계획)
7. [시각화 대시보드](#시각화-대시보드)
8. [고급 기능](#고급-기능)

---

## 서비스 개요

### 🎯 목적
매장 내부 이미지를 자동으로 분석하여 **장애인 및 휠체어 사용자를 위한 접근성 정보**를 제공하는 서비스

### 🔍 배경
현재 데이터 구조:
- **Spider 폴더**: 크롤링된 매장 이미지가 배치 단위로 저장 (batch_00 ~ batch_10)
- **GT 폴더**: 108개 이미지의 접근성 분석 결과가 JSONL 형식으로 저장

### 💡 핵심 가치
1. **자동화**: 수작업 분석 → GPT Vision API 자동 분석
2. **확장성**: 배치 단위 처리로 대량 이미지 처리 가능
3. **시각화**: 분석 결과를 직관적인 대시보드로 제공
4. **실용성**: 접근성 점수 및 개선 사항 제안

---

## 시스템 아키텍처

### 전체 구조도

```
┌─────────────────────────────────────────────────────────────────┐
│                         System Architecture                      │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐
│  Crawler     │  매장 이미지 크롤링
│  (External)  │
└──────┬───────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────────┐
│                    INPUT: Spider Folder                          │
│  data/spider/                                                    │
│    ├── batch_00/  (5 images)                                    │
│    ├── batch_01/  (3 images)                                    │
│    └── batch_XX/  ...                                           │
└──────────────────┬───────────────────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────────────────┐
│              File Watcher (Monitoring Service)                   │
│  - Watchdog: spider 폴더 실시간 모니터링                           │
│  - 새 배치 폴더 감지 시 자동 트리거                                 │
│  - 처리 완료된 배치 추적 (SQLite/JSON)                            │
└──────────────────┬───────────────────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────────────────┐
│                  Batch Processor                                 │
│  1. 배치 이미지 스캔 및 검증                                       │
│  2. 이미지 전처리 (리사이징, 포맷 변환)                             │
│  3. GPT Vision Analyzer 호출                                     │
│  4. 에러 핸들링 및 재시도                                          │
└──────────────────┬───────────────────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────────────────┐
│              GPT-4 Vision API Analyzer                           │
│  ┌────────────────────────────────────────────────────┐         │
│  │ Prompt Template:                                   │         │
│  │ "이미지를 분석하여 접근성 정보 추출:                 │         │
│  │  1. has_step: 단차/계단 유무                       │         │
│  │  2. width_class: 통로 너비                        │         │
│  │  3. chair: 의자 타입"                             │         │
│  └────────────────────────────────────────────────────┘         │
│                                                                  │
│  Response Schema:                                                │
│  {                                                               │
│    "has_step": boolean,                                          │
│    "width_class": ["wide" | "normal" | "narrow" | "not_passable"],│
│    "chair": {                                                    │
│      "has_movable_chair": boolean,                               │
│      "has_high_movable_chair": boolean,                          │
│      "has_fixed_chair": boolean,                                 │
│      "has_floor_chair": boolean                                  │
│    }                                                             │
│  }                                                               │
└──────────────────┬───────────────────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────────────────┐
│                    Data Manager                                  │
│  1. 분석 결과를 gt.jsonl에 추가 (append mode)                     │
│  2. 처리된 이미지를 gt/img_gt/로 이동                             │
│  3. 배치 메타데이터 업데이트                                       │
│  4. 중복 처리 방지 (file_path 체크)                               │
└──────────────────┬───────────────────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────────────────┐
│                  OUTPUT: GT Folder                               │
│  data/gt/                                                        │
│    ├── gt.jsonl         (분석 결과 메타데이터)                    │
│    └── img_gt/          (처리된 이미지 파일)                      │
└──────────────────┬───────────────────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────────────────┐
│                    FastAPI Server                                │
│  ┌────────────────────────────────────────────────────┐         │
│  │ API Endpoints:                                     │         │
│  │  GET  /api/statistics                              │         │
│  │  GET  /api/batches                                 │         │
│  │  GET  /api/images?filter=has_step:false           │         │
│  │  POST /api/analyze (수동 트리거)                    │         │
│  │  GET  /api/export/csv                              │         │
│  └────────────────────────────────────────────────────┘         │
└──────────────────┬───────────────────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────────────────┐
│              Visualization Dashboard (Next.js)                   │
│  ┌─────────────────────────────────────────────────┐            │
│  │  📊 통계 카드                                    │            │
│  │  📈 차트 (단차, 통로 너비, 의자 타입)              │            │
│  │  🖼️  이미지 갤러리 (필터링)                      │            │
│  │  📦 배치 진행률                                  │            │
│  │  📄 리포트 내보내기                              │            │
│  └─────────────────────────────────────────────────┘            │
└──────────────────────────────────────────────────────────────────┘
```

### 데이터 플로우

```
Image File → Preprocessing → GPT Analysis → Validation → Storage → Visualization
    │            │               │              │           │           │
  .webp      resize to       JSON response   schema     gt.jsonl   Dashboard
             1024px max                       check      + img_gt
```

---

## 데이터 분석

### 현재 데이터 상태

#### Spider 폴더 구조
```
data/spider/
├── batch_00/  (5 images)
│   ├── 20240406121216_photo1_96fe98eaa714.webp
│   ├── 20241103124712_photo2_e79f04f02f02.webp
│   ├── 20241214072812938_photo_1a04d11682bc.webp
│   ├── gold_20240317125953_photo4_8fa73bbfd2e7.webp
│   └── gold_20250427125847_photo1_9c87a02fd398.webp
├── batch_01/  (3 images)
├── batch_02/  (11 images)
├── ...
└── batch_10/  (6 images)
```

**파일명 패턴 분석:**
- `YYYYMMDDHHMMSS_[photo|menu]N_HASH.webp`
- `gold_` 접두사: 검증된/우수한 샘플 (품질 보증)

#### GT 폴더 분석

**gt.jsonl 통계 (108개 샘플):**

```
단차 유무:
✅ 단차 없음: 65건 (60.2%)
❌ 단차 있음: 43건 (39.8%)

통로 너비 분포:
📏 Wide (넓음):        48건 (44.4%)
📏 Normal (보통):      32건 (29.6%)
📏 Narrow (좁음):      25건 (23.1%)
🚫 Not Passable (통과불가): 3건 (2.8%)

의자 타입 분포:
🪑 이동형 의자:         89건 (82.4%)
🪑 높이 조절 의자:      31건 (28.7%)
🪑 고정형 의자:         42건 (38.9%)
🪑 바닥 좌식:          13건 (12.0%)
```

### 접근성 정보 스키마

```json
{
  "file_path": "string",           // 파일명
  "has_step": boolean,             // 단차/계단 유무
  "width_class": string[],         // 통로 너비 분류 (배열)
  "chair": {
    "has_movable_chair": boolean,       // 이동 가능한 일반 의자
    "has_high_movable_chair": boolean,  // 팔걸이/높이 조절 의자
    "has_fixed_chair": boolean,         // 고정된 의자 (부스, 벤치 등)
    "has_floor_chair": boolean          // 바닥 좌석 (좌식 테이블)
  },
  "timestamp": "ISO8601",          // 분석 시각 (추가 예정)
  "batch_id": "string",            // 배치 ID (추가 예정)
  "confidence": float              // 신뢰도 (추가 예정)
}
```

---

## 기능 명세

### 1. 배치 처리 시스템

#### 1.1 File Watcher (실시간 모니터링)
```python
# backend/processor/file_watcher.py

from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

class SpiderFolderHandler(FileSystemEventHandler):
    """Spider 폴더 변경 감지"""
    
    def on_created(self, event):
        """새 폴더/파일 생성 감지"""
        if event.is_directory and event.src_path.startswith('batch_'):
            self.trigger_batch_processing(event.src_path)
    
    def trigger_batch_processing(self, batch_path):
        """배치 처리 트리거"""
        # 배치 처리 큐에 추가
        # 또는 즉시 처리
        pass
```

**기능:**
- `data/spider/` 폴더 실시간 모니터링
- 새 `batch_XX` 폴더 생성 감지
- 자동 배치 처리 트리거
- 처리 완료된 배치 추적 (중복 방지)

#### 1.2 Batch Processor
```python
# backend/processor/batch_processor.py

class BatchProcessor:
    def process_batch(self, batch_dir: str):
        """배치 폴더 내 모든 이미지 처리"""
        
        # 1. 이미지 파일 스캔
        images = self.scan_images(batch_dir)
        
        # 2. 각 이미지 처리
        results = []
        for img_path in images:
            try:
                # 전처리
                processed_img = self.preprocess_image(img_path)
                
                # GPT Vision 분석
                analysis = self.analyzer.analyze(processed_img)
                
                # 검증
                validated = self.validate_result(analysis)
                
                results.append(validated)
                
            except Exception as e:
                self.logger.error(f"Failed to process {img_path}: {e}")
                self.retry_queue.add(img_path)
        
        # 3. 결과 저장
        self.data_manager.save_results(results)
        
        # 4. 이미지 이동
        self.data_manager.move_images(images)
        
        return results
```

**기능:**
- 이미지 스캔 및 검증
- 전처리 (리사이징, 포맷 변환)
- GPT Vision Analyzer 호출
- 에러 핸들링 및 재시도
- 진행률 추적

### 2. GPT Vision Analyzer

#### 2.1 프롬프트 템플릿
```python
# backend/analyzer/prompt_template.py

ACCESSIBILITY_ANALYSIS_PROMPT = """
당신은 장애인 접근성 전문가입니다. 제공된 매장 내부 이미지를 분석하여 
휠체어 사용자 및 거동이 불편한 고객을 위한 접근성 정보를 추출해주세요.

다음 항목을 JSON 형식으로 분석해주세요:

1. **단차/계단 (has_step)**
   - 입구나 내부에 단차, 계단이 있는지 확인
   - 경사로가 있어도 계단이 있으면 true
   - boolean 값으로 응답

2. **통로 너비 (width_class)**
   - 이미지에서 보이는 모든 통로를 평가
   - 여러 통로가 있으면 배열로 반환
   - 분류 기준:
     * "wide": 휠체어 2대 이상 여유롭게 통과 가능 (약 1.5m 이상)
     * "normal": 휠체어 1대가 무리없이 통과 가능 (약 0.9-1.5m)
     * "narrow": 휠체어가 겨우 통과하거나 어려움 (약 0.7-0.9m)
     * "not_passable": 휠체어 통과 불가능 (0.7m 미만 또는 장애물)

3. **의자 타입 (chair)**
   - 여러 종류가 있으면 모두 true로 표시
   - has_movable_chair: 이동 가능한 일반 의자/스툴
   - has_high_movable_chair: 팔걸이가 있거나 높이 조절 가능한 의자
   - has_fixed_chair: 고정된 의자 (부스 좌석, 벤치 등)
   - has_floor_chair: 바닥에 앉는 좌식 좌석

**중요:**
- 명확하지 않으면 보수적으로 평가 (안전성 우선)
- 이미지에 보이지 않는 정보는 추측하지 마세요
- JSON 형식으로만 응답하세요

응답 형식:
{{
  "has_step": boolean,
  "width_class": ["wide" | "normal" | "narrow" | "not_passable"],
  "chair": {{
    "has_movable_chair": boolean,
    "has_high_movable_chair": boolean,
    "has_fixed_chair": boolean,
    "has_floor_chair": boolean
  }}
}}
"""
```

#### 2.2 Analyzer 구현
```python
# backend/analyzer/gpt_vision.py

from openai import OpenAI
import base64

class GPTVisionAnalyzer:
    def __init__(self, api_key: str):
        self.client = OpenAI(api_key=api_key)
        self.model = "gpt-4-vision-preview"
    
    def analyze(self, image_path: str) -> dict:
        """이미지 접근성 분석"""
        
        # 이미지를 base64로 인코딩
        with open(image_path, "rb") as image_file:
            base64_image = base64.b64encode(image_file.read()).decode('utf-8')
        
        # GPT Vision API 호출
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": ACCESSIBILITY_ANALYSIS_PROMPT
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{base64_image}"
                            }
                        }
                    ]
                }
            ],
            max_tokens=500,
            temperature=0.2,  # 일관성을 위해 낮은 temperature
        )
        
        # JSON 파싱
        result = json.loads(response.choices[0].message.content)
        
        return result
```

### 3. Data Manager

```python
# backend/processor/data_manager.py

import json
import shutil
from pathlib import Path

class DataManager:
    def __init__(self, gt_path: str, img_gt_path: str):
        self.gt_jsonl = Path(gt_path) / "gt.jsonl"
        self.img_gt_dir = Path(img_gt_path)
        self.img_gt_dir.mkdir(parents=True, exist_ok=True)
    
    def save_results(self, results: list[dict]):
        """분석 결과를 gt.jsonl에 추가"""
        
        # 기존 파일 경로 로드 (중복 방지)
        existing_paths = self.get_existing_paths()
        
        # 새 결과만 추가
        with open(self.gt_jsonl, 'a', encoding='utf-8') as f:
            for result in results:
                if result['file_path'] not in existing_paths:
                    f.write(json.dumps(result, ensure_ascii=False) + '\n')
    
    def move_images(self, image_paths: list[str]):
        """처리된 이미지를 gt/img_gt로 이동"""
        for img_path in image_paths:
            src = Path(img_path)
            dst = self.img_gt_dir / src.name
            
            if not dst.exists():
                shutil.move(str(src), str(dst))
    
    def get_existing_paths(self) -> set:
        """기존 JSONL에 있는 파일 경로 조회"""
        paths = set()
        if self.gt_jsonl.exists():
            with open(self.gt_jsonl, 'r', encoding='utf-8') as f:
                for line in f:
                    data = json.loads(line)
                    paths.add(data['file_path'])
        return paths
```

### 4. FastAPI Server

```python
# backend/api/main.py

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional

app = FastAPI(title="Accessibility Analysis API")

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/statistics")
async def get_statistics():
    """전체 통계"""
    data = load_gt_data()
    
    return {
        "total_images": len(data),
        "has_step": {
            "true": sum(1 for d in data if d['has_step']),
            "false": sum(1 for d in data if not d['has_step'])
        },
        "width_class": calculate_width_distribution(data),
        "chair_types": calculate_chair_distribution(data),
        "accessibility_score": calculate_avg_accessibility_score(data)
    }

@app.get("/api/images")
async def get_images(
    has_step: Optional[bool] = None,
    width_class: Optional[str] = None,
    skip: int = 0,
    limit: int = 20
):
    """이미지 목록 조회 (필터링)"""
    data = load_gt_data()
    
    # 필터 적용
    if has_step is not None:
        data = [d for d in data if d['has_step'] == has_step]
    if width_class:
        data = [d for d in data if width_class in d['width_class']]
    
    # 페이지네이션
    total = len(data)
    data = data[skip:skip+limit]
    
    return {
        "total": total,
        "items": data,
        "skip": skip,
        "limit": limit
    }

@app.post("/api/analyze")
async def trigger_analysis(batch_id: str):
    """수동 배치 분석 트리거"""
    # 배치 처리 시작
    processor = BatchProcessor()
    result = processor.process_batch(f"data/spider/{batch_id}")
    
    return {"status": "success", "processed": len(result)}
```

---

## 기술 스택

### Backend

| 기술 | 버전 | 용도 |
|------|------|------|
| Python | 3.10+ | 메인 언어 |
| OpenAI SDK | 1.0+ | GPT-4 Vision API |
| FastAPI | 0.104+ | REST API 서버 |
| Pydantic | 2.0+ | 데이터 검증 |
| Watchdog | 3.0+ | 파일 시스템 모니터링 |
| Pillow | 10.0+ | 이미지 전처리 |
| python-dotenv | 1.0+ | 환경 변수 관리 |

### Frontend

| 기술 | 버전 | 용도 |
|------|------|------|
| Next.js | 14+ | React 프레임워크 |
| TypeScript | 5.0+ | 타입 안정성 |
| Tailwind CSS | 3.3+ | 스타일링 |
| Recharts | 2.9+ | 차트 라이브러리 |
| SWR | 2.2+ | 데이터 페칭 |
| Axios | 1.6+ | HTTP 클라이언트 |

### Optional (고급 기능)

| 기술 | 용도 |
|------|------|
| Redis | 캐싱, 큐 |
| Celery | 비동기 작업 처리 |
| PostgreSQL | 고급 쿼리 (통계, 검색) |
| Docker | 컨테이너화 |
| Nginx | 리버스 프록시 |

---

## 구현 계획

### Phase 1: 코어 분석 엔진 (1-2주)

**목표:** GPT Vision을 활용한 기본 분석 기능 구현

- [ ] 프로젝트 구조 설정
  - [ ] `backend/` 폴더 구조 생성
  - [ ] `requirements.txt` 작성
  - [ ] `.env.example` 생성
  
- [ ] GPT Vision Analyzer
  - [ ] 프롬프트 템플릿 작성 및 테스트
  - [ ] `gpt_vision.py` 구현
  - [ ] 이미지 전처리 함수
  - [ ] 응답 검증 로직
  
- [ ] Batch Processor
  - [ ] 배치 스캔 함수
  - [ ] 단일 이미지 처리 파이프라인
  - [ ] 에러 핸들링
  
- [ ] Data Manager
  - [ ] JSONL 읽기/쓰기
  - [ ] 중복 체크
  - [ ] 이미지 파일 이동

**테스트:**
```bash
python scripts/test_analyzer.py --image data/spider/batch_00/20240406121216_photo1_96fe98eaa714.webp
```

### Phase 2: 자동화 시스템 (1주)

**목표:** 배치 자동 처리 시스템 구축

- [ ] File Watcher
  - [ ] Watchdog 설정
  - [ ] 이벤트 핸들러 구현
  - [ ] 배치 큐 관리
  
- [ ] 자동 배치 처리
  - [ ] 백그라운드 프로세스
  - [ ] 진행률 추적
  - [ ] 완료/실패 알림
  
- [ ] 로깅 시스템
  - [ ] 구조화된 로그
  - [ ] 로그 파일 관리
  - [ ] 에러 추적

**테스트:**
```bash
# Watcher 실행
python backend/processor/file_watcher.py

# 새 배치 폴더 생성 (자동 처리 확인)
mkdir data/spider/batch_test
cp test_images/* data/spider/batch_test/
```

### Phase 3: API 서버 (1주)

**목표:** FastAPI 기반 REST API 구축

- [ ] FastAPI 앱 설정
  - [ ] 프로젝트 구조
  - [ ] CORS 설정
  - [ ] 환경 변수
  
- [ ] API 엔드포인트
  - [ ] `/api/statistics` - 통계
  - [ ] `/api/batches` - 배치 목록
  - [ ] `/api/images` - 이미지 조회
  - [ ] `/api/analyze` - 수동 분석
  
- [ ] Pydantic 모델
  - [ ] Request/Response 스키마
  - [ ] 데이터 검증

**테스트:**
```bash
uvicorn backend.api.main:app --reload
curl http://localhost:8000/api/statistics
```

### Phase 4: 대시보드 UI (2주)

**목표:** Next.js 기반 시각화 대시보드

- [ ] Next.js 프로젝트 설정
  - [ ] TypeScript 설정
  - [ ] Tailwind CSS 설정
  - [ ] 폴더 구조
  
- [ ] 컴포넌트 개발
  - [ ] Dashboard 메인 페이지
  - [ ] 통계 카드
  - [ ] 차트 컴포넌트 (Recharts)
  - [ ] 이미지 갤러리
  - [ ] 필터 UI
  
- [ ] API 연동
  - [ ] API 클라이언트 (Axios)
  - [ ] SWR 데이터 페칭
  - [ ] 에러 처리
  
- [ ] 반응형 디자인
  - [ ] 모바일 최적화
  - [ ] 다크 모드 (선택)

### Phase 5: 고급 기능 (1주)

**목표:** 접근성 점수 및 리포트 기능

- [ ] 접근성 점수 알고리즘
  - [ ] 점수 계산 로직
  - [ ] 등급 분류 (S/A/B/C/D)
  
- [ ] 개선 사항 추천
  - [ ] 규칙 기반 추천 시스템
  - [ ] 우선순위 계산
  
- [ ] 리포트 내보내기
  - [ ] CSV 생성
  - [ ] Excel 생성 (openpyxl)
  - [ ] PDF 리포트 (선택)

---

## 시각화 대시보드

### 메인 대시보드 구성

```
┌─────────────────────────────────────────────────────────┐
│  📊 접근성 분석 대시보드                                  │
│  마지막 업데이트: 2025-10-22 14:30                        │
└─────────────────────────────────────────────────────────┘

┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ 📸 총 분석   │  │ ✅ 단차 없음 │  │ 📊 평균 점수 │  │ 🔄 처리중    │
│   108장     │  │    65장     │  │    78점     │  │   batch_01  │
│             │  │   (60.2%)   │  │   (B등급)    │  │    2/3      │
└─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘

┌───────────────────────────────────────────────────────────┐
│  📈 통로 너비 분포                                         │
│                                                           │
│   Wide        ████████████████████████ 48 (44.4%)        │
│   Normal      ████████████████ 32 (29.6%)                │
│   Narrow      ████████████ 25 (23.1%)                    │
│   통과불가     ██ 3 (2.8%)                                 │
│                                                           │
└───────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────┐
│  🪑 의자 타입 분포 (중복 가능)                              │
│                                                           │
│   이동형       ██████████████████████████████ 89 (82.4%)  │
│   높이 조절    ████████████ 31 (28.7%)                     │
│   고정형       ████████████████ 42 (38.9%)                │
│   바닥 좌식    ████ 13 (12.0%)                            │
│                                                           │
└───────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────┐
│  📦 배치 처리 현황                                          │
│                                                           │
│  batch_00   ✅ 완료 (5/5)    2025-10-20 10:30            │
│  batch_01   ⏳ 처리중 (2/3)  2025-10-22 14:15            │
│  batch_02   ⏸️  대기중 (0/11)                             │
│  batch_03   ⏸️  대기중 (0/5)                              │
│                                                           │
└───────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────┐
│  🖼️  최근 분석 이미지                                      │
│                                                           │
│  [img] [img] [img] [img] [img] [img]                     │
│                                                           │
│  🔍 필터: ▼단차 없음  ▼Wide  ▼이동형 의자                  │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

### 이미지 상세 페이지

```
┌─────────────────────────────────────────────────────────┐
│  ← 뒤로가기                                               │
│                                                         │
│  📷 20240406121216_photo1_96fe98eaa714.webp             │
└─────────────────────────────────────────────────────────┘

┌──────────────────────┐  ┌─────────────────────────────┐
│                      │  │  접근성 정보                 │
│                      │  │                             │
│   [이미지 표시]       │  │  ✅ 단차: 없음               │
│                      │  │  📏 통로 너비: Wide, Normal  │
│                      │  │  🪑 의자:                    │
│                      │  │     ✓ 이동형                │
│                      │  │     ✓ 높이 조절             │
│                      │  │                             │
│                      │  │  📊 접근성 점수: 85/100 (A)  │
│                      │  │                             │
│                      │  │  💡 개선 사항:               │
│                      │  │  - 없음 (우수함)             │
└──────────────────────┘  └─────────────────────────────┘
```

---

## 고급 기능

### 1. 접근성 점수 계산

```python
def calculate_accessibility_score(data: dict) -> dict:
    """
    접근성 점수 계산 (0-100점)
    
    평가 항목:
    - 단차: 30점
    - 통로 너비: 40점
    - 의자: 20점
    - 추가 요소: 10점
    """
    score = 100
    details = []
    
    # 1. 단차 평가 (-30점)
    if data['has_step']:
        score -= 30
        details.append({
            "category": "단차",
            "impact": -30,
            "reason": "휠체어 진입 어려움"
        })
    
    # 2. 통로 너비 평가 (0-40점)
    width_score = 0
    if 'wide' in data['width_class']:
        width_score = 40
    elif 'normal' in data['width_class']:
        width_score = 30
    elif 'narrow' in data['width_class']:
        width_score = 15
    elif 'not_passable' in data['width_class']:
        width_score = 0
        details.append({
            "category": "통로",
            "impact": -40,
            "reason": "휠체어 통과 불가능"
        })
    
    score = score - 40 + width_score
    
    # 3. 의자 평가 (0-20점)
    chair_score = 0
    if data['chair']['has_movable_chair']:
        chair_score += 10
    if data['chair']['has_high_movable_chair']:
        chair_score += 5
    if not data['chair']['has_fixed_chair']:
        chair_score += 5  # 고정형 없으면 보너스
    
    score = score - 20 + chair_score
    
    # 등급 계산
    if score >= 90:
        grade = 'S'
    elif score >= 80:
        grade = 'A'
    elif score >= 70:
        grade = 'B'
    elif score >= 60:
        grade = 'C'
    else:
        grade = 'D'
    
    return {
        "score": max(0, min(100, score)),
        "grade": grade,
        "details": details
    }
```

### 2. 개선 사항 추천 시스템

```python
def generate_recommendations(data: dict) -> list[dict]:
    """접근성 개선 사항 추천"""
    recommendations = []
    
    # 단차 관련
    if data['has_step']:
        recommendations.append({
            "priority": "high",
            "category": "단차",
            "title": "경사로 설치 권장",
            "description": "휠체어 사용자를 위한 경사로 설치를 권장합니다. (경사도 1:12 이하)",
            "estimated_cost": "중",
            "impact": "매우 높음"
        })
    
    # 통로 너비 관련
    if 'narrow' in data['width_class'] or 'not_passable' in data['width_class']:
        recommendations.append({
            "priority": "high",
            "category": "통로",
            "title": "통로 확장 필요",
            "description": "최소 0.9m 이상의 통로 너비 확보가 필요합니다.",
            "estimated_cost": "고",
            "impact": "높음"
        })
    
    # 의자 관련
    if not data['chair']['has_movable_chair']:
        recommendations.append({
            "priority": "medium",
            "category": "의자",
            "title": "이동 가능한 의자 배치 권장",
            "description": "다양한 신체 조건의 고객을 위해 이동 가능한 의자를 배치하는 것이 좋습니다.",
            "estimated_cost": "저",
            "impact": "중간"
        })
    
    if data['chair']['has_floor_chair'] and not data['chair']['has_movable_chair']:
        recommendations.append({
            "priority": "medium",
            "category": "의자",
            "title": "일반 테이블 좌석 추가 권장",
            "description": "좌식만 있는 경우 거동이 불편한 고객의 이용이 어렵습니다.",
            "estimated_cost": "중",
            "impact": "높음"
        })
    
    # 우선순위 정렬
    priority_order = {"high": 0, "medium": 1, "low": 2}
    recommendations.sort(key=lambda x: priority_order[x["priority"]])
    
    return recommendations
```

### 3. 리포트 내보내기

```python
# backend/api/routes/export.py

import pandas as pd
from fastapi.responses import StreamingResponse
import io

@app.get("/api/export/csv")
async def export_csv():
    """CSV 리포트 내보내기"""
    data = load_gt_data()
    
    # DataFrame 생성
    rows = []
    for item in data:
        row = {
            "파일명": item["file_path"],
            "단차": "있음" if item["has_step"] else "없음",
            "통로너비": ", ".join(item["width_class"]),
            "이동형의자": "O" if item["chair"]["has_movable_chair"] else "X",
            "고정형의자": "O" if item["chair"]["has_fixed_chair"] else "X",
            "접근성점수": calculate_accessibility_score(item)["score"],
            "등급": calculate_accessibility_score(item)["grade"]
        }
        rows.append(row)
    
    df = pd.DataFrame(rows)
    
    # CSV 생성
    stream = io.StringIO()
    df.to_csv(stream, index=False, encoding='utf-8-sig')
    
    response = StreamingResponse(
        iter([stream.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": "attachment; filename=accessibility_report.csv"
        }
    )
    
    return response
```

---

## 보안 및 최적화

### API 키 관리
```python
# .env
OPENAI_API_KEY=sk-...
```

### 이미지 최적화
```python
from PIL import Image

def optimize_image(image_path: str, max_size: int = 1024) -> str:
    """이미지 크기 최적화"""
    img = Image.open(image_path)
    
    # 비율 유지하며 리사이징
    img.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
    
    # 임시 파일로 저장
    optimized_path = f"/tmp/{Path(image_path).name}"
    img.save(optimized_path, quality=85, optimize=True)
    
    return optimized_path
```

### 캐싱
```python
from functools import lru_cache

@lru_cache(maxsize=128)
def get_statistics():
    """통계 캐싱 (1분)"""
    # 계산 비용이 높은 통계 캐싱
    pass
```

---

## 모니터링 및 로깅

```python
# backend/utils/logger.py

import logging
from logging.handlers import RotatingFileHandler

def setup_logger(name: str):
    logger = logging.getLogger(name)
    logger.setLevel(logging.INFO)
    
    # 파일 핸들러 (최대 10MB, 5개 백업)
    file_handler = RotatingFileHandler(
        'logs/app.log',
        maxBytes=10*1024*1024,
        backupCount=5
    )
    file_handler.setFormatter(logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    ))
    
    logger.addHandler(file_handler)
    
    return logger
```

---

## 다음 단계

1. **즉시 시작 가능한 작업:**
   - [ ] `requirements.txt` 작성
   - [ ] `.env.example` 생성
   - [ ] GPT Vision 프롬프트 테스트

2. **단기 목표 (1주):**
   - [ ] Phase 1 완료 (코어 엔진)
   - [ ] 샘플 이미지로 테스트

3. **중기 목표 (1개월):**
   - [ ] Phase 1-3 완료
   - [ ] API 서버 배포

4. **장기 목표 (2개월):**
   - [ ] 전체 시스템 완성
   - [ ] 프로덕션 배포

---

**문서 작성일**: 2025-10-22  
**버전**: 1.0  
**작성자**: AI Assistant

