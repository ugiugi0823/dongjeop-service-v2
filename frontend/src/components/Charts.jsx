import { PieChart, Pie, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './Charts.css';

const COLORS = {
  step: ['#28a745', '#dc3545'],
  width: { wide: '#28a745', normal: '#17a2b8', narrow: '#ffc107', not_passable: '#dc3545' },
  chair: ['#007bff', '#6f42c1', '#20c997', '#fd7e14'],
  grade: ['#28a745', '#17a2b8', '#ffc107', '#fd7e14', '#dc3545']
};

function Charts({ statistics }) {
  if (!statistics) {
    return (
      <div className="charts-container">
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>차트를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 단차 데이터
  const stepData = [
    { name: '단차 없음', value: statistics.has_step?.false || 0 },
    { name: '단차 있음', value: statistics.has_step?.true || 0 }
  ];

  // 통로 너비 데이터
  const widthNames = {
    wide: 'Wide (넓음)',
    normal: 'Normal (보통)',
    narrow: 'Narrow (좁음)',
    not_passable: '통과 불가'
  };

  const widthData = Object.entries(statistics.width_class || {}).map(([key, value]) => ({
    name: widthNames[key] || key,
    value: value,
    key: key
  }));

  // 의자 타입 데이터
  const chairData = [
    { name: '이동형', value: statistics.chair_types?.movable || 0 },
    { name: '높이 조절', value: statistics.chair_types?.high_movable || 0 },
    { name: '고정형', value: statistics.chair_types?.fixed || 0 },
    { name: '바닥 좌식', value: statistics.chair_types?.floor || 0 }
  ];

  // 등급 분포 데이터
  const gradeData = Object.entries(statistics.grade_distribution || {}).map(([grade, count]) => ({
    grade: grade,
    count: count,
    percentage: statistics.total_images ? ((count / statistics.total_images) * 100).toFixed(1) : 0
  }));

  return (
    <div className="charts-container">
      <div className="charts-grid">
        {/* 단차 분포 파이 차트 */}
        <div className="chart-card">
          <h3 className="chart-title">단차 분포</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={stepData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {stepData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS.step[index % COLORS.step.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* 통로 너비 분포 바 차트 */}
        <div className="chart-card">
          <h3 className="chart-title">통로 너비 분포</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={widthData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 의자 타입 분포 파이 차트 */}
        <div className="chart-card">
          <h3 className="chart-title">의자 타입 분포</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chairData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chairData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS.chair[index % COLORS.chair.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* 접근성 등급 분포 바 차트 */}
        <div className="chart-card">
          <h3 className="chart-title">접근성 등급 분포</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={gradeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="grade" />
              <YAxis />
              <Tooltip formatter={(value, name) => [value, '개']} />
              <Bar dataKey="count" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default Charts;