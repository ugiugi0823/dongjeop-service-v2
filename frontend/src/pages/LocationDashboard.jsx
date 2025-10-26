import { useState, useEffect } from 'react';
import { api } from '../services/api';
import './LocationDashboard.css';

function LocationDashboard() {
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [loading, setLoading] = useState(true);

  // 서울 지역별 배치 매핑 (데모용)
  const seoulDistricts = {
    '강남구': { x: 60, y: 40, batches: ['batch_00', 'batch_01'] },
    '서초구': { x: 55, y: 50, batches: ['batch_02'] },
    '송파구': { x: 70, y: 60, batches: ['batch_03'] },
    '강동구': { x: 80, y: 55, batches: ['batch_04'] },
    '마포구': { x: 30, y: 30, batches: ['batch_05', 'batch_06'] },
    '서대문구': { x: 25, y: 25, batches: ['batch_07'] },
    '종로구': { x: 40, y: 20, batches: ['batch_08'] },
    '중구': { x: 45, y: 25, batches: ['batch_09'] },
    '용산구': { x: 35, y: 35, batches: ['batch_10'] }
  };

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

  const getBatchStatus = (batchName) => {
    // 데모용: 일부 배치는 완료 상태로 설정
    const completedBatches = ['batch_00', 'batch_02', 'batch_05', 'batch_08'];
    return completedBatches.includes(batchName) ? 'completed' : 'pending';
  };

  const getDistrictStatus = (district) => {
    const districtBatches = district.batches;
    const completedCount = districtBatches.filter(batch => getBatchStatus(batch) === 'completed').length;
    const totalCount = districtBatches.length;
    
    if (completedCount === 0) return 'pending';
    if (completedCount === totalCount) return 'completed';
    return 'partial';
  };

  const handleDistrictClick = (districtName, district) => {
    setSelectedBatch({
      name: districtName,
      batches: district.batches,
      status: getDistrictStatus(district)
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#10b981'; // 초록
      case 'partial': return '#f59e0b'; // 주황
      case 'pending': return '#ef4444'; // 빨강
      default: return '#6b7280'; // 회색
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed': return '분석 완료';
      case 'partial': return '부분 완료';
      case 'pending': return '분석 대기';
      default: return '알 수 없음';
    }
  };

  if (loading) {
    return (
      <div className="location-dashboard">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>위치 데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="location-dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <h1>🗺️ 위치 기반 분석 대시보드</h1>
          <p className="header-subtitle">
            서울 지역별 배치 분석 현황을 지도로 확인하세요
          </p>
        </div>
        <div className="header-stats">
          <div className="stat-item">
            <span className="stat-label">총 배치</span>
            <span className="stat-value">{batches.length}개</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">완료 지역</span>
            <span className="stat-value">
              {Object.values(seoulDistricts).filter(district => 
                getDistrictStatus(district) === 'completed'
              ).length}개
            </span>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        {/* 서울 지도 */}
        <section className="map-section">
          <h2 className="section-title">🏙️ 서울 지역별 분석 현황</h2>
          <div className="seoul-map">
            {Object.entries(seoulDistricts).map(([districtName, district]) => {
              const status = getDistrictStatus(district);
              const color = getStatusColor(status);
              
              return (
                <div
                  key={districtName}
                  className={`district-marker ${status}`}
                  style={{
                    left: `${district.x}%`,
                    top: `${district.y}%`,
                    backgroundColor: color
                  }}
                  onClick={() => handleDistrictClick(districtName, district)}
                >
                  <div className="marker-content">
                    <div className="district-name">{districtName}</div>
                    <div className="batch-count">{district.batches.length}개 배치</div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* 범례 */}
          <div className="map-legend">
            <div className="legend-item">
              <div className="legend-color completed"></div>
              <span>분석 완료</span>
            </div>
            <div className="legend-item">
              <div className="legend-color partial"></div>
              <span>부분 완료</span>
            </div>
            <div className="legend-item">
              <div className="legend-color pending"></div>
              <span>분석 대기</span>
            </div>
          </div>
        </section>

        {/* 선택된 지역 상세 정보 */}
        {selectedBatch && (
          <section className="district-details">
            <h2 className="section-title">📍 {selectedBatch.name} 상세 정보</h2>
            <div className="district-info">
              <div className="info-card">
                <div className="info-header">
                  <h3>{selectedBatch.name}</h3>
                  <span className={`status-badge ${selectedBatch.status}`}>
                    {getStatusText(selectedBatch.status)}
                  </span>
                </div>
                <div className="batch-list">
                  {selectedBatch.batches.map((batch, index) => (
                    <div key={index} className="batch-item">
                      <div className="batch-name">{batch}</div>
                      <div className={`batch-status ${getBatchStatus(batch)}`}>
                        {getBatchStatus(batch) === 'completed' ? '완료' : '대기'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 전체 통계 */}
        <section className="stats-section">
          <h2 className="section-title">📊 지역별 분석 통계</h2>
          <div className="stats-grid">
            {Object.entries(seoulDistricts).map(([districtName, district]) => {
              const status = getDistrictStatus(district);
              const completedCount = district.batches.filter(batch => 
                getBatchStatus(batch) === 'completed'
              ).length;
              
              return (
                <div key={districtName} className="district-stat-card">
                  <div className="stat-header">
                    <h4>{districtName}</h4>
                    <span className={`status-indicator ${status}`}></span>
                  </div>
                  <div className="stat-content">
                    <div className="progress-bar">
                      <div 
                        className="progress-fill"
                        style={{ 
                          width: `${(completedCount / district.batches.length) * 100}%`,
                          backgroundColor: getStatusColor(status)
                        }}
                      ></div>
                    </div>
                    <div className="stat-text">
                      {completedCount}/{district.batches.length} 완료
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}

export default LocationDashboard;


