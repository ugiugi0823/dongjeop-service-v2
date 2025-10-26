import axios from 'axios';

// GitHub Pages에서는 정적 파일을 사용
const isGitHubPages = window.location.hostname === 'ugiugi0823.github.io';
const API_BASE_URL = isGitHubPages ? '' : '/api';

// 정적 데이터 로드 함수
const loadStaticData = async () => {
  try {
    const response = await fetch('/gt.jsonl');
    const text = await response.text();
    return text.split('\n').filter(line => line.trim()).map(line => JSON.parse(line));
  } catch (error) {
    console.error('Failed to load static data:', error);
    return [];
  }
};

// 통계 계산 함수
const calculateStatistics = (data) => {
  const total = data.length;
  const hasStep = { true: 0, false: 0 };
  const widthClass = { wide: 0, normal: 0, narrow: 0, not_passable: 0 };
  const chairTypes = { movable: 0, high_movable: 0, fixed: 0, floor: 0 };
  const gradeDistribution = { S: 0, A: 0, B: 0, C: 0, D: 0 };

  data.forEach(item => {
    // 단차 통계
    if (item.has_step) hasStep.true++;
    else hasStep.false++;

    // 통로 너비 통계
    if (item.width_class) {
      item.width_class.forEach(width => {
        if (widthClass.hasOwnProperty(width)) {
          widthClass[width]++;
        }
      });
    }

    // 의자 타입 통계
    if (item.chair) {
      if (item.chair.has_movable_chair) chairTypes.movable++;
      if (item.chair.has_high_movable_chair) chairTypes.high_movable++;
      if (item.chair.has_fixed_chair) chairTypes.fixed++;
      if (item.chair.has_floor_chair) chairTypes.floor++;
    }

    // 등급 분포 (간단한 계산)
    const score = calculateAccessibilityScore(item);
    gradeDistribution[score.grade]++;
  });

  return {
    total_images: total,
    has_step: hasStep,
    width_class: widthClass,
    chair_types: chairTypes,
    grade_distribution: gradeDistribution,
    percentages: {
      step_free: total > 0 ? ((hasStep.false / total) * 100).toFixed(1) : 0
    }
  };
};

// 접근성 점수 계산
const calculateAccessibilityScore = (item) => {
  let score = 100;
  
  if (item.has_step) score -= 30;
  
  if (item.width_class) {
    if (item.width_class.includes('not_passable')) score -= 40;
    else if (item.width_class.includes('narrow')) score -= 20;
    else if (item.width_class.includes('normal')) score -= 10;
  }
  
  if (item.chair && !item.chair.has_movable_chair) score -= 10;
  
  const grade = score >= 90 ? 'S' : score >= 80 ? 'A' : score >= 70 ? 'B' : score >= 60 ? 'C' : 'D';
  
  return { score, grade };
};

