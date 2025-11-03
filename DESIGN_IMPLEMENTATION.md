# 🎨 디자인 시안 기반 개발 문서

> 디자인 시안(`task/page/`)에 맞춘 페이지 구현 가이드

## 📋 개요

이 문서는 디자인 시안 이미지를 기반으로 다음 3개의 페이지를 구현하기 위한 개발 가이드입니다:

1. **실내사진목록** - 전체 실내 사진 이미지 갤러리
2. **검수대상목록** - 검수가 필요한 이미지 목록
3. **검수완료목록** - 검수 완료된 이미지 목록

---

## 📄 페이지 1: 실내사진목록 (Image Gallery)

### 기능 개요
모든 실내 사진 이미지를 갤러리 형태로 표시하고, 필터링 및 검색 기능을 제공하는 페이지입니다.

### UI 요구사항

#### 레이아웃 구조
```
┌─────────────────────────────────────┐
│  헤더 영역                           │
│  - 페이지 제목                        │
│  - 통계 정보 (총 이미지 수 등)        │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│  필터 영역                           │
│  - 단차 필터                         │
│  - 통로 너비 필터                    │
│  - 의자 타입 필터                    │
│  - 검색 바                           │
│  - 필터 초기화 버튼                  │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│  이미지 그리드                        │
│  [이미지1] [이미지2] [이미지3] ...   │
│  [이미지4] [이미지5] [이미지6] ...   │
│  각 이미지 카드:                     │
│  - 썸네일                            │
│  - 파일명                            │
│  - 접근성 등급 배지                  │
│  - 핵심 정보 (단차, 통로, 의자)      │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│  페이지네이션                        │
│  [이전] [1] [2] [3] ... [다음]      │
└─────────────────────────────────────┘
```

#### 컴포넌트 구조
```
ImageGalleryPage/
├── GalleryHeader/
│   ├── Title
│   ├── Statistics
│   └── Actions
├── FilterBar/
│   ├── FilterGroup (단차)
│   ├── FilterGroup (통로)
│   ├── FilterGroup (의자)
│   ├── SearchInput
│   └── ResetButton
├── ImageGrid/
│   └── ImageCard[] (12개씩)
│       ├── Thumbnail
│       ├── Filename
│       ├── GradeBadge
│       ├── QuickInfo
│       └── ClickHandler (모달 열기)
└── Pagination/
    ├── PrevButton
    ├── PageNumbers
    └── NextButton
```

#### 이미지 카드 디자인
- **썸네일**: 300x300px (또는 비율 유지), hover 시 확대 효과
- **파일명**: 이미지 하단 또는 오버레이로 표시
- **등급 배지**: S/A/B/C/D 색상 구분 (우측 상단)
- **핵심 정보 아이콘**: 단차(♿), 통로(🚶), 의자(🪑)

#### 필터 디자인
- 드롭다운 선택 박스
- 다중 필터 동시 적용 가능
- 필터 적용 시 배지 표시
- 필터 초기화 버튼 (선택된 필터 모두 해제)

### 데이터 구조

#### API 요청
```javascript
GET /api/images?skip=0&limit=12&has_step=false&width_class=wide&chair_type=movable&search=keyword
```

#### API 응답
```json
{
  "items": [
    {
      "file_path": "image.jpg",
      "has_step": false,
      "width_class": ["wide", "normal"],
      "chair": {
        "has_movable_chair": true,
        "has_high_movable_chair": false,
        "has_fixed_chair": false,
        "has_floor_chair": false
      },
      "score": 85,
      "grade": "A",
      "needs_relabeling": false
    }
  ],
  "total": 107,
  "page": 1,
  "pageSize": 12
}
```

### 상태 관리

```javascript
const [images, setImages] = useState([]);
const [loading, setLoading] = useState(true);
const [currentPage, setCurrentPage] = useState(0);
const [totalImages, setTotalImages] = useState(0);
const [filters, setFilters] = useState({
  has_step: '',
  width_class: '',
  chair_type: '',
  search: ''
});
const [selectedImage, setSelectedImage] = useState(null); // 모달용
```

