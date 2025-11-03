import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api, getImageUrl } from '../services/api';
import './HumanReview.css';

function HumanReview() {
  const location = useLocation();
  const navigate = useNavigate();
  const [images, setImages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // 검수 폼 상태
  const [formData, setFormData] = useState({
    image_url: '',
    category: '전체',
    has_step: '없음',
    chair_type: '',
    width_class: '보통',
    status: '정상'
  });

  useEffect(() => {
    // URL 파라미터에서 선택된 이미지들 가져오기
    const params = new URLSearchParams(location.search);
    const imagesParam = params.get('images');
    if (!imagesParam) {
      // 선택된 이미지가 없으면 검수대상목록으로 리다이렉트
      navigate('/review/queue');
      return;
    }
    
    const selectedPaths = imagesParam.split(',').map(path => decodeURIComponent(path));
    
    if (selectedPaths.length === 0) {
      navigate('/review/queue');
      return;
    }
    
    // 이미지 정보 로드
    loadImages(selectedPaths);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  const loadImages = async (filePaths) => {
    try {
      setLoading(true);
      const items = [];
      
      for (const filePath of filePaths) {
        try {
          const detail = await api.getImageDetail(filePath);
          if (detail) {
            items.push({
              file_path: filePath,
              ...detail
            });
          } else {
            // 상세 정보가 없어도 기본 정보로 추가
            items.push({
              file_path: filePath,
              has_step: false,
              width_class: ['normal'],
              chair: { has_movable_chair: true }
            });
          }
        } catch (error) {
          console.error(`Failed to load ${filePath}:`, error);
          // 에러가 있어도 기본 정보로 추가
          items.push({
            file_path: filePath,
            has_step: false,
            width_class: ['normal'],
            chair: { has_movable_chair: true }
          });
        }
      }
      
      setImages(items);
      
      // 첫 번째 이미지의 기존 데이터로 폼 초기화
      if (items.length > 0) {
        initializeForm(items[0]);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('이미지 로드 실패:', error);
      setLoading(false);
    }
  };

  const initializeForm = (image) => {
    setFormData({
      image_url: image.image_url || '',
      category: image.category || '전체',
      has_step: image.has_step ? '있음' : '없음',
      chair_type: getChairType(image.chair) || '',
      width_class: getWidthClass(image.width_class) || '보통',
      status: image.status || '정상'
    });
  };

  const getChairType = (chair) => {
    if (!chair) return '';
    if (chair.has_floor_chair) return '좌식형';
    if (chair.has_fixed_chair) return '고정형';
    if (chair.has_high_movable_chair) return '높은 이동형';
    if (chair.has_movable_chair) return '낮은 이동형';
    return '';
  };

  const getWidthClass = (widthClass) => {
    if (!widthClass || !Array.isArray(widthClass)) return '보통';
    if (widthClass.includes('not_passable')) return '통과 불가';
    if (widthClass.includes('narrow')) return '좁음';
    if (widthClass.includes('wide')) return '넓음';
    return '보통';
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (images.length === 0) return;
    
    try {
      const currentImage = images[currentIndex];
      const reviewData = {
        file_path: currentImage.file_path,
        image_url: formData.image_url,
        category: formData.category,
        has_step: formData.has_step === '있음',
        width_class: getWidthClassArray(formData.width_class),
        chair: getChairObject(formData.chair_type),
        status: formData.status,
        reviewed_at: new Date().toISOString(),
        reviewed_by: 'admin' // 실제로는 로그인한 사용자 정보 사용
      };

      // API 호출하여 검수 결과 저장
      await api.completeReview([currentImage.file_path], reviewData);
      
      // 다음 이미지로 이동 또는 완료
      if (currentIndex < images.length - 1) {
        const nextIndex = currentIndex + 1;
        setCurrentIndex(nextIndex);
        initializeForm(images[nextIndex]);
      } else {
        // 모든 이미지 검수 완료
        alert('모든 이미지 검수가 완료되었습니다.');
        navigate('/review/queue');
      }
    } catch (error) {
      console.error('검수 결과 저장 실패:', error);
      alert('검수 결과 저장에 실패했습니다.');
    }
  };

  const getWidthClassArray = (widthClass) => {
    switch (widthClass) {
      case '넓음': return ['wide'];
      case '좁음': return ['narrow'];
      case '통과 불가': return ['not_passable'];
      default: return ['normal'];
    }
  };

  const getChairObject = (chairType) => {
    const chair = {
      has_movable_chair: false,
      has_high_movable_chair: false,
      has_fixed_chair: false,
      has_floor_chair: false
    };
    
    switch (chairType) {
      case '낮은 이동형':
        chair.has_movable_chair = true;
        break;
      case '높은 이동형':
        chair.has_high_movable_chair = true;
        break;
      case '고정형':
        chair.has_fixed_chair = true;
        break;
      case '좌식형':
        chair.has_floor_chair = true;
        break;
    }
    
    return chair;
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      setCurrentIndex(prevIndex);
      initializeForm(images[prevIndex]);
    }
  };

  const handleNext = () => {
    if (currentIndex < images.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      initializeForm(images[nextIndex]);
    }
  };

  const handleClose = () => {
    navigate('/review/queue');
  };

  if (loading) {
    return (
      <div className="human-review-loading">
        <div className="loading-spinner"></div>
        <p>이미지를 불러오는 중...</p>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="human-review-empty">
        <p>검수할 이미지가 없습니다.</p>
        <button onClick={handleClose} className="btn-close">닫기</button>
      </div>
    );
  }

  const currentImage = images[currentIndex];

  return (
    <div className="human-review-container">
      <div className="human-review-modal">
        <div className="human-review-header">
          <h2>실내 사진 검수하기 ({currentIndex + 1}/{images.length})</h2>
          <button onClick={handleClose} className="btn-close-modal">×</button>
        </div>

        <div className="human-review-content">
          <div className="human-review-image-container">
            <button
              onClick={handlePrev}
              className="nav-button nav-button-prev"
              disabled={currentIndex === 0}
            >
              ←
            </button>
            <div className="human-review-image-wrapper">
              <img
                src={getImageUrl(currentImage.file_path, currentImage.from_gpt ? 'review_queue' : 'default')}
                alt={currentImage.file_path}
                onError={(e) => {
                  e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect fill="%23f0f0f0" width="800" height="600"/><text x="50%" y="50%" text-anchor="middle" fill="%23999" dy=".3em">이미지 없음</text></svg>';
                }}
              />
            </div>
            <button
              onClick={handleNext}
              className="nav-button nav-button-next"
              disabled={currentIndex === images.length - 1}
            >
              →
            </button>
          </div>

          <div className="human-review-form">
            <div className="form-group">
              <label>이미지 URL</label>
              <input
                type="text"
                value={formData.image_url}
                onChange={(e) => handleFormChange('image_url', e.target.value)}
                placeholder="www.naver.com/1231213/1231431"
              />
            </div>

            <div className="form-group">
              <label>카테고리</label>
              <select
                value={formData.category}
                onChange={(e) => handleFormChange('category', e.target.value)}
              >
                <option value="전체">전체</option>
                <option value="카페">카페</option>
                <option value="식당">식당</option>
                <option value="음식점">음식점</option>
                <option value="기타">기타</option>
              </select>
            </div>

            <div className="form-group">
              <label>계단/턱</label>
              <div className="radio-group">
                <label>
                  <input
                    type="radio"
                    name="has_step"
                    value="있음"
                    checked={formData.has_step === '있음'}
                    onChange={(e) => handleFormChange('has_step', e.target.value)}
                  />
                  있음
                </label>
                <label>
                  <input
                    type="radio"
                    name="has_step"
                    value="없음"
                    checked={formData.has_step === '없음'}
                    onChange={(e) => handleFormChange('has_step', e.target.value)}
                  />
                  없음
                </label>
              </div>
            </div>

            <div className="form-group">
              <label>의자유형</label>
              <div className="radio-group">
                <label>
                  <input
                    type="radio"
                    name="chair_type"
                    value="낮은 이동형"
                    checked={formData.chair_type === '낮은 이동형'}
                    onChange={(e) => handleFormChange('chair_type', e.target.value)}
                  />
                  낮은 이동형
                </label>
                <label>
                  <input
                    type="radio"
                    name="chair_type"
                    value="높은 이동형"
                    checked={formData.chair_type === '높은 이동형'}
                    onChange={(e) => handleFormChange('chair_type', e.target.value)}
                  />
                  높은 이동형
                </label>
                <label>
                  <input
                    type="radio"
                    name="chair_type"
                    value="고정형"
                    checked={formData.chair_type === '고정형'}
                    onChange={(e) => handleFormChange('chair_type', e.target.value)}
                  />
                  고정형
                </label>
                <label>
                  <input
                    type="radio"
                    name="chair_type"
                    value="좌식형"
                    checked={formData.chair_type === '좌식형'}
                    onChange={(e) => handleFormChange('chair_type', e.target.value)}
                  />
                  좌식형
                </label>
              </div>
            </div>

            <div className="form-group">
              <label>통로</label>
              <div className="radio-group">
                <label>
                  <input
                    type="radio"
                    name="width_class"
                    value="좁음"
                    checked={formData.width_class === '좁음'}
                    onChange={(e) => handleFormChange('width_class', e.target.value)}
                  />
                  좁음
                </label>
                <label>
                  <input
                    type="radio"
                    name="width_class"
                    value="보통"
                    checked={formData.width_class === '보통'}
                    onChange={(e) => handleFormChange('width_class', e.target.value)}
                  />
                  보통
                </label>
                <label>
                  <input
                    type="radio"
                    name="width_class"
                    value="넓음"
                    checked={formData.width_class === '넓음'}
                    onChange={(e) => handleFormChange('width_class', e.target.value)}
                  />
                  넓음
                </label>
                <label>
                  <input
                    type="radio"
                    name="width_class"
                    value="통과 불가"
                    checked={formData.width_class === '통과 불가'}
                    onChange={(e) => handleFormChange('width_class', e.target.value)}
                  />
                  통과 불가
                </label>
              </div>
            </div>

            <div className="form-group">
              <label>상태값</label>
              <div className="radio-group">
                <label>
                  <input
                    type="radio"
                    name="status"
                    value="정상"
                    checked={formData.status === '정상'}
                    onChange={(e) => handleFormChange('status', e.target.value)}
                  />
                  정상
                </label>
                <label>
                  <input
                    type="radio"
                    name="status"
                    value="보류"
                    checked={formData.status === '보류'}
                    onChange={(e) => handleFormChange('status', e.target.value)}
                  />
                  보류
                </label>
                <label>
                  <input
                    type="radio"
                    name="status"
                    value="폐기"
                    checked={formData.status === '폐기'}
                    onChange={(e) => handleFormChange('status', e.target.value)}
                  />
                  폐기
                </label>
              </div>
            </div>

            <div className="form-actions">
              <button onClick={handleSave} className="btn-save">
                저장하기
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HumanReview;

