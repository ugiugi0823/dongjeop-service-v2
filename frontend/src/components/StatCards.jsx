import './StatCards.css';

function StatCards({ statistics }) {
  if (!statistics) {
    return (
      <div className="stats-grid">
        <div className="stat-card loading">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <div className="stat-value">로딩 중...</div>
            <div className="stat-label">데이터를 불러오는 중</div>
          </div>
        </div>
      </div>
    );
  }

  const excellentCount = statistics.grade_distribution?.S + statistics.grade_distribution?.A || 0;
  const excellentPercent = statistics.total_images ? ((excellentCount / statistics.total_images) * 100).toFixed(1) : '0';

  return (
    <div className="stats-grid">
      <div className="stat-card">
        <div className="stat-icon">📸</div>
        <div className="stat-content">
          <div className="stat-label">총 분석 이미지</div>
          <div className="stat-value">{statistics.total_images}장</div>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon">✅</div>
        <div className="stat-content">
          <div className="stat-label">단차 없음</div>
          <div className="stat-value">{statistics.has_step?.false || 0}장</div>
          <div className="stat-percent">({statistics.percentages?.step_free || 0}%)</div>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon">📊</div>
        <div className="stat-content">
          <div className="stat-label">평균 점수</div>
          <div className="stat-value">{statistics.average_score || 0}점</div>
          <div className="stat-percent">
            {statistics.average_score >= 90 ? 'S등급' : 
             statistics.average_score >= 80 ? 'A등급' : 
             statistics.average_score >= 70 ? 'B등급' : 
             statistics.average_score >= 60 ? 'C등급' : 'D등급'}
          </div>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon">⭐</div>
        <div className="stat-content">
          <div className="stat-label">우수 등급 (S+A)</div>
          <div className="stat-value">{excellentCount}장</div>
          <div className="stat-percent">({excellentPercent}%)</div>
        </div>
      </div>
    </div>
  );
}

export default StatCards;