### 구현 파일
- `frontend/src/pages/ImageGallery.jsx` (또는 기존 Gallery.jsx 수정)
- `frontend/src/pages/ImageGallery.css`
- `frontend/src/components/ImageCard.jsx` (새로 생성)
- `frontend/src/components/FilterBar.jsx` (새로 생성 또는 기존 확장)

---

## 📄 페이지 2: 검수대상목록 (Needs Review List)

### 기능 개요
AI 분석 결과가 부정확하거나 재검토가 필요한 이미지 목록을 별도로 관리하는 페이지입니다.

### UI 요구사항

#### 레이아웃 구조
```
┌─────────────────────────────────────┐
│  헤더 영역                           │
│  - 페이지 제목: "검수대상목록"        │
│  - 검수 대기 이미지 수 (배지)         │
│  - 일괄 검수 완료 버튼 (선택적)      │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│  검색/필터 영역                      │
│  - 검색 바 (파일명, 매장명 등)       │
│  - 우선순위 필터 (높음/보통/낮음)     │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│  검수 대상 목록 (테이블 또는 카드)    │
│  ┌───────────────────────────────┐  │
│  │ [체크박스] [이미지] [파일명]  │  │
│  │ [상태] [우선순위] [액션 버튼]  │  │
│  └───────────────────────────────┘  │
│  ...                                 │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│  액션 바 (하단 고정 가능)            │
│  - 선택된 항목 수                    │
│  - 일괄 검수 완료 버튼              │
│  - 일괄 삭제 버튼                    │
└─────────────────────────────────────┘
```

#### 핵심 기능
1. **체크박스 선택**: 다중 선택 가능
2. **상태 표시**: "검수 대기", "검수 중", "검수 완료"
3. **우선순위 표시**: 높음(빨강), 보통(노랑), 낮음(회색)
4. **빠른 액션**: 개별 이미지 카드에서 직접 검수 완료 처리
5. **일괄 처리**: 선택된 항목을 한 번에 처리

#### 테이블/카드 항목 정보
- 체크박스 (다중 선택)
- 썸네일 이미지
- 파일명
- AI 분석 결과 (요약)
- 우선순위
- 상태
- 액션 버튼 (검수 완료, 상세보기, 삭제)

### 데이터 구조

#### API 요청
```javascript
GET /api/images?needs_relabeling=true&priority=high&skip=0&limit=20
```

#### API 응답
```json
{
  "items": [
    {
      "file_path": "image.jpg",
      "needs_relabeling": true,
      "review_priority": "high", // "high", "medium", "low"
      "review_status": "pending", // "pending", "in_progress", "completed"
      "review_reason": "AI 분석 결과 불확실",
      "original_analysis": {
        "has_step": null,
        "width_class": [],
        "chair": {}
      },
      "score": null,
      "grade": null
    }
  ],
  "total": 15
}
```

#### 검수 완료 API
```javascript
POST /api/images/review/complete
Body: {
  "file_paths": ["image1.jpg", "image2.jpg"],
  "reviewed_by": "user_id",
  "reviewed_at": "2025-11-01T10:00:00Z"
}
```

### 상태 관리

```javascript
const [reviewItems, setReviewItems] = useState([]);
const [selectedItems, setSelectedItems] = useState([]);
const [loading, setLoading] = useState(true);
const [searchQuery, setSearchQuery] = useState('');
const [priorityFilter, setPriorityFilter] = useState('all');
```

### 구현 파일
- `frontend/src/pages/ReviewQueue.jsx` (새로 생성)
- `frontend/src/pages/ReviewQueue.css`
- `frontend/src/components/ReviewItemCard.jsx` (새로 생성)
- `frontend/src/components/BulkActionBar.jsx` (새로 생성)

---

