# 🚀 접근성 분석 데모 웹사이트

> 실제 AI 연결 없이 기존 데이터(`gt.jsonl`)를 활용한 시각화 대시보드

## ✨ 주요 기능

### 📊 대시보드
- **통계 카드**: 총 분석 이미지, 단차 없는 이미지, 평균 점수, 우수 등급 비율
- **차트 시각화**:
  - 단차 유무 분포 (도넛 차트)
  - 통로 너비 분포 (막대 그래프)
  - 의자 타입 분포 (막대 그래프)
  - 접근성 등급 분포 (파이 차트)

### 🖼️ 이미지 갤러리
- 전체 이미지 목록 조회
- 필터링 기능:
  - 단차 유무
  - 통로 너비 (Wide/Normal/Narrow/통과불가)
- 페이지네이션 (12개씩)
- 접근성 점수 및 등급 표시

### 🔍 상세 정보
- 이미지별 접근성 정보
- 점수 및 등급
- 맞춤형 개선 사항 추천

## 🚀 빠른 시작

### Mac/Linux

```bash
# 1. 실행 권한 부여
chmod +x run_demo.sh

# 2. 데모 실행
./run_demo.sh
```

### Windows

```bash
# 데모 실행
run_demo.bat
```

### 수동 실행

```bash
# 1. 가상환경 생성 및 활성화
python -m venv venv
source venv/bin/activate  # Mac/Linux
# venv\Scripts\activate   # Windows

# 2. 의존성 설치
pip install -r requirements.txt

# 3. 서버 실행
python -m uvicorn backend.api.main:app --host 0.0.0.0 --port 8000 --reload
```

## 🌐 접속

서버가 시작되면 웹 브라우저에서 다음 주소로 접속하세요:

- **대시보드**: http://localhost:8000
- **API 문서**: http://localhost:8000/docs

## 📁 프로젝트 구조

```
service_v2/
├── backend/
│   ├── api/
│   │   └── main.py              # FastAPI 서버
│   ├── processor/
│   │   └── data_manager.py      # 데이터 관리
│   └── utils/
│       ├── config.py            # 설정
│       └── logger.py            # 로깅
├── frontend/
│   └── public/
│       ├── index.html           # 메인 페이지
│       ├── css/
│       │   └── style.css        # 스타일
│       └── js/
│           └── app.js           # JavaScript
├── data/
│   └── gt/
│       ├── gt.jsonl             # 분석 데이터 (108개)
│       └── img_gt/              # 이미지 파일
├── requirements.txt
├── run_demo.sh                  # 실행 스크립트 (Mac/Linux)
├── run_demo.bat                 # 실행 스크립트 (Windows)
└── DEMO_README.md              # 이 문서
```

## 🎨 화면 구성

### 메인 대시보드
```
┌─────────────────────────────────────────────┐
│  📊 접근성 분석 대시보드                      │
├─────────────────────────────────────────────┤
│  [총 108장] [단차없음 65장] [평균 78점] [우수 45%] │
│                                             │
│  📈 단차 분포   📊 통로 너비   🪑 의자 타입    │
│  📊 등급 분포                                │
│                                             │
│  🖼️  이미지 갤러리 [필터] [검색]             │
│  [이미지1] [이미지2] [이미지3] ...           │
└─────────────────────────────────────────────┘
```

### 이미지 상세 모달
```
┌─────────────────────────────────────────────┐
│  파일명: test1_식당.jpg                      │
├─────────────────────────────────────────────┤
│  ✅ 단차: 없음                               │
│  📏 통로: Wide, Normal                       │
│  🪑 의자: 이동형, 높이조절                    │
│                                             │
│  📊 접근성 점수: 85점 (A등급)                │
│                                             │
│  💡 개선 사항:                               │
│  - (없음, 우수함)                            │
└─────────────────────────────────────────────┘
```

## 🔧 API 엔드포인트

### GET /api/statistics
전체 통계 조회

**응답 예시:**
```json
{
  "total_images": 108,
  "has_step": {
    "true": 43,
    "false": 65
  },
  "width_class": {
    "wide": 48,
    "normal": 32,
    "narrow": 25,
    "not_passable": 3
  },
  "chair_types": {
    "movable": 89,
    "high_movable": 31,
    "fixed": 42,
    "floor": 13
  }
}
```

