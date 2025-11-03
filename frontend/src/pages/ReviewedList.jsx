import { useState, useEffect } from 'react';
import { api, getImageUrl } from '../services/api';
import ImageModal from '../components/ImageModal';
import './ReviewedList.css';
import './Gallery.css'; // Gallery 스타일 사용 (버튼 그룹)

function ReviewedList() {
  const [reviewedItems, setReviewedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('all');
  const [reviewerFilter, setReviewerFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    loadReviewedList();
  }, [dateRange, reviewerFilter, statusFilter, searchQuery]);

  const loadReviewedList = async () => {
    try {
      setLoading(true);
      const data = await api.getReviewedList({
        date_range: dateRange !== 'all' ? dateRange : undefined,
        reviewer: reviewerFilter !== 'all' ? reviewerFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: searchQuery || undefined
      });
      setReviewedItems(data.items || []);
      setTotalItems(data.total || 0);
    } catch (error) {
      console.error('검수 완료 목록 로드 실패:', error);
      setReviewedItems([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  };

  const handleReReview = async (filePath) => {
    if (confirm('이 이미지를 다시 검수 대상으로 등록하시겠습니까?')) {
      try {
        await api.markAsNeedsReview([filePath]);
        alert('검수 대상으로 등록되었습니다.');
      } catch (error) {
        console.error('재검수 등록 실패:', error);
        alert('재검수 등록에 실패했습니다.');
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getGradeColor = (grade) => {
    switch (grade) {
      case 'S': return '#10b981';
      case 'A': return '#3b82f6';
      case 'B': return '#f59e0b';
      case 'C': return '#ef4444';
      case 'D': return '#6b7280';
      default: return '#9ca3af';
    }
  };

  return (
    <div className="reviewed-list-page">
      <div className="reviewed-list-header">
        <div className="header-content">
          <h1>✅ 검수완료목록</h1>
          <p className="header-subtitle">
            검수가 완료된 이미지 목록 및 검수 이력
          </p>
        </div>
        <div className="header-stats">
          <div className="stat-item">
            <span className="stat-label">검수 완료</span>
            <span className="stat-value">{totalItems}개</span>
          </div>
        </div>
      </div>

      <div className="gallery-filters">
        <div className="filter-section">
          <label className="filter-label">기간</label>
          <div className="filter-button-group">
            <button
              className={`filter-button ${dateRange === 'all' ? 'active' : ''}`}
              onClick={() => setDateRange('all')}
            >
              전체
            </button>
            <button
              className={`filter-button ${dateRange === '7days' ? 'active' : ''}`}
              onClick={() => setDateRange('7days')}
            >
              최근 7일
            </button>
            <button
              className={`filter-button ${dateRange === '30days' ? 'active' : ''}`}
              onClick={() => setDateRange('30days')}
            >
              최근 30일
            </button>
            <button
              className={`filter-button ${dateRange === '90days' ? 'active' : ''}`}
              onClick={() => setDateRange('90days')}
            >
              최근 90일
            </button>
          </div>
        </div>

        <div className="filter-section">
          <label className="filter-label">검수자</label>
          <div className="filter-button-group">
            <button
              className={`filter-button ${reviewerFilter === 'all' ? 'active' : ''}`}
              onClick={() => setReviewerFilter('all')}
            >
              전체
            </button>
            <button
              className={`filter-button ${reviewerFilter === 'admin' ? 'active' : ''}`}
              onClick={() => setReviewerFilter('admin')}
            >
              관리자
            </button>
            <button
              className={`filter-button ${reviewerFilter === 'reviewer1' ? 'active' : ''}`}
              onClick={() => setReviewerFilter('reviewer1')}
            >
              검수자1
            </button>
            <button
              className={`filter-button ${reviewerFilter === 'reviewer2' ? 'active' : ''}`}
              onClick={() => setReviewerFilter('reviewer2')}
            >
              검수자2
            </button>
          </div>
        </div>

        <div className="filter-section">
          <label className="filter-label">상태</label>
          <div className="filter-button-group">
            <button
              className={`filter-button ${statusFilter === 'all' ? 'active' : ''}`}
              onClick={() => setStatusFilter('all')}
            >
              전체
            </button>
            <button
              className={`filter-button ${statusFilter === '정상' ? 'active' : ''}`}
              onClick={() => setStatusFilter('정상')}
            >
              정상
            </button>
            <button
              className={`filter-button ${statusFilter === '보류' ? 'active' : ''}`}
              onClick={() => setStatusFilter('보류')}
            >
              보류
            </button>
            <button
              className={`filter-button ${statusFilter === '폐기' ? 'active' : ''}`}
              onClick={() => setStatusFilter('폐기')}
            >
              폐기
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

      {loading ? (
        <div className="review-loading">
          <div className="loading-spinner"></div>
          <p>검수 완료 목록을 불러오는 중...</p>
        </div>
      ) : (
        <>
          {reviewedItems.length === 0 ? (
            <div className="no-results">
              <div className="no-results-icon">📋</div>
              <h3>검수 완료 항목이 없습니다</h3>
              <p>검수 완료된 이미지가 없습니다</p>
            </div>
          ) : (
            <div className="reviewed-list-grid">
              {reviewedItems.map((item) => {
                // 검수대상목록 이미지인지 확인 (review_reason 필드가 있거나 batch 필드가 있는 경우)
                const isQueueImage = item.review_reason || item.batch;
                const imageUrl = isQueueImage 
                  ? getImageUrl(item.file_path, 'review_queue')
                  : getImageUrl(item.file_path);
                
                return (
                <div key={item.file_path} className="reviewed-item-card">
                  <div 
                    className="reviewed-item-image"
                    onClick={() => setSelectedImage(item)}
                  >
                    <img
                      src={imageUrl}
                      alt={item.file_path}
                      onError={(e) => {
                        e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200"><rect fill="%23f0f0f0" width="300" height="200"/><text x="50%" y="50%" text-anchor="middle" fill="%23999" dy=".3em">이미지 없음</text></svg>';
                      }}
                    />
                  </div>
                  <div className="reviewed-item-content">
                    <div className="reviewed-item-filename">{item.file_path.replace(/batch_/g, 'folder_')}</div>
                    <div className="reviewed-item-meta">
                      <div className="meta-row">
                        <span className="meta-label">검수자:</span>
                        <span className="meta-value">{item.reviewed_by || '미지정'}</span>
                      </div>
                      <div className="meta-row">
                        <span className="meta-label">검수일시:</span>
                        <span className="meta-value">{formatDate(item.reviewed_at)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="reviewed-item-actions">
                    <button
                      onClick={() => setSelectedImage(item)}
                      className="btn-detail"
                    >
                      상세보기
                    </button>
                    <button
                      onClick={() => handleReReview(item.file_path)}
                      className="btn-rereview"
                    >
                      재검수
                    </button>
                  </div>
                </div>
                );
              })}
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

export default ReviewedList;