## 📄 페이지 3: 검수완료목록 (Reviewed List)

### 기능 개요
검수가 완료된 이미지 목록을 조회하고, 검수 이력을 확인할 수 있는 페이지입니다.

### UI 요구사항

#### 레이아웃 구조
```
┌─────────────────────────────────────┐
│  헤더 영역                           │
│  - 페이지 제목: "검수완료목록"        │
│  - 검수 완료 통계                    │
│  - 기간 필터 (최근 7일/30일/전체)    │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│  필터/검색 영역                      │
│  - 검색 바                           │
│  - 검수자 필터                       │
│  - 등급 필터                        │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│  검수 완료 목록                      │
│  ┌───────────────────────────────┐  │
│  │ [이미지] [파일명] [검수 결과]  │  │
│  │ [검수자] [검수일시] [액션]    │  │
│  └───────────────────────────────┘  │
│  ...                                 │
└─────────────────────────────────────┘
```

#### 핵심 기능
1. **검수 이력 표시**: 검수자, 검수 일시, 검수 결과
2. **변경 이력**: AI 분석 vs 검수 결과 비교
3. **필터링**: 검수자별, 기간별, 등급별 필터
4. **상세 보기**: 검수 상세 정보 모달
5. **재검수**: 검수 완료된 항목도 다시 검수 가능

#### 카드/테이블 항목 정보
- 썸네일 이미지
- 파일명
- 검수 결과 (등급, 점수)
- 검수자 이름
- 검수 일시
- 변경 사항 표시 (AI 결과와 다른 경우)
- 액션 버튼 (상세보기, 재검수)

### 데이터 구조

#### API 요청
```javascript
GET /api/images?review_status=completed&reviewed_by=user_id&from_date=2025-10-01&to_date=2025-11-01
```

#### API 응답
```json
{
  "items": [
    {
      "file_path": "image.jpg",
      "review_status": "completed",
      "reviewed_by": "user_123",
      "reviewed_at": "2025-11-01T10:00:00Z",
      "review_result": {
        "has_step": false,
        "width_class": ["wide"],
        "chair": {
          "has_movable_chair": true
        },
        "score": 90,
        "grade": "S"
      },
      "original_analysis": {
        "has_step": null,
        "width_class": [],
        "score": null,
        "grade": null
      },
      "has_changes": true // AI 결과와 검수 결과가 다른지
    }
  ],
  "total": 50
}
```

### 상태 관리

```javascript
const [reviewedItems, setReviewedItems] = useState([]);
const [loading, setLoading] = useState(true);
const [dateRange, setDateRange] = useState({
  from: null,
  to: null
});
const [reviewerFilter, setReviewerFilter] = useState('all');
const [gradeFilter, setGradeFilter] = useState('all');
```

### 구현 파일
- `frontend/src/pages/ReviewedList.jsx` (새로 생성)
- `frontend/src/pages/ReviewedList.css`
- `frontend/src/components/ReviewedItemCard.jsx` (새로 생성)
- `frontend/src/components/ReviewHistoryModal.jsx` (새로 생성)

---

## 🔄 공통 컴포넌트

### ImageCard (이미지 카드)
```jsx
<ImageCard
  image={imageData}
  onClick={handleImageClick}
  showGrade={true}
  showQuickInfo={true}
  size="medium" // small, medium, large
/>
```

**Props:**
- `image`: 이미지 데이터 객체
- `onClick`: 클릭 핸들러
- `showGrade`: 등급 배지 표시 여부
- `showQuickInfo`: 빠른 정보 표시 여부
- `size`: 카드 크기

### FilterBar (필터 바)
```jsx
<FilterBar
  filters={filters}
  onFilterChange={handleFilterChange}
  onReset={handleReset}
  showSearch={true}
/>
```

### Pagination (페이지네이션)
```jsx
<Pagination
  currentPage={currentPage}
  totalPages={totalPages}
  onPageChange={handlePageChange}
  itemsPerPage={itemsPerPage}
/>
```

