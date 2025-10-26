import React from 'react';

function TestDashboard() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
      padding: '32px',
      color: 'white'
    }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '20px' }}>
        🎉 테스트 대시보드
      </h1>
      <p style={{ fontSize: '1.2rem', marginBottom: '20px' }}>
        이 페이지가 보인다면 React가 정상적으로 작동하고 있습니다!
      </p>
      <div style={{
        background: 'rgba(51, 65, 85, 0.6)',
        padding: '20px',
        borderRadius: '12px',
        border: '1px solid rgba(99, 102, 241, 0.3)'
      }}>
        <h2>현재 시간</h2>
        <p>{new Date().toLocaleString('ko-KR')}</p>
      </div>
    </div>
  );
}

export default TestDashboard;