export const api = {
  // 요약 통계
  getSummary: async () => {
    if (isGitHubPages) {
      const data = await loadStaticData();
      return calculateStatistics(data);
    }
    const response = await axios.get(`${API_BASE_URL}/summary`);
    return response.data;
  },

  // 전체 통계
  getStatistics: async () => {
    if (isGitHubPages) {
      const data = await loadStaticData();
      return calculateStatistics(data);
    }
    const response = await axios.get(`${API_BASE_URL}/statistics`);
    return response.data;
  },

  // 이미지 목록 (필터링 & 페이지네이션)
  getImages: async (params = {}) => {
    if (isGitHubPages) {
      const data = await loadStaticData();
      let filteredData = data;
      
      // 필터링 적용
      if (params.has_step !== undefined) {
        filteredData = filteredData.filter(item => item.has_step === params.has_step);
      }
      if (params.width_class) {
        filteredData = filteredData.filter(item => 
          item.width_class && item.width_class.includes(params.width_class)
        );
      }
      if (params.chair_type) {
        filteredData = filteredData.filter(item => {
          if (!item.chair) return false;
          const chairTypeMap = {
            'movable': 'has_movable_chair',
            'high_movable': 'has_high_movable_chair',
            'fixed': 'has_fixed_chair',
            'floor': 'has_floor_chair'
          };
          return item.chair[chairTypeMap[params.chair_type]] || false;
        });
      }
      if (params.needs_relabeling !== undefined) {
        filteredData = filteredData.filter(item => {
          const filePath = item.file_path || '';
          const needsRelabelingPatterns = ['test', 'sample', 'temp', 'draft'];
          return needsRelabelingPatterns.some(pattern => 
            filePath.toLowerCase().includes(pattern)
          );
        });
      }
      
      // 페이지네이션
      const skip = params.skip || 0;
      const limit = params.limit || 20;
      const paginatedData = filteredData.slice(skip, skip + limit);
      
      // 접근성 점수 추가
      paginatedData.forEach(item => {
        item.accessibility = calculateAccessibilityScore(item);
      });
      
      return {
        total: filteredData.length,
        skip,
        limit,
        items: paginatedData
      };
    }
    const response = await axios.get(`${API_BASE_URL}/images`, { params });
    return response.data;
  },

  // 이미지 상세
  getImageDetail: async (filePath) => {
    if (isGitHubPages) {
      const data = await loadStaticData();
      const item = data.find(d => d.file_path === filePath);
      if (item) {
        item.accessibility = calculateAccessibilityScore(item);
        return item;
      }
      throw new Error('Image not found');
    }
    const response = await axios.get(`${API_BASE_URL}/images/${encodeURIComponent(filePath)}`);
    return response.data;
  },

  // 배치 목록 조회
  getBatches: async () => {
    if (isGitHubPages) {
      // 데모용 배치 데이터
      return [
        { name: 'batch_00', status: 'completed', image_count: 5 },
        { name: 'batch_01', status: 'completed', image_count: 3 },
        { name: 'batch_02', status: 'pending', image_count: 10 },
        { name: 'batch_03', status: 'pending', image_count: 5 },
        { name: 'batch_04', status: 'completed', image_count: 16 },
        { name: 'batch_05', status: 'pending', image_count: 15 },
        { name: 'batch_06', status: 'completed', image_count: 12 },
        { name: 'batch_07', status: 'pending', image_count: 17 },
        { name: 'batch_08', status: 'completed', image_count: 11 },
        { name: 'batch_09', status: 'pending', image_count: 12 },
        { name: 'batch_10', status: 'completed', image_count: 6 }
      ];
    }
    const response = await axios.get(`${API_BASE_URL}/batches`);
    return response.data;
  },

  // 배치별 이미지 목록
  getBatchImages: async (batchName) => {
    if (isGitHubPages) {
      // 데모용 이미지 목록
      return [
        '20240406121216_photo1_96fe98eaa714.webp',
        '20241103124712_photo2_e79f04f02f02.webp',
        '20241214072812938_photo_1a04d11682bc.webp',
        'gold_20240317125953_photo4_8fa73bbfd2e7.webp',
        'gold_20250427125847_photo1_9c87a02fd398.webp'
      ];
    }
    const response = await axios.get(`${API_BASE_URL}/batches/${batchName}/images`);
    return response.data;
  },

  // 배치 분석 시작
  startBatchAnalysis: async (batchName) => {
    if (isGitHubPages) {
      return { message: 'Demo mode - analysis simulation', batch: batchName };
    }
    const response = await axios.post(`${API_BASE_URL}/batches/${batchName}/analyze`);
    return response.data;
  },
};

// 이미지 URL 생성
export const getImageUrl = (fileName) => {
  if (isGitHubPages) {
    return `/dongjeop-service-v2/images/${fileName}`;
  }
  return `/images/${fileName}`;
};

// Spider 이미지 URL 생성
export const getSpiderImageUrl = (fileName) => {
  if (isGitHubPages) {
    return `/dongjeop-service-v2/images/${fileName}`;
  }
  return `/spider-images/${fileName}`;
};

