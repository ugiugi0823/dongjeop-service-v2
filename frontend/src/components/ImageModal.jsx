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
      
      // 이미 전달받은 이미지 데이터에 상세 정보가 있으면 바로 사용
      if (image.has_step !== undefined || image.review_result || image.width_class) {
        // 검수완료목록 또는 검수대상목록 데이터인 경우
        let detailData = { ...image };
        
        // 검수 완료 데이터인 경우
        if (image.review_result) {
          detailData.has_step = image.review_result.has_step;
          detailData.width_class = image.review_result.width_class;
          detailData.chair = image.review_result.chair;
          detailData.accessibility = {
            score: image.review_result.score,
            grade: image.review_result.grade
          };
        } else {
          // 검수 대기 데이터이거나 기본 데이터인 경우
          // 접근성 점수 계산
          if (!detailData.accessibility) {
            const score = calculateAccessibilityScore(detailData);
            detailData.accessibility = score;
          }
        }
        
        setDetail(detailData);
        setLoading(false);
        return;
      }
      
      // 기존 방식: API에서 상세 정보 가져오기
      const data = await api.getImageDetail(image.file_path);
      if (data) {
        setDetail(data);
      } else {
        // API에서 찾지 못한 경우 전달받은 데이터 사용
        const score = calculateAccessibilityScore(image);
        setDetail({
          ...image,
          accessibility: score
        });
      }
    } catch (error) {
      console.error('상세 정보 로드 실패:', error);
      // 에러 발생 시 전달받은 이미지 데이터라도 표시
      if (image) {
        const score = calculateAccessibilityScore(image);
        setDetail({
          ...image,
          accessibility: score
        });
      }
    } finally {
      setLoading(false);
    }
  };
  
  // 접근성 점수 계산 함수
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
              <h3>{detail.file_path?.replace(/batch_/g, 'folder_') || '이미지 정보 없음'}</h3>
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
              
              {detail.has_step !== undefined ? (
                <>
                  <div className="info-item">
                    <span className="info-label">단차:</span>
                    <span className={`info-value ${detail.has_step ? 'text-danger' : 'text-success'}`}>
                      {detail.has_step ? '있음 ❌' : '없음 ✅'}
                    </span>
                  </div>

                  <div className="info-item">
                    <span className="info-label">통로 너비:</span>
                    <span className="info-value">
                      {detail.width_class && detail.width_class.length > 0 
                        ? getWidthText(detail.width_class) 
                        : '분석 안됨'}
                    </span>
                  </div>

                  <div className="info-item">
                    <span className="info-label">의자 타입:</span>
                    <span className="info-value">
                      {detail.chair ? getChairTypes(detail.chair) : '분석 안됨'}
                    </span>
                  </div>

                </>
              ) : (
                <>
                  {detail.review_status && (
                    <div className="info-item">
                      <span className="info-label">검수 상태:</span>
                      <span className="info-value">{detail.review_status === 'pending' ? '검수 대기' : '검수 완료'}</span>
                    </div>
                  )}
                  {detail.review_priority && (
                    <div className="info-item">
                      <span className="info-label">우선순위:</span>
                      <span className="info-value">
                        {detail.review_priority === 'high' ? '높음' : 
                         detail.review_priority === 'medium' ? '보통' : '낮음'}
                      </span>
                    </div>
                  )}
                  {detail.review_reason && (
                    <div className="info-item">
                      <span className="info-label">검수 사유:</span>
                      <span className="info-value">{detail.review_reason}</span>
                    </div>
                  )}
                  {detail.batch && (
                    <div className="info-item">
                      <span className="info-label">배치:</span>
                      <span className="info-value">{detail.batch}</span>
                    </div>
                  )}
                </>
              )}

              {detail.recommendations && detail.recommendations.length > 0 && (
                <div className="recommendations">
                  <h4>💡 개선 사항</h4>
                  {detail.recommendations.map((rec, index) => (
                    <div key={index} className={`recommendation-item ${rec.priority}`}>
                      <div className="recommendation-title">{rec.title}</div>
                      <div className="recommendation-desc">{rec.description}</div>
                    </div>
                  ))}
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

