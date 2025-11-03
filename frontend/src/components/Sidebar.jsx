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
      path: '/photo-collection',
      icon: '📸',
      label: '사진수집현황',
      description: '수집된 사진 목록'
    },
    {
      path: '/review/queue',
      icon: '📋',
      label: '검수대상목록',
      description: 'AI 분석 재검토 필요'
    },
    {
      path: '/review/completed',
      icon: '✅',
      label: '검수완료목록',
      description: '검수 완료된 이미지'
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
