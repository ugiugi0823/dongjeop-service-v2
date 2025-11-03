# AI 모델 신뢰도 기반 재검토 필요성 분석 계획

## 📋 목적
`gt.jsonl` 데이터를 분석하여 AI 모델의 예측 신뢰도(confidence)를 기반으로 재검토/재레이블링이 필요한 이미지를 식별하고, 신뢰도 기준을 설정한다.

## 🎯 핵심 개념

### 모델 신뢰도 (Confidence Score)
- **높은 신뢰도** (예: 90% 이상) → AI 예측을 신뢰 → **재검토 불필요**
- **중간 신뢰도** (예: 75-90%) → AI 예측 부분 신뢰 → **선택적 재검토**
- **낮은 신뢰도** (예: 75% 미만) → AI 예측 불확실 → **재검토 필요**

### 재검토 필요 여부
```
재검토 필요성 = 1 - 모델 신뢰도
- 신뢰도가 높을수록 재검토 필요성 낮음
- 신뢰도가 낮을수록 재검토 필요성 높음
```

## 🔍 현재 상황 분석

### 데이터 구조
현재 `gt.jsonl`에는 다음 필드만 포함:
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

**문제점:**
- ❌ `confidence` 필드 없음
- ❌ 모델 예측 불확실성 정보 없음
- ❌ 재검토 필요 여부 명시적 표시 없음

### 현재 구현
- `needs_relabeling` 필터는 파일명 패턴으로 판단 (`_needs_relabeling`)
- 실제 모델 신뢰도 기반이 아님

## 📊 모델 신뢰도 추정 방법

### 방법 1: 모델 출력에서 직접 가져오기 (권장)
AI 모델이 예측 시 confidence score를 함께 반환하면:
```json
{
  "file_path": "1.png",
  "has_step": false,
  "width_class": ["normal", "narrow"],
  "chair": {...},
  "confidence": {
    "overall": 0.85,  // 전체 신뢰도
    "has_step": 0.92,  // 단차 예측 신뢰도
    "width_class": 0.78,  // 통로 너비 예측 신뢰도
    "chair": 0.88  // 의자 타입 예측 신뢰도
  }
}
```

### 방법 2: 예측 불확실성으로 추정 (임시)
모델이 confidence를 제공하지 않는 경우, 다음 요소로 추정:
1. **모호한 분류**
   - `width_class`가 여러 값 (예: `["normal", "narrow"]`) → 불확실성 증가
   - 단일 값 → 확실성 증가

2. **접근성 점수의 극단성**
   - 매우 높거나 매우 낮은 점수 → 예측이 명확 → 신뢰도 높음
   - 중간 점수 → 모호 → 신뢰도 낮음

3. **조합의 일관성**
   - 단차 있음 + 통과불가 → 일관된 저접근성 → 신뢰도 높음
   - 단차 없음 + 통과불가 → 모순 → 신뢰도 낮음

### 방법 3: 외부 신뢰도 계산 (하이브리드)
여러 요소를 결합하여 신뢰도 점수 계산:
```
confidence = f(
  모델 출력 confidence,
  분류 모호성,
  점수 극단성,
  조합 일관성
)
```

## 📈 신뢰도 기준 설정 제안

### 시나리오 1: 보수적 접근 (재검토 많음)
```
90점 이상: 신뢰도 높음 → 재검토 불필요
75점 이상: 신뢰도 중간 → 선택적 재검토
50점 이상: 신뢰도 낮음 → 재검토 권장
25점 미만: 신뢰도 매우 낮음 → 필수 재검토
```

### 시나리오 2: 균형적 접근 (권장)
```
90점 이상: 신뢰도 높음 → 재검토 불필요
75점 이상: 신뢰도 중간 → 선택적 재검토
50점 미만: 신뢰도 낮음 → 재검토 필요
```

### 시나리오 3: 엄격한 접근 (재검토 많음)
```
95점 이상: 신뢰도 매우 높음 → 재검토 불필요
80점 이상: 신뢰도 높음 → 선택적 재검토
80점 미만: 신뢰도 낮음 → 재검토 필요
```

