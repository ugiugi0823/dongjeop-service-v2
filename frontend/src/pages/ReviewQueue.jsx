import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, getImageUrl } from '../services/api';
import ImageModal from '../components/ImageModal';
import './ReviewQueue.css';
import './Gallery.css'; // Gallery 스타일 사용

function ReviewQueue() {
  const navigate = useNavigate();
  const [reviewItems, setReviewItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [totalItems, setTotalItems] = useState(0);
  const searchTimeoutRef = useRef(null);
  
  // 필터 상태 (실내사진목록과 동일)
  const [filters, setFilters] = useState({
    has_step: '',
    width_class: '',
    chair_type: '',
    score: ''
  });

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
  };

  const loadReviewQueue = async (applyFilters = true) => {
    try {
      setLoading(true);
      const params = {
        search: undefined // 검색은 클라이언트 사이드에서 처리
      };
      
      console.log('Loading review queue with params:', params);
      const data = await api.getReviewQueue(params);
      console.log('Review queue data:', data);
      let items = data.items || [];
      console.log('Review queue items count before filtering:', items.length);
      
      // 필터 적용 여부 확인
      if (!applyFilters) {
        setReviewItems(items);
        setTotalItems(items.length);
        setLoading(false);
        return;
      }
      
      // 클라이언트 사이드 필터링 적용
      console.log('Applying filters:', filters);
      console.log('Search query:', searchQuery);
      
      // 참고: 검수대상목록은 분석 정보가 없을 수 있으므로, 
      // 데이터에 정보가 있는 경우에만 필터링
      items = items.filter(item => {
        // 검색어 필터
        if (searchQuery && searchQuery.trim() !== '') {
          const searchLower = searchQuery.toLowerCase();
          if (!item.file_path.toLowerCase().includes(searchLower)) {
            return false;
          }
        }
        
        // 계단/턱 필터
        if (filters.has_step !== '') {
          if (item.has_step === undefined) return false;
          const filterValue = filters.has_step === 'true';
          if (item.has_step !== filterValue) {
            return false;
          }
        }
        
        // 통로 필터
        if (filters.width_class !== '') {
          if (!item.width_class || !Array.isArray(item.width_class)) return false;
          if (!item.width_class.includes(filters.width_class)) {
            return false;
          }
        }
        
        // 의자 타입 필터
        if (filters.chair_type !== '') {
          if (!item.chair) return false;
          const chairTypeMap = {
            'movable': 'has_movable_chair',
            'high_movable': 'has_high_movable_chair',
            'fixed': 'has_fixed_chair',
            'floor': 'has_floor_chair'
          };
          const chairKey = chairTypeMap[filters.chair_type];
          if (!chairKey || !item.chair[chairKey]) {
            return false;
          }
        }
        
        // 신뢰도 필터 (모델 신뢰도 기준)
        if (filters.score !== '') {
          // confidence가 있으면 사용, 없으면 접근성 점수로 추정
          let confidence = item.confidence;
          
          if (confidence === undefined || confidence === null) {
            // confidence가 없으면 접근성 점수로 추정
            let score = 100;
            if (item.has_step) score -= 30;
            if (item.width_class) {
              if (item.width_class.includes('not_passable')) score -= 40;
              else if (item.width_class.includes('narrow')) score -= 20;
              else if (item.width_class.includes('normal')) score -= 10;
            }
            if (item.chair && !item.chair.has_movable_chair) score -= 10;
            // 접근성 점수를 신뢰도로 변환 (100점 = 1.0, 50점 = 0.5)
            confidence = score / 100;
          }
          
          // 신뢰도를 백분율로 변환 (0.9 -> 90)
          const confidencePercent = confidence * 100;
          const minScore = parseInt(filters.score);
          
          if (minScore === 90 && confidencePercent < 90) return false;
          if (minScore === 75 && confidencePercent < 75) return false;
          if (minScore === 50 && confidencePercent < 50) return false;
          if (minScore === 25 && confidencePercent >= 25) return false; // 25% 미만: 25 이상이면 제외
        }
        
        return true;
      });
      
      console.log('Filtered items count:', items.length);
      
      setReviewItems(items);
      setTotalItems(items.length);
    } catch (error) {
      console.error('검수 대기 목록 로드 실패:', error);
      setReviewItems([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  };

  // 초기 로드
  useEffect(() => {
    loadReviewQueue();
  }, []);

  // 필터 변경 시 자동 필터링
  useEffect(() => {
    loadReviewQueue();
  }, [filters]);

  // 검색어 변경 시 debounce 적용하여 필터링
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      loadReviewQueue();
    }, 300);
    
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const handleSelectItem = (filePath) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(filePath)) {
        newSet.delete(filePath);
      } else {
        newSet.add(filePath);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedItems.size === reviewItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(reviewItems.map(item => item.file_path)));
    }
  };

  const handleHumanReview = () => {
    if (selectedItems.size === 0) {
      alert('검수할 이미지를 선택해주세요.');
      return;
    }
    
    // 선택된 이미지들을 URL 파라미터로 전달하여 사람 검수 페이지로 이동
    const selectedPaths = Array.from(selectedItems);
    const imageParams = selectedPaths.map(path => encodeURIComponent(path)).join(',');
    navigate(`/review/human?images=${imageParams}`);
  };

  const handleComplete = async (filePath) => {
    try {
      await api.completeReview([filePath]);
      loadReviewQueue();
    } catch (error) {
      console.error('검수 완료 처리 실패:', error);
      alert('검수 완료 처리에 실패했습니다.');
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#9ca3af';
      default: return '#6b7280';
    }
  };

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 'high': return '높음';
      case 'medium': return '보통';
      case 'low': return '낮음';
      default: return '미지정';
    }
  };

  return (
    <div className="gallery-page review-queue-page">
      <div className="gallery-header">
        <div className="header-content">
          <h1>📋 검수대상목록</h1>
          <p className="header-subtitle">
            AI 분석 결과 재검토가 필요한 이미지 목록
          </p>
        </div>
        <div className="header-stats">
          <div className="stat-item">
            <span className="stat-label">검수 대기</span>
            <span className="stat-value">{totalItems}개</span>
          </div>
          {selectedItems.size > 0 && (
            <div className="stat-item">
              <span className="stat-label">선택됨</span>
              <span className="stat-value">{selectedItems.size}개</span>
            </div>
          )}
        </div>
      </div>

      <div className="gallery-filters">
        <div className="filter-section">
          <label className="filter-label">모델 신뢰도</label>
          <div className="filter-button-group">
            <button
              className={`filter-button ${filters.score === '90' ? 'active' : ''}`}
              onClick={() => handleFilterChange('score', filters.score === '90' ? '' : '90')}
            >
              90% 이상
            </button>
            <button
              className={`filter-button ${filters.score === '75' ? 'active' : ''}`}
              onClick={() => handleFilterChange('score', filters.score === '75' ? '' : '75')}
            >
              75% 이상
            </button>
            <button
              className={`filter-button ${filters.score === '50' ? 'active' : ''}`}
              onClick={() => handleFilterChange('score', filters.score === '50' ? '' : '50')}
            >
              50% 이상
            </button>
            <button
              className={`filter-button ${filters.score === '25' ? 'active' : ''}`}
              onClick={() => handleFilterChange('score', filters.score === '25' ? '' : '25')}
            >
              25% 미만
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

        <div className="filter-section">
          <label className="filter-label">검색</label>
          <input
            type="text"
            placeholder="파일명으로 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="filter-input"
            style={{
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              width: '200px'
            }}
          />
        </div>
      </div>

      {selectedItems.size > 0 && (
        <div className="bulk-action-bar">
          <div className="bulk-info">
            <input
              type="checkbox"
              checked={selectedItems.size === reviewItems.length && reviewItems.length > 0}
              onChange={handleSelectAll}
              style={{ marginRight: '8px' }}
            />
            <span>{selectedItems.size}개 항목 선택됨</span>
          </div>
          <div className="bulk-actions">
            <button
              onClick={handleSelectAll}
              className="btn-bulk-select-all"
              style={{
                marginRight: '8px',
                padding: '8px 16px',
                background: '#f3f4f6',
                color: '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              전체 선택
            </button>
            <button
              onClick={handleHumanReview}
              className="btn-bulk-complete"
            >
              사람 검수
            </button>
            <button
              onClick={() => setSelectedItems(new Set())}
              className="btn-bulk-cancel"
            >
              선택 해제
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="gallery-loading">
          <div className="loading-spinner"></div>
          <p>검수 대기 목록을 불러오는 중...</p>
        </div>
      ) : (
        <>
          {reviewItems.length === 0 ? (
            <div className="no-results">
              <div className="no-results-icon">✅</div>
              <h3>검수 대기 항목이 없습니다</h3>
              <p>모든 이미지가 검수 완료되었습니다</p>
            </div>
          ) : (
            <div className="gallery-grid">
              {reviewItems.map((item) => (
                <div key={item.file_path} className="gallery-item">
                  <div className="gallery-item-header">
                    <label className="review-checkbox-label">
                      <input
                        type="checkbox"
                        checked={selectedItems.has(item.file_path)}
                        onChange={() => handleSelectItem(item.file_path)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </label>
                    {item.confidence !== undefined && (
                      <span className="confidence-badge" style={{ 
                        backgroundColor: item.confidence >= 0.9 ? '#10b981' : item.confidence >= 0.75 ? '#f59e0b' : '#ef4444',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        color: 'white',
                        fontSize: '11px',
                        fontWeight: '600'
                      }}>
                        신뢰도 {(item.confidence * 100).toFixed(0)}%
                      </span>
                    )}
                  </div>
                  <div 
                    className="gallery-image"
                    onClick={() => setSelectedImage(item)}
                  >
                    <img
                      src={getImageUrl(item.file_path, item.from_gpt ? 'review_queue' : (item.from_gt ? 'gt' : 'default'))}
                      alt={item.file_path}
                      onError={(e) => {
                        e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200"><rect fill="%23f0f0f0" width="300" height="200"/><text x="50%" y="50%" text-anchor="middle" fill="%23999" dy=".3em">이미지 없음</text></svg>';
                      }}
                    />
                  </div>
                  <div className="gallery-item-info">
                    <div style={{ marginBottom: '4px', fontSize: '12px', color: '#64748b' }}>
                      {item.file_path.replace(/batch_/g, 'folder_')}
                    </div>
                    {item.review_reason && (
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                        사유: {item.review_reason}
                      </div>
                    )}
                  </div>
                  <div className="gallery-item-score" style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '12px 16px'
                  }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleComplete(item.file_path);
                      }}
                      className="btn-complete"
                      style={{
                        padding: '6px 12px',
                        background: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        fontWeight: '500'
                      }}
                    >
                      검수 완료
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedImage(item);
                      }}
                      className="btn-detail"
                      style={{
                        padding: '6px 12px',
                        background: '#f3f4f6',
                        color: '#374151',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        fontWeight: '500'
                      }}
                    >
                      상세보기
                    </button>
                  </div>
                </div>
              ))}
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

export default ReviewQueue;

