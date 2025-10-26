import axios from 'axios';

const API_BASE_URL = '/api';

export const api = {
  // 요약 통계
  getSummary: async () => {
    const response = await axios.get(`${API_BASE_URL}/summary`);
    return response.data;
  },

  // 전체 통계
  getStatistics: async () => {
    const response = await axios.get(`${API_BASE_URL}/statistics`);
    return response.data;
  },

  // 이미지 목록 (필터링 & 페이지네이션)
  getImages: async (params = {}) => {
    const response = await axios.get(`${API_BASE_URL}/images`, { params });
    return response.data;
  },

  // 이미지 상세
  getImageDetail: async (filePath) => {
    const response = await axios.get(`${API_BASE_URL}/images/${encodeURIComponent(filePath)}`);
    return response.data;
  },

  // 배치 목록 조회
  getBatches: async () => {
    const response = await axios.get(`${API_BASE_URL}/batches`);
    return response.data;
  },

  // 배치별 이미지 목록
  getBatchImages: async (batchName) => {
    const response = await axios.get(`${API_BASE_URL}/batches/${batchName}/images`);
    return response.data;
  },

  // 배치 분석 시작
  startBatchAnalysis: async (batchName) => {
    const response = await axios.post(`${API_BASE_URL}/batches/${batchName}/analyze`);
    return response.data;
  },
};

// 이미지 URL 생성
export const getImageUrl = (fileName) => {
  return `/images/${fileName}`;
};

// Spider 이미지 URL 생성
export const getSpiderImageUrl = (fileName) => {
  return `/spider-images/${fileName}`;
};

