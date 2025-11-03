#!/usr/bin/env python3
"""
GPT Vision API를 사용하여 검수대상목록 이미지 분석 스크립트
"""

import json
import base64
import os
import sys
from pathlib import Path
from typing import Dict, List
import time
from openai import OpenAI

# 프로젝트 루트 경로
PROJECT_ROOT = Path(__file__).parent.parent
API_KEY_FILE = PROJECT_ROOT / "api.txt"
REVIEW_QUEUE_PATH = PROJECT_ROOT / "data" / "검수대상목록"
OUTPUT_FILE = PROJECT_ROOT / "data" / "검수대상목록" / "gpt_analysis_results.jsonl"

def load_api_key() -> str:
    """API 키 로드"""
    if not API_KEY_FILE.exists():
        raise FileNotFoundError(f"API 키 파일을 찾을 수 없습니다: {API_KEY_FILE}")
    
    with open(API_KEY_FILE, 'r') as f:
        api_key = f.read().strip()
    
    if not api_key:
        raise ValueError("API 키가 비어있습니다")
    
    return api_key


def encode_image(image_path: Path) -> str:
    """이미지를 base64로 인코딩"""
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')


def analyze_image_with_gpt(client: OpenAI, image_path: Path, batch_name: str) -> Dict:
    """GPT Vision API를 사용하여 이미지 분석"""
    
    # 이미지 base64 인코딩
    base64_image = encode_image(image_path)
    
    # 프롬프트 작성
    prompt = """이 이미지는 음식점의 실내 공간 사진입니다. 이동약자 접근성 관점에서 다음 항목들을 분석해주세요:

1. **단차/계단/턱 (has_step)**: 
   - 휠체어 사용자가 진입하기 어려운 단차, 계단, 문턱이 있는지 확인
   - boolean 값으로 반환 (true: 있음, false: 없음)

2. **통로 너비 (width_class)**:
   - wide: 휠체어가 여유롭게 통과 가능 (약 90cm 이상)
   - normal: 휠체어가 통과 가능하나 좁음 (약 70-90cm)
   - narrow: 휠체어 통과가 매우 어려움 (약 50-70cm)
   - not_passable: 휠체어 통과 불가능 (50cm 미만)
   - 배열로 반환 (여러 구간이 있으면 모두 포함)

3. **의자 타입 (chair)**:
   - has_movable_chair: 일반적인 이동 가능한 의자 (의자, 스툴 등)
   - has_high_movable_chair: 팔걸이가 있거나 높이 조절 가능한 의자
   - has_fixed_chair: 고정된 의자 (벤치, 부스 좌석 등)
   - has_floor_chair: 바닥 좌석 (좌식 테이블)
   - 각각 boolean 값으로 반환

응답은 반드시 다음 JSON 형식으로만 제공해주세요:
{
  "has_step": boolean,
  "width_class": ["wide" 또는 "normal" 또는 "narrow" 또는 "not_passable"],
  "chair": {
    "has_movable_chair": boolean,
    "has_high_movable_chair": boolean,
    "has_fixed_chair": boolean,
    "has_floor_chair": boolean
  },
  "confidence": float (0.0-1.0, 전체 예측의 신뢰도)
}"""

    try:
        response = client.chat.completions.create(
            model="gpt-4o",  # 또는 "gpt-4-vision-preview"
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": prompt
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/webp;base64,{base64_image}"
                            }
                        }
                    ]
                }
            ],
            max_tokens=500,
            temperature=0.1  # 일관성을 위해 낮은 temperature
        )
        
        # 응답에서 JSON 추출
        content = response.choices[0].message.content.strip()
        
        # JSON 파싱 (마크다운 코드 블록 제거)
        if content.startswith("```json"):
            content = content[7:]
        if content.startswith("```"):
            content = content[3:]
        if content.endswith("```"):
            content = content[:-3]
        content = content.strip()
        
        result = json.loads(content)
        
        # file_path 추가
        result["file_path"] = f"{batch_name}/{image_path.name}"
        result["batch"] = batch_name
        
        # confidence가 없으면 기본값 설정
        if "confidence" not in result:
            result["confidence"] = 0.85  # 기본 신뢰도
        
        return result
        
    except json.JSONDecodeError as e:
        print(f"⚠️  JSON 파싱 오류 ({image_path.name}): {e}")
        print(f"   응답 내용: {content[:200]}...")
        # 기본값 반환
        return {
            "file_path": f"{batch_name}/{image_path.name}",
            "batch": batch_name,
            "has_step": False,
            "width_class": ["normal"],
            "chair": {
                "has_movable_chair": True,
                "has_high_movable_chair": False,
                "has_fixed_chair": False,
                "has_floor_chair": False
            },
            "confidence": 0.5  # 낮은 신뢰도 (파싱 실패)
        }
    except Exception as e:
        print(f"❌ API 호출 오류 ({image_path.name}): {e}")
        raise


