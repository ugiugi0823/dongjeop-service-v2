import { useState, useEffect } from 'react';
import { api, getImageUrl } from '../services/api';
import ImageModal from '../components/ImageModal';
import './Gallery.css';

function Gallery() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalImages, setTotalImages] = useState(0);
  const [selectedImage, setSelectedImage] = useState(null);
  
  // 필터 상태
  const [filters, setFilters] = useState({
    has_step: '',
    width_class: '',
    chair_type: '',
    needs_relabeling: '',
    score: '' // 신뢰도 점수 필터 추가
  });

  const itemsPerPage = 12;

  useEffect(() => {
    // 초기 로드 시에만 자동 실행
    const hasFilters = Object.values(filters).some(v => v !== '');
    if (!hasFilters && currentPage === 0) {
      loadGallery();
    }
  }, []); // 초기 마운트 시에만 실행
  
  // 페이지네이션은 loadGallery를 직접 호출하므로 useEffect 불필요

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
      if (filters.needs_relabeling !== '') {
        params.needs_relabeling = filters.needs_relabeling === 'true';
      }
      if (filters.score !== '') {
        params.min_score = parseInt(filters.score);
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
    // 필터 변경 시 첫 페이지로 이동하지만 자동 조회는 하지 않음
    // "조회하기" 버튼 클릭 시 조회
  };
  
  const handleQuery = () => {
    setCurrentPage(0);
    loadGallery();
  };

  const totalPages = Math.ceil(totalImages / itemsPerPage);

  const handlePrevPage = () => {
    if (currentPage > 0) {
      const newPage = currentPage - 1;
      setCurrentPage(newPage);
      // 페이지 변경 시 현재 필터로 조회
      loadGalleryWithPage(newPage);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      const newPage = currentPage + 1;
      setCurrentPage(newPage);
      // 페이지 변경 시 현재 필터로 조회
      loadGalleryWithPage(newPage);
    }
  };
  
  const loadGalleryWithPage = async (page) => {
    try {
      setLoading(true);
      const params = {
        skip: page * itemsPerPage,
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
      if (filters.needs_relabeling !== '') {
        params.needs_relabeling = filters.needs_relabeling === 'true';
      }
      if (filters.score !== '') {
        params.min_score = parseInt(filters.score);
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
    <div className="gallery-page">
      <div className="gallery-header">
        <div className="header-content">
          <h1>🖼️ 실내사진목록</h1>
          <p className="header-subtitle">
            매장 이미지를 필터링하여 검색하고 상세 정보를 확인하세요
          </p>
        </div>
        <div className="header-stats">
          <div className="stat-item">
            <span className="stat-label">총 이미지</span>
            <span className="stat-value">{totalImages}개</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">현재 페이지</span>
            <span className="stat-value">{currentPage + 1}/{totalPages || 1}</span>
          </div>
        </div>
      </div>

      <div className="gallery-filters">
        <div className="filter-section">
          <label className="filter-label">신뢰도</label>
          <div className="filter-button-group">
            <button
              className={`filter-button ${filters.score === '90' ? 'active' : ''}`}
              onClick={() => handleFilterChange('score', filters.score === '90' ? '' : '90')}
            >
              90점 이상
            </button>
            <button
              className={`filter-button ${filters.score === '75' ? 'active' : ''}`}
              onClick={() => handleFilterChange('score', filters.score === '75' ? '' : '75')}
            >
              75점 이상
            </button>
            <button
              className={`filter-button ${filters.score === '50' ? 'active' : ''}`}
              onClick={() => handleFilterChange('score', filters.score === '50' ? '' : '50')}
            >
              50점 이상
            </button>
            <button
              className={`filter-button ${filters.score === '25' ? 'active' : ''}`}
              onClick={() => handleFilterChange('score', filters.score === '25' ? '' : '25')}
            >
              25점 미만
            </button>
          </div>
        </div>

        <div className="filter-section">
          <label className="filter-label">계단/턱</label>
          <div className="filter-button-group">
            <button
              className={`filter-button ${filters.has_step === '' ? 'active' : ''}`}
              onClick={() => handleFilterChange('has_step', '')}
            >
              전체
            </button>
            <button
              className={`filter-button ${filters.has_step === 'true' ? 'active' : ''}`}
              onClick={() => handleFilterChange('has_step', filters.has_step === 'true' ? '' : 'true')}
            >
              있음
            </button>
            <button
              className={`filter-button ${filters.has_step === 'false' ? 'active' : ''}`}
              onClick={() => handleFilterChange('has_step', filters.has_step === 'false' ? '' : 'false')}
            >
              없음
            </button>
          </div>
        </div>

        <div className="filter-section">
          <label className="filter-label">의자유형</label>
          <div className="filter-button-group">
            <button
              className={`filter-button ${filters.chair_type === '' ? 'active' : ''}`}
              onClick={() => handleFilterChange('chair_type', '')}
            >
              전체
            </button>
            <button
              className={`filter-button ${filters.chair_type === 'movable' ? 'active' : ''}`}
              onClick={() => handleFilterChange('chair_type', filters.chair_type === 'movable' ? '' : 'movable')}
            >
              낮은 이동형
            </button>
            <button
              className={`filter-button ${filters.chair_type === 'high_movable' ? 'active' : ''}`}
              onClick={() => handleFilterChange('chair_type', filters.chair_type === 'high_movable' ? '' : 'high_movable')}
            >
              높은 이동형
            </button>
            <button
              className={`filter-button ${filters.chair_type === 'fixed' ? 'active' : ''}`}
              onClick={() => handleFilterChange('chair_type', filters.chair_type === 'fixed' ? '' : 'fixed')}
            >
              고정형
            </button>
            <button
              className={`filter-button ${filters.chair_type === 'floor' ? 'active' : ''}`}
              onClick={() => handleFilterChange('chair_type', filters.chair_type === 'floor' ? '' : 'floor')}
            >
              좌식형
            </button>
          </div>
        </div>

        <div className="filter-section">
          <label className="filter-label">통로</label>
          <div className="filter-button-group">
            <button
              className={`filter-button ${filters.width_class === '' ? 'active' : ''}`}
              onClick={() => handleFilterChange('width_class', '')}
            >
              전체
            </button>
            <button
              className={`filter-button ${filters.width_class === 'wide' ? 'active' : ''}`}
              onClick={() => handleFilterChange('width_class', filters.width_class === 'wide' ? '' : 'wide')}
            >
              넓음
            </button>
            <button
              className={`filter-button ${filters.width_class === 'normal' ? 'active' : ''}`}
              onClick={() => handleFilterChange('width_class', filters.width_class === 'normal' ? '' : 'normal')}
            >
              보통
            </button>
            <button
              className={`filter-button ${filters.width_class === 'narrow' ? 'active' : ''}`}
              onClick={() => handleFilterChange('width_class', filters.width_class === 'narrow' ? '' : 'narrow')}
            >
              좁음
            </button>
            <button
              className={`filter-button ${filters.width_class === 'not_passable' ? 'active' : ''}`}
              onClick={() => handleFilterChange('width_class', filters.width_class === 'not_passable' ? '' : 'not_passable')}
            >
              통과 불가
            </button>
          </div>
        </div>

        <div className="filter-actions">
          <button
            onClick={handleQuery}
            className="btn-query"
          >
            조회하기
          </button>
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
              <div className="no-results">
                <div className="no-results-icon">🔍</div>
                <h3>검색 결과가 없습니다</h3>
                <p>다른 필터 조건을 시도해보세요</p>
              </div>
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
                  
                  <div className="gallery-item-header">{item.file_path}</div>
                  
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
                className="btn-pagination"
              >
                이전
              </button>
              <span className="page-info">
                {currentPage + 1} / {totalPages || 1}
              </span>
              <button
                onClick={handleNextPage}
                disabled={currentPage >= totalPages - 1}
                className="btn-pagination"
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

export default Gallery;
