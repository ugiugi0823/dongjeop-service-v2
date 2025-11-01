# 🛠️ 개발 작업 문서

> 동접 서비스 v2 개발자를 위한 실용적인 작업 가이드

## 📊 프로젝트 현재 상태

### ✅ 완료된 작업 (Phase 1: MVP)

#### 백엔드
- [x] FastAPI 서버 구축
- [x] JSONL 데이터 파싱 및 관리 (DataManager)
- [x] 이미지 정적 파일 서빙
- [x] API 엔드포인트 (`/api/summary`, `/api/statistics`, `/api/images`)
- [x] 배치 처리 기본 구조
- [x] 접근성 점수 계산 로직
- [x] CORS 설정

#### 프론트엔드
- [x] React 18 + Vite 프로젝트 설정
- [x] 대시보드 기본 UI
- [x] 통계 카드 (총 이미지, 단차 없음, 평균 점수, 우수 등급)
- [x] 4개 차트 시각화 (Recharts)
  - 단차 유무 분포 (파이 차트)
  - 통로 너비 분포 (막대 그래프)
  - 의자 타입 분포 (막대 그래프)
  - 접근성 등급 분포 (파이 차트)
- [x] 이미지 갤러리
- [x] 필터링 기능 (단차, 통로 너비)
- [x] 페이지네이션
- [x] 상세 모달 (이미지 확대 및 접근성 정보)
- [x] React Router 설정
- [x] GitHub Pages 배포
- [x] 정적 데이터 로딩 (백엔드 없이 동작)

#### 배포
- [x] GitHub Pages 자동 배포 (GitHub Actions)
- [x] 이미지 정적 호스팅
- [x] CORS 및 프로덕션 환경 대응

---

## 🔄 진행 예정 작업 (Phase 2: AI 통합)

### 우선순위 1: AI 분석 파이프라인 구축

#### 작업 목록
- [ ] GPT-4 Vision API 연동
  - [ ] OpenAI API 클라이언트 설정
  - [ ] 프롬프트 엔지니어링
  - [ ] 응답 파싱 로직
  - [ ] 에러 핸들링 및 재시도
  - [ ] 비용 최적화 (배치 처리, 캐싱)

- [ ] 이미지 분석 파이프라인
  - [ ] 배치별 이미지 순차 처리
  - [ ] 진행률 추적
  - [ ] 결과 저장 자동화
  - [ ] 분석 로그 관리

- [ ] API 엔드포인트 추가
  - [ ] `POST /api/batches/{batch_name}/analyze` - 배치 분석 시작
  - [ ] `GET /api/batches/{batch_name}/status` - 분석 진행 상황
  - [ ] `GET /api/batches/{batch_name}/results` - 분석 결과

#### 예상 시간
- Phase 2.1 (GPT-4 연동): 2-3일
- Phase 2.2 (파이프라인 구축): 3-4일
- Phase 2.3 (API 완성): 1-2일

**총 예상: 1-2주**

---

### 우선순위 2: 프론트엔드 기능 강화

#### 작업 목록
- [ ] 검색 기능 구현
  - [ ] 파일명 검색 UI
  - [ ] 실시간 검색 필터링
  - [ ] 검색 결과 하이라이트

- [ ] 정렬 기능 구현
  - [ ] 점수 높은 순 / 낮은 순
  - [ ] 날짜순 정렬
  - [ ] 정렬 기준 드롭다운

- [ ] 데이터 내보내기
  - [ ] CSV 내보내기 기능
  - [ ] 필터링된 데이터만 내보내기
  - [ ] 다운로드 버튼 추가

- [ ] 비교 모드
  - [ ] 2개 이미지 선택 UI
  - [ ] 나란히 비교 레이아웃
  - [ ] 차이점 하이라이트

#### 예상 시간
- 검색/정렬: 2일
- CSV 내보내기: 1일
- 비교 모드: 2-3일

**총 예상: 1주**

---

### 우선순위 3: 품질 개선

#### 작업 목록
- [ ] 성능 최적화
  - [ ] 이미지 lazy loading
  - [ ] 데이터 프리패칭
  - [ ] 캐싱 전략 개선
  - [ ] 번들 크기 최적화

- [ ] 에러 핸들링 강화
  - [ ] 전역 에러 바운더리
  - [ ] 사용자 친화적 에러 메시지
  - [ ] 에러 로깅 시스템

- [ ] 테스트 작성
  - [ ] 유닛 테스트 (Jest)
  - [ ] 통합 테스트
  - [ ] E2E 테스트 (Playwright)

- [ ] 접근성 개선
  - [ ] 키보드 네비게이션
  - [ ] 스크린 리더 대응
  - [ ] WCAG 2.1 AA 준수

---

## 🚀 향후 계획 (Phase 3)

### 장기 계획
- [ ] 사용자 인증 시스템
- [ ] 다중 사용자 지원
- [ ] 실시간 알림 시스템 (WebSocket)
- [ ] 모바일 앱 (React Native)
- [ ] 다국어 지원
- [ ] 어드민 대시보드
- [ ] 데이터베이스 마이그레이션 (JSONL → PostgreSQL)
- [ ] CDN 통합
- [ ] CI/CD 파이프라인 고도화

---

## 🛠️ 기술 스택

### Frontend
- **React 18.2.0**: UI 프레임워크
- **Vite 5.0.0**: 빌드 도구
- **React Router 7.9.4**: 라우팅
- **Recharts 2.10.0**: 차트 라이브러리
- **Axios 1.6.0**: HTTP 클라이언트

