"""
데이터 관리 모듈
"""
import json
from pathlib import Path
from typing import List, Dict, Optional
from backend.utils.logger import setup_logger

logger = setup_logger(__name__)


class DataManager:
    """GT 데이터 관리"""
    
    def __init__(self, gt_jsonl_path: Path):
        self.gt_jsonl_path = Path(gt_jsonl_path)
        self._cache: Optional[List[Dict]] = None
    
    def load_all_data(self, use_cache: bool = True) -> List[Dict]:
        """모든 데이터 로드"""
        if use_cache and self._cache is not None:
            return self._cache
        
        data = []
        if not self.gt_jsonl_path.exists():
            logger.warning(f"GT file not found: {self.gt_jsonl_path}")
            return data
        
        try:
            with open(self.gt_jsonl_path, 'r', encoding='utf-8') as f:
                for line_num, line in enumerate(f, 1):
                    line = line.strip()
                    if not line:
                        continue
                    try:
                        item = json.loads(line)
                        data.append(item)
                    except json.JSONDecodeError as e:
                        logger.error(f"JSON decode error at line {line_num}: {e}")
            
            self._cache = data
            logger.info(f"Loaded {len(data)} items from {self.gt_jsonl_path}")
            
        except Exception as e:
            logger.error(f"Error loading data: {e}")
        
        return data
    
    def get_statistics(self) -> Dict:
        """통계 계산"""
        data = self.load_all_data()
        
        if not data:
            return {
                "total_images": 0,
                "has_step": {"true": 0, "false": 0},
                "width_class": {},
                "chair_types": {},
                "grade_distribution": {"S": 0, "A": 0, "B": 0, "C": 0, "D": 0},
                "average_score": 0.0,
                "percentages": {"step_free": 0}
            }
        
        # 단차 통계
        has_step_count = sum(1 for item in data if item.get('has_step', False))
        
        # 통로 너비 통계
        width_counts = {}
        for item in data:
            for width in item.get('width_class', []):
                width_counts[width] = width_counts.get(width, 0) + 1
        
        # 의자 타입 통계
        chair_stats = {
            'movable': 0,
            'high_movable': 0,
            'fixed': 0,
            'floor': 0
        }
        
        for item in data:
            chair = item.get('chair', {})
            if chair.get('has_movable_chair'):
                chair_stats['movable'] += 1
            if chair.get('has_high_movable_chair'):
                chair_stats['high_movable'] += 1
            if chair.get('has_fixed_chair'):
                chair_stats['fixed'] += 1
            if chair.get('has_floor_chair'):
                chair_stats['floor'] += 1
        
        # 등급 분포 및 평균 점수 계산
        grade_distribution = {"S": 0, "A": 0, "B": 0, "C": 0, "D": 0}
        total_score = 0
        
        for item in data:
            score_result = self.calculate_accessibility_score(item)
            grade_distribution[score_result['grade']] += 1
            total_score += score_result['score']
        
        average_score = round(total_score / len(data), 1) if data else 0.0
        
        return {
            "total_images": len(data),
            "has_step": {
                "true": has_step_count,
                "false": len(data) - has_step_count
            },
            "width_class": width_counts,
            "chair_types": chair_stats,
            "grade_distribution": grade_distribution,
            "average_score": average_score,
            "percentages": {
                "step_free": round((len(data) - has_step_count) / len(data) * 100, 1) if data else 0
            }
        }
    
    def get_images(
        self, 
        skip: int = 0, 
        limit: int = 20,
        has_step: Optional[bool] = None,
        width_class: Optional[str] = None,
        chair_type: Optional[str] = None,
        needs_relabeling: Optional[bool] = None
    ) -> Dict:
        """이미지 목록 조회 (필터링 및 페이지네이션)"""
        data = self.load_all_data()
        
        # 필터 적용
        filtered_data = data
        
        if has_step is not None:
            filtered_data = [
                item for item in filtered_data 
                if item.get('has_step', False) == has_step
            ]
        
        if width_class:
            filtered_data = [
                item for item in filtered_data
                if width_class in item.get('width_class', [])
            ]
        
        if chair_type:
            filtered_data = [
                item for item in filtered_data
                if self._has_chair_type(item.get('chair', {}), chair_type)
            ]
        
        if needs_relabeling is not None:
            filtered_data = [
                item for item in filtered_data
                if self._needs_relabeling(item) == needs_relabeling
            ]
        
        # 페이지네이션
        total = len(filtered_data)
        paginated_data = filtered_data[skip:skip + limit]
        
        return {
            "total": total,
            "skip": skip,
            "limit": limit,
            "items": paginated_data
        }
    
    def _has_chair_type(self, chair: Dict, chair_type: str) -> bool:
        """의자 타입 확인"""
        chair_type_map = {
            'movable': 'has_movable_chair',
            'high_movable': 'has_high_movable_chair', 
            'fixed': 'has_fixed_chair',
            'floor': 'has_floor_chair'
        }
        
        if chair_type in chair_type_map:
            return chair.get(chair_type_map[chair_type], False)
        return False
    
    def _needs_relabeling(self, item: Dict) -> bool:
        """레이블링 필요 여부 판단 (데모용 로직)"""
        # 데모용: 일부 조건에 따라 레이블링이 필요하다고 판단
        file_path = item.get('file_path', '')
        
        # 특정 파일명 패턴이나 조건에 따라 레이블링 필요로 설정
        needs_relabeling_patterns = [
            'test', 'sample', 'temp', 'draft'
        ]
        
        # 파일명에 특정 패턴이 포함된 경우
        if any(pattern in file_path.lower() for pattern in needs_relabeling_patterns):
            return True
            
        # 접근성 점수가 낮은 경우 (D등급)
        score = self.calculate_accessibility_score(item)
        if score['grade'] == 'D':
            return True
            
        # 단차가 있으면서 통로가 좁은 경우 (복잡한 상황)
        if (item.get('has_step', False) and 
            'narrow' in item.get('width_class', []) and
            'not_passable' in item.get('width_class', [])):
            return True
            
        return False
    
    def calculate_accessibility_score(self, item: Dict) -> Dict:
        """접근성 점수 계산"""
        score = 100
        details = []
        
        # 단차 평가 (-30점)
        if item.get('has_step', False):
            score -= 30
            details.append({
                "category": "단차",
                "impact": -30,
                "reason": "휠체어 진입 어려움"
            })
        
        # 통로 너비 평가 (0-40점)
        width_classes = item.get('width_class', [])
        if 'wide' in width_classes:
            width_score = 40
        elif 'normal' in width_classes:
            width_score = 30
        elif 'narrow' in width_classes:
            width_score = 15
            details.append({
                "category": "통로",
                "impact": -25,
                "reason": "통로가 좁음"
            })
        elif 'not_passable' in width_classes:
            width_score = 0
            details.append({
                "category": "통로",
                "impact": -40,
                "reason": "휠체어 통과 불가능"
            })
        else:
            width_score = 20
        
        score = score - 40 + width_score
        
        # 의자 평가 (0-20점)
        chair = item.get('chair', {})
        chair_score = 0
        
        if chair.get('has_movable_chair'):
            chair_score += 10
        if chair.get('has_high_movable_chair'):
            chair_score += 5
        if not chair.get('has_fixed_chair'):
            chair_score += 5
        
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

