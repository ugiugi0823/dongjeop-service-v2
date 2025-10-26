import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../services/api';
import './Gallery.css';

function BatchGallery() {
  const { batchName } = useParams();
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    load();
  }, [batchName]);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getBatchImages(batchName);
      setImages(data);
    } catch (e) {
      console.error(e);
      setError('이미지를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="gallery-page">
        <div className="gallery-loading">
          <div className="loading-spinner"></div>
          <p>{batchName} 이미지를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="gallery-page">
        <div className="no-results">
          <div className="no-results-icon">⚠️</div>
          <h3>{error}</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="gallery-page">
      <div className="gallery-header">
        <div className="header-content">
          <h1>🖼️ {batchName} 이미지 갤러리</h1>
          <p className="header-subtitle">Spider 폴더의 실제 이미지를 확인하세요</p>
        </div>
      </div>

      <div className="gallery-grid">
        {images.map((image, idx) => (
          <div key={idx} className="gallery-item">
            <div className="gallery-image">
              <img
                src={`/spider-images/${batchName}/${image}`}
                alt={image}
                onError={(e) => {
                  e.target.src = '/img/batch_img.png';
                }}
              />
            </div>
            <div className="gallery-item-header">{image}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default BatchGallery;


