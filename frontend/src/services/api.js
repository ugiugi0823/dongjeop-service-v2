import axios from 'axios';

// GitHub Pages에서는 정적 파일을 사용
const isGitHubPages = window.location.hostname === 'ugiugi0823.github.io';
const API_BASE_URL = isGitHubPages ? '' : '/api';

// 정적 데이터 로드 함수
const loadStaticData = async () => {
  try {
    const url = isGitHubPages ? '/dongjeop-service-v2/gt.jsonl' : '/gt.jsonl';
    const response = await fetch(url);
    const text = await response.text();
    return text.split('\n').filter(line => line.trim()).map(line => JSON.parse(line));
  } catch (error) {
    console.error('Failed to load static data:', error);
    return [];
  }
};

// 검수완료목록 데이터 로드
const loadReviewedData = async () => {
  try {
    const url = isGitHubPages 
      ? '/dongjeop-service-v2/data/검수완료목록/gt.jsonl' 
      : '/data/검수완료목록/gt.jsonl';
    const response = await fetch(url);
    const text = await response.text();
    return text.split('\n').filter(line => line.trim()).map(line => JSON.parse(line));
  } catch (error) {
    console.error('Failed to load reviewed data:', error);
    return [];
  }
};

// GPT Vision API 분석 결과 로드
const loadGPTAnalysisResults = async () => {
  try {
    // 로컬 개발: base path 없이, GitHub Pages: base path 포함
    // vite.config.js에서 로컬 개발 시 base를 '/'로 설정했으므로 로컬에서는 base path 불필요
    const url = isGitHubPages 
      ? '/dongjeop-service-v2/gpt_analysis_results.jsonl' 
      : '/gpt_analysis_results.jsonl';
    console.log('Loading GPT analysis results from:', url);
    console.log('isGitHubPages:', isGitHubPages);
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error('Failed to fetch GPT analysis results:', response.status, response.statusText);
      return [];
    }
    
    const text = await response.text();
    console.log('GPT analysis results text length:', text.length);
    
    const lines = text.split('\n').filter(line => line.trim());
    console.log('GPT analysis results lines:', lines.length);
    
    const results = [];
    for (let i = 0; i < lines.length; i++) {
      try {
        const item = JSON.parse(lines[i]);
        results.push(item);
      } catch (parseError) {
        console.warn(`Failed to parse line ${i + 1}:`, parseError, lines[i]);
      }
    }
    
    console.log('Successfully loaded GPT analysis results:', results.length);
    return results;
  } catch (error) {
    console.error('Failed to load GPT analysis results:', error);
    return [];
  }
};

