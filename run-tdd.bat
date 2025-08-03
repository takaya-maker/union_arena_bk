@echo off
REM Union Arena TDD Development Script
REM テスト駆動開発のための統合実行スクリプト

echo ======================================
echo Union Arena TDD Development
echo ======================================
echo.

REM Docker Composeが利用可能かチェック
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker Compose not found. Please install Docker Desktop.
    pause
    exit /b 1
)

REM Docker が起動しているかチェック
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker is not running. Please start Docker Desktop.
    pause
    exit /b 1
)

echo ✅ Docker environment OK
echo.

:menu
echo Select TDD operation:
echo 1. Setup development environment
echo 2. Run all tests (TDD Red phase)
echo 3. Start development servers
echo 4. Run E2E tests
echo 5. View service logs
echo 6. Health check
echo 7. Clean and restart
echo 8. Monitor TDD cycle (Real-time)
echo 9. Open monitoring dashboard
echo 10. Export test reports
echo 11. Exit
echo.
set /p choice="Enter your choice (1-11): "

if "%choice%"=="1" goto setup
if "%choice%"=="2" goto test_all
if "%choice%"=="3" goto dev_start
if "%choice%"=="4" goto test_e2e
if "%choice%"=="5" goto view_logs
if "%choice%"=="6" goto health_check
if "%choice%"=="7" goto clean_restart
if "%choice%"=="8" goto monitor_tdd
if "%choice%"=="9" goto open_dashboard
if "%choice%"=="10" goto export_reports
if "%choice%"=="11" goto exit
goto menu

:setup
echo 🚀 Setting up development environment...
docker-compose build
docker-compose up -d backend frontend
echo ⏳ Waiting for services to start...
timeout /t 15 /nobreak
echo.
echo ✅ Development environment ready!
echo 📱 Frontend: http://localhost:3000
echo 🔧 Backend API: http://localhost:8000
echo 📊 API Docs: http://localhost:8000/docs
echo.
pause
goto menu

:test_all
echo 🧪 Running all tests (TDD Red phase)...
echo.
echo 📋 Frontend unit tests:
docker-compose exec -T frontend npm test -- --coverage --watchAll=false
echo.
echo 🎯 E2E tests:
docker-compose exec -T tests npm run test:docker
echo.
echo ✅ Test cycle complete
pause
goto menu

:dev_start
echo 🏁 Starting development servers...
docker-compose up -d
echo ✅ All services started
echo 📱 Frontend: http://localhost:3000
echo 🔧 Backend: http://localhost:8000
pause
goto menu

:test_e2e
echo 🎯 Running E2E tests...
docker-compose exec -T tests npm run test:docker
pause
goto menu

:view_logs
echo 📊 Viewing service logs...
docker-compose logs -f
goto menu

:health_check
echo 🏥 Checking service health...
echo.
echo Backend API:
curl -s http://localhost:8000/health 2>nul || echo ❌ Backend unreachable
echo.
echo Frontend:
curl -s http://localhost:3000 >nul 2>&1 && echo ✅ Frontend OK || echo ❌ Frontend unreachable
echo.
echo LLM API:
curl -s http://localhost:11434/api/tags >nul 2>&1 && echo ✅ LLM API OK || echo ❌ LLM API unreachable
echo.
pause
goto menu

:clean_restart
echo 🧹 Cleaning and restarting...
docker-compose down -v
docker-compose build
docker-compose up -d
echo ✅ Clean restart complete
pause
goto menu

:monitor_tdd
echo 🔄 Starting TDD cycle monitoring...
echo 📊 Real-time monitoring active
cd scripts
node test-monitor.js tdd
pause
goto menu

:open_dashboard
echo 📊 Opening monitoring dashboard...
start test-dashboard.html
echo ✅ Dashboard opened in browser
pause
goto menu

:export_reports
echo 📋 Exporting test reports...
cd scripts
node test-monitor.js export
echo ✅ Reports exported
pause
goto menu

:exit
echo 👋 Goodbye!
exit /b 0