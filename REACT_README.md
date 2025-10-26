# 🚀 React 접근성 분석 대시보드

> React + Vite로 구현한 실시간 이미지 갤러리 및 필터링 대시보드

## ✨ 주요 기능

### 📊 대시보드
- **통계 카드**: 총 이미지, 단차 없음, 평균 점수, 우수 등급
- **4개 차트 시각화** (Recharts):
  - 단차 유무 분포 (파이 차트)
  - 통로 너비 분포 (막대 그래프)
  - 의자 타입 분포 (막대 그래프)
  - 접근성 등급 분포 (파이 차트)

### 🖼️ 실제 이미지 갤러리
- **107개 이미지 썸네일 표시**
- `/images/` 경로를 통해 실제 이미지 서빙
- 이미지 클릭 시 큰 화면으로 보기

### 🔍 강력한 필터링
- **단차 필터**: 전체 / 단차 없음 / 단차 있음
- **통로 너비 필터**: 전체 / Wide / Normal / Narrow / 통과불가
- 필터 조합 가능
- 실시간 필터링 결과 표시

### 📄 상세 모달
- 이미지 원본 표시
- 접근성 점수 및 등급
- 맞춤형 개선 사항 추천

## 🚀 빠른 시작

### 1. 백엔드 서버 실행 (터미널 1)

```bash
# 프로젝트 루트에서
python -m uvicorn backend.api.main:app --reload
```

**확인**: http://localhost:8000/docs 접속 시 API 문서가 보여야 함

### 2. React 프론트엔드 실행 (터미널 2)

```bash
# 방법 1: 자동 스크립트 (권장)
chmod +x run_react_demo.sh
./run_react_demo.sh

# 방법 2: 수동 실행
cd frontend
npm install  # 최초 1회만
npm run dev
```

**접속**: http://localhost:3000

## 📁 프로젝트 구조

```
service_v2/
├── backend/
│   ├── api/main.py              # FastAPI 서버 (이미지 서빙 추가)
│   ├── processor/data_manager.py
│   └── utils/config.py
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx        # 헤더
│   │   │   ├── StatCards.jsx     # 통계 카드
│   │   │   ├── Charts.jsx        # 차트 (Recharts)
│   │   │   ├── ImageGallery.jsx  # 이미지 갤러리 + 필터
│   │   │   └── ImageModal.jsx    # 상세 모달
│   │   ├── services/
│   │   │   └── api.js            # API 클라이언트
│   │   ├── App.jsx               # 메인 앱
│   │   ├── main.jsx              # 엔트리 포인트
│   │   └── index.css             # 글로벌 스타일
│   │
│   ├── package.json
│   ├── vite.config.js
│   └── index.html
│
├── data/
│   └── gt/
│       ├── gt.jsonl              # 메타데이터 (107개)
│       └── img_gt/               # 실제 이미지 파일
│
├── run_react_demo.sh             # React 실행 스크립트
└── REACT_README.md               # 이 문서
```

## 🎨 화면 구성

### 메인 대시보드
```
┌─────────────────────────────────────────────────┐
│  🏢 접근성 분석 대시보드                          │
├─────────────────────────────────────────────────┤
│  [총 107장] [단차없음 85장] [평균 78점] [우수 45%] │
│                                                 │
│  📊 4개 차트 (단차/통로/의자/등급)                │
│                                                 │
│  🖼️  이미지 갤러리                               │
│  [단차 필터 ▼] [통로 필터 ▼]                     │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐              │
│  │ 이미 │ │ 이미 │ │ 이미 │ │ 이미 │              │
│  │ 지1  │ │ 지2  │ │ 지3  │ │ 지4  │              │
│  └─────┘ └─────┘ └─────┘ └─────┘              │
│  [이전] 1/9 [다음]                               │
└─────────────────────────────────────────────────┘
```

### 이미지 클릭 시 모달
```
┌─────────────────────────────────────────────────┐
│  ✕                                              │
│  ┌────────┐  │ 접근성 정보                       │
│  │        │  │ ✅ 단차: 없음                    │
│  │ 이미지  │  │ 📏 통로: Wide                   │
│  │        │  │ 🪑 의자: 이동형                  │
│  └────────┘  │                                 │
│              │ 📊 점수: 85점 (A등급)            │
│              │                                 │
│              │ 💡 개선 사항: (없음)             │
└─────────────────────────────────────────────────┘
```