// 검수대상목록 데이터 로드 (배치 폴더에서 이미지 목록만 가져옴)
const loadReviewQueueImages = async () => {
  try {
    const url = isGitHubPages 
      ? '/dongjeop-service-v2/review_queue_images.json' 
      : '/review_queue_images.json';
    const response = await fetch(url);
    const imageFiles = await response.json();
    
    return imageFiles.map((filePath, index) => {
      const batchName = filePath.split('/')[0];
      const fileName = filePath.split('/')[1];
      // 우선순위: index 기반으로 균등 분배
      const priority = index % 10 < 3 ? 'high' : index % 10 < 7 ? 'medium' : 'low';
      return {
        file_path: filePath,
        batch: batchName,
        review_status: 'pending',
        review_priority: priority,
        review_reason: 'AI 분석 결과 불확실'
      };
    });
  } catch (error) {
    console.error('Failed to load review queue images:', error);
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
  let totalScore = 0;

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

    // 등급 분포 및 평균 점수 계산
    const score = calculateAccessibilityScore(item);
    gradeDistribution[score.grade]++;
    totalScore += score.score;
  });

  const averageScore = total > 0 ? (totalScore / total).toFixed(1) : 0;

  return {
    total_images: total,
    has_step: hasStep,
    width_class: widthClass,
    chair_types: chairTypes,
    grade_distribution: gradeDistribution,
    average_score: averageScore,
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
    // 로컬 개발 환경에서도 정적 데이터를 사용 (백엔드 데이터가 없는 경우 대비)
    try {
      const data = await loadStaticData();
      if (data && data.length > 0) {
        return calculateStatistics(data);
      }
    } catch (error) {
      console.log('정적 데이터 로드 실패, 백엔드 API 시도:', error);
    }
    
    // 백엔드 API 시도
    try {
      const response = await axios.get(`${API_BASE_URL}/statistics`);
      if (response.data && response.data.total_images > 0) {
        return response.data;
      }
    } catch (error) {
      console.error('백엔드 API 호출 실패:', error);
    }
    
    // 둘 다 실패하면 빈 통계 반환
    return {
      total_images: 0,
      has_step: { true: 0, false: 0 },
      width_class: {},
      chair_types: {},
      grade_distribution: { S: 0, A: 0, B: 0, C: 0, D: 0 },
      average_score: 0,
      percentages: { step_free: 0 }
    };
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
      
      // 신뢰도 점수 필터 (접근성 점수 기준)
      if (params.min_score !== undefined) {
        filteredData = filteredData.filter(item => {
          const score = calculateAccessibilityScore(item);
          if (params.min_score === 90) {
            return score.score >= 90;
          } else if (params.min_score === 75) {
            return score.score >= 75;
          } else if (params.min_score === 50) {
            return score.score >= 50;
          } else if (params.min_score === 25) {
            return score.score < 25;
          }
          return true;
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
    if (isGitHubPages || true) {
      // 먼저 검수완료목록에서 찾기
      try {
        const reviewedData = await loadReviewedData();
        const reviewedItem = reviewedData.find(d => d.file_path === filePath);
        if (reviewedItem) {
          const score = calculateAccessibilityScore(reviewedItem);
          return {
            ...reviewedItem,
            accessibility: score
          };
        }
      } catch (e) {
        console.log('검수완료목록에서 찾기 실패:', e);
      }
      
      // 그 다음 기존 gt.jsonl에서 찾기
      try {
        const data = await loadStaticData();
        const item = data.find(d => d.file_path === filePath);
        if (item) {
          item.accessibility = calculateAccessibilityScore(item);
          return item;
        }
      } catch (e) {
        console.log('기존 데이터에서 찾기 실패:', e);
      }
      
      // 찾지 못한 경우 null 반환 (ImageModal에서 처리)
      return null;
    }
    const response = await axios.get(`${API_BASE_URL}/images/${encodeURIComponent(filePath)}`);
    return response.data;
  },

  // 배치 목록 조회
  getBatches: async () => {
    if (isGitHubPages) {
      // 데모용 배치 데이터
      return [
        { name: 'folder_00', status: 'completed', image_count: 5 },
        { name: 'folder_01', status: 'completed', image_count: 3 },
        { name: 'folder_02', status: 'pending', image_count: 10 },
        { name: 'folder_03', status: 'pending', image_count: 5 },
        { name: 'folder_04', status: 'completed', image_count: 16 },
        { name: 'folder_05', status: 'pending', image_count: 15 },
        { name: 'folder_06', status: 'completed', image_count: 12 },
        { name: 'folder_07', status: 'pending', image_count: 17 },
        { name: 'folder_08', status: 'completed', image_count: 11 },
        { name: 'folder_09', status: 'pending', image_count: 12 },
        { name: 'folder_10', status: 'completed', image_count: 6 }
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

  // 검수 대기 목록 조회
  getReviewQueue: async (params = {}) => {
    if (isGitHubPages || true) { // 로컬 개발도 정적 파일 사용
      // GPT Vision API 분석 결과만 사용 (검수대상목록은 GPT 분석 결과만 표시)
      let gptResults = await loadGPTAnalysisResults();
      console.log('GPT results loaded:', gptResults.length);
      
      if (gptResults.length === 0) {
        console.warn('No GPT analysis results found. Returning empty list.');
        return {
          total: 0,
          items: []
        };
      }
      
      // GPT 분석 결과를 검수대상 형식으로 변환
      let data = gptResults.map((item) => {
        // 신뢰도 기반 우선순위 설정
        let priority = 'medium';
        const confidence = item.confidence || 0;
        if (confidence < 0.5) {
          priority = 'high'; // 신뢰도 매우 낮음
        } else if (confidence < 0.75) {
          priority = 'high'; // 신뢰도 낮음
        } else if (confidence >= 0.9) {
          priority = 'low'; // 신뢰도 높음
        }
        
        return {
          file_path: item.file_path,
          batch: item.batch,
          review_status: 'pending',
          review_priority: priority,
          review_reason: confidence < 0.75 ? 'AI 분석 신뢰도 낮음' : 'AI 분석 결과 재검토 필요',
          // GPT 분석 결과 데이터 포함
          has_step: item.has_step,
          width_class: item.width_class,
          chair: item.chair,
          confidence: confidence, // 모델 신뢰도 추가
          from_gpt: true // GPT 분석 결과임을 표시
        };
      });
      
      // 검색 필터 적용
      if (params.search) {
        const searchLower = params.search.toLowerCase();
        data = data.filter(item => 
          item.file_path.toLowerCase().includes(searchLower)
        );
      }
      
      console.log('Final review queue data count:', data.length);
      return {
        total: data.length,
        items: data
      };
    }
    const response = await axios.get(`${API_BASE_URL}/images/review/queue`, { params });
    return response.data;
  },

  // 검수 완료 목록 조회
  getReviewedList: async (params = {}) => {
    if (isGitHubPages || true) { // 로컬 개발도 정적 파일 사용
      // 검수완료 데이터와 검수대상 데이터를 모두 가져옴
      let reviewedData = await loadReviewedData();
      let queueData = await loadReviewQueueImages();
      
      // 검수완료 데이터 처리
      let completedItems = reviewedData.map((item, index) => {
        const score = calculateAccessibilityScore(item);
        // 상태값 랜덤 할당 (정상 70%, 보류 20%, 폐기 10%)
        const statusOptions = ['정상', '정상', '정상', '정상', '정상', '정상', '정상', '보류', '보류', '폐기'];
        const status = statusOptions[index % statusOptions.length];
        return {
          ...item,
          review_status: 'completed',
          reviewed_by: `reviewer${(index % 3) + 1}`,
          reviewed_at: new Date(Date.now() - index * 86400000).toISOString(),
          review_result: {
            has_step: item.has_step,
            width_class: item.width_class,
            chair: item.chair,
            score: score.score,
            grade: score.grade
          },
          has_changes: index % 5 === 0, // 5개 중 1개는 변경됨
          status: status
        };
      });
      
      // 검수대상 이미지들을 검수완료 형식으로 변환 (임시 검수 정보 추가)
      let queueItems = queueData.map((item, index) => {
        // 상태값 랜덤 할당 (정상 70%, 보류 20%, 폐기 10%)
        const statusOptions = ['정상', '정상', '정상', '정상', '정상', '정상', '정상', '보류', '보류', '폐기'];
        const status = statusOptions[(index + reviewedData.length) % statusOptions.length];
        // 검수대상 이미지도 검수 완료된 것처럼 표시
        return {
          ...item,
          review_status: 'completed',
          reviewed_by: `reviewer${(index % 3) + 1}`,
          reviewed_at: new Date(Date.now() - (index + reviewedData.length) * 86400000).toISOString(),
          review_result: {
            has_step: false, // 기본값
            width_class: ['normal'], // 기본값
            chair: { has_movable_chair: true }, // 기본값
            score: 75, // 기본 점수
            grade: 'B' // 기본 등급
          },
          has_changes: false,
          status: status
        };
      });
      
      // 두 데이터 합치기
      let data = [...completedItems, ...queueItems];
      
      // 기본 상태값 설정 (없으면 정상으로 처리)
      data = data.map(item => ({
        ...item,
        status: item.status || '정상'
      }));
      
      // 각 이미지별로 검수 정보 추가
      let filteredData = data;
      
      // 필터 적용
      if (params.search) {
        const searchLower = params.search.toLowerCase();
        filteredData = filteredData.filter(item => 
          item.file_path.toLowerCase().includes(searchLower)
        );
      }
      
      if (params.status && params.status !== 'all') {
        filteredData = filteredData.filter(item => 
          (item.status || '정상') === params.status
        );
      }
      
      if (params.reviewer && params.reviewer !== 'all') {
        filteredData = filteredData.filter(item => 
          item.reviewed_by === params.reviewer
        );
      }
      
      // 날짜 필터 (간단히 일수로 필터링)
      if (params.date_range && params.date_range !== 'all') {
        const days = params.date_range === '7days' ? 7 : 
                     params.date_range === '30days' ? 30 : 
                     params.date_range === '90days' ? 90 : 365;
        const cutoffDate = new Date(Date.now() - days * 86400000);
        filteredData = filteredData.filter(item => {
          const reviewedDate = new Date(item.reviewed_at);
          return reviewedDate >= cutoffDate;
        });
      }
      
      return {
        total: filteredData.length,
        items: filteredData
      };
    }
    const response = await axios.get(`${API_BASE_URL}/images/review/completed`, { params });
    return response.data;
  },

  // 검수 완료 처리
  completeReview: async (filePaths, reviewData = null) => {
    if (isGitHubPages || true) { // 로컬 개발도 데모 모드
      // 검수 데이터 저장 (실제로는 로컬 스토리지나 백엔드에 저장)
      if (reviewData) {
        console.log('Review data saved:', reviewData);
        // 나중에 실제 백엔드 구현 시 사용할 수 있도록 구조 준비
      }
      return { message: 'Demo mode - review completed', file_paths: filePaths };
    }
    const response = await axios.post(`${API_BASE_URL}/images/review/complete`, {
      file_paths: filePaths,
      review_data: reviewData
    });
    return response.data;
  },

  // 재검수 등록
  markAsNeedsReview: async (filePaths) => {
    if (isGitHubPages) {
      return { message: 'Demo mode - marked for review', file_paths: filePaths };
    }
    const response = await axios.post(`${API_BASE_URL}/images/review/mark-needs-review`, {
      file_paths: filePaths
    });
    return response.data;
  },

  // 사진수집현황 배치 목록 조회
  getPhotoCollectionBatches: async () => {
    if (isGitHubPages || true) {
      try {
        const url = isGitHubPages 
          ? '/dongjeop-service-v2/photo_collection_images.json' 
          : '/photo_collection_images.json';
        const response = await fetch(url);
        const imageFiles = await response.json();
        
        // 배치별로 그룹화
        const batchMap = {};
        imageFiles.forEach(filePath => {
          const batchName = filePath.split('/')[0];
          if (!batchMap[batchName]) {
            batchMap[batchName] = [];
          }
          batchMap[batchName].push(filePath);
        });
        
        return Object.keys(batchMap).sort().map(batchName => ({
          name: batchName,
          image_count: batchMap[batchName].length
        }));
      } catch (error) {
        console.error('사진수집현황 배치 목록 로드 실패:', error);
        // 데모용 기본 데이터
        return [
          { name: 'folder_00', image_count: 5 },
          { name: 'folder_01', image_count: 3 },
          { name: 'folder_02', image_count: 11 },
          { name: 'folder_03', image_count: 5 },
          { name: 'folder_04', image_count: 16 },
          { name: 'folder_05', image_count: 15 },
          { name: 'folder_06', image_count: 12 },
          { name: 'folder_07', image_count: 17 },
          { name: 'folder_08', image_count: 11 },
          { name: 'folder_09', image_count: 12 },
          { name: 'folder_10', image_count: 6 }
        ];
      }
    }
    const response = await axios.get(`${API_BASE_URL}/photo-collection/batches`);
    return response.data;
  },

  // 사진수집현황 배치별 이미지 목록 조회
  getPhotoCollectionImages: async (batchName) => {
    if (isGitHubPages || true) {
      try {
        const url = isGitHubPages 
          ? '/dongjeop-service-v2/photo_collection_images.json' 
          : '/photo_collection_images.json';
        const response = await fetch(url);
        const imageFiles = await response.json();
        
        // 해당 배치의 이미지만 필터링
        const batchImages = imageFiles
          .filter(filePath => filePath.startsWith(`${batchName}/`))
          .map(filePath => ({
            file_path: filePath
          }));
        
        return batchImages;
      } catch (error) {
        console.error('사진수집현황 이미지 로드 실패:', error);
        return [];
      }
    }
    const response = await axios.get(`${API_BASE_URL}/photo-collection/batches/${batchName}/images`);
    return response.data;
  },

  // GPT Vision API로 이미지 분석
  analyzeImages: async (imagePaths) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/analyze/images`, {
        image_paths: imagePaths
      });
      return response.data;
    } catch (error) {
      console.error('이미지 분석 실패:', error);
      throw error;
    }
  },
};

// 이미지 URL 생성
export const getImageUrl = (fileName, source = 'default') => {
  // batch_xx를 folder_xx로 변환 (하위 호환성)
  const normalizedFileName = fileName.replace(/batch_/g, 'folder_');
  
  // source 파라미터로 명시적으로 구분
  // 검수대상목록 이미지 (GPT 분석 결과) - 가장 먼저 체크
  if (source === 'review_queue') {
    // 경로의 각 부분을 URL 인코딩 (한글 폴더명 처리)
    const encodedFileName = normalizedFileName.split('/').map(part => encodeURIComponent(part)).join('/');
    const url = isGitHubPages
      ? `/dongjeop-service-v2/data/검수대상목록/${encodedFileName}`
      : `/data/검수대상목록/${encodedFileName}`;
    console.log('getImageUrl - review_queue:', { fileName, normalizedFileName, encodedFileName, source, url });
    return url;
  }
  
  // 사진수집현황 이미지
  if (source === 'photo_collection') {
    const encodedFileName = normalizedFileName.split('/').map(part => encodeURIComponent(part)).join('/');
    if (isGitHubPages) {
      return `/dongjeop-service-v2/data/사진수집현황/${encodedFileName}`;
    }
    return `/data/사진수집현황/${encodedFileName}`;
  }
  
  // 검수완료목록 이미지 (img_gt 폴더)
  if (source === 'gt' || source === 'reviewed') {
    const encodedFileName = normalizedFileName.split('/').map(part => encodeURIComponent(part)).join('/');
    if (isGitHubPages) {
      return `/dongjeop-service-v2/data/검수완료목록/img_gt/${encodedFileName}`;
    }
    return `/data/검수완료목록/img_gt/${encodedFileName}`;
  }
  
  // source가 지정되지 않은 경우 기본 처리
  // folder_XX 형식이면 사진수집현황으로 처리
  if (normalizedFileName.includes('folder_')) {
    const encodedFileName = normalizedFileName.split('/').map(part => encodeURIComponent(part)).join('/');
    if (isGitHubPages) {
      return `/dongjeop-service-v2/data/사진수집현황/${encodedFileName}`;
    }
    return `/data/사진수집현황/${encodedFileName}`;
  }
  
  // 그 외의 경우 검수완료목록 img_gt 폴더로 처리
  const encodedFileName = normalizedFileName.split('/').map(part => encodeURIComponent(part)).join('/');
  if (isGitHubPages) {
    return `/dongjeop-service-v2/data/검수완료목록/img_gt/${encodedFileName}`;
  }
  return `/data/검수완료목록/img_gt/${encodedFileName}`;
};

// Spider 이미지 URL 생성
export const getSpiderImageUrl = (fileName) => {
  if (isGitHubPages) {
    return `/dongjeop-service-v2/images/${fileName}`;
  }
  return `/spider-images/${fileName}`;
};