def get_all_images() -> List[tuple]:
    """검수대상목록 폴더의 모든 이미지 가져오기"""
    images = []
    
    if not REVIEW_QUEUE_PATH.exists():
        print(f"❌ 폴더를 찾을 수 없습니다: {REVIEW_QUEUE_PATH}")
        return images
    
    # batch 폴더들 순회
    for batch_dir in sorted(REVIEW_QUEUE_PATH.iterdir()):
        if not batch_dir.is_dir():
            continue
        
        batch_name = batch_dir.name
        
        # 이미지 파일들 찾기
        for image_file in sorted(batch_dir.glob("*")):
            if image_file.is_file() and image_file.suffix.lower() in ['.jpg', '.jpeg', '.png', '.webp']:
                images.append((batch_name, image_file))
    
    return images


def main():
    print("🚀 GPT Vision API 이미지 분석 시작...\n")
    
    # API 키 로드
    try:
        api_key = load_api_key()
        client = OpenAI(api_key=api_key)
        print("✅ API 키 로드 완료\n")
    except Exception as e:
        print(f"❌ API 키 로드 실패: {e}")
        sys.exit(1)
    
    # 이미지 목록 가져오기
    images = get_all_images()
    total = len(images)
    
    if total == 0:
        print("❌ 분석할 이미지가 없습니다.")
        sys.exit(1)
    
    print(f"📸 총 {total}개의 이미지를 찾았습니다.\n")
    
    # 기존 결과 파일이 있으면 백업
    if OUTPUT_FILE.exists():
        backup_file = OUTPUT_FILE.with_suffix('.jsonl.backup')
        import shutil
        shutil.copy(OUTPUT_FILE, backup_file)
        print(f"📦 기존 결과를 백업했습니다: {backup_file}\n")
    
    # 결과 저장
    results = []
    success_count = 0
    error_count = 0
    
    for idx, (batch_name, image_path) in enumerate(images, 1):
        print(f"[{idx}/{total}] 분석 중: {batch_name}/{image_path.name}")
        
        try:
            result = analyze_image_with_gpt(client, image_path, batch_name)
            results.append(result)
            success_count += 1
            
            # 결과를 JSONL 형식으로 즉시 저장
            with open(OUTPUT_FILE, 'a', encoding='utf-8') as f:
                f.write(json.dumps(result, ensure_ascii=False) + '\n')
            
            print(f"   ✅ 완료 (신뢰도: {result.get('confidence', 0):.2f})")
            
            # API rate limit 방지를 위한 대기
            if idx < total:
                time.sleep(1)  # 1초 대기
            
        except Exception as e:
            print(f"   ❌ 오류: {e}")
            error_count += 1
            continue
    
    # 요약 출력
    print("\n" + "=" * 80)
    print("📊 분석 완료 요약")
    print("=" * 80)
    print(f"  총 이미지: {total}개")
    print(f"  성공: {success_count}개")
    print(f"  실패: {error_count}개")
    print(f"  결과 파일: {OUTPUT_FILE}")
    print("\n✅ 분석 완료!")


if __name__ == '__main__':
    main()


