import { useState, useEffect } from 'react';
import { api, getImageUrl } from '../services/api';
import './ImageModal.css';

function ImageModal({ image, onClose }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDetail();
  }, [image]);

  const loadDetail = async () => {
    try {
      setLoading(true);
      const data = await api.getImageDetail(image.file_path);
      setDetail(data);
    } catch (error) {
      console.error('상세 정보 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const getWidthText = (widthClasses) => {
    const map = {
      wide: 'Wide (넓음)',
      normal: 'Normal (보통)',
      narrow: 'Narrow (좁음)',
      not_passable: '통과 불가'
    };
    return widthClasses.map(w => map[w] || w).join(', ');
  };

  const getChairTypes = (chair) => {
    const types = [];
    if (chair.has_movable_chair) types.push('이동형');
    if (chair.has_high_movable_chair) types.push('높이 조절');
    if (chair.has_fixed_chair) types.push('고정형');
    if (chair.has_floor_chair) types.push('바닥 좌식');
    return types.join(', ') || '없음';
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal" onClick={handleBackdropClick}>
      <div className="modal-content">
        <span className="modal-close" onClick={onClose}>&times;</span>
        
        {loading ? (
          <div className="modal-loading">
            <div className="loading-spinner"></div>
            <p>상세 정보를 불러오는 중...</p>
          </div>
        ) : detail ? (
          <div className="modal-body">
            <div className="modal-image-section">
              <h3>{detail.file_path}</h3>
              <div className="modal-image">
                <img
                  src={getImageUrl(detail.file_path)}
                  alt={detail.file_path}
                  onError={(e) => {
                    e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect fill="%23f0f0f0" width="400" height="300"/><text x="50%" y="50%" text-anchor="middle" fill="%23999" dy=".3em" font-size="20">이미지 없음</text></svg>';
                  }}
                />
              </div>
            </div>

            <div className="modal-info-section">
              <h3>접근성 정보</h3>
              
              <div className="info-item">
                <span className="info-label">단차:</span>
                <span className={`info-value ${detail.has_step ? 'text-danger' : 'text-success'}`}>
                  {detail.has_step ? '있음 ❌' : '없음 ✅'}
                </span>
              </div>

              <div className="info-item">
                <span className="info-label">통로 너비:</span>
                <span className="info-value">{getWidthText(detail.width_class)}</span>
              </div>

              <div className="info-item">
                <span className="info-label">의자 타입:</span>
                <span className="info-value">{getChairTypes(detail.chair)}</span>
              </div>

              <div className="score-box">
                <div className="score-label">접근성 점수</div>
                <div className="score-value">{detail.accessibility.score}점</div>
                <div className="score-grade">{detail.accessibility.grade} 등급</div>
              </div>

              {detail.recommendations && detail.recommendations.length > 0 ? (
                <div className="recommendations">
                  <h4>💡 개선 사항</h4>
                  {detail.recommendations.map((rec, index) => (
                    <div key={index} className={`recommendation-item ${rec.priority}`}>
                      <div className="recommendation-title">{rec.title}</div>
                      <div className="recommendation-desc">{rec.description}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="recommendations">
                  <p className="excellent-message">✅ 접근성이 우수합니다!</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <p>데이터를 불러올 수 없습니다.</p>
        )}
      </div>
    </div>
  );
}

export default ImageModal;