### GET /api/summary
대시보드 요약 데이터

**응답 예시:**
```json
{
  "total_images": 108,
  "step_free_count": 65,
  "step_free_percentage": 60.2,
  "average_score": 78.5,
  "average_grade": "B",
  "grade_distribution": {
    "S": 12,
    "A": 33,
    "B": 42,
    "C": 18,
    "D": 3
  }
}
```

### GET /api/images
이미지 목록 조회 (필터링 및 페이지네이션)

**쿼리 파라미터:**
- `skip`: 건너뛸 항목 수 (기본값: 0)
- `limit`: 가져올 항목 수 (기본값: 20)
- `has_step`: 단차 필터 (true/false)
- `width_class`: 통로 너비 필터 (wide/normal/narrow/not_passable)

**요청 예시:**
```
GET /api/images?skip=0&limit=20&has_step=false&width_class=wide
```

### GET /api/images/{file_path}
이미지 상세 정보 조회

**응답 예시:**
```json
{
  "file_path": "test1_식당.jpg",
  "has_step": false,
  "width_class": ["wide", "normal"],
  "chair": {
    "has_movable_chair": true,
    "has_high_movable_chair": false,
    "has_fixed_chair": false,
    "has_floor_chair": false
  },
  "accessibility": {
    "score": 85,
    "grade": "A",
    "details": []
  },
  "recommendations": []
}
```

## 📊 접근성 점수 계산 방식

```
기본 점수: 100점

평가 항목:
1. 단차 (-30점)
   - 단차/계단 있음: -30점

2. 통로 너비 (40점 배점)
   - Wide: 40점
   - Normal: 30점
   - Narrow: 15점
   - 통과 불가: 0점

3. 의자 타입 (20점 배점)
   - 이동형: +10점
   - 높이 조절: +5점
   - 고정형 없음: +5점

등급:
- S: 90점 이상
- A: 80-89점
- B: 70-79점
- C: 60-69점
- D: 59점 이하
```

## 🐛 트러블슈팅

### 서버가 시작되지 않는 경우

**문제**: `ModuleNotFoundError: No module named 'fastapi'`

**해결**:
```bash
# 가상환경 활성화 확인
source venv/bin/activate  # Mac/Linux
# venv\Scripts\activate   # Windows

# 의존성 재설치
pip install -r requirements.txt
```

### 포트 8000이 이미 사용 중인 경우

**문제**: `Address already in use`

**해결**:
```bash
# 다른 포트로 실행
python -m uvicorn backend.api.main:app --port 8001

# 또는 사용 중인 프로세스 종료
lsof -i :8000  # Mac/Linux
# 표시된 PID를 종료
kill -9 <PID>
```

### 데이터가 표시되지 않는 경우

**문제**: 대시보드가 빈 화면으로 표시됨

**해결**:
1. `data/gt/gt.jsonl` 파일이 존재하는지 확인
2. 브라우저 콘솔(F12)에서 에러 확인
3. API가 정상 작동하는지 확인: http://localhost:8000/api/statistics

### CORS 에러가 발생하는 경우

**문제**: `Access to fetch blocked by CORS policy`

**해결**:
- 서버를 재시작
- `backend/utils/config.py`에서 CORS 설정 확인

## 🎯 다음 단계

이 데모는 기존 데이터를 시각화하는 버전입니다. 
실제 AI 연결 버전으로 업그레이드하려면:

1. **GPT Vision API 연결**
   - `backend/analyzer/gpt_vision.py` 구현
   - OpenAI API 키 설정

2. **배치 처리 시스템**
   - `backend/processor/batch_processor.py` 구현
   - 자동 모니터링 추가

3. **프로덕션 배포**
   - Docker 컨테이너화
   - Nginx 리버스 프록시
   - SSL 인증서 적용

자세한 내용은 [docs/service_plan.md](docs/service_plan.md)를 참고하세요.

## 📝 라이선스

MIT License

---

**제작**: 2025-10-22  
**버전**: 1.0.0 (데모)