---

## 🛣️ 라우팅

### 경로 설계
```javascript
// App.jsx 또는 Router 설정
const routes = [
  {
    path: '/',
    element: <Dashboard />
  },
  {
    path: '/gallery',
    element: <ImageGallery /> // 실내사진목록
  },
  {
    path: '/review/queue',
    element: <ReviewQueue /> // 검수대상목록
  },
  {
    path: '/review/completed',
    element: <ReviewedList /> // 검수완료목록
  }
];
```

### 사이드바 네비게이션 업데이트
```jsx
<nav>
  <Link to="/">대시보드</Link>
  <Link to="/gallery">실내사진목록</Link>
  <Link to="/review/queue">검수대상목록</Link>
  <Link to="/review/completed">검수완료목록</Link>
</nav>
```

---

## 📊 상태 관리 (전역)

### Context API 또는 Redux 구조
```javascript
// ReviewContext.jsx
const ReviewContext = createContext();

export function ReviewProvider({ children }) {
  const [reviewQueue, setReviewQueue] = useState([]);
  const [reviewedItems, setReviewedItems] = useState([]);
  
  const markAsReviewed = async (filePaths) => {
    // API 호출 및 상태 업데이트
  };
  
  return (
    <ReviewContext.Provider value={{
      reviewQueue,
      reviewedItems,
      markAsReviewed
    }}>
      {children}
    </ReviewContext.Provider>
  );
}
```

---

## 🔌 API 엔드포인트 명세

### 1. 이미지 목록 조회 (실내사진목록)
```
GET /api/images
Query Parameters:
  - skip: number (기본값: 0)
  - limit: number (기본값: 12)
  - has_step: boolean | null
  - width_class: string | null
  - chair_type: string | null
  - search: string | null
  - needs_relabeling: boolean | null
```

### 2. 검수 대기 목록
```
GET /api/images/review/queue
Query Parameters:
  - skip: number
  - limit: number
  - priority: 'high' | 'medium' | 'low' | null
  - search: string | null
```

### 3. 검수 완료 목록
```
GET /api/images/review/completed
Query Parameters:
  - skip: number
  - limit: number
  - reviewed_by: string | null
  - from_date: string (ISO 8601)
  - to_date: string (ISO 8601)
  - grade: 'S' | 'A' | 'B' | 'C' | 'D' | null
```

### 4. 검수 완료 처리
```
POST /api/images/review/complete
Body: {
  file_paths: string[],
  reviewed_by: string,
  review_result: {
    has_step: boolean,
    width_class: string[],
    chair: {
      has_movable_chair: boolean,
      has_high_movable_chair: boolean,
      has_fixed_chair: boolean,
      has_floor_chair: boolean
    }
  }
}
```

### 5. 검수 이력 조회
```
GET /api/images/{file_path}/review/history
Response: {
  reviews: [
    {
      reviewed_by: string,
      reviewed_at: string,
      review_result: object,
      review_notes: string
    }
  ]
}
```

---

## 🎨 디자인 시스템

### 색상 팔레트
```css
/* 등급 색상 */
--grade-s: #10b981; /* Green */
--grade-a: #3b82f6; /* Blue */
--grade-b: #f59e0b; /* Amber */
--grade-c: #ef4444; /* Red */
--grade-d: #6b7280; /* Gray */

/* 상태 색상 */
--status-pending: #f59e0b;
--status-in-progress: #3b82f6;
--status-completed: #10b981;

/* 우선순위 색상 */
--priority-high: #ef4444;
--priority-medium: #f59e0b;
--priority-low: #9ca3af;
```

### 타이포그래피
```css
/* 제목 */
h1: 32px, 700, #1e293b
h2: 24px, 600, #1e293b
h3: 18px, 600, #374151

/* 본문 */
body: 14px, 400, #374151
small: 12px, 400, #64748b
```

