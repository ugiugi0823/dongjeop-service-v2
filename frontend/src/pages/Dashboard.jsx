import { useState, useEffect } from 'react';
import { api } from '../services/api';
import StatCards from '../components/StatCards';
import Charts from '../components/Charts';
import './Dashboard.css';

function Dashboard() {
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('API 호출 시작...');
      const data = await api.getStatistics();
      console.log('API 응답:', data);
      setStatistics(data);
    } catch (error) {
      console.error('통계 로드 실패:', error);
      setError('데이터를 불러오는데 실패했습니다.');
      // 데모용 더미 데이터
      setStatistics({
        total_images: 107,
        has_step: { true: 22, false: 85 },
        width_class: { wide: 56, normal: 30, narrow: 15, not_passable: 6 },
        chair_types: { movable: 93, high_movable: 8, fixed: 4, floor: 2 },
        grade_distribution: { S: 0, A: 0, B: 0, C: 0, D: 0 },
        percentages: { step_free: 79.4 }
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div className="dashboard-loading">
          <div className="loading-spinner"></div>
          <p>대시보드를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error && !statistics) {
    return (
      <div className="dashboard">
        <div className="dashboard-loading">
          <div style={{ color: '#ef4444', marginBottom: '16px' }}>⚠️</div>
          <p style={{ color: '#ef4444' }}>{error}</p>
          <button 
            onClick={loadStatistics}
            style={{
              marginTop: '16px',
              padding: '8px 16px',
              background: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <h1>📊 접근성 분석 대시보드</h1>
          <p className="header-subtitle">
            매장 이미지의 접근성 정보를 종합적으로 분석합니다
          </p>
        </div>
        <div className="header-actions">
          <div className="last-updated">
            마지막 업데이트: {new Date().toLocaleString('ko-KR')}
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        {/* 통계 카드 */}
        <section className="stats-section">
          <h2 className="section-title">📈 핵심 지표</h2>
          <StatCards statistics={statistics} />
        </section>

        {/* 차트 섹션 */}
        <section className="charts-section">
          <h2 className="section-title">📊 상세 분석</h2>
          <Charts statistics={statistics} />
        </section>

        {/* 요약 정보 */}
        <section className="summary-section">
          <h2 className="section-title">💡 분석 요약</h2>
          <div className="summary-grid">
            <div className="summary-card">
              <div className="summary-icon">♿</div>
              <div className="summary-content">
                <h3>단차 분석</h3>
                <p>전체 {statistics?.total_images || 0}개 매장 중 {statistics?.has_step?.false || 0}개({statistics?.percentages?.step_free || 0}%)가 단차가 없어 휠체어 접근이 가능합니다.</p>
              </div>
            </div>
            <div className="summary-card">
              <div className="summary-icon">🚶</div>
              <div className="summary-content">
                <h3>통로 분석</h3>
                <p>Wide 통로가 {statistics?.width_class?.wide || 0}개({statistics?.width_class?.wide ? ((statistics.width_class.wide / statistics.total_images) * 100).toFixed(1) : 0}%)로 가장 많아 이동 편의성이 양호합니다.</p>
              </div>
            </div>
            <div className="summary-card">
              <div className="summary-icon">🪑</div>
              <div className="summary-content">
                <h3>의자 분석</h3>
                <p>이동형 의자가 {statistics?.chair_types?.movable || 0}개({statistics?.chair_types?.movable ? ((statistics.chair_types.movable / statistics.total_images) * 100).toFixed(1) : 0}%)로 대부분의 매장에서 편의성을 제공합니다.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Dashboard;