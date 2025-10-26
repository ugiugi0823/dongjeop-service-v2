# 🚀 설치 및 설정 가이드

## 목차
1. [사전 요구사항](#사전-요구사항)
2. [환경 설정](#환경-설정)
3. [설치 단계](#설치-단계)
4. [실행 방법](#실행-방법)
5. [트러블슈팅](#트러블슈팅)

---

## 사전 요구사항

### 필수 소프트웨어
- **Python 3.10 이상**
- **Node.js 18 이상** (프론트엔드 개발 시)
- **OpenAI API Key** (GPT-4 Vision 접근 권한)

### 권장 도구
- **Git** (버전 관리)
- **VS Code** (개발 환경)
- **Postman** (API 테스트)

---

## 환경 설정

### 1. 환경 변수 파일 생성

프로젝트 루트에 `.env` 파일을 생성하고 다음 내용을 추가하세요:

```bash
# OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4-vision-preview
OPENAI_MAX_TOKENS=500
OPENAI_TEMPERATURE=0.2

# Path Configuration
SPIDER_PATH=/Users/jhw/kakao/service_v2/data/spider
GT_PATH=/Users/jhw/kakao/service_v2/data/gt
GT_JSONL_PATH=/Users/jhw/kakao/service_v2/data/gt/gt.jsonl
IMG_GT_PATH=/Users/jhw/kakao/service_v2/data/gt/img_gt

# API Server Configuration
API_HOST=0.0.0.0
API_PORT=8000
API_RELOAD=true
CORS_ORIGINS=http://localhost:3000,http://localhost:3001

# Processing Configuration
BATCH_SIZE=10
MAX_RETRIES=3
RETRY_DELAY=5
IMAGE_MAX_SIZE=1024
SUPPORTED_FORMATS=.webp,.jpg,.jpeg,.png

# File Watcher Configuration
WATCH_ENABLED=true
WATCH_RECURSIVE=true
WATCH_INTERVAL=1

# Logging Configuration
LOG_LEVEL=INFO
LOG_FILE=logs/app.log
LOG_MAX_BYTES=10485760
LOG_BACKUP_COUNT=5

# Feature Flags
ENABLE_AUTO_PROCESSING=true
ENABLE_CACHE=false
ENABLE_ASYNC_QUEUE=false
```

### 2. OpenAI API Key 발급

1. [OpenAI Platform](https://platform.openai.com/) 접속
2. 계정 생성 또는 로그인
3. **API Keys** 메뉴에서 새 키 생성
4. 생성된 키를 복사하여 `.env` 파일의 `OPENAI_API_KEY`에 붙여넣기

⚠️ **주의**: API 키는 절대 공개 저장소에 커밋하지 마세요!

---

## 설치 단계

### Backend 설치

```bash
# 1. 프로젝트 디렉토리로 이동
cd /Users/jhw/kakao/service_v2

# 2. Python 가상환경 생성
python3 -m venv venv

# 3. 가상환경 활성화
# Mac/Linux:
source venv/bin/activate

# Windows:
# venv\Scripts\activate

# 4. 의존성 설치
pip install --upgrade pip
pip install -r requirements.txt

# 5. 필요한 디렉토리 생성
mkdir -p logs
mkdir -p data/gt/img_gt
mkdir -p backend/analyzer
mkdir -p backend/processor
mkdir -p backend/api
mkdir -p backend/utils
mkdir -p scripts
```

### Frontend 설치 (선택사항)

```bash
# 1. frontend 디렉토리 생성
mkdir -p frontend
cd frontend

# 2. Next.js 프로젝트 초기화
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir

# 3. 추가 의존성 설치
npm install recharts axios swr
npm install -D @types/node

# 4. 개발 서버 실행 테스트
npm run dev
```

---

## 실행 방법

### 1. 단일 이미지 분석 테스트

먼저 GPT Vision API가 정상 작동하는지 테스트합니다:

```bash
# 테스트 스크립트 실행 (구현 후)
python scripts/test_analyzer.py \
  --image data/spider/batch_00/20240406121216_photo1_96fe98eaa714.webp
```

**예상 출력:**
```json
{
  "file_path": "20240406121216_photo1_96fe98eaa714.webp",
  "has_step": false,
  "width_class": ["wide"],
  "chair": {
    "has_movable_chair": true,
    "has_high_movable_chair": false,
    "has_fixed_chair": false,
    "has_floor_chair": false
  }
}
```

### 2. 배치 처리 실행

특정 배치를 수동으로 처리:

```bash
python scripts/run_batch_analysis.py --batch batch_00
```

**출력 예시:**
```
[INFO] Processing batch: batch_00
[INFO] Found 5 images
[INFO] Processing 1/5: 20240406121216_photo1_96fe98eaa714.webp
[INFO] Processing 2/5: 20241103124712_photo2_e79f04f02f02.webp
...
[INFO] Batch processing completed
[INFO] Results saved to: data/gt/gt.jsonl
[INFO] Images moved to: data/gt/img_gt/
```

### 3. 자동 모니터링 시작

spider 폴더를 실시간으로 모니터링하고 새 배치를 자동 처리:

```bash
python backend/processor/file_watcher.py
```

**출력 예시:**
```
[INFO] Starting file watcher...
[INFO] Monitoring: /Users/jhw/kakao/service_v2/data/spider
[INFO] Press Ctrl+C to stop

[INFO] New batch detected: batch_11
[INFO] Starting automatic processing...
[INFO] Processing completed for batch_11
```

### 4. API 서버 실행

```bash
# 개발 모드 (자동 재시작)
uvicorn backend.api.main:app --reload --host 0.0.0.0 --port 8000

# 프로덕션 모드
uvicorn backend.api.main:app --host 0.0.0.0 --port 8000 --workers 4
```

**확인:**
- API 문서: http://localhost:8000/docs
- 통계 조회: http://localhost:8000/api/statistics

### 5. 프론트엔드 실행

```bash
cd frontend
npm run dev
```

**확인:**
- 대시보드: http://localhost:3000

---

## 디렉토리 구조 확인

설치 후 다음과 같은 구조가 생성되어야 합니다:

```
service_v2/
├── venv/                      # Python 가상환경
├── backend/
│   ├── analyzer/
│   │   ├── __init__.py
│   │   ├── gpt_vision.py
│   │   └── prompt_template.py
│   ├── processor/
│   │   ├── __init__.py
│   │   ├── batch_processor.py
│   │   ├── file_watcher.py
│   │   └── data_manager.py
│   ├── api/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   └── routes/
│   └── utils/
│       ├── __init__.py
│       ├── logger.py
│       └── config.py
├── frontend/                  # Next.js 프로젝트
├── data/
│   ├── spider/                # 입력 데이터
│   └── gt/
│       ├── gt.jsonl           # 분석 결과
│       └── img_gt/            # 처리된 이미지
├── scripts/
│   ├── test_analyzer.py
│   └── run_batch_analysis.py
├── logs/                      # 로그 파일
├── docs/                      # 문서
├── .env                       # 환경 변수 (생성 필요)
├── .gitignore
├── requirements.txt
└── README.md
```

---

## 초기 테스트 체크리스트

### ✅ 환경 설정
- [ ] Python 가상환경 생성 및 활성화
- [ ] 의존성 설치 완료
- [ ] `.env` 파일 생성 및 API 키 설정
- [ ] 필요한 디렉토리 생성

### ✅ 기능 테스트
- [ ] OpenAI API 연결 테스트
- [ ] 단일 이미지 분석 성공
- [ ] 배치 처리 성공
- [ ] gt.jsonl에 결과 저장 확인
- [ ] 이미지 파일 이동 확인

### ✅ 서버 실행
- [ ] API 서버 정상 실행
- [ ] API 문서 접근 가능 (/docs)
- [ ] 통계 API 응답 확인
- [ ] (선택) 프론트엔드 정상 실행

---

## 트러블슈팅

### 문제 1: OpenAI API 에러

**증상:**
```
openai.error.AuthenticationError: Incorrect API key provided
```

**해결:**
1. `.env` 파일에 올바른 API 키가 있는지 확인
2. API 키가 유효한지 [OpenAI Platform](https://platform.openai.com/api-keys)에서 확인
3. 환경 변수가 로드되는지 확인:
   ```python
   from dotenv import load_dotenv
   import os
   load_dotenv()
   print(os.getenv('OPENAI_API_KEY'))
   ```

### 문제 2: 모듈을 찾을 수 없음

**증상:**
```
ModuleNotFoundError: No module named 'openai'
```

**해결:**
1. 가상환경이 활성화되어 있는지 확인
2. 의존성 재설치:
   ```bash
   pip install -r requirements.txt
   ```

### 문제 3: 파일 권한 에러

**증상:**
```
PermissionError: [Errno 13] Permission denied: 'data/gt/img_gt/'
```

**해결:**
```bash
# 디렉토리 권한 확인 및 수정
chmod 755 data/gt/img_gt/
```

### 문제 4: 포트 이미 사용 중

**증상:**
```
ERROR: [Errno 48] Address already in use
```

**해결:**
```bash
# 사용 중인 프로세스 찾기
lsof -i :8000

# 프로세스 종료
kill -9 <PID>

# 또는 다른 포트 사용
uvicorn backend.api.main:app --port 8001
```

### 문제 5: CORS 에러 (프론트엔드)

**증상:**
```
Access to fetch at 'http://localhost:8000/api/statistics' from origin 'http://localhost:3000' 
has been blocked by CORS policy
```

**해결:**
`.env` 파일에서 CORS 설정 확인:
```
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

### 문제 6: 이미지 처리 에러

**증상:**
```
PIL.UnidentifiedImageError: cannot identify image file
```

**해결:**
1. 이미지 파일이 손상되지 않았는지 확인
2. 지원되는 형식인지 확인 (.webp, .jpg, .jpeg, .png)
3. Pillow 업데이트:
   ```bash
   pip install --upgrade Pillow
   ```

---

## 개발 워크플로우

### 일일 개발 시작

```bash
# 1. 가상환경 활성화
source venv/bin/activate

# 2. 최신 코드 가져오기 (Git 사용 시)
git pull

# 3. 의존성 업데이트 확인
pip install -r requirements.txt

# 4. API 서버 실행 (터미널 1)
uvicorn backend.api.main:app --reload

# 5. 프론트엔드 실행 (터미널 2)
cd frontend && npm run dev
```

### 코드 변경 후 테스트

```bash
# 단위 테스트 (구현 후)
pytest tests/

# 코드 포맷팅
black backend/

# 린팅
flake8 backend/

# 타입 체크
mypy backend/
```

---

## 배포 준비

### 프로덕션 환경 변수

`.env.production` 파일 생성:
```bash
OPENAI_API_KEY=your_production_api_key
API_HOST=0.0.0.0
API_PORT=8000
API_RELOAD=false
LOG_LEVEL=WARNING
ENABLE_AUTO_PROCESSING=true
```

### Docker 배포 (선택사항)

```dockerfile
# Dockerfile (예시)
FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "backend.api.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

```bash
# Docker 빌드 및 실행
docker build -t accessibility-service .
docker run -p 8000:8000 --env-file .env accessibility-service
```

---

## 유용한 명령어 모음

```bash
# Python 패키지 목록 저장
pip freeze > requirements.txt

# 로그 실시간 확인
tail -f logs/app.log

# 데이터베이스 백업 (gt.jsonl)
cp data/gt/gt.jsonl data/gt/gt.jsonl.backup.$(date +%Y%m%d)

# 처리된 이미지 개수 확인
ls -1 data/gt/img_gt/ | wc -l

# API 헬스 체크
curl http://localhost:8000/api/statistics
```

---

## 다음 단계

설치가 완료되면:

1. **코드 구현 시작**: [docs/service_plan.md](service_plan.md) 참고
2. **API 테스트**: Postman 또는 `/docs` 사용
3. **대시보드 개발**: 프론트엔드 컴포넌트 구현
4. **배포 계획**: 인프라 설정

---

**문서 버전**: 1.0  
**마지막 업데이트**: 2025-10-22

