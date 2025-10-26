# 🏢 접근성 분석 서비스 (Accessibility Analysis Service)

> 매장 크롤링 이미지를 GPT Vision API로 자동 분석하여 장애인/휠체어 사용자를 위한 접근성 정보를 제공하는 서비스

## 📌 프로젝트 개요

이 프로젝트는 매장 내부 이미지를 자동으로 분석하여 다음과 같은 접근성 정보를 추출합니다:
- **단차/계단 유무**: 휠체어 진입 가능 여부
- **통로 너비**: 휠체어 이동 가능 공간 평가
- **의자 타입**: 이동형/고정형/바닥 좌식 등 분류

## 🎯 주요 기능

### 자동 배치 처리
- `spider/` 폴더의 배치 이미지를 자동 감지
- GPT-4 Vision API를 통한 접근성 분석
- 분석 결과를 `gt/gt.jsonl`에 저장
- 처리된 이미지를 `gt/img_gt/`로 이동

### 시각화 대시보드
- 접근성 통계 실시간 표시
- 단차, 통로 너비, 의자 타입 분포 차트
- 배치별 처리 현황 모니터링
- 이미지 갤러리 및 필터링

### API 서버
- FastAPI 기반 REST API
- 분석 결과 조회 및 통계 제공
- 이미지 메타데이터 관리

## 📁 프로젝트 구조

```
service_v2/
├── backend/
│   ├── analyzer/              # GPT Vision API 분석 모듈
│   ├── processor/             # 배치 처리 및 파일 모니터링
│   ├── api/                   # FastAPI 서버
│   └── utils/                 # 유틸리티
├── frontend/                  # Next.js 대시보드
├── data/
│   ├── spider/                # 크롤링 이미지 (입력)
│   └── gt/                    # 분석 결과 (출력)
├── scripts/                   # 실행 스크립트
└── docs/                      # 문서
```

## 🛠️ 기술 스택

**Backend**
- Python 3.10+
- OpenAI GPT-4 Vision API
- FastAPI
- Watchdog (파일 모니터링)

**Frontend**
- Next.js 14 + TypeScript
- Tailwind CSS
- Recharts (시각화)

## 🚀 빠른 시작

### 1. 환경 설정

```bash
# 가상환경 생성 및 활성화
python -m venv venv
source venv/bin/activate  # Mac/Linux
# venv\Scripts\activate  # Windows

# 의존성 설치
pip install -r requirements.txt

# 환경 변수 설정
cp .env.example .env
# .env 파일에 OPENAI_API_KEY 추가
```

### 2. 수동 배치 분석 (테스트)

```bash
python scripts/run_batch_analysis.py --batch batch_00
```

### 3. 자동 모니터링 시작

```bash
python backend/processor/file_watcher.py
```

### 4. API 서버 실행

```bash
uvicorn backend.api.main:app --reload --port 8000
```

### 5. 대시보드 실행

```bash
cd frontend
npm install
npm run dev
```

브라우저에서 `http://localhost:3000` 접속

## 📊 데이터 구조

### 입력 데이터 (spider/)
```
spider/
├── batch_00/
│   ├── 20240406121216_photo1_96fe98eaa714.webp
│   ├── 20241103124712_photo2_e79f04f02f02.webp
│   └── ...
├── batch_01/
└── ...
```

### 출력 데이터 (gt/)

**gt.jsonl 예시:**
```json
{
  "file_path": "1.png",
  "has_step": false,
  "width_class": ["normal", "narrow"],
  "chair": {
    "has_movable_chair": true,
    "has_high_movable_chair": false,
    "has_fixed_chair": false,
    "has_floor_chair": false
  }
}
```

**필드 설명:**
- `has_step`: 단차/계단 존재 여부 (boolean)
- `width_class`: 통로 너비 분류 (배열)
  - `wide`: 휠체어 2대 이상 통과 (>1.5m)
  - `normal`: 휠체어 1대 통과 (0.9-1.5m)
  - `narrow`: 휠체어 통과 어려움 (0.7-0.9m)
  - `not_passable`: 통과 불가 (<0.7m)
- `chair`: 의자 타입 (객체)
  - `has_movable_chair`: 이동 가능한 일반 의자
  - `has_high_movable_chair`: 팔걸이/높이 조절 의자
  - `has_fixed_chair`: 고정된 의자
  - `has_floor_chair`: 바닥 좌석

## 📈 워크플로우

```
1. 크롤링 이미지 수집
   └─> data/spider/batch_XX/
   
2. 자동 배치 감지
   └─> file_watcher.py
   
3. GPT Vision 분석
   └─> gpt_vision.py
   
4. 결과 저장
   ├─> data/gt/gt.jsonl (메타데이터)
   └─> data/gt/img_gt/ (이미지 파일)
   
5. 대시보드 시각화
   └─> 통계 및 차트 표시
```

## 💡 주요 API 엔드포인트

```
GET  /api/statistics          # 전체 통계
GET  /api/batches             # 배치 목록
GET  /api/batches/{id}        # 배치 상세
GET  /api/images              # 이미지 목록 (필터링 지원)
GET  /api/images/{id}         # 이미지 상세
POST /api/analyze             # 수동 분석 트리거
GET  /api/export/csv          # CSV 내보내기
```

## 📋 개발 로드맵

- [x] 프로젝트 기획 및 데이터 구조 분석
- [ ] **Phase 1**: 코어 분석 엔진 구현
- [ ] **Phase 2**: 자동화 시스템 구축
- [ ] **Phase 3**: API 서버 개발
- [ ] **Phase 4**: 대시보드 UI 구현
- [ ] **Phase 5**: 고급 기능 (점수 계산, 리포트)

## 📝 환경 변수

`.env` 파일 예시:
```env
# OpenAI API
OPENAI_API_KEY=your_api_key_here
OPENAI_MODEL=gpt-4-vision-preview

# Path Configuration
SPIDER_PATH=/Users/jhw/kakao/service_v2/data/spider
GT_PATH=/Users/jhw/kakao/service_v2/data/gt
IMG_GT_PATH=/Users/jhw/kakao/service_v2/data/gt/img_gt

# API Server
API_HOST=0.0.0.0
API_PORT=8000

# Processing
BATCH_SIZE=10
MAX_RETRIES=3
```

## 💰 예상 비용 (GPT API)

- GPT-4 Vision: 이미지당 약 $0.01-0.03
- 100장 처리: $1-3
- 월 1,000장 처리: $10-30

**최적화 방안:**
- 이미지 크기 조정 (최대 1024px)
- 배치 처리로 API 호출 최소화
- 캐싱으로 중복 분석 방지

## 🤝 기여 방법

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

This project is licensed under the MIT License

## 📧 문의

프로젝트 관련 문의사항은 이슈를 등록해주세요.

---

**더 자세한 정보는 [docs/service_plan.md](docs/service_plan.md)를 참고하세요.**

