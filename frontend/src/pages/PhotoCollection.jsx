import { useState, useEffect } from 'react';
import { api, getImageUrl } from '../services/api';
import ImageModal from '../components/ImageModal';
import './PhotoCollection.css';

function PhotoCollection() {
  const [batches, setBatches] = useState([]);
  const [allImages, setAllImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedBatch, setSelectedBatch] = useState('all'); // 'all' 또는 특정 배치명
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedImages, setSelectedImages] = useState(new Set()); // 선택된 이미지 경로들
  const [analyzing, setAnalyzing] = useState(false); // 분석 진행 중 여부
  const [analysisResult, setAnalysisResult] = useState(null); // 분석 결과
  const itemsPerPage = 24;

  useEffect(() => {
    loadAllData();
  }, []);

  // 배치 변경 또는 페이지 변경 시 선택 초기화
  useEffect(() => {
    setSelectedImages(new Set());
    setAnalysisResult(null);
  }, [selectedBatch, currentPage]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const batchesData = await api.getPhotoCollectionBatches();
      setBatches(batchesData);
      
      // 모든 배치의 이미지 로드
      const allImagesList = [];
      for (const batch of batchesData) {
        const batchImages = await api.getPhotoCollectionImages(batch.name);
        allImagesList.push(...batchImages);
      }
      setAllImages(allImagesList);
    } catch (error) {
      console.error('데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredImages = () => {
    if (selectedBatch === 'all') {
      return allImages;
    }
    return allImages.filter(img => img.file_path.startsWith(`${selectedBatch}/`));
  };

  const getTotalImages = () => {
    return batches.reduce((sum, batch) => sum + (batch.image_count || 0), 0);
  };

  const filteredImages = getFilteredImages();
  const paginatedImages = filteredImages.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );
  const totalPages = Math.ceil(filteredImages.length / itemsPerPage);

  // 이미지 선택 토글
  const toggleImageSelection = (imagePath, e) => {
    e.stopPropagation(); // 카드 클릭 이벤트와 충돌 방지
    setSelectedImages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(imagePath)) {
        newSet.delete(imagePath);
      } else {
        newSet.add(imagePath);
      }
      return newSet;
    });
  };

  // 전체 선택/해제
  const toggleSelectAll = () => {
    if (selectedImages.size === paginatedImages.length) {
      setSelectedImages(new Set());
    } else {
      setSelectedImages(new Set(paginatedImages.map(img => img.file_path)));
    }
  };

  // GPT Vision API 분석 실행 (비용 발생으로 인해 비활성화)
  const handleAnalyze = async () => {
    // API 호출 비활성화 - 비용 발생 방지
    alert('현재 GPT 분석 기능은 비용 발생으로 인해 비활성화되어 있습니다.');
    return;
    
    /* 주석 처리된 기존 코드 (나중에 활성화 시 사용)
    if (selectedImages.size === 0) {
      alert('분석할 이미지를 선택해주세요.');
      return;
    }

    if (!window.confirm(`${selectedImages.size}개 이미지를 분석하시겠습니까?\n(GPT Vision API 사용으로 비용이 발생할 수 있습니다.)`)) {
      return;
    }

    setAnalyzing(true);
    setAnalysisResult(null);

    try {
      const imagePaths = Array.from(selectedImages);
      const result = await api.analyzeImages(imagePaths);
      
      setAnalysisResult(result);
      
      if (result.success > 0) {
        alert(`분석 완료!\n성공: ${result.success}개, 실패: ${result.errors}개`);
        // 선택 초기화
        setSelectedImages(new Set());
      } else {
        alert(`분석 실패: ${result.error_details?.[0]?.error || '알 수 없는 오류'}`);
      }
    } catch (error) {
      console.error('분석 오류:', error);
      alert(`분석 중 오류가 발생했습니다: ${error.response?.data?.detail || error.message}`);
    } finally {
      setAnalyzing(false);
    }
    */
  };

  return (
    <div className="photo-collection-page">
      <div className="photo-collection-header">
        <div className="header-content">
          <h1>📸 사진수집현황</h1>
          <p className="header-subtitle">
            수집된 사진을 배치별로 확인하세요
          </p>
        </div>
        <div className="header-stats">
          <div className="stat-item">
            <span className="stat-label">총 배치</span>
            <span className="stat-value">{batches.length}개</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">총 이미지</span>
            <span className="stat-value">{getTotalImages()}개</span>
          </div>
        </div>
      </div>

      {/* 배치 필터 */}
      <div className="batch-filter">
        <button
          className={`batch-filter-btn ${selectedBatch === 'all' ? 'active' : ''}`}
          onClick={() => {
            setSelectedBatch('all');
            setCurrentPage(0);
          }}
        >
          전체
        </button>
        {batches.map((batch) => (
          <button
            key={batch.name}
            className={`batch-filter-btn ${selectedBatch === batch.name ? 'active' : ''}`}
            onClick={() => {
              setSelectedBatch(batch.name);
              setCurrentPage(0);
            }}
          >
            {batch.name.replace(/batch_/g, 'folder_')} ({batch.image_count})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="collection-loading">
          <div className="loading-spinner"></div>
          <p>이미지를 불러오는 중...</p>
        </div>
      ) : (
        <>
          <div className="images-header">
            <div className="images-header-left">
              <h2 className="images-title">
                {selectedBatch === 'all' ? '전체 이미지' : `${selectedBatch.replace(/batch_/g, 'folder_')} 이미지`}
              </h2>
              <div className="images-count">{filteredImages.length}개</div>
            </div>
            <div className="images-header-right">
              <button
                className="btn-select-all"
                onClick={toggleSelectAll}
              >
                전체 선택
              </button>
              <button
                className={`btn-analyze ${analyzing ? 'analyzing' : ''}`}
                onClick={handleAnalyze}
                disabled={selectedImages.size === 0 || analyzing}
              >
                {analyzing ? '분석 중...' : `GPT 분석 (${selectedImages.size}개)`}
              </button>
            </div>
          </div>

          {analysisResult && (
            <div className={`analysis-result ${analysisResult.errors > 0 ? 'has-errors' : ''}`}>
              <div className="result-summary">
                <span className="result-success">✅ 성공: {analysisResult.success}개</span>
                {analysisResult.errors > 0 && (
                  <span className="result-errors">❌ 실패: {analysisResult.errors}개</span>
                )}
              </div>
              {analysisResult.error_details && analysisResult.error_details.length > 0 && (
                <div className="error-details">
                  {analysisResult.error_details.map((err, idx) => (
                    <div key={idx} className="error-item">
                      <span className="error-file">{err.file_path}</span>: <span className="error-message">{err.error}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="images-grid">
            {paginatedImages.length === 0 ? (
              <div className="no-results">
                <div className="no-results-icon">📷</div>
                <h3>이미지가 없습니다</h3>
              </div>
            ) : (
              paginatedImages.map((image, index) => {
                const isSelected = selectedImages.has(image.file_path);
                return (
                  <div
                    key={image.file_path || index}
                    className={`image-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedImage(image)}
                  >
                    <div className="image-checkbox-wrapper">
                      <input
                        type="checkbox"
                        className="image-checkbox"
                        checked={isSelected}
                        onChange={(e) => toggleImageSelection(image.file_path, e)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="image-thumbnail">
                      <img
                        src={getImageUrl(image.file_path, 'photo_collection')}
                        alt={image.file_path}
                        onError={(e) => {
                          e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200"><rect fill="%23f0f0f0" width="300" height="200"/><text x="50%" y="50%" text-anchor="middle" fill="%23999" dy=".3em">이미지 없음</text></svg>';
                        }}
                      />
                    </div>
                    <div className="image-info">
                      <div className="image-filename">{image.file_path.replace(/batch_/g, 'folder_')}</div>
                      <div className="image-batch">{image.file_path.split('/')[0].replace(/batch_/g, 'folder_')}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="btn-pagination"
                onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                disabled={currentPage === 0}
              >
                이전
              </button>
              <span className="page-info">
                {currentPage + 1} / {totalPages}
              </span>
              <button
                className="btn-pagination"
                onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                disabled={currentPage >= totalPages - 1}
              >
                다음
              </button>
            </div>
          )}
        </>
      )}

      {selectedImage && (
        <ImageModal
          image={selectedImage}
          onClose={() => setSelectedImage(null)}
        />
      )}
    </div>
  );
}

export default PhotoCollection;


