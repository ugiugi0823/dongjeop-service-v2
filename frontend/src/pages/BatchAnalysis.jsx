import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import './BatchAnalysis.css';

// GitHub Pages 감지
const isGitHubPages = window.location.hostname === 'ugiugi0823.github.io';

function BatchAnalysis() {
  const navigate = useNavigate();
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [batchImages, setBatchImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);

  useEffect(() => {
    loadBatches();
  }, []);

  const loadBatches = async () => {
    try {
      setLoading(true);
      const data = await api.getBatches();
      setBatches(data);
    } catch (error) {
      console.error('배치 목록 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectBatch = async (batchName) => {
    try {
      setLoading(true);
      const data = await api.getBatchImages(batchName);
      setSelectedBatch(batchName);
      setBatchImages(data);
    } catch (error) {
      console.error('배치 이미지 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const startAnalysis = async () => {
    if (!selectedBatch) return;
    
    setAnalyzing(true);
    setAnalysisProgress(0);
    
    // 분석 시뮬레이션 (실제 AI 연결 없이)
    const totalImages = batchImages.length;
    const interval = setInterval(() => {
      setAnalysisProgress(prev => {
        const newProgress = prev + Math.random() * 15;
        if (newProgress >= 100) {
          clearInterval(interval);
          setAnalyzing(false);
          setAnalysisProgress(100);
          // 분석 완료 후 배치를 gt 폴더로 이동 시뮬레이션
          setTimeout(() => {
            alert(`🎉 분석 완료!\n${selectedBatch} 배치의 ${totalImages}개 이미지가 분석되었습니다.`);
          }, 500);
          return 100;
        }
        return newProgress;
      });
    }, 200);
  };


  if (loading && !selectedBatch) {
    return (
      <div className="batch-analysis">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>배치 목록을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="batch-analysis">
      <div className="batch-header">
        <div className="header-content">
          <h1>🔬 배치 단위 분석</h1>
          <p className="header-subtitle">
            Spider 폴더의 배치별 이미지를 분석하여 GT 폴더로 이동시킵니다
          </p>
        </div>
        <div className="header-actions">
          <div className="batch-stats">
            <span className="stat-label">총 배치</span>
            <span className="stat-value">{batches.length}개</span>
          </div>
        </div>
      </div>

      <div className="batch-content">
        {/* 배치 목록 (분석 대기) */}
        <section className="batch-list-section">
          <h2 className="section-title">📁 분석 대기 배치</h2>
          <div className="batch-grid">
            {batches.map((batch) => (
              <div
                key={batch.name}
                className={`batch-card ${selectedBatch === batch.name ? 'selected' : ''}`}
                onClick={() => navigate(`/batch/${batch.name}`)}
              >
                <div className="batch-icon">📦</div>
                <div className="batch-info">
                  <div className="batch-name">{batch.name}</div>
                  <div className="batch-details">
                    <span className="image-count">{batch.image_count}개 이미지</span>
                    <span className={`batch-status status-${batch.status}`}>
                      {batch.status === 'pending' ? '대기' : 
                       batch.status === 'analyzing' ? '분석중' : '완료'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 분석 완료 배치 → 기존 이미지 갤러리 이동 */}
        <section className="batch-list-section">
          <h2 className="section-title">📁 분석 완료 배치</h2>
          <div className="batch-grid">
            <div
              className="batch-card"
              onClick={() => navigate('/gallery')}
            >
              <img className="batch-icon" src="/dongjeop-service-v2/batch_img.png" alt="batch" />
              <div className="batch-info">
                <div className="batch-name">이미지 갤러리로 이동</div>
                <div className="batch-details">
                  <span className="image-count">GT 폴더 결과 확인</span>
                  <span className="batch-status status-completed">완료</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 선택된 배치의 이미지들 */}
        {selectedBatch && (
          <section className="batch-images-section">
            <div className="section-header">
              <h2 className="section-title">🖼️ {selectedBatch} 이미지 목록</h2>
              <div className="section-actions">
                <button
                  onClick={startAnalysis}
                  disabled={analyzing}
                  className="btn-analyze"
                >
                  {analyzing ? '분석 중...' : '분석 시작'}
                </button>
              </div>
            </div>

            {analyzing && (
              <div className="analysis-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${analysisProgress}%` }}
                  ></div>
                </div>
                <div className="progress-text">
                  분석 진행률: {Math.round(analysisProgress)}%
                </div>
              </div>
            )}

            <div className="images-grid">
              {batchImages.map((image, index) => (
                <div key={index} className="image-card">
                  <div className="image-preview">
                    <img
                      src={isGitHubPages ? `/dongjeop-service-v2/images/${image}` : `/spider-images/${selectedBatch}/${image}`}
                      alt={image}
                      onError={(e) => {
                        e.target.src = '/dongjeop-service-v2/batch_img.png';
                      }}
                    />
                  </div>
                  <div className="image-info">
                    <div className="image-name">{image}</div>
                    <div className="image-status">
                      {analyzing ? '분석 중...' : '대기'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default BatchAnalysis;
