"""
백엔드 기능 테스트 스크립트
"""
import sys
from pathlib import Path

# 프로젝트 루트를 경로에 추가
sys.path.insert(0, str(Path(__file__).parent))

from backend.utils.config import settings
from backend.processor.data_manager import DataManager

def test_data_loading():
    """데이터 로딩 테스트"""
    print("=" * 60)
    print("1. 데이터 로딩 테스트")
    print("=" * 60)
    
    manager = DataManager(settings.GT_JSONL_PATH)
    data = manager.load_all_data()
    
    print(f"✅ 총 {len(data)}개의 이미지 데이터 로드 완료")
    
    if data:
        print(f"   첫 번째 항목: {data[0]['file_path']}")
    
    return len(data) > 0

def test_statistics():
    """통계 계산 테스트"""
    print("\n" + "=" * 60)
    print("2. 통계 계산 테스트")
    print("=" * 60)
    
    manager = DataManager(settings.GT_JSONL_PATH)
    stats = manager.get_statistics()
    
    print(f"✅ 통계 계산 완료")
    print(f"   총 이미지: {stats['total_images']}장")
    print(f"   단차 없음: {stats['has_step']['false']}장 ({stats['has_step']['false']/stats['total_images']*100:.1f}%)")
    print(f"   단차 있음: {stats['has_step']['true']}장 ({stats['has_step']['true']/stats['total_images']*100:.1f}%)")
    
    print(f"\n   통로 너비 분포:")
    for width, count in stats['width_class'].items():
        print(f"     - {width}: {count}개")
    
    print(f"\n   의자 타입:")
    for chair_type, count in stats['chair_types'].items():
        print(f"     - {chair_type}: {count}개")
    
    return stats['total_images'] > 0

def test_pagination():
    """페이지네이션 테스트"""
    print("\n" + "=" * 60)
    print("3. 페이지네이션 테스트")
    print("=" * 60)
    
    manager = DataManager(settings.GT_JSONL_PATH)
    result = manager.get_images(skip=0, limit=5)
    
    print(f"✅ 페이지네이션 테스트 완료")
    print(f"   총 {result['total']}개 중 {len(result['items'])}개 조회")
    
    for i, item in enumerate(result['items'], 1):
        print(f"   {i}. {item['file_path']}")
    
    return len(result['items']) > 0

def test_filtering():
    """필터링 테스트"""
    print("\n" + "=" * 60)
    print("4. 필터링 테스트")
    print("=" * 60)
    
    manager = DataManager(settings.GT_JSONL_PATH)
    
    # 단차 없는 이미지만
    result1 = manager.get_images(has_step=False, limit=5)
    print(f"✅ 단차 없는 이미지: {result1['total']}개")
    
    # Wide 통로만
    result2 = manager.get_images(width_class='wide', limit=5)
    print(f"✅ Wide 통로 이미지: {result2['total']}개")
    
    return True

def test_accessibility_score():
    """접근성 점수 계산 테스트"""
    print("\n" + "=" * 60)
    print("5. 접근성 점수 계산 테스트")
    print("=" * 60)
    
    manager = DataManager(settings.GT_JSONL_PATH)
    data = manager.load_all_data()
    
    if data:
        # 첫 3개 샘플 테스트
        for i, item in enumerate(data[:3], 1):
            score_info = manager.calculate_accessibility_score(item)
            print(f"\n   샘플 {i}: {item['file_path']}")
            print(f"     점수: {score_info['score']}점")
            print(f"     등급: {score_info['grade']}")
            print(f"     단차: {'있음' if item.get('has_step') else '없음'}")
            print(f"     통로: {', '.join(item.get('width_class', []))}")
    
    return True

def main():
    """메인 테스트 함수"""
    print("\n🧪 백엔드 기능 테스트 시작\n")
    
    tests = [
        ("데이터 로딩", test_data_loading),
        ("통계 계산", test_statistics),
        ("페이지네이션", test_pagination),
        ("필터링", test_filtering),
        ("접근성 점수", test_accessibility_score)
    ]
    
    results = []
    
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"\n❌ {test_name} 테스트 실패: {e}")
            results.append((test_name, False))
    
    # 결과 요약
    print("\n" + "=" * 60)
    print("테스트 결과 요약")
    print("=" * 60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {test_name}")
    
    print(f"\n총 {total}개 테스트 중 {passed}개 통과")
    
    if passed == total:
        print("\n🎉 모든 테스트 통과!")
        print("\n다음 명령으로 서버를 실행하세요:")
        print("  ./run_demo.sh  (Mac/Linux)")
        print("  run_demo.bat   (Windows)")
        print("\n브라우저에서 http://localhost:8000 접속")
    else:
        print(f"\n⚠️  {total - passed}개 테스트 실패")
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(main())

