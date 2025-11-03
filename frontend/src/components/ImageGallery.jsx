import { useState, useEffect } from 'react';
import { api, getImageUrl } from '../services/api';
import ImageModal from './ImageModal';
import './ImageGallery.css';

function ImageGallery() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalImages, setTotalImages] = useState(0);
  const [selectedImage, setSelectedImage] = useState(null);
  
  // 필터 상태
  const [filters, setFilters] = useState({
    has_step: '',
    width_class: '',
    chair_type: ''
  });

  const itemsPerPage = 12;

  useEffect(() => {
    loadGallery();
  }, [currentPage, filters]);

  const loadGallery = async () => {
    try {
      setLoading(true);
      const params = {
        skip: currentPage * itemsPerPage,
        limit: itemsPerPage
      };

      if (filters.has_step !== '') {
        params.has_step = filters.has_step === 'true';
      }
      if (filters.width_class !== '') {
        params.width_class = filters.width_class;
      }
      if (filters.chair_type !== '') {
        params.chair_type = filters.chair_type;
      }

      const data = await api.getImages(params);
      setImages(data.items);
      setTotalImages(data.total);
    } catch (error) {
      console.error('갤러리 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
    setCurrentPage(0); // 필터 변경 시 첫 페이지로
  };

  const totalPages = Math.ceil(totalImages / itemsPerPage);

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const getGradeClassName = (grade) => {
    return `grade-${grade}`;
  };

  const getWidthText = (widthClasses) => {
    const map = {
      wide: 'Wide',
      normal: 'Normal',
      narrow: 'Narrow',
      not_passable: '통과불가'
    };
    return widthClasses.map(w => map[w] || w).join(', ');
  };

  const getChairTypes = (chair) => {
    const types = [];
    if (chair.has_movable_chair) types.push('이동형');
    if (chair.has_high_movable_chair) types.push('높이조절');
    if (chair.has_fixed_chair) types.push('고정형');
    if (chair.has_floor_chair) types.push('바닥좌식');
    return types.join(', ') || '없음';
  };

  return (
    <div className="gallery-section">
      <div className="gallery-header">
        <h2>🖼️ 이미지 갤러리</h2>
        
        <div className="filters">
          <select
            value={filters.has_step}
            onChange={(e) => handleFilterChange('has_step', e.target.value)}
            className="filter-select"
          >
            <option value="">전체 (단차)</option>
            <option value="false">단차 없음</option>
            <option value="true">단차 있음</option>
          </select>

          <select
            value={filters.width_class}
            onChange={(e) => handleFilterChange('width_class', e.target.value)}
            className="filter-select"
          >
            <option value="">전체 (통로)</option>
            <option value="wide">Wide (넓음)</option>
            <option value="normal">Normal (보통)</option>
            <option value="narrow">Narrow (좁음)</option>
            <option value="not_passable">통과 불가</option>
          </select>

          <select
            value={filters.chair_type}
            onChange={(e) => handleFilterChange('chair_type', e.target.value)}
            className="filter-select"
          >
            <option value="">전체 (의자)</option>
            <option value="movable">이동형 의자</option>
            <option value="high_movable">높이조절 의자</option>
            <option value="fixed">고정형 의자</option>
            <option value="floor">바닥좌식</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="gallery-loading">
          <div className="loading-spinner"></div>
          <p>이미지를 불러오는 중...</p>
        </div>
      ) : (
        <>
          <div className="gallery-grid">
            {images.length === 0 ? (
              <p className="no-results">검색 결과가 없습니다.</p>
            ) : (
              images.map((item) => (
                <div
                  key={item.file_path}
                  className="gallery-item"
                  onClick={() => setSelectedImage(item)}
                >
                  <div className="gallery-image">
                    <img
                      src={getImageUrl(item.file_path)}
                      alt={item.file_path}
                      onError={(e) => {
                        e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150"><rect fill="%23f0f0f0" width="200" height="150"/><text x="50%" y="50%" text-anchor="middle" fill="%23999" dy=".3em">이미지 없음</text></svg>';
                      }}
                    />
                  </div>
                  
                  <div className="gallery-item-header">{item.file_path.replace(/batch_/g, 'folder_')}</div>
                  
                  <div className="gallery-item-info">
                    <div>단차: {item.has_step ? '있음 ❌' : '없음 ✅'}</div>
                    <div>통로: {getWidthText(item.width_class)}</div>
                    <div>의자: {getChairTypes(item.chair)}</div>
                  </div>

                </div>
              ))
            )}
          </div>

          {totalImages > 0 && (
            <div className="pagination">
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 0}
                className="btn-secondary"
              >
                이전
              </button>
              <span className="page-info">
                {currentPage + 1} / {totalPages || 1}
              </span>
              <button
                onClick={handleNextPage}
                disabled={currentPage >= totalPages - 1}
                className="btn-secondary"
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

export default ImageGallery;

