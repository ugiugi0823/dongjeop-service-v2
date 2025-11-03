import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ReviewQueue from './ReviewQueue';
import ReviewedList from './ReviewedList';
import PhotoCollection from './PhotoCollection';
import './UnifiedGallery.css';

function UnifiedGallery() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // URL 경로에 따라 초기 탭 설정
  const getInitialTab = () => {
    if (location.pathname === '/review/queue') return 'review-queue';
    if (location.pathname === '/review/completed') return 'reviewed';
    if (location.pathname === '/photo-collection') return 'collection';
    if (location.pathname === '/gallery') return 'collection'; // gallery 경로도 collection으로 리다이렉트
    return 'collection'; // 기본값을 사진수집현황으로 변경
  };
  
  const [activeTab, setActiveTab] = useState(getInitialTab());
  
  // URL 경로 변경 시 탭 업데이트
  useEffect(() => {
    const newTab = getInitialTab();
    if (newTab !== activeTab) {
      setActiveTab(newTab);
    }
  }, [location.pathname]);
  
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    // URL도 함께 변경
    switch (tabId) {
      case 'review-queue':
        navigate('/review/queue');
        break;
      case 'reviewed':
        navigate('/review/completed');
        break;
      case 'collection':
        navigate('/photo-collection');
        break;
      default:
        navigate('/photo-collection');
        break;
    }
  };

  const tabs = [
    { id: 'collection', label: '사진수집현황', icon: '📸' },
    { id: 'review-queue', label: '검수대상목록', icon: '📋' },
    { id: 'reviewed', label: '검수완료목록', icon: '✅' }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'review-queue':
        return <div className="tab-content-wrapper"><ReviewQueue /></div>;
      case 'reviewed':
        return <div className="tab-content-wrapper"><ReviewedList /></div>;
      case 'collection':
        return <div className="tab-content-wrapper"><PhotoCollection /></div>;
      default:
        return <div className="tab-content-wrapper"><PhotoCollection /></div>;
    }
  };

  return (
    <div className="unified-gallery-page">
      <div className="unified-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`unified-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => handleTabChange(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>
      <div className="unified-content">
        {renderContent()}
      </div>
    </div>
  );
}

export default UnifiedGallery;

