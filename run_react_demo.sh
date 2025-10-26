#!/bin/bash

# React 접근성 분석 데모 실행 스크립트

echo "🚀 React 접근성 분석 대시보드를 시작합니다..."
echo ""

# 백엔드 서버가 실행 중인지 확인
if ! lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "⚠️  백엔드 서버가 실행되고 있지 않습니다."
    echo "   새 터미널에서 다음 명령을 실행하세요:"
    echo ""
    echo "   python -m uvicorn backend.api.main:app --reload"
    echo ""
    read -p "백엔드 서버를 실행했으면 Enter를 누르세요..."
fi

# frontend 디렉토리로 이동
cd frontend

# node_modules가 없으면 설치
if [ ! -d "node_modules" ]; then
    echo "📦 의존성 설치 중..."
    npm install
fi

echo ""
echo "✅ 준비 완료!"
echo ""
echo "=========================================="
echo "  React 접근성 분석 대시보드"
echo "=========================================="
echo ""
echo "🌐 웹 브라우저에서 다음 주소로 접속하세요:"
echo ""
echo "   http://localhost:3000"
echo ""
echo "=========================================="
echo ""
echo "⚠️  개발 서버를 종료하려면 Ctrl+C를 누르세요"
echo ""

# React 개발 서버 실행
npm run dev

