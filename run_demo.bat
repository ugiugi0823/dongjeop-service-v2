@echo off
REM 접근성 분석 데모 웹사이트 실행 스크립트 (Windows)

echo 🚀 접근성 분석 데모 웹사이트를 시작합니다...
echo.

REM 가상환경 확인
if not exist "venv\" (
    echo ⚠️  가상환경이 없습니다. 생성 중...
    python -m venv venv
    echo ✅ 가상환경 생성 완료
)

echo 📦 가상환경 활성화 중...
call venv\Scripts\activate.bat

REM 의존성 설치
echo 📦 의존성 설치 확인 중...
pip install -q -r requirements.txt

echo.
echo ✅ 준비 완료!
echo.
echo ==========================================
echo   접근성 분석 대시보드
echo ==========================================
echo.
echo 🌐 웹 브라우저에서 다음 주소로 접속하세요:
echo.
echo    http://localhost:8000
echo.
echo 📚 API 문서:
echo.
echo    http://localhost:8000/docs
echo.
echo ==========================================
echo.
echo ⚠️  서버를 종료하려면 Ctrl+C를 누르세요
echo.

REM FastAPI 서버 실행
python -m uvicorn backend.api.main:app --host 0.0.0.0 --port 8000 --reload