### Backend
- **FastAPI**: Python 웹 프레임워크
- **Uvicorn**: ASGI 서버
- **Python 3.8+**: 언어
- **Pillow**: 이미지 처리

### 배포
- **GitHub Pages**: 정적 호스팅
- **GitHub Actions**: CI/CD

---

## 📋 개발 가이드

### 환경 설정

#### 1. Repository Clone
```bash
git clone https://github.com/ugiugi0823/dongjeop-service-v2.git
cd dongjeop-service-v2
```

#### 2. 백엔드 설정
```bash
# Python 가상환경 생성
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt

# 서버 실행
python -m uvicorn backend.api.main:app --reload
```

#### 3. 프론트엔드 설정
```bash
cd frontend

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

#### 4. 접속
- Backend API: http://localhost:8000
- Frontend: http://localhost:5173
- API Docs: http://localhost:8000/docs

---

### 코드 스타일

#### Python
- PEP 8 준수
- Type hints 사용
- Docstring 작성
- Black 포매터 사용

#### JavaScript/React
- ES6+ 문법 사용
- 함수형 컴포넌트 선호
- Hook 활용
- Prettier + ESLint

---

### Git 워크플로우

#### 브랜치 전략
- `main`: 프로덕션 배포
- `develop`: 개발 브랜치
- `feature/*`: 기능 개발
- `bugfix/*`: 버그 수정

#### 커밋 메시지
```
[타입] 간단한 제목

상세 설명 (선택사항)

타입:
- feat: 새로운 기능
- fix: 버그 수정
- docs: 문서 수정
- style: 코드 스타일
- refactor: 리팩토링
- test: 테스트
- chore: 기타 작업
```

예시:
```
[feat] Add search functionality to image gallery

- Implement file name search UI
- Add real-time filtering
- Update API endpoint for search
```

---

### 디렉토리 구조

```
service_v2/
├── backend/
│   ├── api/
│   │   ├── main.py              # FastAPI 앱 진입점
│   │   └── routes/              # API 라우트
│   ├── processor/
│   │   ├── data_manager.py      # 데이터 관리
│   │   └── analyzer.py          # AI 분석 (예정)
│   ├── utils/
│   │   ├── config.py            # 설정
│   │   └── logger.py            # 로깅
│   └── requirements.txt         # Python 의존성
│
├── frontend/
│   ├── src/
│   │   ├── components/          # 재사용 컴포넌트
│   │   │   ├── StatCards.jsx
│   │   │   ├── Charts.jsx
│   │   │   ├── ImageGallery.jsx
│   │   │   └── ImageModal.jsx
│   │   ├── pages/               # 페이지 컴포넌트
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Gallery.jsx
│   │   │   └── BatchAnalysis.jsx
│   │   ├── services/            # API 클라이언트
│   │   │   └── api.js
│   │   ├── App.jsx              # 메인 앱
│   │   └── main.jsx             # 엔트리 포인트
│   ├── public/                  # 정적 파일
│   ├── package.json
│   └── vite.config.js
│
├── data/
│   ├── gt/
│   │   ├── gt.jsonl             # 메타데이터
│   │   └── img_gt/              # 이미지 파일
│   └── spider/                  # 크롤링 데이터
│
├── .github/
│   └── workflows/
│       └── deploy.yml           # GitHub Actions
│
├── PROJECT_PLAN.md              # 프로젝트 기획서
├── REACT_README.md              # React 개발 가이드
├── DEVELOPMENT_TASKS.md         # 이 문서
└── README.md                    # 메인 README

```

---

## 🐛 알려진 이슈

### 현재 버그
없음

### 기술 부채
1. **데이터 저장 방식**: 현재 JSONL 파일 사용, 대량 데이터 처리 시 DB 필요
2. **에러 핸들링**: 일부 API 에러 시 사용자 친화적 메시지 부족
3. **테스트 커버리지**: 0% → 목표 80%+
4. **성능**: 이미지 갤러리 100개 이상 시 로딩 지연
5. **접근성**: WCAG 2.1 AA 미준수

### 개선 필요사항
- 이미지 최적화 (WebP 변환)
- 번들 크기 줄이기
- SEO 최적화
- 오프라인 지원 (PWA)

---

## 📚 참고 자료

### 문서
- [프로젝트 기획서](./PROJECT_PLAN.md)
- [React 개발 가이드](./REACT_README.md)
- [API 문서](http://localhost:8000/docs) (Swagger)

### 외부 링크
- [React 공식 문서](https://react.dev)
- [FastAPI 공식 문서](https://fastapi.tiangolo.com)
- [Recharts 문서](https://recharts.org/)
- [GitHub Pages 배포](https://pages.github.com/)
- [OpenAI API 문서](https://platform.openai.com/docs)

---

## 🤝 기여 가이드

### 새로운 기능 추가
1. `feature/기능명` 브랜치 생성
2. 개발 및 테스트
3. PR 작성
4. 코드 리뷰
5. 머지 후 배포

### 버그 리포트
1. GitHub Issues 생성
2. 재현 단계 작성
3. 예상 동작 vs 실제 동작
4. 환경 정보 제공

---

## 📞 연락처

- **저장소**: https://github.com/ugiugi0823/dongjeop-service-v2
- **이슈**: https://github.com/ugiugi0823/dongjeop-service-v2/issues
- **데모**: https://ugiugi0823.github.io/dongjeop-service-v2

---

**마지막 업데이트**: 2025-11-01  
**버전**: 2.0.0  
**상태**: Phase 1 완료, Phase 2 진행 예정