### 간격 시스템
```css
--spacing-xs: 4px;
--spacing-sm: 8px;
--spacing-md: 16px;
--spacing-lg: 24px;
--spacing-xl: 32px;
```

---

## ✅ 개발 체크리스트

### Phase 1: 실내사진목록 구현
- [ ] ImageGallery 컴포넌트 디자인 시안 반영
- [ ] ImageCard 컴포넌트 구현
- [ ] FilterBar 컴포넌트 구현
- [ ] 검색 기능 구현
- [ ] 페이지네이션 구현
- [ ] 이미지 모달 연동
- [ ] 반응형 디자인 적용

### Phase 2: 검수대상목록 구현
- [ ] ReviewQueue 컴포넌트 생성
- [ ] ReviewItemCard 컴포넌트 구현
- [ ] 체크박스 다중 선택 기능
- [ ] 우선순위 표시 및 필터링
- [ ] 일괄 액션 바 구현
- [ ] 검수 완료 API 연동
- [ ] 상태 관리 (Context 또는 Redux)

### Phase 3: 검수완료목록 구현
- [ ] ReviewedList 컴포넌트 생성
- [ ] ReviewedItemCard 컴포넌트 구현
- [ ] 검수 이력 표시
- [ ] AI vs 검수 결과 비교 UI
- [ ] 기간 필터 구현
- [ ] 검수자 필터 구현
- [ ] 재검수 기능 구현

### Phase 4: 통합 및 최적화
- [ ] 라우팅 설정
- [ ] 사이드바 네비게이션 업데이트
- [ ] 공통 컴포넌트 추출
- [ ] 성능 최적화 (가상 스크롤, 이미지 lazy loading)
- [ ] 에러 핸들링
- [ ] 테스트 작성
- [ ] 접근성 개선

---

## 🚀 구현 순서 권장사항

1. **실내사진목록** (1주)
   - 기존 Gallery 컴포넌트를 디자인 시안에 맞게 개선
   - ImageCard 컴포넌트 분리 및 재사용성 향상

2. **검수대상목록** (1주)
   - 새로운 ReviewQueue 페이지 생성
   - 백엔드 API 연동 (needs_relabeling 필드 활용)

3. **검수완료목록** (1주)
   - ReviewedList 페이지 생성
   - 검수 이력 저장 및 조회 기능 구현

4. **통합 및 테스트** (3일)
   - 전체 플로우 테스트
   - 사용자 피드백 반영

---

## 📝 참고사항

### 데이터베이스 스키마 (향후)
검수 기능을 완전히 구현하려면 데이터베이스 스키마가 필요합니다:

```sql
CREATE TABLE image_reviews (
  id SERIAL PRIMARY KEY,
  file_path VARCHAR(255) NOT NULL,
  reviewed_by VARCHAR(100) NOT NULL,
  reviewed_at TIMESTAMP NOT NULL,
  review_result JSONB NOT NULL,
  review_notes TEXT,
  review_status VARCHAR(20) NOT NULL, -- pending, in_progress, completed
  review_priority VARCHAR(20), -- high, medium, low
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_review_status ON image_reviews(review_status);
CREATE INDEX idx_review_priority ON image_reviews(review_priority);
CREATE INDEX idx_reviewed_at ON image_reviews(reviewed_at);
```

### 현재 JSONL 구조 확장
현재 `gt.jsonl` 파일에 다음 필드 추가 필요:
- `needs_relabeling`: boolean
- `review_status`: string
- `review_priority`: string
- `review_history`: array of review objects

---

## 📞 연락 및 질문

구현 과정에서 디자인 시안과 다른 점이 있거나, 추가 기능이 필요한 경우:
1. 디자인 시안 이미지(`task/page/`) 참고
2. 이 문서의 요구사항 확인
3. 필요시 프로젝트 관리자와 협의

---

**작성일**: 2025-11-01  
**버전**: 1.0.0  
**디자인 시안 위치**: `task/page/`
