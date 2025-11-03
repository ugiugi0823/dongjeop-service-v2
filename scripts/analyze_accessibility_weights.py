#!/usr/bin/env python3
"""
이동약자 관점 접근성 점수 가중치 분석 스크립트

gt.jsonl 데이터를 분석하여 현재 가중치의 적절성을 평가하고,
이동약자 관점에서 개선된 가중치를 제안합니다.
"""

import json
import sys
from pathlib import Path
from collections import defaultdict, Counter
from typing import Dict, List, Tuple
import statistics

# 프로젝트 루트 경로
PROJECT_ROOT = Path(__file__).parent.parent
GT_JSONL_PATH = PROJECT_ROOT / "frontend" / "public" / "gt.jsonl"


def load_gt_data() -> List[Dict]:
    """gt.jsonl 파일 로드"""
    data = []
    if not GT_JSONL_PATH.exists():
        print(f"❌ 파일을 찾을 수 없습니다: {GT_JSONL_PATH}")
        return data
    
    with open(GT_JSONL_PATH, 'r', encoding='utf-8') as f:
        for line_num, line in enumerate(f, 1):
            line = line.strip()
            if not line:
                continue
            try:
                item = json.loads(line)
                data.append(item)
            except json.JSONDecodeError as e:
                print(f"⚠️  라인 {line_num} JSON 파싱 오류: {e}")
    
    return data


def calculate_current_score(item: Dict) -> Tuple[int, str]:
    """현재 가중치로 점수 계산 (Frontend 로직과 동일)"""
    score = 100
    
    # 단차
    if item.get('has_step'):
        score -= 30
    
    # 통로 너비
    width_class = item.get('width_class', [])
    if 'not_passable' in width_class:
        score -= 40
    elif 'narrow' in width_class:
        score -= 20
    elif 'normal' in width_class:
        score -= 10
    
    # 의자
    chair = item.get('chair', {})
    if chair and not chair.get('has_movable_chair'):
        score -= 10
    
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
    
    return max(0, min(100, score)), grade


def calculate_proposed_score(item: Dict, scenario: str = 'conservative') -> Tuple[int, str]:
    """제안된 가중치로 점수 계산"""
    # 가중치 시나리오 설정
    scenarios = {
        'conservative': {
            'step': -40,
            'width': {'not_passable': -50, 'narrow': -30, 'normal': -10, 'wide': 0},
            'chair': {'floor_only': -30, 'fixed_only': -15, 'movable': 0, 'high_movable_bonus': 5}
        },
        'realistic': {
            'step': -45,
            'width': {'not_passable': -60, 'narrow': -35, 'normal': -12, 'wide': 0},
            'chair': {'floor_only': -35, 'fixed_only': -18, 'movable': 0, 'high_movable_bonus': 3}
        },
        'strict': {
            'step': -50,
            'width': {'not_passable': -70, 'narrow': -40, 'normal': -15, 'wide': 0},
            'chair': {'floor_only': -40, 'fixed_only': -20, 'movable': 0, 'high_movable_bonus': 5}
        }
    }
    
    weights = scenarios.get(scenario, scenarios['conservative'])
    score = 100
    
    # 단차
    if item.get('has_step'):
        score += weights['step']
    
    # 통로 너비
    width_class = item.get('width_class', [])
    if 'not_passable' in width_class:
        score += weights['width']['not_passable']
    elif 'narrow' in width_class:
        score += weights['width']['narrow']
    elif 'normal' in width_class:
        score += weights['width']['normal']
    elif 'wide' in width_class:
        score += weights['width']['wide']
    
    # 의자 (더 세밀한 로직)
    chair = item.get('chair', {})
    has_movable = chair.get('has_movable_chair', False)
    has_high_movable = chair.get('has_high_movable_chair', False)
    has_fixed = chair.get('has_fixed_chair', False)
    has_floor = chair.get('has_floor_chair', False)
    
    if has_floor and not has_movable:
        # 좌식형만 있는 경우
        score += weights['chair']['floor_only']
    elif has_fixed and not has_movable:
        # 고정형만 있는 경우
        score += weights['chair']['fixed_only']
    # 이동형 의자가 있으면 감점 없음
    
    if has_high_movable:
        # 높이 조절 가능 보너스
        score += weights['chair']['high_movable_bonus']
    
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
    
    return max(0, min(100, score)), grade