## 🔧 구현 계획

### Phase 1: 데이터 구조 확장
1. **`gt.jsonl` 스키마 확장**
   ```json
   {
     "file_path": "1.png",
     "has_step": false,
     "width_class": ["normal", "narrow"],
     "chair": {...},
     "confidence": 0.85,  // 추가
     "needs_review": false  // 추가
   }
   ```

2. **모델 출력 확장**
   - AI 모델이 confidence score를 함께 반환하도록 수정
   - 각 클래스별 confidence도 저장

### Phase 2: 신뢰도 계산 로직
1. **모델 confidence가 있는 경우**
   - 직접 사용

2. **모델 confidence가 없는 경우**
   - 불확실성 추정 알고리즘 구현
   - 하이브리드 방식 적용

### Phase 3: 필터링 로직 업데이트
1. **신뢰도 필터 기준 변경**
   ```javascript
   // 기존: 접근성 점수 기반
   if (params.min_score === 90) {
     return score.score >= 90;
   }
   
   // 신규: 모델 신뢰도 기반
   if (params.confidence_threshold === 90) {
     return item.confidence >= 0.90;  // 90% 이상
   }
   ```

2. **검수대상목록 자동 필터링**
   ```javascript
   // 신뢰도가 낮은 이미지만 검수대상목록에 표시
   const needsReview = item.confidence < 0.75;  // 75% 미만
   ```

### Phase 4: UI 업데이트
1. **필터 레이블 변경**
   - "신뢰도 90점 이상" → "모델 신뢰도 90% 이상"
   - "신뢰도 75점 이상" → "모델 신뢰도 75% 이상"

2. **신뢰도 표시**
   - 각 이미지에 모델 신뢰도 표시
   - 신뢰도가 낮은 이미지는 경고 표시

## 📝 분석 스크립트 계획

### 신뢰도 분석 스크립트
1. **데이터 로더**
   - `gt.jsonl` 파일 읽기
   - confidence 필드 확인

2. **신뢰도 분포 분석**
   - 신뢰도별 이미지 수
   - 신뢰도 분포 히스토그램
   - 재검토 필요 이미지 비율

3. **재검토 기준 시뮬레이션**
   - 여러 threshold (90%, 75%, 50%) 적용
   - 재검토 필요 이미지 수 계산
   - 비용 효율성 분석

4. **시각화**
   - 신뢰도 분포 차트
   - 재검토 필요 이미지 비율
   - threshold별 비교

## 🎯 우선순위

### High Priority
1. ✅ 현재 `gt.jsonl` 데이터에 confidence 필드 존재 여부 확인
2. ✅ 모델이 confidence를 제공하는지 확인
3. ✅ confidence가 없을 경우 추정 방법 설계

### Medium Priority
1. 신뢰도 기준 설정 및 검증
2. 필터링 로직 업데이트
3. UI 업데이트

### Low Priority
1. 신뢰도 분석 스크립트 작성
2. 시각화 및 리포트 생성
3. 문서화

## 🔧 구현 파일 목록

- `scripts/analyze_model_confidence.py` - 신뢰도 분석 스크립트 (신규)
- `scripts/estimate_confidence.py` - 신뢰도 추정 알고리즘 (신규)
- `frontend/src/services/api.js` - 필터링 로직 수정
- `frontend/src/pages/ReviewQueue.jsx` - 신뢰도 필터 UI 업데이트
- `frontend/src/pages/Gallery.jsx` - 신뢰도 필터 레이블 변경
- `backend/processor/data_manager.py` - confidence 필드 처리 추가

## ❓ 확인 필요 사항

1. **모델 출력**
   - AI 모델이 confidence score를 제공하는가?
   - 각 클래스별 confidence를 제공하는가?

2. **데이터 상태**
   - 현재 `gt.jsonl`에 confidence 필드가 있는가?
   - 기존 데이터에 confidence를 추가할 수 있는가?

3. **비즈니스 요구사항**
   - 재검토 threshold는 어느 정도가 적절한가?
   - 재검토 비용과 품질의 균형점은?