## 🔧 주요 API 엔드포인트

### Backend (FastAPI)

```
GET  /api/summary              # 대시보드 요약
GET  /api/statistics           # 전체 통계
GET  /api/images               # 이미지 목록 (필터링)
     ?skip=0&limit=12
     &has_step=false
     &width_class=wide
GET  /api/images/{file_path}   # 이미지 상세
GET  /images/{filename}        # 실제 이미지 파일
```

### Frontend (React)

```javascript
// api.js 사용 예시
import { api, getImageUrl } from './services/api';

// 요약 데이터
const summary = await api.getSummary();

// 필터링된 이미지 목록
const images = await api.getImages({
  skip: 0,
  limit: 12,
  has_step: false,
  width_class: 'wide'
});

// 이미지 URL 생성
const imgUrl = getImageUrl('1.png');  // /images/1.png
```

## 🎯 필터링 사용법

### 1. 단차 필터
- **전체**: 모든 이미지 표시
- **단차 없음**: 휠체어 접근 가능한 매장만
- **단차 있음**: 단차가 있는 매장만

### 2. 통로 너비 필터
- **Wide**: 휠체어 2대 이상 통과 가능
- **Normal**: 휠체어 1대 통과 가능
- **Narrow**: 휠체어 통과 어려움
- **통과불가**: 휠체어 통과 불가능

### 3. 조합 필터 예시
```
단차 없음 + Wide
→ 휠체어 접근성이 매우 우수한 매장만 표시
```

## 📊 데이터 구조 (gt.jsonl)

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
  }
}
```

## 🐛 트러블슈팅

### 백엔드 서버가 시작되지 않음

**증상**: `ModuleNotFoundError`

**해결**:
```bash
pip install fastapi uvicorn pillow
```

### 프론트엔드가 시작되지 않음

**증상**: `npm: command not found`

**해결**:
1. Node.js 설치 (https://nodejs.org/)
2. 터미널 재시작
3. `npm install` 재실행

### 이미지가 표시되지 않음

**증상**: 이미지 자리에 "이미지 없음" 표시

**원인**: 
- 백엔드 서버가 실행되지 않음
- `/images/` 경로 설정 문제

**해결**:
1. 백엔드 서버 실행 확인: http://localhost:8000/docs
2. 이미지 URL 직접 확인: http://localhost:8000/images/1.png
3. `backend/api/main.py`에서 이미지 서빙 설정 확인

### CORS 에러

**증상**: `blocked by CORS policy`

**해결**:
- `backend/utils/config.py`에서 CORS 설정 확인
- 백엔드 서버 재시작

### 필터가 작동하지 않음

**증상**: 필터 선택해도 결과가 변하지 않음

**해결**:
1. 브라우저 콘솔(F12) 확인
2. API 응답 확인
3. 페이지 새로고침 (Ctrl+R 또는 Cmd+R)

## 💡 개발 팁

### 핫 리로드
- 코드 수정 시 자동으로 브라우저 새로고침
- React 컴포넌트 수정 시 즉시 반영

### 디버깅
```javascript
// 브라우저 콘솔에서
console.log(images);  // 이미지 데이터 확인
```

### 빌드 (프로덕션)
```bash
cd frontend
npm run build
# dist/ 폴더에 빌드 파일 생성
```

## 🎉 완성된 기능

- ✅ React 18 + Vite
- ✅ Recharts 차트 시각화
- ✅ 실제 이미지 표시 (/images/)
- ✅ 필터링 (단차, 통로 너비)
- ✅ 페이지네이션 (12개씩)
- ✅ 상세 모달 (이미지 확대)
- ✅ 접근성 점수 자동 계산
- ✅ 반응형 디자인 (모바일 지원)
- ✅ 개선 사항 추천

## 📝 다음 단계

### 추가 가능한 기능
1. **검색 기능**: 파일명으로 검색
2. **정렬 기능**: 점수 높은 순, 낮은 순
3. **일괄 다운로드**: 필터링된 이미지 다운로드
4. **CSV 내보내기**: 분석 결과 엑셀로 저장
5. **비교 모드**: 2개 이미지 나란히 비교

### 프로덕션 배포
1. Frontend 빌드: `npm run build`
2. Backend와 함께 서빙
3. Nginx 설정
4. HTTPS 적용

---

**제작일**: 2025-10-22  
**버전**: 2.0.0 (React)  
**라이선스**: MIT