def analyze_data(data: List[Dict]) -> Dict:
    """데이터 분석"""
    total = len(data)
    
    if total == 0:
        return {}
    
    # 기본 통계
    stats = {
        'total': total,
        'has_step': {'true': 0, 'false': 0},
        'width_class': {'wide': 0, 'normal': 0, 'narrow': 0, 'not_passable': 0},
        'chair': {
            'movable': 0,
            'high_movable': 0,
            'fixed': 0,
            'floor': 0
        },
        'current_scores': [],
        'current_grades': {'S': 0, 'A': 0, 'B': 0, 'C': 0, 'D': 0}
    }
    
    # 조합별 분석
    combinations = {
        'step_and_width': defaultdict(int),
        'step_and_chair': defaultdict(int),
        'width_and_chair': defaultdict(int),
        'all_three': defaultdict(int)
    }
    
    for item in data:
        # 단차 통계
        if item.get('has_step'):
            stats['has_step']['true'] += 1
        else:
            stats['has_step']['false'] += 1
        
        # 통로 너비 통계
        width_class = item.get('width_class', [])
        for w in width_class:
            if w in stats['width_class']:
                stats['width_class'][w] += 1
        
        # 의자 타입 통계
        chair = item.get('chair', {})
        if chair.get('has_movable_chair'):
            stats['chair']['movable'] += 1
        if chair.get('has_high_movable_chair'):
            stats['chair']['high_movable'] += 1
        if chair.get('has_fixed_chair'):
            stats['chair']['fixed'] += 1
        if chair.get('has_floor_chair'):
            stats['chair']['floor'] += 1
        
        # 현재 점수 계산
        score, grade = calculate_current_score(item)
        stats['current_scores'].append(score)
        stats['current_grades'][grade] += 1
        
        # 조합 분석
        has_step = 'step' if item.get('has_step') else 'no_step'
        width_main = width_class[0] if width_class else 'unknown'
        chair_type = 'movable' if chair.get('has_movable_chair') else \
                     'fixed' if chair.get('has_fixed_chair') else \
                     'floor' if chair.get('has_floor_chair') else 'none'
        
        combinations['step_and_width'][f"{has_step}_{width_main}"] += 1
        combinations['step_and_chair'][f"{has_step}_{chair_type}"] += 1
        combinations['width_and_chair'][f"{width_main}_{chair_type}"] += 1
        combinations['all_three'][f"{has_step}_{width_main}_{chair_type}"] += 1
    
    stats['current_avg_score'] = statistics.mean(stats['current_scores'])
    stats['current_median_score'] = statistics.median(stats['current_scores'])
    stats['combinations'] = combinations
    
    return stats


def compare_scenarios(data: List[Dict]) -> Dict:
    """여러 시나리오 비교"""
    scenarios = ['conservative', 'realistic', 'strict']
    results = {}
    
    for scenario in scenarios:
        scores = []
        grades = {'S': 0, 'A': 0, 'B': 0, 'C': 0, 'D': 0}
        
        for item in data:
            score, grade = calculate_proposed_score(item, scenario)
            scores.append(score)
            grades[grade] += 1
        
        results[scenario] = {
            'avg_score': statistics.mean(scores),
            'median_score': statistics.median(scores),
            'grades': grades
        }
    
    return results


def print_analysis_report(stats: Dict, comparisons: Dict):
    """분석 리포트 출력"""
    print("=" * 80)
    print("📊 접근성 점수 가중치 분석 리포트")
    print("=" * 80)
    
    print(f"\n📈 기본 통계")
    print(f"  총 이미지 수: {stats['total']}개")
    
    print(f"\n🪜 단차 (계단/턱)")
    print(f"  있음: {stats['has_step']['true']}개 ({stats['has_step']['true']/stats['total']*100:.1f}%)")
    print(f"  없음: {stats['has_step']['false']}개 ({stats['has_step']['false']/stats['total']*100:.1f}%)")
    
    print(f"\n🛤️  통로 너비")
    total_width = sum(stats['width_class'].values())
    for width, count in stats['width_class'].items():
        if total_width > 0:
            print(f"  {width}: {count}개 ({count/total_width*100:.1f}%)")
    
    print(f"\n🪑 의자 타입")
    total_chair = sum(stats['chair'].values())
    for chair_type, count in stats['chair'].items():
        if total_chair > 0:
            print(f"  {chair_type}: {count}개 ({count/total_chair*100:.1f}%)")
    
    print(f"\n📊 현재 점수 분포")
    print(f"  평균 점수: {stats['current_avg_score']:.1f}점")
    print(f"  중간값: {stats['current_median_score']:.1f}점")
    print(f"  등급 분포:")
    for grade, count in stats['current_grades'].items():
        print(f"    {grade}등급: {count}개 ({count/stats['total']*100:.1f}%)")
    
    print(f"\n🔄 가중치 시나리오 비교")
    print(f"  현재 가중치:")
    print(f"    평균 점수: {stats['current_avg_score']:.1f}점")
    
    for scenario, result in comparisons.items():
        print(f"\n  {scenario.upper()} 시나리오:")
        print(f"    평균 점수: {result['avg_score']:.1f}점 (변화: {result['avg_score'] - stats['current_avg_score']:+.1f}점)")
        print(f"    등급 분포:")
        for grade, count in result['grades'].items():
            current_count = stats['current_grades'][grade]
            change = count - current_count
            change_pct = (change / stats['total'] * 100) if stats['total'] > 0 else 0
            print(f"      {grade}등급: {count}개 ({count/stats['total']*100:.1f}%, 변화: {change:+d}개 ({change_pct:+.1f}%))")
    
    print("\n" + "=" * 80)


def main():
    print("🚀 접근성 점수 가중치 분석 시작...\n")
    
    # 데이터 로드
    data = load_gt_data()
    if not data:
        print("❌ 분석할 데이터가 없습니다.")
        sys.exit(1)
    
    print(f"✅ {len(data)}개의 이미지 데이터를 로드했습니다.\n")
    
    # 분석 실행
    stats = analyze_data(data)
    comparisons = compare_scenarios(data)
    
    # 리포트 출력
    print_analysis_report(stats, comparisons)
    
    print("\n✅ 분석 완료!")


if __name__ == '__main__':
    main()


