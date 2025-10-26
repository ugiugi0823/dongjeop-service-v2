import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';

function Sidebar() {
  const location = useLocation();

  const menuItems = [
    {
      path: '/',
      icon: '📊',
      label: '대시보드',
      description: '전체 통계 및 분석'
    },
    {
      path: '/location-dashboard',
      icon: '🗺️',
      label: '위치 기반 대시보드',
      description: '서울 지역별 분석 현황'
    },
    {
      path: '/batch-analysis',
      icon: '🔬',
      label: '배치 단위 분석',
      description: 'Spider → GT 분석 워크플로우'
    }
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <span className="logo-icon">♿</span>
          <div className="logo-text">
            <div className="logo-title">접근성 분석</div>
            <div className="logo-subtitle">Accessibility Dashboard</div>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <ul className="nav-list">
          {menuItems.map((item) => (
            <li key={item.path} className="nav-item">
              <Link
                to={item.path}
                className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
              >
                <span className="nav-icon">{item.icon}</span>
                <div className="nav-content">
                  <div className="nav-label">{item.label}</div>
                  <div className="nav-description">{item.description}</div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="sidebar-footer">
        <div className="footer-info">
          <div className="footer-title">총 이미지</div>
          <div className="footer-value">107개</div>
        </div>
        <div className="footer-info">
          <div className="footer-title">분석 완료</div>
          <div className="footer-value">100%</div>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;
